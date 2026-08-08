'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, BookOpen, MessageCircle, Globe2 } from 'lucide-react';

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
  callEnded?: boolean;
  micError?: boolean;

}

export const WelcomeView = ({
  startButtonText,
  onStartCall,
  callEnded = false,
  micError = false,
  ref,
}: React.ComponentProps<'div'> & WelcomeViewProps) => {
  return (
    <main className="min-h-screen overflow-y-auto bg-[#FFFDF7] px-5 py-8 text-[#242321] md:px-10">
      
      {/* TOP BRAND */}
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl">
            Saarthi
          </h1>
          <p className="text-sm text-[#777268]">
            एक नई राह
          </p>
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm shadow-sm md:flex">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
          Your learning companion
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto grid max-w-6xl items-center gap-6 pt-8 md:grid-cols-2 md:pt-12">

        {/* LEFT */}
        <div className="order-2 text-center md:order-1 md:text-left">

          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#F5D76E] bg-[#FFF4B8] px-4 py-2 text-sm font-semibold shadow-sm">
            <Sparkles size={16} />
            Learn · Explore · Grow
          </div>

          <h2 className="mx-auto max-w-xl text-5xl font-black leading-[0.95] tracking-[-0.04em] md:mx-0 md:text-7xl">
            A new way to
            <span className="block bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#F59E0B] bg-clip-text text-transparent">
              learn through
            </span>
            conversation.
          </h2>

          <p className="mx-auto mt-7 max-w-xl text-base leading-7 text-[#6e6a62] md:mx-0 md:text-lg">
            {micError
              ? 'Saarthi needs access to your microphone to have a voice conversation.'
              : callEnded
              ? 'Your conversation has ended. Start again whenever you are ready.'
              : "Hi, I'm Saarthi. Ask questions, explore ideas, practice skills, or simply start a conversation."}
          </p>
          {micError && (
            <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-left shadow-sm md:mx-0">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-xl">
                  🎙️
                </div>

                <div>
                  <p className="font-bold text-red-900">
                    Microphone access is blocked
                  </p>

                  <p className="mt-1 text-sm leading-6 text-red-700">
                    Please allow microphone access in your browser settings,
                    then click Start Again.
                  </p>

                  <p className="mt-2 text-xs leading-5 text-red-600">
                    In Chrome, click the 🔒 icon near the website address →
                    Microphone → Allow → reload the page.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button
            size="lg"
            onClick={onStartCall}
            className="mt-8 h-14 w-full max-w-sm rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-base font-bold text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"
          >
            🎙️ {micError ? 'TRY AGAIN' :startButtonText}
            <ArrowRight className="ml-2" size={20} />
          </Button>

        </div>

        {/* RIGHT — YOUR ILLUSTRATION */}
        <div className="relative order-1 flex min-h-[360px] items-center justify-center md:order-2 md:min-h-[500px]">

          {/* floating label */}
          <div className="absolute right-2 top-8 z-20 rounded-2xl border border-black/10 bg-[#DFF7E8] px-4 py-3 text-sm font-semibold shadow-lg md:right-10">
            👋 Hi!
          </div>

          {/* small decorative element */}
          <div className="absolute left-5 top-16 text-3xl text-[#777268]">
            ✦
          </div>

          {/* IMAGE */}
          <img
            src="/opengraph-image-bg.png"
            alt="Saarthi learning companion"
            className="relative z-10 h-auto w-[310px] object-contain mix-blend-multiply md:w-[780px]"
          />

          {/* floating bottom bubble */}
          <div className="absolute bottom-5 left-5 z-20 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm shadow-lg">
            💡 Ask me anything
          </div>

        </div>
      </section>

      {/* USE CASE CARDS */}
      <section className="mx-auto mt-8 grid max-w-6xl grid-cols-1 gap-4 pb-10 sm:grid-cols-2 md:grid-cols-3">

        <div className="group rounded-3xl border border-black/10 bg-white/90 p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF0C2]">
            <BookOpen size={21} />
          </div>

          <h3 className="font-bold">Learn something new</h3>

          <p className="mt-2 text-sm leading-6 text-[#777268]">
            Understand school subjects, concepts and everyday knowledge
            through simple conversations.
          </p>
        </div>

        <div className="group rounded-3xl border border-black/10 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E9DDFF]">
            <MessageCircle size={21} />
          </div>

          <h3 className="font-bold">Practice & ask</h3>

          <p className="mt-2 text-sm leading-6 text-[#777268]">
            Ask questions naturally. Speak in English, Hindi or Hinglish
            and learn at your own pace.
          </p>
        </div>

        <div className="group rounded-3xl border border-black/10 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#DDF7E8]">
            <Globe2 size={21} />
          </div>

          <h3 className="font-bold">Explore the world</h3>

          <p className="mt-2 text-sm leading-6 text-[#777268]">
            Build curiosity, confidence, communication skills and
            practical understanding.
          </p>
        </div>

      </section>

      {/* FOOTER */}
      <p className="pb-5 text-center text-xs text-[#99948a]">
        Saarthi · एक नई राह
      </p>

    </main>
  );
};