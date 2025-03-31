export async function GET() {
  // randomly select plan_type and referral_source
  const planTypes = ["free", "paid"];
  const referralSources = ["twitter", "linkedin", "google"];
  const randomPlanType = planTypes[Math.floor(Math.random() * planTypes.length)];
  const randomReferralSource = referralSources[Math.floor(Math.random() * referralSources.length)];
    try {
      globalThis.metrics?.userSignups.inc({
        plan_type: randomPlanType,
        referral_source: randomReferralSource
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