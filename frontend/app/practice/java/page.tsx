// 'use client';
// import { useRouter } from 'next/navigation';
// import { useEffect, useRef } from 'react';
// import {
//   useSessionContext,
//   useSessionMessages,
// } from '@livekit/components-react';

// export default function JavaPracticePage() {

// //   const startPractice = async () => {
// //     try {
// //       await session.start();
// //     } catch (error) {
// //       console.error('Could not start practice:', error);
// //     }
// //    };


//    return (
//     <main className="min-h-screen bg-[#fffaf0] px-6 py-12">
//       <div className="mx-auto max-w-3xl text-center">

//         <p className="text-sm font-semibold text-violet-600">
//           SAARTHI PRACTICE
//         </p>

//         <h1 className="mt-3 text-4xl font-black text-gray-900">
//           ☕ Java Practice
//         </h1>

//         <p className="mt-4 text-gray-600">
//           Get ready to practice Java with Saarthi.
//         </p>

//         <button
//           //onClick={startPractice}
//           className="mt-8 rounded-full bg-violet-600 px-8 py-4 font-bold text-white shadow-lg transition hover:bg-violet-700"
//         >
//           Start Practice
//         </button>

//       </div>
//     </main>
//   );
// }

'use client';

import { useRouter } from 'next/navigation';

export default function JavaPracticePage() {
  const router = useRouter();

  const startPractice = () => {
    router.push('/?practice=java');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-violet-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">

        <button
          onClick={() => router.push('/practice')}
          className="mb-10 text-sm font-semibold text-violet-600 hover:text-violet-800"
        >
          ← Back to Practice
        </button>

        <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-lg">

          <p className="text-sm font-bold uppercase tracking-widest text-violet-600">
            SAARTHI PRACTICE
          </p>

          <h1 className="mt-3 text-4xl font-black text-gray-900">
            ☕ Java Practice
          </h1>

          <p className="mt-4 max-w-xl text-gray-600">
            Practice Java fundamentals with Saarthi. Saarthi will ask
            you questions from the learning library.
          </p>

          <button
            onClick={startPractice}
            className="mt-8 rounded-full bg-violet-600 px-8 py-4 font-bold text-white shadow-lg transition hover:bg-violet-700"
          >
            Start Practice →
          </button>

        </div>

      </div>
    </main>
  );
}