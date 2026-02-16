import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { db } from "@/db";
import { subscriptions, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

export async function POST(req: Request) {
  const stripe = getStripe();
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.mode === "subscription" && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        const clerkUserId =
          session.metadata?.clerkUserId ||
          (await getClerkUserIdFromCustomer(sub.customer as string));

        if (clerkUserId) {
          await upsertSubscription(sub, clerkUserId);
        }
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const clerkUserId = await getClerkUserIdFromCustomer(
        sub.customer as string
      );

      if (clerkUserId) {
        await upsertSubscription(sub, clerkUserId);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const clerkUserId = await getClerkUserIdFromCustomer(
        sub.customer as string
      );

      if (clerkUserId) {
        await db
          .update(subscriptions)
          .set({ status: "canceled", updatedAt: new Date() })
          .where(eq(subscriptions.id, sub.id));
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subId = (invoice as any).subscription as string | null;
      if (subId) {
        await db
          .update(subscriptions)
          .set({ status: "past_due", updatedAt: new Date() })
          .where(eq(subscriptions.id, subId));
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}

async function getClerkUserIdFromCustomer(
  customerId: string
): Promise<string | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.stripeCustomerId, customerId));
  return user?.id ?? null;
}

async function upsertSubscription(
  sub: Stripe.Subscription,
  clerkUserId: string
) {
  await db
    .insert(subscriptions)
    .values({
      id: sub.id,
      userId: clerkUserId,
      status: sub.status,
      stripePriceId: sub.items.data[0].price.id,
      currentPeriodStart: new Date(sub.items.data[0].current_period_start * 1000),
      currentPeriodEnd: new Date(sub.items.data[0].current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    })
    .onConflictDoUpdate({
      target: subscriptions.id,
      set: {
        status: sub.status,
        stripePriceId: sub.items.data[0].price.id,
        currentPeriodStart: new Date(sub.items.data[0].current_period_start * 1000),
        currentPeriodEnd: new Date(sub.items.data[0].current_period_end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        updatedAt: new Date(),
      },
    });
}
