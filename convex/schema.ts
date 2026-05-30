import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { agentTables } from './agent/schema';
import { aiTownTables } from './aiTown/schema';
import { conversationId, playerId } from './aiTown/ids';
import { engineTables } from './engine/schema';

export default defineSchema({
  music: defineTable({
    storageId: v.string(),
    type: v.union(v.literal('background'), v.literal('player')),
  }),

  messages: defineTable({
    conversationId,
    messageUuid: v.string(),
    author: playerId,
    text: v.string(),
    worldId: v.optional(v.id('worlds')),
  })
    .index('conversationId', ['worldId', 'conversationId'])
    .index('messageUuid', ['conversationId', 'messageUuid']),

  directives: defineTable({
    from: v.string(),
    task: v.string(),
    assignedTo: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('in_progress'),
      v.literal('completed'),
      v.literal('failed'),
    ),
    result: v.optional(v.string()),
    priority: v.number(),
    createdAt: v.number(),
  })
    .index('status', ['status'])
    .index('assignedTo', ['assignedTo', 'status']),

  llmQueue: defineTable({
    requestor: v.string(),
    prompt: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('processing'),
      v.literal('completed'),
      v.literal('failed'),
    ),
    result: v.optional(v.string()),
    priority: v.number(),
    createdAt: v.number(),
  })
    .index('status', ['status'])
    .index('priority', ['status', 'priority']),

  ...agentTables,
  ...aiTownTables,
  ...engineTables,
});