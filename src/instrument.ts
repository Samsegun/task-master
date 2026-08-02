// src/instrument.ts
import * as Sentry from "@sentry/node";

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,

    // captures 100% of errors always — what you actually care about
    // tracesSampleRate captures performance transactions — start at 0.1
    // (10%) to avoid burning through your free quota on every request
    tracesSampleRate: 0.1,

    // only run Sentry in production — don't pollute your Sentry dashboard
    // with dev errors
    enabled: process.env.NODE_ENV === "production",
});
