import { internalAction, internalMutation, internalQuery, httpAction, query } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';
import { chatCompletion } from './util/llm';
import { LLMMessage } from './util/llm';

const POLL_INTERVAL_MS = 500;
const MAX_WAIT_MS = 120_000; // 2 minutes max wait
const PROCESSING_TIMEOUT_MS = 90_000; // 90s before a processing job is considered dead

// Submit a chat completion request to the queue and wait for the result
export const queuedChatCompletion = internalAction({
  args: {
    requestor: v.string(),
    messages: v.array(v.object({
      role: v.union(v.literal('system'), v.literal('user'), v.literal('assistant'), v.literal('function')),
      content: v.union(v.string(), v.null()),
      name: v.optional(v.string()),
    })),
    maxTokens: v.optional(v.number()),
    stopWords: v.optional(v.array(v.string())),
    priority: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Insert into queue
    const queueId = await ctx.runMutation(internal.llmQueue.enqueue, {
      requestor: args.requestor,
      prompt: JSON.stringify(args.messages),
      priority: args.priority ?? 1,
    });

    // Poll for result
    const start = Date.now();
    while (Date.now() - start < MAX_WAIT_MS) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      const entry = await ctx.runQuery(internal.llmQueue.getEntry, { queueId });
      if (!entry) throw new Error(`Queue entry ${queueId} disappeared`);
      if (entry.status === 'completed' && entry.result) {
        return { content: entry.result, retries: 0, ms: Date.now() - start };
      }
      if (entry.status === 'failed') {
        throw new Error(`LLM queue entry failed: ${entry.result ?? 'unknown error'}`);
      }
    }
    throw new Error(`LLM queue entry timed out after ${MAX_WAIT_MS}ms`);
  },
});

// Insert a new request into the queue
export const enqueue = internalMutation({
  args: {
    requestor: v.string(),
    prompt: v.string(),
    priority: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('llmQueue', {
      requestor: args.requestor,
      prompt: args.prompt,
      status: 'pending',
      priority: args.priority,
      createdAt: Date.now(),
    });
  },
});

// Get a single queue entry by ID
export const getEntry = internalQuery({
  args: { queueId: v.id('llmQueue') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.queueId);
  },
});

// Claim the next pending entry
export const claimNext = internalMutation({
  args: {},
  handler: async (ctx) => {
    // First clean up any stalled processing entries
    const stalled = await ctx.db
      .query('llmQueue')
      .withIndex('status', (q) => q.eq('status', 'processing'))
      .collect();
    for (const entry of stalled) {
      if (Date.now() - entry.createdAt > PROCESSING_TIMEOUT_MS) {
        await ctx.db.patch(entry._id, { status: 'pending' });
      }
    }

    // Grab highest priority pending entry
    const pending = await ctx.db
      .query('llmQueue')
      .withIndex('priority', (q) => q.eq('status', 'pending'))
      .order('desc')
      .first();

    if (!pending) return null;

    await ctx.db.patch(pending._id, { status: 'processing' });
    return pending;
  },
});

// Mark an entry complete or failed
export const resolveEntry = internalMutation({
  args: {
    queueId: v.id('llmQueue'),
    status: v.union(v.literal('completed'), v.literal('failed')),
    result: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.queueId, { status: args.status, result: args.result });
  },
});

// The queue worker — claims and processes one entry at a time
export const processNext = internalAction({
  args: {},
  handler: async (ctx) => {
    const entry = await ctx.runMutation(internal.llmQueue.claimNext, {});
    if (!entry) {
      console.log('[llmQueue] No pending entries');
      return;
    }

    console.log(`[llmQueue] Processing entry ${entry._id} for ${entry.requestor}`);
    try {
      const messages = JSON.parse(entry.prompt) as LLMMessage[];
      console.log(`[llmQueue] Calling Ollama for entry ${entry._id}`);
      const { content } = await chatCompletion({ messages, stream: false });
      const result = typeof content === 'string' ? content : await (content as any).readAll();
      console.log(`[llmQueue] Completed entry ${entry._id}: ${result.substring(0, 50)}`);
      await ctx.runMutation(internal.llmQueue.resolveEntry, {
        queueId: entry._id,
        status: 'completed',
        result,
      });
    } catch (e: any) {
      console.error(`[llmQueue] Failed entry ${entry._id}:`, e?.message ?? e);
      await ctx.runMutation(internal.llmQueue.resolveEntry, {
        queueId: entry._id,
        status: 'failed',
        result: e?.message ?? 'Unknown error',
      });
    }

    // Schedule next run immediately to keep draining the queue
    await ctx.scheduler.runAfter(0, internal.llmQueue.processNext, {});
  },
});

// Kick off the worker — called once to start the drain loop
export const startWorker = internalAction({
  args: {},
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(0, internal.llmQueue.processNext, {});
  },
});

// HTTP action — allows external callers (Hermes) to submit LLM requests
export const httpEnqueueLLM = httpAction(async (ctx, request) => {
  const body = await request.json();
  const { requestor, messages, priority } = body;

  if (!requestor || !messages) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: requestor, messages' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const queueId = await ctx.runMutation(internal.llmQueue.enqueue, {
    requestor,
    prompt: JSON.stringify(messages),
    priority: priority ?? 1,
  });

  return new Response(
    JSON.stringify({ success: true, queueId }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});

// Public query — check queue entry status
export const checkEntry = query({
  args: { queueId: v.id('llmQueue') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.queueId);
  },
});
