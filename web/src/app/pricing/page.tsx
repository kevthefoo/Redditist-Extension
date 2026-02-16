"use client";

import { Button } from "@heroui/react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";

export default function PricingPage() {
  const { isSignedIn } = useUser();
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    if (!isSignedIn) {
      window.location.href = "/sign-up";
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
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
            {isSignedIn ? (
              <Link href="/dashboard">
                <Button size="sm" variant="flat">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button size="sm" variant="flat">
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button size="sm" color="warning">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Pricing */}
      <section className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="text-4xl font-bold">Simple Pricing</h1>
        <p className="mt-4 text-gray-400">
          One plan. Unlimited summaries. Cancel anytime.
        </p>

        <div className="mt-12 rounded-2xl border border-orange-500/30 bg-white/5 p-8">
          <h3 className="text-lg font-semibold text-gray-300">Monthly</h3>
          <div className="mt-4">
            <span className="text-5xl font-bold">$5</span>
            <span className="text-gray-400">/month</span>
          </div>
          <ul className="mt-8 space-y-3 text-left text-sm text-gray-300">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span> Unlimited Reddit post
              summaries
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span> AI-powered comment
              analysis
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span> 15+ language support
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span> Works on new &amp; old
              Reddit
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span> No API key needed
            </li>
          </ul>
          <Button
            color="warning"
            size="lg"
            className="mt-8 w-full font-semibold"
            isLoading={loading}
            onPress={handleSubscribe}
          >
            {isSignedIn ? "Subscribe Now" : "Get Started"}
          </Button>
        </div>
      </section>
    </div>
  );
}
