export async function GET() {
    try {
      // throw new Error("Something went terribly wrong.")
      globalThis?.logger?.info({
        meta: {
          requestId: crypto.randomUUID(),
          extra: 'This is some extra information that you can add to the meta.',
          anything: "anything"
        },
        message: 'Message of the log.',
      });
      return Response.json({
        message: 'It works.',
      });
    } catch (error) {
      globalThis?.logger?.error({
        err: error,
        message: 'Something went wrong.',
      });
      return Response.json({
        message: 'An error occurred.',
      }, { status: 500 });
    }
  }

