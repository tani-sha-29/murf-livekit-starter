"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SupportRequest = {
  reference_id: string;
  reason: string;
  topic: string | null;
  summary: string;
  urgency: "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "ASSIGNED" | "RESOLVED";
  assigned_to: string | null;
  staff_response: string | null;
  created_at: string;
  updated_at: string;
};

export default function MySupportPage() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRequests() {
      try {
        const response = await fetch(
          "http://localhost:8000/support-requests/user/user_001"
        );

        if (!response.ok) {
          throw new Error("Failed to load support requests");
        }

        const data: SupportRequest[] = await response.json();
        setRequests(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load your support requests.");
      } finally {
        setLoading(false);
      }
    }

    loadRequests();
  }, []);

  return (
    <main className="min-h-screen bg-[#FFF9EC] text-[#18202A]">
      <header className="border-b border-[#E9D9A8] bg-[#FFF4C7]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F5C542]">
              ✦
            </div>

            <div>
              <h1 className="text-xl font-bold">Saarthi</h1>
              <p className="text-sm text-[#5E6470]">
                My Support
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="rounded-xl border border-[#D8C98F] bg-white px-4 py-2 text-sm"
          >
            ← Home
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-sm font-semibold uppercase tracking-wider text-[#A17800]">
          Human Support
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          Your Support Requests
        </h2>

        <p className="mt-2 text-[#686E78]">
          See the status of requests created with Saarthi and any
          response from learning support.
        </p>

        {loading && (
          <div className="mt-8 rounded-2xl bg-white p-8 shadow-sm">
            Loading your requests...
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && requests.length === 0 && (
          <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm">
            <div className="text-3xl">🌱</div>

            <h3 className="mt-3 font-semibold">
              No support requests
            </h3>

            <p className="mt-1 text-sm text-[#747A84]">
              When Saarthi creates a human-support request for you,
              it will appear here.
            </p>
          </div>
        )}

        <div className="mt-8 space-y-5">
          {requests.map((request) => (
            <div
              key={request.reference_id}
              className="rounded-3xl border border-[#E7DFCA] bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#FFF4C7] px-3 py-1 text-xs font-semibold">
                  {request.reference_id}
                </span>

                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                  {request.urgency}
                </span>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {request.status}
                </span>
              </div>

              <h3 className="mt-4 text-xl font-bold">
                {request.topic || "General Learning Support"}
              </h3>

              <p className="mt-3 text-sm leading-6 text-[#5F6570]">
                {request.summary}
              </p>

              <div className="mt-6 rounded-2xl bg-[#FFF8E5] p-5">
                <p className="text-sm font-semibold">
                  Human Response
                </p>

                {request.staff_response ? (
                  <p className="mt-2 text-sm leading-6 text-[#4F5660]">
                    {request.staff_response}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-[#8A9098]">
                    Learning support has not responded yet.
                  </p>
                )}
              </div>

              <p className="mt-4 text-xs text-[#8A9098]">
                Created{" "}
                {new Date(request.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}