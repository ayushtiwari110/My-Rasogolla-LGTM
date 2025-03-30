export const updateHttpMetrics = async ({
  method,
  route,
  statusCode,
  userAgent,
  duration,
  contentLength,
  errorType
}: {
  method: string;
  route: string;
  statusCode: number;
  userAgent?: string | null;
  duration?: number;
  contentLength?: number;
  errorType?: string;
}) => {
  try {
    // Ensure global metrics are available
    if (!globalThis.metrics) {
      console.warn('Metrics are not initialized');
      return;
    }

    // Increment HTTP request counter
    globalThis.metrics.httpRequestCounter.inc({
      method,
      route,
      status_code: statusCode.toString(),
      user_agent: userAgent || 'unknown'
    });

    // Observe request duration if available
    if (duration !== undefined) {
      globalThis.metrics.httpRequestDuration.observe(
        { method, route, status_code: statusCode.toString() },
        duration
      );
    }

    // Observe response size if available
    if (contentLength !== undefined) {
      globalThis.metrics.httpResponseSize.observe(
        { method, route, status_code: statusCode.toString() },
        contentLength
      );
    }

    // Increment error counter if applicable
    if (errorType) {
      globalThis.metrics.httpErrors.inc({
        method,
        route,
        error_type: errorType
      });
    }
  } catch (error) {
    console.error('Failed to update metrics:', error);
  }
};
