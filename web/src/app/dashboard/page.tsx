"use client";

import { Button } from "@heroui/react";
import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";

interface SubscriptionData {
  active: boolean;
  subscription: {
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
}

export default function DashboardPage() {
  const { user } = useUser();
  const [subData, setSubData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  async function fetchSubscription() {
    try {
      const res = await fetch("/api/subscription/status");
      const data = await res.json();
      setSubData(data);
    } catch {
      console.error("Failed to fetch subscription");
    } finally {
      setLoading(false);
    }
  }

  async function handleManageSubscription() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-xl font-bold text-orange-500">
            🔥 Redditist
          </Link>
          <div className="flex items-center gap-4">
            <UserButton />
          </div>
        </div>
      </nav>

      {/* Dashboard */}
      <section className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-gray-400">
          Welcome back, {user?.firstName || user?.emailAddresses[0]?.emailAddress}
        </p>

        {loading ? (
          <div className="mt-8 text-gray-400">Loading subscription...</div>
        ) : subData?.active ? (
          <div className="mt-8 rounded-xl border border-green-500/30 bg-green-500/5 p-6">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
              <span className="font-semibold text-green-400">
                Active Subscription
              </span>
            </div>
            <p className="mt-3 text-sm text-gray-400">
              Your subscription renews on{" "}
              {new Date(
                subData.subscription!.currentPeriodEnd
              ).toLocaleDateString()}
              {subData.subscription!.cancelAtPeriodEnd && (
                <span className="text-yellow-400">
                  {" "}
                  (Cancels at end of period)
                </span>
              )}
            </p>
            <Button
              variant="bordered"
              className="mt-4"
              isLoading={portalLoading}
              onPress={handleManageSubscription}
            >
              Manage Subscription
            </Button>
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="font-semibold">No Active Subscription</p>
            <p className="mt-2 text-sm text-gray-400">
              Subscribe to unlock unlimited AI-powered Reddit summaries.
            </p>
            <Link href="/pricing">
              <Button color="warning" className="mt-4">
                View Plans
              </Button>
            </Link>
          </div>
        )}

        {/* Extension Install */}
        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="font-semibold">Chrome Extension</h3>
          <p className="mt-2 text-sm text-gray-400">
            Install the Redditist Chrome extension to start summarizing Reddit
            posts. After installing, click &quot;Sign In&quot; in the extension popup to
            connect your account.
          </p>
        </div>
      </section>
    </div>
  );
}
