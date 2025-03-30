import type { Logger } from 'pino';
import { Registry, collectDefaultMetrics, Counter, Gauge, Histogram } from 'prom-client';
import { registerOTel } from '@vercel/otel';

declare global {
  // var usage is required for global declaration
  // eslint-disable-next-line no-var
  var logger: Logger | undefined;

  // eslint-disable-next-line no-var
  var metrics: {
    registry: Registry;
    userSignups: Counter;
    loginSuccessTotal: Counter;
    loginFailuresTotal: Counter;
    externalApiLatencyMs: Histogram;
    externalApiErrorsTotal: Counter;
    dbUserCount: Gauge;
    cpuOperationDurationMs: Histogram;
    nodejsMemoryHeapUsedBytes: Gauge;
    httpRequestCounter: Counter<string>;
    httpRequestDuration: Histogram<string>;
    httpResponseSize: Histogram<string>;
    httpErrors: Counter<string>;
  } | undefined;
}

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const pino = (await import('pino')).default;
    const pinoLoki = (await import('pino-loki')).default;

    const transport = pinoLoki({
      host: 'http://localhost:3100', // Loki server address
      batching: true, // Enable batching of logs for better performance
      interval: 5, // Send logs every 5 seconds when batching
      labels: { app: 'next-app' } // Add application label to all logs
    })

    const logger = pino(transport);
    globalThis.logger = logger;

    const prometheusRegistry = new Registry();
    collectDefaultMetrics({
      register: prometheusRegistry
    });

    // User signups counter
    const userSignups = new Counter({
      name: 'user_signups_total',
      help: 'Total number of user signups',
      labelNames: ['plan_type', 'referral_source'],
      registers: [prometheusRegistry]
    });

    // Auth metrics
    const loginSuccessTotal = new Counter({
      name: 'login_success_total',
      help: 'Total number of successful logins',
      registers: [prometheusRegistry]
    });

    const loginFailuresTotal = new Counter({
      name: 'login_failures_total',
      help: 'Total number of failed login attempts',
      registers: [prometheusRegistry]
    });

    // API metrics
    const externalApiLatencyMs = new Histogram({
      name: 'external_api_latency_ms',
      help: 'Latency of external API calls in milliseconds',
      buckets: [10, 50, 100, 250, 500, 1000, 2500, 5000],
      registers: [prometheusRegistry]
    });

    const externalApiErrorsTotal = new Counter({
      name: 'external_api_errors_total',
      help: 'Total number of external API call errors',
      registers: [prometheusRegistry]
    });

    // Database metrics
    const dbUserCount = new Gauge({
      name: 'db_user_count',
      help: 'Current number of users in the database',
      registers: [prometheusRegistry]
    });

    // CPU metrics
    const cpuOperationDurationMs = new Histogram({
      name: 'cpu_operation_duration_ms',
      help: 'Duration of CPU-intensive operations in milliseconds',
      buckets: [10, 50, 100, 500, 1000, 5000, 10000],
      registers: [prometheusRegistry]
    });

    // Memory metrics
    const nodejsMemoryHeapUsedBytes = new Gauge({
      name: 'nodejs_memory_heap_used_bytes',
      help: 'Memory used in bytes by the Node.js heap',
      registers: [prometheusRegistry]
    });

    // HTTP metrics
    const httpRequestCounter = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code', 'user_agent'],
      registers: [prometheusRegistry]
    });

    const httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 10],
      registers: [prometheusRegistry]
    });

    const httpResponseSize = new Histogram({
      name: 'http_response_size_bytes',
      help: 'Size of HTTP responses in bytes',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [512, 1024, 5120, 10240, 51200, 102400, 512000],
      registers: [prometheusRegistry]
    });

    const httpErrors = new Counter({
      name: 'http_errors_total',
      help: 'Total number of HTTP errors',
      labelNames: ['method', 'route', 'error_type'],
      registers: [prometheusRegistry]
    });

    // Register all metrics
    prometheusRegistry.registerMetric(userSignups);
    prometheusRegistry.registerMetric(loginSuccessTotal);
    prometheusRegistry.registerMetric(loginFailuresTotal);
    prometheusRegistry.registerMetric(externalApiLatencyMs);
    prometheusRegistry.registerMetric(externalApiErrorsTotal);
    prometheusRegistry.registerMetric(dbUserCount);
    prometheusRegistry.registerMetric(cpuOperationDurationMs);
    prometheusRegistry.registerMetric(nodejsMemoryHeapUsedBytes);
    prometheusRegistry.registerMetric(httpRequestCounter);
    prometheusRegistry.registerMetric(httpRequestDuration);
    prometheusRegistry.registerMetric(httpResponseSize);
    prometheusRegistry.registerMetric(httpErrors);


    globalThis.metrics = {
      registry: prometheusRegistry,
      userSignups,
      loginSuccessTotal,
      loginFailuresTotal,
      externalApiLatencyMs,
      externalApiErrorsTotal,
      dbUserCount,
      cpuOperationDurationMs,
      nodejsMemoryHeapUsedBytes,
      httpRequestCounter,
      httpRequestDuration,
      httpResponseSize,
      httpErrors
    }

    // vercel otel for traces
    registerOTel();
  }
}