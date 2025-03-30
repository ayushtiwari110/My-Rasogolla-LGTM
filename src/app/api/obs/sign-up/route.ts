export async function GET() {
    try {
      globalThis.metrics?.userSignups.inc({
        plan_type: "free",
        referral_source: "direct"
      });
  
      return Response.json({
        message: 'User signup recorded successfully'
      });
    } catch (error) {
      globalThis?.logger?.error({
        err: error,
        message: 'Failed to record user signup'
      });
  
      return Response.json({
        error: 'Failed to record user signup'
      }, { status: 500 });
    }
  }