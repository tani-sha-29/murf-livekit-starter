// // 'use client';

// // import { useTheme } from 'next-themes';
// // import { AnimatePresence, motion } from 'motion/react';
// // import { useSessionContext } from '@livekit/components-react';
// // import type { AppConfig } from '@/app-config';
// // import { AgentSessionView_01 } from '@/components/agents-ui/blocks/agent-session-view-01';
// // import { WelcomeView } from '@/components/app/welcome-view';

// // const MotionWelcomeView = motion.create(WelcomeView);
// // const MotionSessionView = motion.create(AgentSessionView_01);

// // const VIEW_MOTION_PROPS = {
// //   variants: {
// //     visible: {
// //       opacity: 1,
// //     },
// //     hidden: {
// //       opacity: 0,
// //     },
// //   },
// //   initial: 'hidden',
// //   animate: 'visible',
// //   exit: 'hidden',
// //   transition: {
// //     duration: 0.5,
// //     ease: 'linear',
// //   },
// // };

// // interface ViewControllerProps {
// //   appConfig: AppConfig;
// // }

// // export function ViewController({ appConfig }: ViewControllerProps) {
// //   const { isConnected, start } = useSessionContext();
// //   const { resolvedTheme } = useTheme();

// //   return (
// //     <AnimatePresence mode="wait">
// //       {/* Welcome view */}
// //       {!isConnected && (
// //         <MotionWelcomeView
// //           key="welcome"
// //           {...VIEW_MOTION_PROPS}
// //           startButtonText={appConfig.startButtonText}
// //           onStartCall={start}
// //         />
// //       )}
// //       {/* Session view */}
// //       {isConnected && (
// //         <MotionSessionView
// //           key="session-view"
// //           {...VIEW_MOTION_PROPS}
// //           supportsChatInput={appConfig.supportsChatInput}
// //           supportsVideoInput={appConfig.supportsVideoInput}
// //           supportsScreenShare={appConfig.supportsScreenShare}
// //           isPreConnectBufferEnabled={appConfig.isPreConnectBufferEnabled}
// //           audioVisualizerType={appConfig.audioVisualizerType}
// //           audioVisualizerColor={
// //             resolvedTheme === 'dark'
// //               ? appConfig.audioVisualizerColorDark
// //               : appConfig.audioVisualizerColor
// //           }
// //           audioVisualizerColorShift={appConfig.audioVisualizerColorShift}
// //           audioVisualizerBarCount={appConfig.audioVisualizerBarCount}
// //           audioVisualizerGridRowCount={appConfig.audioVisualizerGridRowCount}
// //           audioVisualizerGridColumnCount={appConfig.audioVisualizerGridColumnCount}
// //           audioVisualizerRadialBarCount={appConfig.audioVisualizerRadialBarCount}
// //           audioVisualizerRadialRadius={appConfig.audioVisualizerRadialRadius}
// //           audioVisualizerWaveLineWidth={appConfig.audioVisualizerWaveLineWidth}
// //           className="fixed inset-0"
// //         />
// //       )}
// //     </AnimatePresence>
// //   );
// // }

// 'use client';

// import { useState } from 'react';
// import { useEffect, useRef } from 'react';
// import { useTheme } from 'next-themes';
// import { AnimatePresence, motion } from 'motion/react';
// import { useSessionContext } from '@livekit/components-react';

// import type { AppConfig } from '@/app-config';

// import { AgentSessionView_01 } from '@/components/agents-ui/blocks/agent-session-view-01';
// import { WelcomeView } from '@/components/app/welcome-view';

// const MotionWelcomeView = motion.create(WelcomeView);
// const MotionSessionView = motion.create(AgentSessionView_01);

// const VIEW_MOTION_PROPS = {
//   variants: {
//     visible: {
//       opacity: 1,
//     },
//     hidden: {
//       opacity: 0,
//     },
//   },
//   initial: 'hidden',
//   animate: 'visible',
//   exit: 'hidden',
//   transition: {
//     duration: 0.5,
//     ease: 'linear',
//   },
// };

// interface ViewControllerProps {
//   appConfig: AppConfig;
// }

// export function ViewController({ appConfig }: ViewControllerProps) {
//   const { isConnected, start } = useSessionContext();
//   const { resolvedTheme } = useTheme();
  
//   // NEW
//   const [callEnded, setCallEnded] = useState(false);
//   const wasConnected = useRef(false);
//   const [micError, setMicError] = useState(false);

//   useEffect(() => {
//   if (isConnected) {
//     wasConnected.current = true;
//   }

//   if (!isConnected && wasConnected.current) {
//     setCallEnded(true);
//     wasConnected.current = false;
//   }
// }, [isConnected]);
  
//   // const handleStartCall = async () => {
//   //   setCallEnded(false);
//   //   await start();
//   // };

//   // const handleCallEnded = () => {
//   //   setCallEnded(true);
//   // };

//   return (
//   <AnimatePresence mode="wait">
//     {!isConnected ? (
//       <MotionWelcomeView
//         key="welcome"
//         {...VIEW_MOTION_PROPS}
//         startButtonText={
//           callEnded ? 'START AGAIN' : appConfig.startButtonText
//         }
//         callEnded={callEnded}
//         micError={micError}
//         onStartCall={async () => {
//           // Clear previous microphone error
//           setMicError(false);
//           setCallEnded(false);

//           try {
//             await start();
//           } catch (error) {
//             console.error('Microphone / call start error:', error);

//             // Show microphone permission message
//             if (
//               error instanceof DOMException &&
//               (error.name === 'NotAllowedError' ||
//                 error.name === 'PermissionDeniedError')
//             ) {
//               setMicError(true);
//             } else {
//               // Also show the message for other start failures
//               setMicError(true);
//             }
//           }
//         }}
//       />
//     ) : (
//       <MotionSessionView
//         key="session-view"
//         {...VIEW_MOTION_PROPS}
//         supportsChatInput={appConfig.supportsChatInput}
//         supportsVideoInput={appConfig.supportsVideoInput}
//         supportsScreenShare={appConfig.supportsScreenShare}
//         isPreConnectBufferEnabled={
//           appConfig.isPreConnectBufferEnabled
//         }
//         audioVisualizerType={appConfig.audioVisualizerType}
//         audioVisualizerColor={
//           resolvedTheme === 'dark'
//             ? appConfig.audioVisualizerColorDark
//             : appConfig.audioVisualizerColor
//         }
//         audioVisualizerColorShift={
//           appConfig.audioVisualizerColorShift
//         }
//         audioVisualizerBarCount={
//           appConfig.audioVisualizerBarCount
//         }
//         audioVisualizerGridRowCount={
//           appConfig.audioVisualizerGridRowCount
//         }
//         audioVisualizerGridColumnCount={
//           appConfig.audioVisualizerGridColumnCount
//         }
//         audioVisualizerRadialBarCount={
//           appConfig.audioVisualizerRadialBarCount
//         }
//         audioVisualizerRadialRadius={
//           appConfig.audioVisualizerRadialRadius
//         }
//         audioVisualizerWaveLineWidth={
//           appConfig.audioVisualizerWaveLineWidth
//         }
//         className="fixed inset-0"
//       />
//     )}
//   </AnimatePresence>
// );
    
  
// }

'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { AnimatePresence, motion } from 'motion/react';
import { useSessionContext } from '@livekit/components-react';

import type { AppConfig } from '@/app-config';

import { AgentSessionView_01 } from '@/components/agents-ui/blocks/agent-session-view-01';
import { WelcomeView } from '@/components/app/welcome-view';

const MotionWelcomeView = motion.create(WelcomeView);
const MotionSessionView = motion.create(AgentSessionView_01);

const VIEW_MOTION_PROPS = {
  variants: {
    visible: {
      opacity: 1,
    },
    hidden: {
      opacity: 0,
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  transition: {
    duration: 0.5,
    ease: 'linear',
  },
};

interface ViewControllerProps {
  appConfig: AppConfig;
}

export function ViewController({ appConfig }: ViewControllerProps) {
  const { isConnected, start } = useSessionContext();
  const { resolvedTheme } = useTheme();

  const [callEnded, setCallEnded] = useState(false);
  const [micError, setMicError] = useState(false);

  const wasConnected = useRef(false);

  /*
   * Remember that a call was actually connected.
   * This prevents the home page from immediately
   * showing "microphone denied".
   */
  useEffect(() => {
    if (isConnected) {
      wasConnected.current = true;
      setMicError(false);
    }

    if (!isConnected && wasConnected.current) {
      setCallEnded(true);
      wasConnected.current = false;
    }
  }, [isConnected]);

  /*
   * Start the voice session.
   */
  const handleStartCall = async () => {
    setCallEnded(false);
    setMicError(false);

    try {
      /*
       * First explicitly request microphone permission.
       */
      await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      /*
       * Permission succeeded.
       * Now start LiveKit.
       */
      await start();
    } catch (error) {
      console.error('Microphone / session error:', error);

      /*
       * Only show the microphone error if the
       * microphone permission itself failed.
       */
      if (
        error instanceof DOMException &&
        (error.name === 'NotAllowedError' ||
          error.name === 'PermissionDeniedError')
      ) {
        setMicError(true);
        return;
      }

      /*
       * Other errors should not be labelled
       * as microphone permission errors.
       */
      console.error('Session could not start:', error);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {!isConnected ? (
        <MotionWelcomeView
          key="welcome"
          {...VIEW_MOTION_PROPS}
          startButtonText={
            micError
              ? 'TRY AGAIN'
              : callEnded
                ? 'START AGAIN'
                : appConfig.startButtonText
          }
          callEnded={callEnded}
          micError={micError}
          onStartCall={handleStartCall}
        />
      ) : (
        <MotionSessionView
          key="session-view"
          {...VIEW_MOTION_PROPS}
          supportsChatInput={appConfig.supportsChatInput}
          supportsVideoInput={appConfig.supportsVideoInput}
          supportsScreenShare={appConfig.supportsScreenShare}
          isPreConnectBufferEnabled={
            appConfig.isPreConnectBufferEnabled
          }
          audioVisualizerType={appConfig.audioVisualizerType}
          audioVisualizerColor={
            resolvedTheme === 'dark'
              ? appConfig.audioVisualizerColorDark
              : appConfig.audioVisualizerColor
          }
          audioVisualizerColorShift={
            appConfig.audioVisualizerColorShift
          }
          audioVisualizerBarCount={
            appConfig.audioVisualizerBarCount
          }
          audioVisualizerGridRowCount={
            appConfig.audioVisualizerGridRowCount
          }
          audioVisualizerGridColumnCount={
            appConfig.audioVisualizerGridColumnCount
          }
          audioVisualizerRadialBarCount={
            appConfig.audioVisualizerRadialBarCount
          }
          audioVisualizerRadialRadius={
            appConfig.audioVisualizerRadialRadius
          }
          audioVisualizerWaveLineWidth={
            appConfig.audioVisualizerWaveLineWidth
          }
          className="fixed inset-0"
        />
      )}
    </AnimatePresence>
  );
}