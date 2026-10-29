// Sentry tracing for the ghost's Gemma calls. Loaded before anything else.
// Only turns on when SENTRY_DSN is set. Prompts, replies and candle names are never sent:
// traces carry timing, model and token counts only.
const Sentry = require("@sentry/node");

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    sendDefaultPii: false,
    environment: process.env.SENTRY_ENVIRONMENT || (process.env.CODESPACES ? "codespaces" : "local")
  });
}

module.exports = Sentry;
