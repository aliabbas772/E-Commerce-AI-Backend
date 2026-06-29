import {
  Registry,
  collectDefaultMetrics,
  Counter,
  Histogram,
  Gauge,
} from "prom-client";

export const register = new Registry();

// Default metrics — Node.js process info
// Automatically tracks: CPU usage, memory usage, event loop lag, GC stats
collectDefaultMetrics({ register });

// ─── Custom metrics for YOUR app ──────────────────────────────────

// Counter — only goes up, never down. Good for counting events.
export const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

// Histogram — tracks distribution of values (response times)
// Buckets define ranges: how many requests took 0.1s, 0.5s, 1s, etc.
export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

// GraphQL specific metrics
export const graphqlRequestsTotal = new Counter({
  name: "graphql_requests_total",
  help: "Total GraphQL operations",
  labelNames: ["operation_name", "operation_type", "status"],
  registers: [register],
});

export const graphqlRequestDuration = new Histogram({
  name: "graphql_request_duration_seconds",
  help: "Duration of GraphQL operations",
  labelNames: ["operation_name"],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2],
  registers: [register],
});

// Gauge — value that goes up AND down. Good for "current state" metrics.
export const activeWebSocketConnections = new Gauge({
  name: "active_websocket_connections",
  help: "Current number of active WebSocket connections",
  registers: [register],
});

export const redisLockFailures = new Counter({
  name: "redis_lock_failures_total",
  help: "Total Redis lock acquisition failures (race condition attempts)",
  registers: [register],
});

export const orderCreatedTotal = new Counter({
  name: "orders_created_total",
  help: "Total orders created",
  registers: [register],
});

export const paymentVerifiedTotal = new Counter({
  name: "payments_verified_total",
  help: "Total payments successfully verified",
  labelNames: ["status"],
  registers: [register],
});

export const aiRequestsTotal = new Counter({
  name: "ai_requests_total",
  help: "Total AI recommendation requests",
  labelNames: ["type", "cache_status"],
  registers: [register],
});

export const dbQueryDuration = new Histogram({
  name: "mongodb_query_duration_seconds",
  help: "MongoDB query duration",
  labelNames: ["operation", "collection"],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1],
  registers: [register],
});
