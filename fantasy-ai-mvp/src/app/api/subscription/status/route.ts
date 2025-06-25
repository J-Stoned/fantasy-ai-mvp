import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripeService, SUBSCRIPTION_PLANS } from '@/lib/payments/stripe-client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const status = await stripeService.getSubscriptionStatus(session.user.id);
    const currentPlan = SUBSCRIPTION_PLANS.find(p => p.id === status.plan);

    return NextResponse.json({
      ...status,
      planDetails: currentPlan,
      availablePlans: SUBSCRIPTION_PLANS
    });

  } catch (error) {
    console.error('Subscription status error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    );
  }
}