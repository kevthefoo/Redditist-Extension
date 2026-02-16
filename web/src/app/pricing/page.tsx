"use client";

import { Button } from "@heroui/react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";
import AuthModal from "@/components/auth-modal";

export default function PricingPage() {
  const { isSignedIn } = useUser();
  const [loading, setLoading] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"sign-in" | "sign-up">("sign-up");

  function openAuth(mode: "sign-in" | "sign-up") {
    setAuthMode(mode);
    setAuthOpen(true);
  }

  async function handleSubscribe() {
    if (!isSignedIn) {
      openAuth("sign-up");
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

  const features = [
    "Unlimited Reddit post summaries",
    "AI-powered comment analysis",
    "15+ language support",
    "Works on new & old Reddit",
    "No API key needed",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold text-orange-500">
            🔥 Redditist
          </Link>
          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <Link href="/dashboard">
                <Button size="sm" variant="flat" className="bg-white/5 text-white">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Button size="sm" variant="light" className="text-zinc-300" onPress={() => openAuth("sign-in")}>
                  Sign In
                </Button>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-orange-500 to-orange-600 font-semibold text-white shadow-md shadow-orange-500/20"
                  onPress={() => openAuth("sign-up")}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Pricing */}
      <section className="relative mx-auto max-w-lg px-6 pb-20 pt-36 text-center">
        <div className="pointer-events-none absolute inset-x-0 top-10 mx-auto h-60 w-full max-w-sm rounded-full bg-orange-500/8 blur-[100px]" />

        <div className="relative">
          <h1 className="text-4xl font-extrabold tracking-tight">Simple Pricing</h1>
          <p className="mt-4 text-zinc-400">
            One plan. Unlimited summaries. Cancel anytime.
          </p>

          <div className="mt-12 overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-b from-white/[0.04] to-transparent p-[1px]">
            <div className="rounded-2xl bg-zinc-900 p-8">
              <p className="text-sm font-medium uppercase tracking-wider text-orange-400">Monthly</p>
              <div className="mt-4 flex items-baseline justify-center gap-1">
                <span className="text-6xl font-extrabold text-white">$5</span>
                <span className="text-lg text-zinc-500">/mo</span>
              </div>

              <div className="mt-8 space-y-4">
                {features.map((f) => (
                  <div key={f} className="flex items-center gap-3 text-left text-sm">
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-500/10">
                      <svg className="h-3 w-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-zinc-300">{f}</span>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                className="mt-8 w-full bg-gradient-to-r from-orange-500 to-orange-600 font-semibold text-white shadow-lg shadow-orange-500/25"
                isLoading={loading}
                onPress={handleSubscribe}
              >
                {isSignedIn ? "Subscribe Now" : "Get Started"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} defaultMode={authMode} />
    </div>
  );
}
