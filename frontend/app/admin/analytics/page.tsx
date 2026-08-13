"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Analytics = {
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
};

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadAnalytics = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/analytics/calls",
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load analytics");
      }

      const data: Analytics = await response.json();

      setAnalytics(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Analytics error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();

    const interval = setInterval(loadAnalytics, 10000);

    return () => clearInterval(interval);
  }, []);

  const successRate = useMemo(() => {
    if (!analytics || analytics.total_calls === 0) {
      return 0;
    }

    return Math.round(
      (analytics.successful_calls /
        analytics.total_calls) *
        100
    );
  }, [analytics]);

  const failedRate = useMemo(() => {
    if (!analytics || analytics.total_calls === 0) {
      return 0;
    }

    return Math.round(
      (analytics.failed_calls /
        analytics.total_calls) *
        100
    );
  }, [analytics]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FFFDF7] p-8 text-[#242321]">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-72 rounded-xl bg-[#F3EBD0]" />
            <div className="h-6 w-96 rounded-xl bg-[#F3EBD0]" />

            <div className="grid gap-4 md:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-32 rounded-3xl bg-white shadow-sm"
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!analytics) {
    return (
      <main className="min-h-screen bg-[#FFFDF7] p-8 text-[#242321]">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-800">
            Unable to load analytics.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFFDF7] text-[#242321]">
      {/* Header */}
      <header className="border-b border-black/5 bg-[#FFF4B8]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10">
          <Link
            href="/"
            className="flex items-center gap-3 transition hover:opacity-80"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F5C542] text-xl shadow-sm">
              ✦
            </div>

            <div>
              <h1 className="text-xl font-black tracking-tight">
                Saarthi
              </h1>

              <p className="text-sm text-[#777268]">
                Learning Intelligence
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-[#6E6A62] sm:block">
              ● Live analytics
            </div>

            <Link
              href="/admin/support"
              className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold transition hover:bg-[#FFF9EC]"
            >
              ← Support
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <section className="mx-auto max-w-7xl px-6 py-10 md:px-10">
        {/* Hero */}
        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#A17800]">
              Day 8 · Learning Outcomes
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">
              Is Saarthi actually
              <span className="block bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#F59E0B] bg-clip-text text-transparent">
                helping learners?
              </span>
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-7 text-[#6E6A62] md:text-lg">
              Instead of measuring only conversations, Saarthi tracks
              whether a learner actually completes a learning activity
              and demonstrates the takeaway.
            </p>
          </div>

          <div className="rounded-3xl border border-[#E9D9A8] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#777268]">
                Learning Success Rate
              </span>

              <span className="text-2xl">🎯</span>
            </div>

            <div className="mt-4 flex items-end gap-3">
              <span className="text-5xl font-black">
                {successRate}%
              </span>

              <span className="pb-2 text-sm text-[#777268]">
                of recorded calls
              </span>
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#F1ECE1]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#F59E0B] transition-all duration-700"
                style={{
                  width: `${successRate}%`,
                }}
              />
            </div>

            <p className="mt-3 text-xs text-[#8A8479]">
              Updated every 10 seconds
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#777268]">
                Total Calls
              </span>

              <span className="text-xl">📞</span>
            </div>

            <p className="mt-5 text-4xl font-black">
              {analytics.total_calls}
            </p>

            <p className="mt-2 text-sm text-[#8A8479]">
              All recorded learner interactions
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#4F7D5A]">
                Successful
              </span>

              <span className="text-xl">✅</span>
            </div>

            <p className="mt-5 text-4xl font-black text-emerald-700">
              {analytics.successful_calls}
            </p>

            <p className="mt-2 text-sm text-[#6A8B71]">
              Learning outcome completed
            </p>
          </div>

          <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-red-700">
                Failed
              </span>

              <span className="text-xl">⚠️</span>
            </div>

            <p className="mt-5 text-4xl font-black text-red-700">
              {analytics.failed_calls}
            </p>

            <p className="mt-2 text-sm text-red-600/70">
              Learning outcome not completed
            </p>
          </div>

          <div className="rounded-3xl border border-[#E9D9A8] bg-[#FFF8E5] p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#8C6A00]">
                Failure Rate
              </span>

              <span className="text-xl">📉</span>
            </div>

            <p className="mt-5 text-4xl font-black text-[#8C6A00]">
              {failedRate}%
            </p>

            <p className="mt-2 text-sm text-[#8A7650]">
              Calls without a completed learning outcome
            </p>
          </div>
        </div>

        {/* Outcome Breakdown */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Visual comparison */}
          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold">
                  Outcome Breakdown
                </h3>

                <p className="mt-1 text-sm text-[#777268]">
                  How recorded conversations are performing.
                </p>
              </div>

              <span className="text-2xl">📊</span>
            </div>

            <div className="mt-8 space-y-6">
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-semibold">
                    Successful learning
                  </span>

                  <span className="font-bold">
                    {analytics.successful_calls}
                  </span>
                </div>

                <div className="h-5 overflow-hidden rounded-full bg-[#EEF4EF]">
                  <div
                    className="h-full rounded-full bg-[#4E9F66]"
                    style={{
                      width:
                        analytics.total_calls > 0
                          ? `${Math.max(
                              (analytics.successful_calls /
                                analytics.total_calls) *
                                100,
                              analytics.successful_calls > 0
                                ? 4
                                : 0
                            )}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-semibold">
                    Needs improvement
                  </span>

                  <span className="font-bold">
                    {analytics.failed_calls}
                  </span>
                </div>

                <div className="h-5 overflow-hidden rounded-full bg-[#FBEDEC]">
                  <div
                    className="h-full rounded-full bg-[#D95F59]"
                    style={{
                      width:
                        analytics.total_calls > 0
                          ? `${Math.max(
                              (analytics.failed_calls /
                                analytics.total_calls) *
                                100,
                              analytics.failed_calls > 0
                                ? 4
                                : 0
                            )}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Meaning panel */}
          <div className="rounded-3xl border border-[#E9D9A8] bg-[#FFF4B8] p-6">
            <div className="text-2xl">🌱</div>

            <h3 className="mt-4 text-xl font-bold">
              Saarthi&apos;s Learning Philosophy
            </h3>

            <p className="mt-3 text-sm leading-7 text-[#6E6A62]">
              A successful interaction is more than keeping someone
              on a call. Saarthi counts success when the learner
              completes the learning activity and can explain what
              they took away from it.
            </p>

            <div className="mt-5 rounded-2xl bg-white/80 p-4">
              <p className="text-sm font-semibold">
                The metric we care about
              </p>

              <p className="mt-2 text-sm text-[#6E6A62]">
                Conversation
                <span className="mx-2">→</span>
                Learning
                <span className="mx-2">→</span>
                Understanding
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex flex-col justify-between gap-3 border-t border-black/5 pt-5 text-xs text-[#938E84] sm:flex-row">
          <p>
            Saarthi · Learning Intelligence
          </p>

          <p>
            {lastUpdated
              ? `Last updated ${lastUpdated.toLocaleTimeString()}`
              : "Waiting for data"}
          </p>
        </div>
      </section>
    </main>
  );
}