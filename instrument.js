// Sentry tracing for the ghost's Gemma calls. Loaded before anything else.
// Only turns on when SENTRY_DSN is set. Prompts, replies and candle names are never sent:
// traces carry timing, model and token counts only. Visitors' IP addresses, locations and
// request headers are stripped too, and Sentry is told not to work them out on its side.
const Sentry = require("@sentry/node");

function scrub(event) {
  event.user = { ip_address: null };   // null = don't record or infer an IP (or a city from it)
  if (event.request) { delete event.request.headers; delete event.request.cookies; delete event.request.env; }
  return event;
}

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    sendDefaultPii: false,
    beforeSend: scrub,
    beforeSendTransaction: scrub,
    traceLifecycle: "static",   // send whole traces at once, so the scrub above runs on them too
    environment: process.env.SENTRY_ENVIRONMENT || (process.env.CODESPACES ? "codespaces" : "local")
  });
}

module.exports = Sentry;
