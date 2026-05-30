import { httpAction, mutation, query, internalMutation } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';

// HTTP action — called by Hermes to inject a directive
export const injectDirective = httpAction(async (ctx, request) => {
  const body = await request.json();
  const { from, task, assignedTo, priority } = body;

  if (!from || !task || !assignedTo) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: from, task, assignedTo' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const directiveId = await ctx.runMutation(internal.directives.createDirective, {
    from,
    task,
    assignedTo,
    priority: priority ?? 1,
  });

  return new Response(
    JSON.stringify({ success: true, directiveId }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});

// Internal mutation — inserts the directive record
export const createDirective = internalMutation({
  args: {
    from: v.string(),
    task: v.string(),
    assignedTo: v.string(),
    priority: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('directives', {
      from: args.from,
      task: args.task,
      assignedTo: args.assignedTo,
      status: 'pending',
      priority: args.priority,
      createdAt: Date.now(),
    });
  },
});

// Query — agents poll this to get their pending directives
export const getPendingForAgent = query({
  args: { assignedTo: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('directives')
      .withIndex('assignedTo', (q) =>
        q.eq('assignedTo', args.assignedTo).eq('status', 'pending'),
      )
      .order('asc')
      .collect();
  },
});
