import { SpanStatusCode, trace } from '@opentelemetry/api';

export async function GET() {
  const tracer = trace.getTracer('next-app');
  const span = tracer.startSpan('custom-operation');

  try {
    span.setAttribute('operation.type', 'test');
    span.setAttribute('operation.id', crypto.randomUUID());
    await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 5000)));
    span.setAttribute('operation.status', 'success');
    span.end();
    return Response.json({
      message: 'It works.',
    });
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({ code: SpanStatusCode.ERROR });
    span.end();
    return Response.json(
      { error: 'Operation failed' }, 
      { status: 500 }
    );
  }
}