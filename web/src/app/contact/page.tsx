import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-300">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-8"
        >
          &larr; Back to home
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">Contact Us</h1>
        <p className="text-zinc-500 mb-10">
          Have questions, feedback, or need support? We&apos;d love to hear from you.
        </p>

        <div className="space-y-8">
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
            <h2 className="text-lg font-semibold text-white mb-3">Email</h2>
            <p className="text-zinc-400">
              Reach us at{" "}
              <a
                href="mailto:support@redditist.com"
                className="text-orange-500 hover:text-orange-400 transition-colors"
              >
                support@redditist.com
              </a>
            </p>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
            <h2 className="text-lg font-semibold text-white mb-3">Bug Reports &amp; Feature Requests</h2>
            <p className="text-zinc-400">
              Found a bug or have an idea? Let us know and we&apos;ll get back to you as soon as possible.
            </p>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
            <h2 className="text-lg font-semibold text-white mb-3">Response Time</h2>
            <p className="text-zinc-400">
              We typically respond within 24&ndash;48 hours during business days.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
