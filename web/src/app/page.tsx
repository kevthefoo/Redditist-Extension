"use client";

import { Button } from "@heroui/react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="text-xl font-bold text-orange-500">
            🔥 Redditist
          </span>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm text-gray-400 hover:text-white">
              Pricing
            </Link>
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
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <h1 className="text-5xl font-bold leading-tight tracking-tight">
          Summarize Reddit Posts
          <br />
          <span className="text-orange-500">in Seconds</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
          Redditist is a Chrome extension that uses AI to instantly summarize
          any Reddit post and its comments. Save hours of scrolling — get the
          key insights immediately.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/sign-up">
            <Button size="lg" color="warning" className="font-semibold">
              Start Free Trial
            </Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="bordered">
              View Pricing
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold">How It Works</h2>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 text-3xl">📥</div>
            <h3 className="mb-2 text-lg font-semibold">1. Install Extension</h3>
            <p className="text-sm text-gray-400">
              Add the Redditist Chrome extension to your browser in one click.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 text-3xl">🔑</div>
            <h3 className="mb-2 text-lg font-semibold">2. Sign In & Subscribe</h3>
            <p className="text-sm text-gray-400">
              Create an account and subscribe to get unlimited AI-powered
              summaries.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 text-3xl">⚡</div>
            <h3 className="mb-2 text-lg font-semibold">
              3. Summarize Any Post
            </h3>
            <p className="text-sm text-gray-400">
              Visit any Reddit post, click the extension, and get an instant
              AI summary of the post and comments.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12">
          <h2 className="text-3xl font-bold">Ready to save time on Reddit?</h2>
          <p className="mt-4 text-gray-400">
            Join thousands of Redditors who use Redditist to stay informed
            without the endless scrolling.
          </p>
          <Link href="/sign-up">
            <Button size="lg" color="warning" className="mt-8 font-semibold">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-8">
        <div className="mx-auto max-w-6xl text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Redditist. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
