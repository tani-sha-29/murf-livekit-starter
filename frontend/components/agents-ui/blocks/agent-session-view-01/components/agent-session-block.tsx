
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, type MotionProps, motion } from 'motion/react';
import {
  useAgent,
  useSessionContext,
  useSessionMessages,
} from '@livekit/components-react';

import { AgentChatTranscript } from '@/components/agents-ui/agent-chat-transcript';

import {
  AgentControlBar,
  type AgentControlBarControls,
} from '@/components/agents-ui/agent-control-bar';

import { Shimmer } from '@/components/ai-elements/shimmer';
import { cn } from '@/lib/shadcn/utils';

import { TileLayout } from './tile-view';

const MotionMessage = motion.create(Shimmer);

/* -------------------------------------------------------
   Bottom animation
------------------------------------------------------- */

const BOTTOM_VIEW_MOTION_PROPS: MotionProps = {
  variants: {
    visible: {
      opacity: 1,
      translateY: '0%',
    },
    hidden: {
      opacity: 0,
      translateY: '100%',
    },
  },

  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',

  transition: {
    duration: 0.3,
    delay: 0.5,
    ease: 'easeOut',
  },
};

/* -------------------------------------------------------
   Chat animation
------------------------------------------------------- */

const CHAT_MOTION_PROPS: MotionProps = {
  variants: {
    hidden: {
      opacity: 0,
      transition: {
        ease: 'easeOut',
        duration: 0.3,
      },
    },

    visible: {
      opacity: 1,
      transition: {
        delay: 0.2,
        ease: 'easeOut',
        duration: 0.3,
      },
    },
  },

  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
};

/* -------------------------------------------------------
   Status message animation
------------------------------------------------------- */

const SHIMMER_MOTION_PROPS: MotionProps = {
  variants: {
    visible: {
      opacity: 1,
      transition: {
        ease: 'easeIn',
        duration: 0.5,
      },
    },

    hidden: {
      opacity: 0,
      transition: {
        ease: 'easeIn',
        duration: 0.3,
      },
    },
  },

  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
};

/* -------------------------------------------------------
   Fade component
------------------------------------------------------- */

interface FadeProps {
  top?: boolean;
  bottom?: boolean;
  className?: string;
}

export function Fade({
  top = false,
  bottom = false,
  className,
}: FadeProps) {
  return (
    <div
      className={cn(
        'pointer-events-none h-4 from-background to-transparent',
        top && 'bg-linear-to-b',
        bottom && 'bg-linear-to-t',
        className
      )}
    />
  );
}

/* -------------------------------------------------------
   Props
------------------------------------------------------- */

export interface AgentSessionView_01Props {
  onCallEnded?: () => void;
  preConnectMessage?: string;

  supportsChatInput?: boolean;

  supportsVideoInput?: boolean;

  supportsScreenShare?: boolean;

  isPreConnectBufferEnabled?: boolean;

  audioVisualizerType?: 'bar' | 'wave' | 'grid' | 'radial' | 'aura';

  audioVisualizerColor?: `#${string}`;

  audioVisualizerColorShift?: number;

  audioVisualizerBarCount?: number;

  audioVisualizerGridRowCount?: number;

  audioVisualizerGridColumnCount?: number;

  audioVisualizerRadialBarCount?: number;

  audioVisualizerRadialRadius?: number;

  audioVisualizerWaveLineWidth?: number;

  className?: string;
}

/* -------------------------------------------------------
   Main Agent Session UI
------------------------------------------------------- */

export function AgentSessionView_01({
  onCallEnded,
  preConnectMessage = 'Agent is listening, ask it a question',

  supportsChatInput = true,

  supportsVideoInput = true,

  supportsScreenShare = true,

  isPreConnectBufferEnabled = true,

  audioVisualizerType,

  audioVisualizerColor,

  audioVisualizerColorShift,

  audioVisualizerBarCount,

  audioVisualizerGridRowCount,

  audioVisualizerGridColumnCount,

  audioVisualizerRadialBarCount,

  audioVisualizerRadialRadius,

  audioVisualizerWaveLineWidth,

  ref,

  className,

  ...props
}: React.ComponentProps<'section'> & AgentSessionView_01Props) {
  /* -----------------------------------------------------
     LiveKit session
  ----------------------------------------------------- */

  const session = useSessionContext();

  const { messages,send } = useSessionMessages(session);

  const { state: agentState } = useAgent();

  /* -----------------------------------------------------
     Local UI state
  ----------------------------------------------------- */

  const [chatOpen, setChatOpen] = useState(false);
  const practiceStarted = useRef(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  /* -----------------------------------------------------
     Controls
  ----------------------------------------------------- */

  const controls: AgentControlBarControls = {
    leave: true,
    microphone: true,
    chat: supportsChatInput,
    camera: supportsVideoInput,
    screenShare: supportsScreenShare,
  };

  /* -----------------------------------------------------
     Scroll transcript when user sends a message
  ----------------------------------------------------- */

  useEffect(() => {
    const lastMessage = messages.at(-1);

    const lastMessageIsLocal =
      lastMessage?.from?.isLocal === true;

    if (
      scrollAreaRef.current &&
      lastMessageIsLocal
    ) {
      scrollAreaRef.current.scrollTop =
        scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  //----------------------------------------------------
  useEffect(() => {
  if (!session.isConnected || practiceStarted.current) {
    return;
  }

  const isJavaPractice =
    window.location.pathname === '/practice/java';

  if (isJavaPractice) {
    practiceStarted.current = true;

    send(
      'Start a Java beginner practice session. Give me one practice question from the learning library.'
    );
  }
}, [session.isConnected, send]);

  /* -----------------------------------------------------
     Saarthi states
  ----------------------------------------------------- */

  const stateInfo = {
    connecting: {
      label: 'CONNECTING',
      message: 'Getting Saarthi ready...',
      icon: '◌',
    },

    initializing: {
      label: 'GETTING READY',
      message: 'Saarthi is getting ready...',
      icon: '◌',
    },

    listening: {
      label: 'LISTENING',
      message: 'I’m listening to you',
      icon: '◉',
    },

    thinking: {
      label: 'THINKING',
      message: 'Saarthi is thinking...',
      icon: '✦',
    },

    speaking: {
      label: 'SPEAKING',
      message: 'Saarthi is speaking...',
      icon: '◉',
    },

    idle: {
      label: 'READY',
      message: 'Ask Saarthi anything',
      icon: '○',
    },
  } as const;

  const currentState =
    stateInfo[
    agentState as keyof typeof stateInfo
    ] ?? stateInfo.idle;

  /* -----------------------------------------------------
     UI
  ----------------------------------------------------- */

  return (
    <section
      ref={ref}
      className={cn(
        'relative z-10 h-full w-full overflow-hidden',
        'bg-gradient-to-br from-amber-50 via-white to-violet-50',
        className
      )}
      {...props}
    >

      {/* =================================================
          TOP FADE
      ================================================= */}

      <Fade
        top
        className="absolute inset-x-4 top-0 z-20 h-32"
      />

      {/* =================================================
          CHAT / TRANSCRIPT
      ================================================= */}

      <div className="absolute top-0 bottom-[135px] z-30 flex w-full flex-col md:bottom-[170px]">

        <AnimatePresence>
          {chatOpen && (
            <motion.div
              {...CHAT_MOTION_PROPS}
              className="flex h-full w-full flex-col gap-4 space-y-3"
            >
              <AgentChatTranscript
                agentState={agentState}
                messages={messages}
                className="
    mx-auto
    w-full
    max-w-2xl
    bg-transparent
    [&_.is-user>div]:rounded-[22px]
    [&_.is-user>div]:bg-violet-100/90
    [&_.is-user>div]:text-gray-900
    [&_.is-agent>div]:rounded-[22px]
    [&_.is-agent>div]:bg-white/70
    [&_.is-agent>div]:text-gray-900
    [&>div>div]:px-4
    [&>div>div]:pt-32
    md:[&>div>div]:px-6
  "
              />
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* =================================================
          ILLUSTRATION / AGENT VISUAL
          
          IMPORTANT:
          This stays behind the status text.
      ================================================= */}

      <div className="absolute inset-0 z-10">

        <TileLayout
          chatOpen={chatOpen}

          audioVisualizerType={audioVisualizerType}

          audioVisualizerColor={audioVisualizerColor}

          audioVisualizerColorShift={
            audioVisualizerColorShift
          }

          audioVisualizerBarCount={
            audioVisualizerBarCount
          }

          audioVisualizerRadialBarCount={
            audioVisualizerRadialBarCount
          }

          audioVisualizerRadialRadius={
            audioVisualizerRadialRadius
          }

          audioVisualizerGridRowCount={
            audioVisualizerGridRowCount
          }

          audioVisualizerGridColumnCount={
            audioVisualizerGridColumnCount
          }

          audioVisualizerWaveLineWidth={
            audioVisualizerWaveLineWidth
          }
        />

      </div>

      {/* =================================================
          SAARTHI STATUS
          
          z-40 = ABOVE IMAGE
      ================================================= */}

      <div
        className="
          pointer-events-none
          absolute
          bottom-[190px]
          left-1/2
          z-40
          w-full
          -translate-x-1/2
          px-4
          text-center
        "
      >

        <div
          className="
            mx-auto
            w-fit
            rounded-2xl
            border
            border-black/10
            bg-white/95
            px-6
            py-3
            shadow-xl
            backdrop-blur-md
          "
        >

          {/* Status title */}

          <div className="flex items-center justify-center gap-3">

            <motion.span
              animate={{
                scale:
                  agentState === 'speaking' ||
                    agentState === 'listening'
                    ? [1, 1.3, 1]
                    : 1,

                opacity:
                  agentState === 'speaking' ||
                    agentState === 'listening'
                    ? [0.7, 1, 0.7]
                    : 1,
              }}

              transition={{
                duration: 1.2,

                repeat:
                  agentState === 'speaking' ||
                    agentState === 'listening'
                    ? Infinity
                    : 0,
              }}

              className="text-xl"
            >
              {currentState.icon}
            </motion.span>

            <span
              className="
                text-base
                font-bold
                tracking-[0.15em]
                text-gray-900
              "
            >
              {currentState.label}
            </span>

          </div>

          {/* Status description */}

          <p
            className="
              mt-1
              text-sm
              font-medium
              text-gray-500
            "
          >
            {currentState.message}
          </p>

        </div>

      </div>

      {/* =================================================
          BOTTOM CONTROLS
          
          z-100 = ABOVE EVERYTHING
      ================================================= */}

      <motion.div
        {...BOTTOM_VIEW_MOTION_PROPS}

        className="
          absolute
          inset-x-3
          bottom-0
          z-[100]
          md:inset-x-12
        "
      >

        {/* {/* -------------------------------------------------
            Status text above controls
        ------------------------------------------------- */}

        {/* {isPreConnectBufferEnabled && (

          <AnimatePresence>

            <MotionMessage
              key={agentState}
              duration={1.2}
              {...SHIMMER_MOTION_PROPS}

              className="
                pointer-events-none
                mx-auto
                block
                w-full
                max-w-2xl
                pb-4
                text-center
                text-sm
                font-semibold
                text-gray-600
              "
            >
              {currentState.message}
            </MotionMessage>

          </AnimatePresence>

        )} */ 
        }
        {/* -------------------------------------------------
            Control bar
        ------------------------------------------------- */}

        <div className="relative mx-auto max-w-2xl pb-3 md:pb-12">

          <Fade
            bottom
            className="
              absolute
              inset-x-0
              top-0
              h-4
              -translate-y-full
            "
          />

          <AgentControlBar
            variant="livekit"

            controls={controls}

            isChatOpen={chatOpen}

            isConnected={session.isConnected}

            // onDisconnect={() => {
            //   onCallEnded?.();
            //   session.end();
            // }}
            onDisconnect={session.end}

            onIsChatOpenChange={setChatOpen}

            className="
              border
              border-black/5
              bg-white/90
              shadow-xl
              backdrop-blur-xl
            "
          />

        </div>

      </motion.div>

    </section>
  );
}