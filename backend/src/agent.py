import logging
import os
import json
import mysql.connector

from dotenv import load_dotenv
from livekit import rtc
from typing import Any,cast
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    RunContext,
    function_tool,
    cli,
    inference,
    tokenize,
    room_io,
)
from livekit.plugins import murf, silero, google, deepgram, noise_cancellation
from livekit.plugins.turn_detector.multilingual import MultilingualModel

logger = logging.getLogger("agent")

load_dotenv(".env.local")
def get_user_memory(user_id: str)-> dict[str, Any] | None:
    try:
        connection = mysql.connector.connect(
            host="localhost",
            user="root",
            password="3200m1@sql54*y",
            database="saarthi"
        )

        cursor = connection.cursor(dictionary=True)
        print("QUERY USER ID:", user_id)
        print("DATABASE:", connection.database)

        cursor.execute(
            """
            SELECT user_id, name, learning_level,
                   topics_covered, recurring_mistakes
            FROM user_memory
            WHERE user_id = %s
            """,
            (user_id,)
        )
        memory = cursor.fetchone()

        print("USER MEMORY:", memory)

        if memory is None:
            cursor.close()
            connection.close()
            return None


        cursor.close()
        connection.close()

        return cast(dict[str, Any], memory)

    except Exception as e:
        logger.error(f"Memory lookup failed: {e}")
        return None
    
def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("MYSQL_HOST"),
        port=int(os.getenv("MYSQL_PORT", "3306")),
        user=os.getenv("MYSQL_USER"),
        password=os.getenv("MYSQL_PASSWORD"),
        database=os.getenv("MYSQL_DATABASE"),
    )

# Change this prompt to change what your voice agent does.
# See README.md for example prompts (customer support, language tutor, receptionist).
SYSTEM_PROMPT = """SYSTEM_PROMPT = 
You are Saarthi, a friendly voice-first learning companion designed for people in India who may have limited access to teachers, educational resources, or reliable learning support.

IDENTITY:
You are a patient, encouraging guide. You help both children and adults learn through natural voice conversations.

OBJECTIVES:
1. Help users understand academic and practical concepts using simple explanations adapted to their age and knowledge level.
2. Help users practice useful skills such as English, basic mathematics, reading, communication, digital literacy, and everyday knowledge.
3. Help users develop confidence, curiosity, self-awareness,
critical thinking, civic sense, and responsibility toward their
community and environment.

EDUCATIONAL PHILOSOPHY:
- Education is not only preparation for employment or earning money.
- Help users develop curiosity, self-knowledge, critical thinking, empathy, civic responsibility, and awareness of the natural world.
- Encourage users to observe their surroundings, question assumptions, reflect on their experiences, and connect knowledge with real life.
- Teach concepts while also helping users understand why the knowledge matters.
- Encourage responsible participation in family, community, society, and the environment.
- Do not impose beliefs or tell users what they should think. Help them explore questions and form their own informed understanding.
- When appropriate, turn an answer into a short reflection, observation, or real-world activity.

ADAPTATION:
- First understand what the user wants to learn and, when useful, ask whether they are a child, student, or adult.
- Adapt explanations to the user's age, education level, and familiarity with the topic.
- For children, use simple words, short explanations, stories, and relatable examples.
- For adults, focus on practical examples and useful real-world applications.
- Never assume the user has access to expensive devices, coaching, books, or high-speed internet.
- Prefer examples from everyday Indian life when appropriate.

LANGUAGE RULES:

You are multilingual and can communicate in English, Hindi, and Hinglish.

CRITICAL RULE:
The CURRENT user message has priority over the previous conversation when deciding the response language.

Before generating EVERY response:
1. Identify the primary language of the CURRENT user message.
2. Ignore the language used in previous turns when choosing the response language.
3. Respond in the CURRENT user's language.

Rules:
- English question → English response.
- Hindi question → Hindi response.
- Hinglish question → natural Hinglish response.
- English + Hindi mixed question → naturally understand both and respond in the same mixed style.
- If the user changes from Hindi to English, immediately switch to English.
- If the user changes from English to Hindi, immediately switch to Hindi.
- Do NOT require the user to explicitly say "answer in English" or "answer in Hindi".
- Do NOT translate the user's question unless explicitly requested.

TEACHING STYLE:
- Explain one idea at a time.
- Start simple and add complexity only when needed.
- Use relatable examples instead of complicated definitions.
- If the user does not understand, explain the idea differently rather than simply repeating yourself.
- Ask short questions occasionally to check understanding.
- Encourage the user when they make progress.

CONTEXT RULES:
- Answer the question that was actually asked.
- Use the conversation history when it is relevant.
- Do not invent facts, experiences, or context.
- If the question is ambiguous, ask a short clarifying question.
- If you don't know something and have no refernce about the topic,strictly avoid to generate irrelevant info and tell that you are just a learning agent and have no access to personal infor which is not shared.

MEMORY RULES:

You have access to two memory tools:

1. lookup_user
   - Use this to check whether the current learner has been seen before.
   - Use the learner's user ID.
   - If memory exists, use it naturally to understand the learner's previous progress.

2. save_memory
   - Use this only after the learner explicitly agrees that Saarthi may remember the information.
   - Never save personal learning information without permission.
   - Save useful learning information such as:
     - name
     - learning level
     - topics covered
     - recurring mistakes

When a returning learner is identified:
- Greet them naturally by name.
- Use their previous learning information when relevant.
- Continue from where they left off instead of behaving as if this is the first conversation.

When you learn useful information about a learner:
- Ask for permission before saving it.
- Example:
  "Would you like me to remember that so I can help you better next time?"
- If the learner says yes, use save_memory.
- If the learner says no, do not save it.

GUARDRAILS:
- Never shame, insult, or discourage someone for giving a wrong answer.
- Never claim that someone has a learning disability or medical condition.
- If asked for a diagnosis, clearly say that you cannot diagnose them and suggest speaking with a qualified professional.
- Never pretend to know something you are uncertain about.
- Do not provide dangerous or harmful instructions.
- Stay focused on helping the user learn.

VOICE:
You are speaking aloud, so avoid long paragraphs, complex formatting, emojis, and unnecessary technical language.
""""""
"""


class Assistant(Agent):
    def __init__(self, memory_context: str) -> None:
        super().__init__(
            instructions=f"""
{SYSTEM_PROMPT}

LEARNER MEMORY:

{memory_context}

Use the learner memory only when relevant.
Do not reveal internal database information.
Do not mention MySQL, database, memory_context, or tools to the learner.
"""
        )

    @function_tool()
    async def lookup_user(
        self,
        context: RunContext,
        user_id: str,
    ) -> dict:
        """Look up an existing learner's memory using their user ID."""

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        try:
            cursor.execute(
                """
                SELECT
                    user_id,
                    name,
                    learning_level,
                    topics_covered,
                    recurring_mistakes,
                    last_interaction
                FROM user_memory
                WHERE user_id = %s
                """,
                (user_id,)
            )

            user = cursor.fetchone()

            if user:
                return {
                    "found": True,
                    "user": user,
                }

            return {
                "found": False,
                "message": "No memory found for this learner."
            }

        finally:
            cursor.close()
            conn.close()


    @function_tool()
    async def save_memory(
        self,
        context: RunContext,
        user_id: str,
        name: str,
        learning_level: str = "",
        topics_covered: str = "",
        recurring_mistakes: str = "",
    ) -> str:
        """Save or update useful learning information about the current learner.

        Only use this after the learner has explicitly agreed to remember
        the information.
        """

        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            cursor.execute(
                """
                INSERT INTO user_memory (
                    user_id,
                    name,
                    learning_level,
                    topics_covered,
                    recurring_mistakes
                )
                VALUES (%s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    learning_level = VALUES(learning_level),
                    topics_covered = VALUES(topics_covered),
                    recurring_mistakes = VALUES(recurring_mistakes),
                    last_interaction = CURRENT_TIMESTAMP
                """,
                (
                    user_id,
                    name,
                    learning_level,
                    topics_covered,
                    recurring_mistakes,
                )
            )

            conn.commit()

            return "Learner memory saved successfully."

        finally:
            cursor.close()
            conn.close()

   


server = AgentServer()


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


server.setup_fnc = prewarm


@server.rtc_session(agent_name="my-agent")
async def my_agent(ctx: JobContext):
    user_id = "user_001"

    user_memory = get_user_memory(user_id)

    if user_memory:
        memory_context = f"""
        The current learner's saved information is:

        Name: {user_memory.get('name')}
        Learning level: {user_memory.get('learning_level')}
        Topics previously covered: {user_memory.get('topics_covered')}
        Recurring mistakes: {user_memory.get('recurring_mistakes')}

        Use this information naturally when relevant.
Do not claim to remember information that is not present here.
"""
    else:
        memory_context = """
    No previous learner information is available.
    Treat this as a new learner.
    """    
    # Logging setup
    # Add any other context you want in all log entries here
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    # Set up a voice AI pipeline using Murf Falcon, Gemini, Deepgram, and the LiveKit turn detector
    
    session = AgentSession(
        # Speech-to-text (STT) is your agent's ears, turning the user's speech into text that the LLM can understand
        # See all available models at https://docs.livekit.io/agents/models/stt/
        stt=deepgram.STT(model="nova-3",language="multi"),
        # A Large Language Model (LLM) is your agent's brain, processing user input and generating a response
        # See all available models at https://docs.livekit.io/agents/models/llm/
        llm=google.LLM(
                model="gemini-3.5-flash-lite",
            ),
        # Text-to-speech (TTS) is your agent's voice, turning the LLM's text into speech that the user can hear
        # See all available models as well as voice selections at https://docs.livekit.io/agents/models/tts/
        tts=murf.TTS(
                voice="Samar", 
                #locale="en-IN",
                style="Conversation",
                pitch= -5,
                tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
                text_pacing=True
            ),
        # VAD and turn detection are used to determine when the user is speaking and when the agent should respond
        # See more at https://docs.livekit.io/agents/build/turns
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        # allow the LLM to generate a response while waiting for the end of turn
        # See more at https://docs.livekit.io/agents/build/audio/#preemptive-generation
        preemptive_generation=True,
    )

    # To use a realtime model instead of a voice pipeline, use the following session setup instead.
    # (Note: This is for the OpenAI Realtime API. For other providers, see https://docs.livekit.io/agents/models/realtime/))
    # 1. Install livekit-agents[openai]
    # 2. Set OPENAI_API_KEY in .env.local
    # 3. Add `from livekit.plugins import openai` to the top of this file
    # 4. Use the following session setup instead of the version above
    # session = AgentSession(
    #     llm=openai.realtime.RealtimeModel(voice="marin")
    # )

    # # Add a virtual avatar to the session, if desired
    # # For other providers, see https://docs.livekit.io/agents/models/avatar/
    # avatar = hedra.AvatarSession(
    #   avatar_id="...",  # See https://docs.livekit.io/agents/models/avatar/plugins/hedra
    # )
    # # Start the avatar and wait for it to join
    # await avatar.start(session, room=ctx.room)

    # Start the session, which initializes the voice pipeline and warms up the models
    await session.start(
    agent=Assistant(memory_context),
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
  
    await session.generate_reply(
    instructions="""
    You are Saarthi, a friendly learning companion.

    Start the conversation yourself. Do not wait for the learner to speak first.

    Say a short, warm and natural opening:
    "Namaste! Main Saarthi hoon —" 
    and a eduactional quote to start learners momentum in english.

    Then briefly say that the learner can ask you about anything they want to understand, practice, or explore.

    Finally ask:
    "Aaj aap kis cheez ko samajhna ya explore karna chahenge?"

    Keep the entire opening conversational and under 20 seconds.
    Do not sound like a formal teacher or customer-service bot.
    """

   )

    # Join the room and connect to the user
    await ctx.connect()


if __name__ == "__main__":
     cli.run_app(server)


