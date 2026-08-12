// "use client";

// import { useEffect, useState } from "react";
// import Link from "next/link";

// type SupportRequest = {
//   reference_id: string;
//   user_id: string;
//   reason: string;
//   topic: string | null;
//   summary: string;
//   urgency: "LOW" | "MEDIUM" | "HIGH";
//   status: "OPEN" | "ASSIGNED" | "RESOLVED";
//   created_at: string;
//   updated_at: string;
// };

// export default function SupportDashboard() {
//   const [requests, setRequests] = useState<SupportRequest[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [selectedRequest, setSelectedRequest] =
//   useState<SupportRequest | null>(null);
//   const [responseText, setResponseText] = useState("");
//   const [isResponding, setIsResponding] = useState(false);
//   const [actionLoading, setActionLoading] = useState(false);
  
//   const updateRequest = async (
//   referenceId: string,
//   action: "assign" | "respond" | "resolve",
//   data: Record<string, string> = {}
// ) => {
//   const response = await fetch(
//     `http://localhost:8000/support-requests/${referenceId}`,
//     {
//       method: "PATCH",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         action,
//         ...data,
//       }),
//     }
//   );

//   if (!response.ok) {
//     throw new Error("Failed to update support request");
//   }

//   const refreshed = await fetch(
//     "http://localhost:8000/support-requests"
//   );

//   if (!refreshed.ok) {
//     throw new Error("Failed to refresh support requests");
//   }

//   const refreshedData: SupportRequest[] =
//     await refreshed.json();

//   setRequests(refreshedData);

//   const updatedRequest = refreshedData.find(
//     (request) =>
//       request.reference_id === referenceId
//   );

//   if (updatedRequest) {
//     setSelectedRequest(updatedRequest);
//   }
// };

//   useEffect(() => {
//     async function loadRequests() {
//       try {
//         const response = await fetch(
//           "http://localhost:8000/support-requests"
//         );

//         if (!response.ok) {
//           throw new Error("Failed to load support requests");
//         }

//         const data = await response.json();
//         setRequests(data);
//       } catch (err) {
//         console.error(err);
//         setError("Unable to load support requests.");
//       } finally {
//         setLoading(false);
//       }
//     }

//     loadRequests();
//   }, []);

//   const openCount = requests.filter(
//     (r) => r.status === "OPEN"
//   ).length;

//   const assignedCount = requests.filter(
//     (r) => r.status === "ASSIGNED"
//   ).length;

//   const highCount = requests.filter(
//     (r) => r.urgency === "HIGH"
//   ).length;

//   const resolvedCount = requests.filter(
//     (r) => r.status === "RESOLVED"
//   ).length;

//   const urgencyBadge = (urgency: SupportRequest["urgency"]) => {
//     if (urgency === "HIGH") {
//       return "bg-red-50 text-red-700 border border-red-200";
//     }

//     if (urgency === "MEDIUM") {
//       return "bg-orange-50 text-orange-700 border border-orange-200";
//     }

//     return "bg-emerald-50 text-emerald-700 border border-emerald-200";
//   };

//   const statusBadge = (status: SupportRequest["status"]) => {
//     if (status === "OPEN") {
//       return "bg-amber-50 text-amber-700 border border-amber-200";
//     }

//     if (status === "ASSIGNED") {
//       return "bg-blue-50 text-blue-700 border border-blue-200";
//     }

//     return "bg-emerald-50 text-emerald-700 border border-emerald-200";
//   };

//   return (
//     <main className="min-h-screen bg-[#FFF9EC] text-[#18202A]">
//       {/* Header */}
//       <header className="border-b border-[#E9D9A8] bg-[#FFF4C7]">
//         <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
//           <div className="flex items-center gap-3">
//             <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F5C542] text-xl shadow-sm">
//               ✦
//             </div>

//             <div>
//               <h1 className="text-xl font-bold tracking-tight">
//                 Saarthi
//               </h1>

//               <p className="text-sm text-[#5E6470]">
//                 Learning Support Operations
//               </p>
//             </div>
//           </div>

//           <Link
//             href="/"
//             className="rounded-xl border border-[#D8C98F] bg-white px-4 py-2 text-sm font-medium transition hover:bg-[#FFFDF5]"
//           >
//             ← Back to Home
//           </Link>
//         </div>
//       </header>

//       <section className="mx-auto max-w-7xl px-6 py-8">
//         {/* Page title */}
//         <div className="mb-8">
//           <p className="text-sm font-semibold uppercase tracking-wider text-[#A17800]">
//             Human Support
//           </p>

//           <h2 className="mt-2 text-3xl font-bold tracking-tight">
//             Support Dashboard
//           </h2>

//           <p className="mt-2 max-w-2xl text-[#686E78]">
//             Review learner escalations, prioritize urgent requests,
//             and coordinate human assistance.
//           </p>
//         </div>

//         {/* Stats */}
//         <div className="grid gap-4 md:grid-cols-4">
//           <div className="rounded-2xl border border-[#E9D9A8] bg-white p-5 shadow-sm">
//             <p className="text-sm text-[#747A84]">Open Requests</p>
//             <p className="mt-2 text-3xl font-bold">{openCount}</p>
//           </div>

//           <div className="rounded-2xl border border-[#F0D0C5] bg-white p-5 shadow-sm">
//             <p className="text-sm text-[#747A84]">High Urgency</p>
//             <p className="mt-2 text-3xl font-bold text-red-600">
//               {highCount}
//             </p>
//           </div>

//           <div className="rounded-2xl border border-[#CADBED] bg-white p-5 shadow-sm">
//             <p className="text-sm text-[#747A84]">Assigned</p>
//             <p className="mt-2 text-3xl font-bold text-blue-600">
//               {assignedCount}
//             </p>
//           </div>

//           <div className="rounded-2xl border border-[#CDE5D4] bg-white p-5 shadow-sm">
//             <p className="text-sm text-[#747A84]">Resolved</p>
//             <p className="mt-2 text-3xl font-bold text-emerald-600">
//               {resolvedCount}
//             </p>
//           </div>
//         </div>

//         {/* Queue */}
//         <div className="mt-10">
//           <div className="mb-4 flex items-end justify-between">
//             <div>
//               <h3 className="text-xl font-bold">
//                 Human Support Queue
//               </h3>

//               <p className="mt-1 text-sm text-[#747A84]">
//                 Highest urgency requests should be handled first.
//               </p>
//             </div>
//           </div>

//           {loading && (
//             <div className="rounded-2xl border border-[#E9D9A8] bg-white p-8 shadow-sm">
//               Loading support requests...
//             </div>
//           )}

//           {error && (
//             <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
//               {error}
//             </div>
//           )}

//           {!loading && !error && requests.length === 0 && (
//             <div className="rounded-2xl border border-[#E9D9A8] bg-white p-10 text-center shadow-sm">
//               <div className="text-3xl">🌱</div>
//               <h4 className="mt-3 font-semibold">
//                 No support requests yet
//               </h4>
//               <p className="mt-1 text-sm text-[#747A84]">
//                 New learner escalations will appear here.
//               </p>
//             </div>
//           )}

//           <div className="space-y-4">
//             {requests.map((request) => (
//               <div
//                 key={request.reference_id}
//                 className="rounded-2xl border border-[#E7DFCA] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
//               >
//                 <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
//                   <div className="flex-1">
//                     <div className="flex flex-wrap items-center gap-2">
//                       <span
//                         className={`rounded-full px-3 py-1 text-xs font-semibold ${urgencyBadge(
//                           request.urgency
//                         )}`}
//                       >
//                         {request.urgency}
//                       </span>

//                       <span
//                         className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(
//                           request.status
//                         )}`}
//                       >
//                         {request.status}
//                       </span>

//                       <span className="text-sm font-semibold text-[#59606B]">
//                         {request.reference_id}
//                       </span>
//                     </div>

//                     <h4 className="mt-4 text-lg font-bold">
//                       {request.topic || "General Learning Support"}
//                     </h4>

//                     <p className="mt-3 text-sm leading-6 text-[#5F6570]">
//                       {request.summary}
//                     </p>

//                     <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
//                       <div>
//                         <span className="font-semibold">
//                           Reason:
//                         </span>{" "}
//                         <span className="text-[#656B75]">
//                           {request.reason}
//                         </span>
//                       </div>

//                       <div>
//                         <span className="font-semibold">
//                           Learner:
//                         </span>{" "}
//                         <span className="text-[#656B75]">
//                           {request.user_id}
//                         </span>
//                       </div>
//                     </div>

//                     <p className="mt-4 text-xs text-[#8A9098]">
//                       Created{" "}
//                       {new Date(
//                         request.created_at
//                       ).toLocaleString()}
//                     </p>
//                   </div>

//                   <div className="flex shrink-0 gap-2">
//                     <button
//                     className="rounded-xl bg-[#18202A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2B3440]"
//                     onClick={() => setSelectedRequest(request)}
//                     >
//                     View Request
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>
//       {selectedRequest && (
//   <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
//     <div className="w-full max-w-3xl rounded-3xl bg-[#FFFDF7] shadow-2xl">

//       {/* Header */}
//       <div className="flex items-start justify-between border-b border-[#E9D9A8] bg-[#FFF4C7] p-6">
//         <div>
//           <p className="text-sm font-semibold uppercase tracking-wider text-[#A17800]">
//             Human Support Request
//           </p>

//           <h2 className="mt-1 text-2xl font-bold">
//             {selectedRequest.reference_id}
//           </h2>
//         </div>

//         <button
//           onClick={() => setSelectedRequest(null)}
//           className="rounded-xl px-3 py-2 text-lg text-[#59606B] hover:bg-white"
//         >
//           ✕
//         </button>
//       </div>

//       {/* Request details */}
//       <div className="space-y-6 p-6">

//         <div className="grid gap-4 md:grid-cols-3">

//           <div>
//             <p className="text-xs font-semibold uppercase text-[#8A9098]">
//               Urgency
//             </p>
//             <p className="mt-1 font-bold text-red-600">
//               {selectedRequest.urgency}
//             </p>
//           </div>

//           <div>
//             <p className="text-xs font-semibold uppercase text-[#8A9098]">
//               Status
//             </p>
//             <p className="mt-1 font-bold">
//               {selectedRequest.status}
//             </p>
//           </div>

//           <div>
//             <p className="text-xs font-semibold uppercase text-[#8A9098]">
//               Learner
//             </p>
//             <p className="mt-1 font-bold">
//               {selectedRequest.user_id}
//             </p>
//           </div>

//         </div>

//         <div>
//           <p className="text-sm font-semibold">Topic</p>
//           <div className="mt-2 rounded-2xl bg-[#FFF8E5] p-4">
//             {selectedRequest.topic || "General Learning Support"}
//           </div>
//         </div>

//         <div>
//           <p className="text-sm font-semibold">Reason</p>
//           <div className="mt-2 rounded-2xl bg-[#F7F7F5] p-4 text-sm leading-6">
//             {selectedRequest.reason}
//           </div>
//         </div>

//         <div>
//           <p className="text-sm font-semibold">
//             Learner Summary
//           </p>
//           <div className="mt-2 rounded-2xl bg-[#F7F7F5] p-4 text-sm leading-6">
//             {selectedRequest.summary}
//           </div>
//         </div>

//         <div>
//           <p className="text-sm font-semibold">
//             Created
//           </p>
//           <p className="mt-2 text-sm text-[#686E78]">
//             {new Date(
//               selectedRequest.created_at
//             ).toLocaleString()}
//           </p>
//         </div>

//         {/* Future staff actions */}
//         <div className="flex flex-wrap gap-3 border-t border-[#E5E0D4] pt-5">
//           <button
//             className="rounded-xl bg-[#F5C542] px-5 py-2.5 text-sm font-semibold text-[#18202A] hover:bg-[#E9B92F]"
//             onClick={async () => {
//                 try {
//                     await updateRequest(
//                         selectedRequest.reference_id,
//                         "assign",
//                         {
//                             assigned_to: "staff_admin",
//                         }
//                     );
//                 } catch (error) {
//                   console.error(error);
//                 alert("Could not assign request.");
//                 }
//             }}
//             >
//             Assign to me
//           </button>

//           <button
//             className="rounded-xl border border-[#D8D2C4] px-5 py-2.5 text-sm font-semibold transition hover:bg-[#FFF4C7]"
//             onClick={async () => {
//             const responseText = window.prompt(
//                 "Enter your response to the learner:"
//             );

//             if (!responseText || !responseText.trim()) {
//                 return;
//             }

//             try {
//                 await updateRequest(
//                 selectedRequest.reference_id,
//                 "respond",
//         {
//             response: responseText.trim(),
//         }
//       );
//         } catch (error) {
//           console.error(error);
//           alert("Could not send the response.");
//     }
//   }}
//         >
//             Respond
//             </button>

//              <button
//                 className="rounded-xl border border-[#D8D2C4] px-5 py-2.5 text-sm font-semibold transition hover:bg-emerald-50 hover:text-emerald-700"
//                 onClick={async () => {
//                 const confirmed = window.confirm(
//                  "Mark this support request as resolved?"
//                 );

//             if (!confirmed) {
//             return;
//             }

//             try {
//             await updateRequest(
//         selectedRequest.reference_id,
//         "resolve"
//       );
//     } catch (error) {
//       console.error(error);
//       alert("Could not resolve the request.");
//     }
//   }}
// >
//   Resolve
// </button>
//         </div>

//       </div>
//     </div>
//   </div>
// )}
//     </main>
//   );
 
// }

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SupportRequest = {
  reference_id: string;
  user_id: string;
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

export default function SupportDashboard() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedRequest, setSelectedRequest] =
    useState<SupportRequest | null>(null);

  const [responseText, setResponseText] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const API_BASE_URL = "http://localhost:8000";

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/support-requests`
      );

      if (!response.ok) {
        throw new Error("Failed to load support requests");
      }

      const data: SupportRequest[] = await response.json();
      setRequests(data);

      if (selectedRequest) {
        const updatedSelected = data.find(
          (request) =>
            request.reference_id ===
            selectedRequest.reference_id
        );

        setSelectedRequest(updatedSelected ?? null);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load support requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const updateRequest = async (
    referenceId: string,
    action: "assign" | "respond" | "resolve",
    data: Record<string, string> = {}
  ) => {
    const response = await fetch(
      `${API_BASE_URL}/support-requests/${referenceId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          ...data,
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);

      throw new Error(
        errorBody?.detail ||
          "Failed to update support request"
      );
    }

    await loadRequests();
  };

  const handleAssign = async () => {
    if (!selectedRequest || actionLoading) {
      return;
    }

    try {
      setActionLoading(true);
      setActionMessage("");

      await updateRequest(
        selectedRequest.reference_id,
        "assign",
        {
          assigned_to: "staff_admin",
        }
      );

      setActionMessage("Request assigned successfully.");
    } catch (error) {
      console.error(error);

      setActionMessage(
        error instanceof Error
          ? error.message
          : "Could not assign request."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRespond = async () => {
    if (
      !selectedRequest ||
      !responseText.trim() ||
      actionLoading
    ) {
      return;
    }

    try {
      setActionLoading(true);
      setActionMessage("");

      await updateRequest(
        selectedRequest.reference_id,
        "respond",
        {
          response: responseText.trim(),
        }
      );

      setResponseText("");
      setIsResponding(false);

      setActionMessage("Response sent successfully.");
    } catch (error) {
      console.error(error);

      setActionMessage(
        error instanceof Error
          ? error.message
          : "Could not send response."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedRequest || actionLoading) {
      return;
    }

    try {
      setActionLoading(true);
      setActionMessage("");

      await updateRequest(
        selectedRequest.reference_id,
        "resolve"
      );

      setActionMessage(
        "Request marked as resolved."
      );
    } catch (error) {
      console.error(error);

      setActionMessage(
        error instanceof Error
          ? error.message
          : "Could not resolve request."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedRequest(null);
    setResponseText("");
    setIsResponding(false);
    setActionMessage("");
  };

  const openCount = requests.filter(
    (request) => request.status === "OPEN"
  ).length;

  const assignedCount = requests.filter(
    (request) => request.status === "ASSIGNED"
  ).length;

  const highCount = requests.filter(
    (request) => request.urgency === "HIGH"
  ).length;

  const resolvedCount = requests.filter(
    (request) => request.status === "RESOLVED"
  ).length;

  const urgencyBadge = (
    urgency: SupportRequest["urgency"]
  ) => {
    if (urgency === "HIGH") {
      return "border border-red-200 bg-red-50 text-red-700";
    }

    if (urgency === "MEDIUM") {
      return "border border-orange-200 bg-orange-50 text-orange-700";
    }

    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  };

  const statusBadge = (
    status: SupportRequest["status"]
  ) => {
    if (status === "OPEN") {
      return "border border-amber-200 bg-amber-50 text-amber-700";
    }

    if (status === "ASSIGNED") {
      return "border border-blue-200 bg-blue-50 text-blue-700";
    }

    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  };

  return (
    <main className="min-h-screen bg-[#FFF9EC] text-[#18202A]">
      {/* Header */}
      <header className="border-b border-[#E9D9A8] bg-[#FFF4C7]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-1 py-1 transition hover:opacity-80"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F5C542] text-xl shadow-sm">
              ✦
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Saarthi
              </h1>

              <p className="text-sm text-[#5E6470]">
                Learning Support Operations
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="rounded-xl border border-[#D8C98F] bg-white px-4 py-2 text-sm font-medium transition hover:bg-[#FFFDF5]"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-8">
        {/* Title */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#A17800]">
            Human Support
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            Support Dashboard
          </h2>

          <p className="mt-2 max-w-2xl text-[#686E78]">
            Review learner escalations, prioritize urgent
            requests, and coordinate human assistance.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-[#E9D9A8] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#747A84]">
              Open Requests
            </p>

            <p className="mt-2 text-3xl font-bold">
              {openCount}
            </p>
          </div>

          <div className="rounded-2xl border border-[#F0D0C5] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#747A84]">
              High Urgency
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {highCount}
            </p>
          </div>

          <div className="rounded-2xl border border-[#CADBED] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#747A84]">
              Assigned
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-600">
              {assignedCount}
            </p>
          </div>

          <div className="rounded-2xl border border-[#CDE5D4] bg-white p-5 shadow-sm">
            <p className="text-sm text-[#747A84]">
              Resolved
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {resolvedCount}
            </p>
          </div>
        </div>

        {/* Queue */}
        <div className="mt-10">
          <div className="mb-4">
            <h3 className="text-xl font-bold">
              Human Support Queue
            </h3>

            <p className="mt-1 text-sm text-[#747A84]">
              Highest urgency requests should be handled first.
            </p>
          </div>

          {loading && (
            <div className="rounded-2xl border border-[#E9D9A8] bg-white p-8 shadow-sm">
              Loading support requests...
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
              {error}
            </div>
          )}

          {!loading &&
            !error &&
            requests.length === 0 && (
              <div className="rounded-2xl border border-[#E9D9A8] bg-white p-10 text-center shadow-sm">
                <div className="text-3xl">🌱</div>

                <h4 className="mt-3 font-semibold">
                  No support requests yet
                </h4>

                <p className="mt-1 text-sm text-[#747A84]">
                  New learner escalations will appear here.
                </p>
              </div>
            )}

          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.reference_id}
                className="rounded-2xl border border-[#E7DFCA] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${urgencyBadge(
                          request.urgency
                        )}`}
                      >
                        {request.urgency}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(
                          request.status
                        )}`}
                      >
                        {request.status}
                      </span>

                      <span className="text-sm font-semibold text-[#59606B]">
                        {request.reference_id}
                      </span>
                    </div>

                    <h4 className="mt-4 text-lg font-bold">
                      {request.topic ||
                        "General Learning Support"}
                    </h4>

                    <p className="mt-3 text-sm leading-6 text-[#5F6570]">
                      {request.summary}
                    </p>

                    <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                      <div>
                        <span className="font-semibold">
                          Reason:
                        </span>{" "}
                        <span className="text-[#656B75]">
                          {request.reason}
                        </span>
                      </div>

                      <div>
                        <span className="font-semibold">
                          Learner:
                        </span>{" "}
                        <span className="text-[#656B75]">
                          {request.user_id}
                        </span>
                      </div>
                    </div>

                    {request.assigned_to && (
                      <p className="mt-3 text-sm text-[#5F6570]">
                        <span className="font-semibold">
                          Assigned to:
                        </span>{" "}
                        {request.assigned_to}
                      </p>
                    )}

                    <p className="mt-4 text-xs text-[#8A9098]">
                      Created{" "}
                      {new Date(
                        request.created_at
                      ).toLocaleString()}
                    </p>
                  </div>

                  <button
                    className="shrink-0 rounded-xl bg-[#18202A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2B3440]"
                    onClick={() => {
                      setSelectedRequest(request);
                      setActionMessage("");
                    }}
                  >
                    View Request
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-[#FFFDF7] shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 flex items-start justify-between border-b border-[#E9D9A8] bg-[#FFF4C7] p-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-[#A17800]">
                  Human Support Request
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  {selectedRequest.reference_id}
                </h2>
              </div>

              <button
                onClick={closeModal}
                className="rounded-xl px-3 py-2 text-lg text-[#59606B] transition hover:bg-white"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* Summary Row */}
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl bg-[#FFF8E5] p-4">
                  <p className="text-xs font-semibold uppercase text-[#8A9098]">
                    Urgency
                  </p>

                  <p className="mt-1 font-bold text-red-600">
                    {selectedRequest.urgency}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#F7F7F5] p-4">
                  <p className="text-xs font-semibold uppercase text-[#8A9098]">
                    Status
                  </p>

                  <p className="mt-1 font-bold">
                    {selectedRequest.status}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#F7F7F5] p-4">
                  <p className="text-xs font-semibold uppercase text-[#8A9098]">
                    Learner
                  </p>

                  <p className="mt-1 font-bold">
                    {selectedRequest.user_id}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#F7F7F5] p-4">
                  <p className="text-xs font-semibold uppercase text-[#8A9098]">
                    Assigned To
                  </p>

                  <p className="mt-1 font-bold">
                    {selectedRequest.assigned_to ||
                      "Unassigned"}
                  </p>
                </div>
              </div>

              {/* Topic */}
              <div>
                <p className="text-sm font-semibold">
                  Topic
                </p>

                <div className="mt-2 rounded-2xl bg-[#FFF8E5] p-4">
                  {selectedRequest.topic ||
                    "General Learning Support"}
                </div>
              </div>

              {/* Reason */}
              <div>
                <p className="text-sm font-semibold">
                  Reason
                </p>

                <div className="mt-2 rounded-2xl bg-[#F7F7F5] p-4 text-sm leading-6">
                  {selectedRequest.reason}
                </div>
              </div>

              {/* Learner Summary */}
              <div>
                <p className="text-sm font-semibold">
                  Learner Summary
                </p>

                <div className="mt-2 rounded-2xl bg-[#F7F7F5] p-4 text-sm leading-6">
                  {selectedRequest.summary}
                </div>
              </div>

              {/* Existing Staff Response */}
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    Human Response
                  </p>

                  {selectedRequest.staff_response && (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Response Sent
                    </span>
                  )}
                </div>

                {selectedRequest.staff_response ? (
                  <div className="mt-2 rounded-2xl border border-[#E9D9A8] bg-[#FFF8E5] p-4 text-sm leading-6">
                    {selectedRequest.staff_response}
                  </div>
                ) : (
                  <div className="mt-2 rounded-2xl border border-dashed border-[#D8D2C4] bg-white p-4 text-sm text-[#8A9098]">
                    No human response has been added yet.
                  </div>
                )}
              </div>

              {/* Response Composer */}
              {isResponding && (
                <div className="rounded-2xl border border-[#E1D7B8] bg-white p-4">
                  <p className="text-sm font-semibold">
                    Write Response
                  </p>

                  <textarea
                    value={responseText}
                    onChange={(event) =>
                      setResponseText(
                        event.target.value
                      )
                    }
                    placeholder="Write a clear and supportive response to the learner..."
                    rows={5}
                    className="mt-3 w-full resize-none rounded-xl border border-[#D8D2C4] bg-[#FFFDF7] p-3 text-sm outline-none transition focus:border-[#F5C542]"
                  />

                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setIsResponding(false);
                        setResponseText("");
                      }}
                      className="rounded-xl border border-[#D8D2C4] px-4 py-2 text-sm font-medium transition hover:bg-[#FFF9EC]"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={handleRespond}
                      disabled={
                        !responseText.trim() ||
                        actionLoading
                      }
                      className="rounded-xl bg-[#F5C542] px-4 py-2 text-sm font-semibold text-[#18202A] transition hover:bg-[#E9B92F] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionLoading
                        ? "Sending..."
                        : "Send Response"}
                    </button>
                  </div>
                </div>
              )}

              {/* Action Message */}
              {actionMessage && (
                <div className="rounded-xl border border-[#E9D9A8] bg-[#FFF8E5] px-4 py-3 text-sm text-[#5E6470]">
                  {actionMessage}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 border-t border-[#E5E0D4] pt-5">
                <button
                  onClick={handleAssign}
                  disabled={
                    actionLoading ||
                    selectedRequest.status ===
                      "RESOLVED"
                  }
                  className="rounded-xl bg-[#F5C542] px-5 py-2.5 text-sm font-semibold text-[#18202A] transition hover:bg-[#E9B92F] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {selectedRequest.assigned_to ===
                  "staff_admin"
                    ? "Assigned to me"
                    : "Assign to me"}
                </button>

                <button
                  onClick={() => {
                    setIsResponding(true);
                    setActionMessage("");
                  }}
                  disabled={
                    actionLoading ||
                    selectedRequest.status ===
                      "RESOLVED"
                  }
                  className="rounded-xl border border-[#D8D2C4] px-5 py-2.5 text-sm font-semibold transition hover:bg-[#FFF4C7] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Respond
                </button>

                <button
                  onClick={handleResolve}
                  disabled={
                    actionLoading ||
                    selectedRequest.status ===
                      "RESOLVED"
                  }
                  className="rounded-xl border border-[#BFDCC8] px-5 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {selectedRequest.status ===
                  "RESOLVED"
                    ? "Resolved"
                    : actionLoading
                    ? "Updating..."
                    : "Resolve"}
                </button>
              </div>

              <div className="text-xs text-[#8A9098]">
                Created{" "}
                {new Date(
                  selectedRequest.created_at
                ).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}