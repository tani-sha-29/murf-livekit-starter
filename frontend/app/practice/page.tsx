'use client';
import { useRouter } from 'next/navigation';

export default function PracticePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-violet-50 px-6 py-10 text-[#292524]">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#292524]">
              Saarthi
            </h1>

            <p className="mt-1 text-sm font-medium text-[#78716c]">
              एक नई राह
            </p>
          </div>

          <div className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#57534e] shadow-sm">
            🧠 Practice Mode
          </div>
        </header>

        {/* Main heading */}
        <section className="mt-16 text-center">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#7c3aed]">
            Learn · Practice · Grow
          </p>

          <h2 className="text-5xl font-black tracking-tight text-[#292524]">
            Practice & Ask
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#78716c]">
            Choose a topic and practice questions from Saarthi's
            learning library at your own pace.
          </p>
        </section>

       {/* Practice Topics */}
<section className="mt-12 grid gap-5 md:grid-cols-3">

  {/* Java */}
  <button
    onClick={() => router.push('/practice/java')}
    className="group rounded-3xl border border-black/10 bg-white/80 p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
  >
    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF0C2] text-2xl">
      ☕
    </div>

    <h3 className="text-xl font-bold text-[#292524]">
      Java
    </h3>

    <p className="mt-2 text-sm leading-6 text-[#78716c]">
      Practice Java fundamentals and object-oriented programming.
    </p>

    <span className="mt-5 inline-block text-sm font-bold text-[#7c3aed]">
      Start practicing →
    </span>
  </button>

  {/* Spring Boot */}
  <button
    onClick={() => router.push('/practice/spring-boot')}
    className="group rounded-3xl border border-black/10 bg-white/80 p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
  >
    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E9DDFF] text-2xl">
      🌱
    </div>

    <h3 className="text-xl font-bold text-[#292524]">
      Spring Boot
    </h3>

    <p className="mt-2 text-sm leading-6 text-[#78716c]">
      Practice backend development and Spring Boot concepts.
    </p>

    <span className="mt-5 inline-block text-sm font-bold text-[#7c3aed]">
      Start practicing →
    </span>
  </button>

  {/* Python */}
  <button
    onClick={() => router.push('/practice/python')}
    className="group rounded-3xl border border-black/10 bg-white/80 p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
  >
    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DDF7E8] text-2xl">
      🐍
    </div>

    <h3 className="text-xl font-bold text-[#292524]">
      Python
    </h3>

    <p className="mt-2 text-sm leading-6 text-[#78716c]">
      Practice Python programming fundamentals.
    </p>

    <span className="mt-5 inline-block text-sm font-bold text-[#7c3aed]">
      Start practicing →
    </span>
  </button>

</section>

      </div>
    </main>
  );
}