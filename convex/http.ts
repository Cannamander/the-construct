import { httpRouter } from 'convex/server';
import { handleReplicateWebhook } from './music';
import { injectDirective } from './directives';
import { httpEnqueueLLM } from './llmQueue';

const http = httpRouter();

http.route({
  path: '/replicate_webhook',
  method: 'POST',
  handler: handleReplicateWebhook,
});

http.route({
  path: '/inject_directive',
  method: 'POST',
  handler: injectDirective,
});

http.route({
  path: '/enqueue_llm',
  method: 'POST',
  handler: httpEnqueueLLM,
});

export default http;
