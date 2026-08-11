import asyncio
import json
import logging
import os

from dotenv import load_dotenv
from livekit import api, rtc

from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    cli,
    room_io,
    tokenize,
)

from livekit.plugins import (
    deepgram,
    google,
    murf,
    silero,
    noise_cancellation,
)

from livekit.plugins.turn_detector.multilingual import MultilingualModel


logger = logging.getLogger("saarthi-outbound")

load_dotenv(".env.local")


OUTBOUND_TRUNK_ID = os.getenv("LIVEKIT_SIP_OUTBOUND_TRUNK_ID")

CALLEE_IDENTITY = "phone-user"


SYSTEM_PROMPT = """
You are Saarthi, a friendly voice-first learning companion.

You are calling the learner over the phone.

Keep the conversation short, natural and conversational.

Your purpose is to help the learner learn and practice.

You can help with:
- Java
- Python
- English
- Mathematics
- Communication
- General learning

When the learner answers, introduce yourself briefly and ask
what they would like to learn or practice today.

Do not sound like a customer-service bot.

Do not mention databases, tools, APIs, LiveKit, SIP or internal systems.

Speak naturally because this is a phone call.
"""


GREETING = (
    "Namaste! Main Saarthi hoon, aapka learning companion. "
    "reminder : Tommorw is your java exam"
    "would you like to have a quick revision session before your exam?"
    "If you don't want to receive these calls, just say "
    "stop calling me. Do you have a moment?"
)


class OutboundAgent(Agent):

    def __init__(self, ctx: JobContext) -> None:
        super().__init__(instructions=SYSTEM_PROMPT)
        self.ctx = ctx


server = AgentServer()


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


server.setup_fnc = prewarm


def phone_number_from_metadata(ctx: JobContext) -> str | None:

    metadata = ctx.job.metadata

    if not metadata:
        return None

    try:
        return json.loads(metadata).get("phone_number")
    except json.JSONDecodeError:
        return metadata.strip() or None


@server.rtc_session(agent_name="outbound-agent")
async def outbound_agent(ctx: JobContext):

    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    phone_number = phone_number_from_metadata(ctx)

    if not phone_number:
        logger.error("No phone number provided.")
        ctx.shutdown()
        return

    if not OUTBOUND_TRUNK_ID:
        logger.error(
            "LIVEKIT_SIP_OUTBOUND_TRUNK_ID is not set."
        )
        ctx.shutdown()
        return

    await ctx.connect()

    session = AgentSession(

        stt=deepgram.STT(
            model="nova-3",
        ),

        llm=google.LLM(
            model="gemini-3.5-flash-lite",
        ),

        tts=murf.TTS(
            voice="en-US-matthew",
            style="Conversation",
            tokenizer=tokenize.basic.SentenceTokenizer(
                min_sentence_len=2
            ),
            text_pacing=True,
        ),

        turn_detection=MultilingualModel(),

        vad=ctx.proc.userdata["vad"],

        preemptive_generation=True,
    )

    @session.on("user_input_transcribed")
    def on_user_input_transcribed(event):
        logger.info(
            "USER SAID: %s | FINAL: %s",
            event.transcript,
            event.is_final,
    )

    session_started = asyncio.create_task(
        session.start(
            agent=OutboundAgent(ctx),
            room=ctx.room,
            room_options=room_io.RoomOptions(
                audio_input=room_io.AudioInputOptions(
                    noise_cancellation=lambda params: (
                        noise_cancellation.BVCTelephony()
                        if params.participant.kind
                        == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                        else noise_cancellation.BVC()
                    ),
                ),
                                
            ),
        )
    )

    logger.info("Dialing %s", phone_number)

    try:

        await ctx.api.sip.create_sip_participant(
            api.CreateSIPParticipantRequest(
                room_name=ctx.room.name,
                sip_trunk_id=OUTBOUND_TRUNK_ID,
                sip_call_to=phone_number,
                participant_identity=CALLEE_IDENTITY,
                participant_name="Phone user",
                wait_until_answered=True,
            )
        )

    except api.TwirpError as e:

        logger.error(
            "Call was not answered: %s (%s)",
            e.message,
            e.metadata.get("sip_status"),
        )

        session_started.cancel()

        ctx.shutdown()

        return

    await session_started

    await session.say(
        GREETING,
        allow_interruptions=True,
    )


if __name__ == "__main__":
    cli.run_app(server)