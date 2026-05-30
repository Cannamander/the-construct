import { httpRouter } from 'convex/server';
import { handleReplicateWebhook } from './music';
import { injectDirective } from './directives';

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

export default http;
