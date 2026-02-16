"use client";

import { Button } from "@heroui/react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import AuthModal from "@/components/auth-modal";

export default function LandingPage() {
    const { isSignedIn } = useUser();
    const searchParams = useSearchParams();
    const [authOpen, setAuthOpen] = useState(false);
    const [authMode, setAuthMode] = useState<"sign-in" | "sign-up">("sign-up");

    // Auto-open modal if redirected from protected route
    useEffect(() => {
        const authParam = searchParams.get("auth");
        if (authParam === "sign-in" || authParam === "sign-up") {
            openAuth(authParam);
        }
    }, [searchParams]);

    function openAuth(mode: "sign-in" | "sign-up") {
        setAuthMode(mode);
        setAuthOpen(true);
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Nav */}
            <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <span className="text-xl font-bold text-orange-500">
                        🔥 Redditist
                    </span>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/pricing"
                            className="text-sm text-zinc-400 transition-colors hover:text-white"
                        >
                            Pricing
                        </Link>
                        {isSignedIn ? (
                            <Link href="/dashboard">
                                <Button
                                    size="sm"
                                    variant="flat"
                                    className="bg-white/5 text-white"
                                >
                                    Dashboard
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Button
                                    size="sm"
                                    variant="light"
                                    className="text-zinc-300"
                                    onPress={() => openAuth("sign-in")}
                                >
                                    Sign In
                                </Button>
                                <Button
                                    size="sm"
                                    className="bg-linear-to-r from-orange-500 to-orange-600 font-semibold text-white shadow-md shadow-orange-500/20"
                                    onPress={() => openAuth("sign-up")}
                                >
                                    Get Started
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative mx-auto max-w-6xl px-6 pb-20 pt-60 text-center  h-screen">
                {/* Glow effect */}
                <div className="pointer-events-none absolute inset-x-0 top-20 mx-auto h-72 w-full max-w-lg rounded-full bg-orange-500/10 blur-[120px]" />

                <div className="relative">
                    <h1 className="text-5xl  font-extrabold leading-[1.1] tracking-tight md:text-6xl">
                        Summarize Reddit Posts
                        <br />
                        <span className="bg-linear-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                            in Seconds
                        </span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
                        Stop scrolling through endless threads. Get instant AI
                        summaries of any Reddit post and its top comments.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-4">
                        {isSignedIn ? (
                            <Link href="/dashboard">
                                <Button
                                    size="lg"
                                    className="bg-linear-to-r from-orange-500 to-orange-600 px-8 font-semibold text-white shadow-lg shadow-orange-500/25"
                                >
                                    Go to Dashboard
                                </Button>
                            </Link>
                        ) : (
                            <Button
                                size="lg"
                                className="bg-linear-to-r from-orange-500 to-orange-600 px-8 font-semibold text-white shadow-lg shadow-orange-500/25"
                                onPress={() => openAuth("sign-up")}
                            >
                                Get Started Free
                            </Button>
                        )}
                        <Link href="/pricing">
                            <Button
                                size="lg"
                                variant="bordered"
                                className="border-zinc-700 px-8 text-zinc-300 hover:border-zinc-500"
                            >
                                View Pricing
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="mx-auto max-w-6xl px-6 py-24">
                <p className="text-center text-sm font-medium uppercase tracking-widest text-orange-500">
                    How it works
                </p>
                <h2 className="mt-3 text-center text-3xl font-bold">
                    Three simple steps
                </h2>

                <div className="mt-14 grid gap-6 md:grid-cols-3">
                    {[
                        {
                            step: "01",
                            title: "Install the Extension",
                            desc: "Add Redditist to Chrome in one click. It sits quietly in your toolbar until you need it.",
                        },
                        {
                            step: "02",
                            title: "Sign In & Subscribe",
                            desc: "Create an account and subscribe for $5/mo. No API keys needed — we handle everything.",
                        },
                        {
                            step: "03",
                            title: "Summarize Any Post",
                            desc: "Visit any Reddit post, click the icon, and get an AI summary of the post and comments instantly.",
                        },
                    ].map((item) => (
                        <div
                            key={item.step}
                            className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-8 transition-all hover:border-orange-500/20 hover:bg-white/[0.04]"
                        >
                            <span className="text-5xl font-black text-white/[0.03] transition-colors group-hover:text-orange-500/10">
                                {item.step}
                            </span>
                            <h3 className="mt-4 text-lg font-semibold text-white">
                                {item.title}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Open Source */}
            <section className="mx-auto max-w-6xl px-6 py-24">
                <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.03] to-transparent p-[1px]">
                    <div className="rounded-3xl bg-zinc-950 px-8 py-16 md:px-16">
                        <div className="flex flex-col items-center gap-12 md:flex-row">
                            {/* Left — Icon + Text */}
                            <div className="flex-1 text-center md:text-left">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-400">
                                    <svg
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                                        />
                                    </svg>
                                    Open Source
                                </div>
                                <h2 className="text-3xl font-bold text-white">
                                    Free forever with{" "}
                                    <span className="text-emerald-400">
                                        your own API key
                                    </span>
                                </h2>
                                <p className="mt-4 max-w-lg text-zinc-400 leading-relaxed">
                                    Redditist is fully open source. Clone the
                                    repo, plug in your own OpenAI API key, and
                                    use it for free — no subscription required.
                                    The paid plan is for those who want a
                                    zero-config experience.
                                </p>
                                <div className="mt-8 flex flex-wrap items-center gap-4 justify-center md:justify-start">
                                    <a
                                        href="https://github.com/redditist/redditist"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Button
                                            size="lg"
                                            variant="bordered"
                                            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                            startContent={
                                                <svg
                                                    className="h-5 w-5"
                                                    fill="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                                                </svg>
                                            }
                                        >
                                            View on GitHub
                                        </Button>
                                    </a>
                                    <Link href="/pricing">
                                        <Button
                                            size="lg"
                                            variant="light"
                                            className="text-zinc-400 hover:text-white"
                                        >
                                            Or subscribe for $5/mo →
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            {/* Right — Visual comparison */}
                            <div className="w-full max-w-xs flex-shrink-0">
                                <div className="space-y-4">
                                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-5">
                                        <p className="text-sm font-semibold text-emerald-400">
                                            Free (BYO Key)
                                        </p>
                                        <ul className="mt-3 space-y-2 text-sm text-zinc-400">
                                            <li className="flex items-center gap-2">
                                                <span className="text-emerald-400">
                                                    ✓
                                                </span>{" "}
                                                Unlimited summaries
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="text-emerald-400">
                                                    ✓
                                                </span>{" "}
                                                Your own OpenAI key
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="text-emerald-400">
                                                    ✓
                                                </span>{" "}
                                                Full source code access
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="text-emerald-400">
                                                    ✓
                                                </span>{" "}
                                                Self-hosted
                                            </li>
                                        </ul>
                                    </div>
                                    <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.05] p-5">
                                        <p className="text-sm font-semibold text-orange-400">
                                            Pro ($5/mo)
                                        </p>
                                        <ul className="mt-3 space-y-2 text-sm text-zinc-400">
                                            <li className="flex items-center gap-2">
                                                <span className="text-orange-400">
                                                    ✓
                                                </span>{" "}
                                                No API key needed
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="text-orange-400">
                                                    ✓
                                                </span>{" "}
                                                One-click install
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="text-orange-400">
                                                    ✓
                                                </span>{" "}
                                                Automatic updates
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="text-orange-400">
                                                    ✓
                                                </span>{" "}
                                                Zero configuration
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="mx-auto max-w-6xl px-6 py-20">
                <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-zinc-900 to-zinc-950 px-8 py-16 text-center">
                    <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-orange-500/10 blur-[80px]" />
                    <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-orange-500/5 blur-[80px]" />
                    <div className="relative">
                        <h2 className="text-3xl font-bold">
                            Ready to save time on Reddit?
                        </h2>
                        <p className="mx-auto mt-4 max-w-md text-zinc-400">
                            Join Redditors who use Redditist to stay informed
                            without the endless scrolling.
                        </p>
                        {isSignedIn ? (
                            <Link href="/dashboard">
                                <Button
                                    size="lg"
                                    className="mt-8 bg-linear-to-r from-orange-500 to-orange-600 px-10 font-semibold text-white shadow-lg shadow-orange-500/25"
                                >
                                    Go to Dashboard
                                </Button>
                            </Link>
                        ) : (
                            <Button
                                size="lg"
                                className="mt-8 bg-linear-to-r from-orange-500 to-orange-600 px-10 font-semibold text-white shadow-lg shadow-orange-500/25"
                                onPress={() => openAuth("sign-up")}
                            >
                                Get Started Now
                            </Button>
                        )}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 px-6 py-8">
                <div className="mx-auto max-w-6xl text-center text-sm text-zinc-600">
                    &copy; {new Date().getFullYear()} Redditist. All rights
                    reserved.
                </div>
            </footer>

            {/* Auth Modal */}
            <AuthModal
                isOpen={authOpen}
                onClose={() => setAuthOpen(false)}
                defaultMode={authMode}
            />
        </div>
    );
}
