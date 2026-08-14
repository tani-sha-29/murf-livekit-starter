import asyncio
import logging
import os
import mysql.connector
import uuid
from practice_agent import PracticeAgent

from dotenv import load_dotenv
from livekit import rtc
from typing import Any, cast

from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    RunContext,
    function_tool,
    cli,
    tokenize,
    room_io,
)

from livekit.plugins import (
    murf,
    silero,
    google,
    deepgram,
    noise_cancellation,
)

from livekit.plugins.turn_detector.multilingual import MultilingualModel


logger = logging.getLogger("agent")

load_dotenv(".env.local")


# ============================================================
# DATABASE
# ============================================================

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("MYSQL_HOST", "localhost"),
        port=int(os.getenv("MYSQL_PORT", "3306")),
        user=os.getenv("MYSQL_USER", "root"),
        password=os.getenv("MYSQL_PASSWORD"),
        database=os.getenv("MYSQL_DATABASE", "saarthi"),
    )


def get_user_memory(user_id: str) -> dict[str, Any] | None:
    """
    Retrieve saved learner information from MySQL.
    """

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        print("QUERY USER ID:", user_id)
        print("DATABASE:", connection.database)

        cursor.execute(
            """
            SELECT
                user_id,
                name,
                learning_level,
                topics_covered,
                recurring_mistakes
            FROM user_memory
            WHERE user_id = %s
            """,
            (user_id,),
        )

        memory = cursor.fetchone()

        print("USER MEMORY:", memory)

        if memory is None:
            return None

        return cast(dict[str, Any], memory)

    except Exception as e:
        logger.error(f"Memory lookup failed: {e}")
        return None

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ============================================================
# SYSTEM PROMPT
# ============================================================

SYSTEM_PROMPT = """
You are Saarthi, a friendly voice-first learning companion designed
for people in India who may have limited access to teachers,
educational resources, or reliable learning support.

IDENTITY:

You are a patient, encouraging guide.

You help both children and adults learn through natural voice
conversations.

Your goal is to make learning simple, useful, practical and
accessible.

============================================================
EDUCATIONAL OBJECTIVES
============================================================

1. Help users understand academic and practical concepts using
   simple explanations.

2. Help users practice useful skills such as:

   - English
   - Hindi
   - Mathematics
   - Reading
   - Communication
   - Digital literacy
   - Everyday knowledge

3. Help users develop:

   - confidence
   - curiosity
   - self-awareness
   - critical thinking
   - civic sense
   - environmental awareness
   - practical understanding

Education is not only about getting a job or earning money.

Help learners understand why knowledge matters in real life.

============================================================
ADAPTATION
============================================================

Adapt explanations according to the learner's knowledge level.

For children:

- Use simple language.
- Use short explanations.
- Use relatable examples.
- Use stories when helpful.

For adults:

- Focus on practical examples.
- Explain real-world applications.

Never assume that the learner has expensive devices,
coaching, books, or high-speed internet.

============================================================
LANGUAGE AND SCRIPT RULES
============================================================

You can communicate in:

- English
- Hindi
- Hinglish
- English + Hindi mixed speech

CRITICAL RULE:

The CURRENT learner message has priority over all previous
messages when deciding the response language.

Before EVERY response:

1. Carefully analyze the CURRENT learner message.
2. Identify the language being used NOW.
3. Do NOT continue the previous language automatically.
4. Respond using the language/style of the CURRENT message.

Always write every language in its own native script.
Hindi → Devanagari (नमस्ते), never romanized (never "namaste").
Same rule for all non-English languages.

------------------------------------------------------------
ENGLISH
------------------------------------------------------------

If the learner speaks English:

Respond completely in English.

Use Latin/English script.

------------------------------------------------------------
HINDI
------------------------------------------------------------

If the learner speaks Hindi:

Respond in Hindi.

Hindi MUST be written using Devanagari script.

------------------------------------------------------------
HINGLISH
------------------------------------------------------------

If the learner mixes Hindi and English:

Use natural Hinglish.

English technical words remain in Latin script.
Hindi words use Devanagari script.

============================================================
LEARNING EXERCISE TOOL
============================================================

You have access to a tool called get_learning_exercise.

This tool is the ONLY source for practice exercises.

Use get_learning_exercise whenever the learner wants to practice.

If the learner asks for another, one more, next, different,
or new exercise after a previous exercise, call
get_learning_exercise again.

Do NOT invent exercises yourself.

------------------------------------------------------------
WHEN TOOL RETURNS success = true
------------------------------------------------------------

Use the EXACT question returned by the tool.

Do not rewrite or replace it.

------------------------------------------------------------
WHEN TOOL RETURNS success = false
------------------------------------------------------------

Do NOT create a replacement exercise yourself.

Explain that another suitable exercise is currently unavailable.

============================================================
PRACTICE MODE
============================================================

When the learner starts a practice session from the Practice
section, the frontend may send:

"Start a Java beginner practice session."

Treat this as an explicit request to practice.

Call get_learning_exercise using the topic and level.

============================================================
CONVERSATION MEMORY
============================================================

You have access to learner memory stored in the application's
database.

Memory may contain:

- name
- learning level
- topics covered
- recurring mistakes

Use this information naturally when relevant.

Do NOT mention:

- MySQL
- database
- SQL
- internal memory
- tools
- user IDs
- memory_context

============================================================
MEMORY SAVING
============================================================

You have a tool called save_memory.

The save_memory tool is the ONLY mechanism that persists learner
information across conversations.

When useful stable learning-related information is identified,
ask the learner whether they want Saarthi to remember it.

After asking:

STOP.

Wait for the learner's response.

Only call save_memory after clear permission.

Never claim that information was saved unless save_memory
actually returned successfully.

============================================================
TEACHING STYLE
============================================================

Explain one idea at a time.

Start simple.

Add complexity only when needed.

Use relatable examples.

If the learner does not understand:

Explain the idea differently instead of simply repeating it.

Ask short questions occasionally.

Encourage learners when they make progress.

============================================================
CONTEXT RULES
============================================================

Answer the question that was actually asked.

Use conversation context when relevant.

Do not invent facts.

Do not invent personal information.

============================================================
GUARDRAILS
============================================================

Never shame or insult a learner.

Never claim that someone has a learning disability or medical
condition.

Do not diagnose medical conditions.

Do not provide dangerous instructions.

Stay focused on helping the learner learn.

============================================================
VOICE
============================================================

You are speaking aloud.

Therefore:

- Avoid long paragraphs.
- Avoid complex formatting.
- Avoid emojis.
- Avoid unnecessary technical language.
- Keep responses conversational.

============================================================
HUMAN HELP / ESCALATION
============================================================

Saarthi should recognize when a learner genuinely needs human
support instead of continuing to answer normally.

Escalate only for meaningful situations such as:

1. The learner explicitly asks for a human, teacher, mentor,
   or support person.

2. The learner is repeatedly struggling with a concept and
   clearly says they are unable to continue or need human help.

3. The learner becomes significantly frustrated or overwhelmed
   and clearly asks for human assistance.

Do NOT escalate because the learner:

- gives a wrong answer
- asks a difficult question
- needs an explanation repeated once
- makes a normal mistake
- simply says they do not understand something

Before creating a human-support request:

1. Explain briefly that a human can help.
2. Explain what information would be shared.
3. Ask for the learner's permission.
4. Wait for a clear YES.
5. Only after YES, create the escalation request.

Each escalation must contain:

- reason
- topic
- concise learner summary
- urgency: LOW, MEDIUM, or HIGH

Urgency rules:

LOW:
Normal request for human learning assistance.

MEDIUM:
Repeated struggle, significant frustration, or difficulty
continuing the learning session.

HIGH:
The learner explicitly asks for urgent/immediate human help
or clearly says they cannot continue without human assistance.

Never create an escalation without learner permission.

Never claim that a human request was created unless the
escalation tool actually succeeds.

Never call create_escalation until the learner has clearly
agreed to create a human-support request.

Pass permission_confirmed=true only after an explicit
affirmative response such as "yes", "okay", "sure", or "please do".

============================================================
CALL SUCCESS
============================================================

When the learner completes a learning activity and can clearly
state the key takeaway, call mark_learning_success.

Do not call it merely because the learner answered one question.

The learner should complete the agreed activity and demonstrate
that they understood the key takeaway.

============================================================
MEMORY DETECTION AND PERMISSION
============================================================

During every conversation, actively watch for stable learner
information that could improve future learning support.

Examples:

- "I'm learning Python."
- "I'm preparing for Java interviews."
- "I'm a beginner in mathematics."
- "I keep making mistakes with SQL joins."
- "I want to improve my English speaking."

When the learner shares such information:

1. Identify the useful information.
2. Ask permission to remember it.
3. STOP and wait for the learner's answer.
4. Do NOT call save_memory before clear permission.
5. If the learner says YES, immediately call save_memory.
6. After successful saving, confirm that it was remembered.

Example:

Learner:
"I'm currently learning Python."

Saarthi:
"Would you like me to remember that you're learning Python
so I can tailor future learning sessions?"

Learner:
"Yes."

→ Call save_memory.

Do NOT wait for the learner to explicitly say
"remember this" before asking permission.

Do NOT silently save information.

Do NOT claim memory was saved unless save_memory actually
returns successfully.

============================================================
SUCCESS TRACKING
============================================================

During a practice or learning activity, actively track whether
the learner has completed the task.

A learning interaction is successful when:

1. Saarthi gives the learner a learning task or exercise.
2. The learner attempts and completes the task.
3. Saarthi asks the learner to explain the key takeaway
   or demonstrate what they learned.
4. The learner gives a reasonable answer demonstrating understanding.

When all four conditions are satisfied:

IMMEDIATELY call mark_learning_success.

Pass:
- learning_task = the task completed
- takeaway = the learner's key takeaway

Do not call mark_learning_success merely because:
- the learner answered one question
- the learner said "okay"
- the learner stayed on the call
- the learner said they understand without demonstrating it.

================================
practice agent
===================================
============================================================
PRACTICE COACH HANDOFF
============================================================

When the learner explicitly wants to practice a topic,
use handoff_to_practice.

Examples:

"I want to practice Java."
"Quiz me on SQL."
"Let's practice inheritance."
"Test me on Python."

Do NOT hand off when the learner wants to understand,
learn, or receive an explanation.

Before handing off, clearly tell the learner:

"I'll connect you with my Practice Coach. You won't need
to repeat what you're working on."

Pass:

- topic
- learner level
- learning goal
- relevant recent conversation context

The Practice Coach generates questions dynamically about
the handed-off topic.
"""


# ============================================================
# ASSISTANT
# ============================================================

class Assistant(Agent):

    def __init__(
        self,
        memory_context: str,
        user_id: str,
    ) -> None:

        self.user_id = user_id
        self.learner_name = ""

        self.pending_memory = None
        self.waiting_for_memory_confirmation = False

        self.used_exercises = set()

        self.call_id = f"CALL-{uuid.uuid4().hex[:8].upper()}"
        self.learning_task = "General learning conversation"
        self.takeaway_completed = False

        # Save this so the greeting can use the same memory
        # that was loaded before the session started.
        self.memory_context = memory_context

        super().__init__(
            instructions=f"""
{SYSTEM_PROMPT}

============================================================
CURRENT LEARNER ID
============================================================

{user_id}

============================================================
LEARNER MEMORY
============================================================

{memory_context}

Use learner memory only when relevant.

Never reveal internal database information.
"""
        )

    # ========================================================
    # INITIAL GREETING
    # ========================================================

    async def on_enter(self) -> None:
        """
        Controlled greeting when this agent becomes active.
        """

        memory = self.memory_context

        if (
            "No previous learner information is available"
            in memory
        ):
            greeting = """
Say exactly:

"Namaste! Main Saarthi hoon, aapka learning companion."

Then say:

"Main aapke saath learning aur practice kar sakta hoon."

Then ask:

"Aaj aap kya seekhna ya practice karna chahenge?"

Do not add another greeting.
Keep the opening warm, natural, and under 20 seconds.
"""

        else:
            greeting = """
Greet the learner warmly.

Use the learner's saved context naturally if a name or
previous learning topics are available.

Introduce yourself as:

"Namaste! Main Saarthi hoon, aapka learning companion."

Then ask what the learner would like to learn,
practice, or explore today.

Do not mention databases, memory systems, tools,
or internal information.

Keep the opening warm, natural, and under 20 seconds.
"""

        # LiveKit documents on_enter as the lifecycle hook
        # for an agent's initial greeting.
        await self.session.generate_reply(
            instructions=greeting
        )

    # ========================================================
    # LOOKUP USER
    # ========================================================

    @function_tool()
    async def lookup_user(
        self,
        context: RunContext,
        user_id: str,
    ) -> dict:

        """
        Look up an existing learner using their user ID.
        """

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
                (user_id,),
            )

            user = cursor.fetchone()

            if user:
                return {
                    "found": True,
                    "user": user,
                }

            return {
                "found": False,
                "message": "No memory found for this learner.",
            }

        finally:

            cursor.close()
            conn.close()

    # ========================================================
    # GET LEARNING EXERCISES
    # ========================================================

    @function_tool()
    async def get_learning_exercise(
        self,
        context: RunContext,
        topic: str,
        level: str,
    ) -> dict:

        """
        Get a learning exercise from Saarthi's learning library.
        """

        import json
        from pathlib import Path

        try:

            file_path = (
                Path(__file__).resolve().parent.parent
                / "data"
                / "learning_exercises.json"
            )

            with open(
                file_path,
                "r",
                encoding="utf-8",
            ) as file:

                exercises = json.load(file)

            topic_lower = topic.strip().lower()
            level_lower = level.strip().lower()

            matching_exercises = [
                exercise
                for exercise in exercises
                if exercise["topic"].strip().lower()
                == topic_lower
                and exercise["level"].strip().lower()
                == level_lower
            ]

            if not matching_exercises:

                return {
                    "success": False,
                    "message": (
                        f"No {level} exercise is currently "
                        f"available for {topic}."
                    ),
                    "source": "Saarthi Learning Library",
                }

            available_exercises = [
                exercise
                for exercise in matching_exercises
                if exercise["question"]
                not in self.used_exercises
            ]

            if not available_exercises:

                print("===================================")
                print("⚠️ NO UNUSED EXERCISES LEFT")
                print("TOPIC:", topic)
                print("LEVEL:", level)
                print("===================================")

                return {
                    "success": False,
                    "message": (
                        f"No more {level} exercises are "
                        f"currently available for {topic}."
                    ),
                    "source": "Saarthi Learning Library",
                }

            exercise = available_exercises[0]

            self.used_exercises.add(
                exercise["question"]
            )

            self.learning_task = (
                f"{exercise['topic']} - "
                f"{exercise['level']} exercise"
            )

            print("===================================")
            print("🔥 GET_LEARNING_EXERCISE TOOL CALLED")
            print("TOPIC:", topic)
            print("LEVEL:", level)
            print("EXERCISE:", exercise["question"])
            print("===================================")

            return {
                "success": True,
                "topic": exercise["topic"],
                "level": exercise["level"],
                "question": exercise["question"],
                "source": exercise["source"],
            }

        except Exception as e:

            logger.error(
                f"Exercise lookup failed: {e}"
            )

            return {
                "success": False,
                "message": (
                    "The learning exercise library is "
                    "temporarily unavailable."
                ),
                "source": "Saarthi Learning Library",
            }

    # ========================================================
    # REQUEST MEMORY PERMISSION
    # ========================================================

    @function_tool()
    async def request_memory_permission(
        self,
        context: RunContext,
        information: str,
    ) -> str:

        """
        Ask whether learner information should be remembered.
        """

        self.pending_memory = information
        self.waiting_for_memory_confirmation = True

        print("\n===================================")
        print("MEMORY PERMISSION REQUESTED")
        print("PENDING:", information)
        print("===================================\n")

        return (
            f"I learned this information: {information}. "
            "Would you like me to remember this so I can "
            "help you better next time?"
        )

    # ========================================================
    # SAVE MEMORY
    # ========================================================

    @function_tool()
    async def save_memory(
        self,
        context: RunContext,
        name: str = "",
        learning_level: str = "",
        topics_covered: str = "",
        recurring_mistakes: str = "",
    ) -> str:

        print("\n===================================")
        print("🔥 SAVE_MEMORY TOOL CALLED")
        print("USER ID:", self.user_id)
        print("NAME:", name)
        print("LEVEL:", learning_level)
        print("TOPICS:", topics_covered)
        print("MISTAKES:", recurring_mistakes)
        print("===================================\n")

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
                name = COALESCE(
                    NULLIF(VALUES(name), ''),
                    name
                ),
                learning_level = COALESCE(
                    NULLIF(VALUES(learning_level), ''),
                    learning_level
                ),
                topics_covered = COALESCE(
                    NULLIF(VALUES(topics_covered), ''),
                    topics_covered
                ),
                recurring_mistakes = COALESCE(
                    NULLIF(VALUES(recurring_mistakes), ''),
                    recurring_mistakes
                ),
                last_interaction = CURRENT_TIMESTAMP
                """,
                (
                    self.user_id,
                    name,
                    learning_level,
                    topics_covered,
                    recurring_mistakes,
                ),
            )

            conn.commit()

            logger.info(
                f"Memory saved successfully for user: "
                f"{self.user_id}"
            )

            return "Learner memory saved successfully."

        except Exception as e:

            conn.rollback()

            logger.error(
                f"Memory save failed for "
                f"{self.user_id}: {e}"
            )

            return "Unable to save learner memory."

        finally:

            cursor.close()
            conn.close()

    # ========================================================
    # ESCALATE TO HUMAN
    # ========================================================

    @function_tool()
    async def create_escalation(
        self,
        context: RunContext,
        reason: str,
        topic: str,
        summary: str,
        urgency: str,
        permission_confirmed: bool,
    ) -> dict:

        """
        Create a human-support request after learner permission.
        """

        if not permission_confirmed:

            return {
                "success": False,
                "message": (
                    "Learner permission is required before "
                    "creating a human-support request."
                ),
            }

        urgency = urgency.strip().upper()

        if urgency not in {"LOW", "MEDIUM", "HIGH"}:
            urgency = "LOW"

        connection = None
        cursor = None

        try:

            connection = get_db_connection()
            cursor = connection.cursor()

            reference_id = (
                f"HELP-{uuid.uuid4().hex[:8].upper()}"
            )

            cursor.execute(
                """
                INSERT INTO support_requests (
                    reference_id,
                    user_id,
                    reason,
                    topic,
                    summary,
                    urgency,
                    status
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    reference_id,
                    self.user_id,
                    reason.strip(),
                    topic.strip(),
                    summary.strip(),
                    urgency,
                    "OPEN",
                ),
            )

            connection.commit()

            logger.info(
                "Human support request created: %s",
                reference_id,
            )

            print("\n===================================")
            print("🔥 HUMAN SUPPORT REQUEST CREATED")
            print("REFERENCE:", reference_id)
            print("USER ID:", self.user_id)
            print("REASON:", reason)
            print("TOPIC:", topic)
            print("URGENCY:", urgency)
            print("STATUS: OPEN")
            print("SUMMARY:", summary)
            print("===================================\n")

            return {
                "success": True,
                "reference_id": reference_id,
                "status": "OPEN",
                "urgency": urgency,
                "message": (
                    f"Human support request {reference_id} "
                    f"has been created successfully."
                ),
            }

        except Exception as e:

            if connection:
                connection.rollback()

            logger.error(
                "Escalation creation failed: %s",
                e,
            )

            return {
                "success": False,
                "message": (
                    "Unable to create the human-support request."
                ),
            }

        finally:

            if cursor:
                cursor.close()

            if connection:
                connection.close()

    # ========================================================
    # CALL ANALYTICS - SUCCESS
    # ========================================================

    @function_tool()
    async def mark_learning_success(
        self,
        context: RunContext,
        learning_task: str,
        takeaway: str,
    ) -> dict:

        """
        Mark the current learning interaction as successful.
        """

        connection = None
        cursor = None

        try:

            connection = get_db_connection()
            cursor = connection.cursor()

            cursor.execute(
    """
    INSERT IGNORE INTO call_analytics (
        call_id,
        user_id,
        channel,
        outcome,
        learning_task,
        takeaway_completed
    )
    VALUES (%s, %s, %s, %s, %s, %s)
    """,
    (
        self.call_id,
        self.user_id,
        "BROWSER",
        "FAILED",
        learning_task.strip(),
        False,
    ),
)

            cursor.execute(
    """
    UPDATE call_analytics
    SET
        outcome = 'SUCCESS',
        learning_task = %s,
        takeaway_completed = TRUE
    WHERE call_id = %s
    """,
    (
        learning_task.strip(),
        self.call_id,
    ),
)

            connection.commit()

            self.takeaway_completed = True
            self.learning_task = learning_task.strip()

            logger.info(
                "Learning success recorded: %s | task=%s | "
                "takeaway=%s",
                self.call_id,
                learning_task,
                takeaway,
            )

            return {
                "success": True,
                "call_id": self.call_id,
                "outcome": "SUCCESS",
                "takeaway_completed": True,
            }

        except Exception as e:

            if connection:
                connection.rollback()

            logger.error(
                "Failed to record learning success: %s",
                e,
            )

            return {
                "success": False,
                "message": (
                    "Unable to record learning outcome."
                ),
            }

        finally:

            if cursor:
                cursor.close()

            if connection:
                connection.close()

    # ========================================================
    # CALL ANALYTICS - FAILED
    # ========================================================

    async def record_call_outcome(
        self,
        outcome: str,
    ) -> None:

        connection = None
        cursor = None

        try:

            connection = get_db_connection()
            cursor = connection.cursor()

            cursor.execute(
    """
    INSERT IGNORE INTO call_analytics (
        call_id,
        user_id,
        channel,
        outcome,
        learning_task,
        takeaway_completed
    )
    VALUES (%s, %s, %s, %s, %s, %s)
    """,
    (
        self.call_id,
        self.user_id,
        "BROWSER",
        outcome,
        self.learning_task,
        self.takeaway_completed,
    ),
)

            connection.commit()

            logger.info(
                "Call outcome recorded: %s -> %s",
                self.call_id,
                outcome,
            )

        except Exception as e:

            if connection:
                connection.rollback()

            logger.error(
                "Failed to record call outcome: %s",
                e,
            )

        finally:

            if cursor:
                cursor.close()

            if connection:
                connection.close()

    # ========================================================
    # PRACTICE ESPECIALIST
    # ========================================================
                
    @function_tool()
    async def handoff_to_practice(
        self,
        context: RunContext,
        topic: str,
        level: str,
        learning_goal: str,
        conversation_context: str,
    ) -> tuple[Agent, str]:
        """
        Transfer the learner to Saarthi's Practice Coach.
        """

        practice_agent = PracticeAgent(
            user_id=self.user_id,
            learner_name="",
            topic=topic.strip(),
            level=level.strip(),
            learning_goal=learning_goal.strip(),
            conversation_context=conversation_context.strip(),
        )

        return (
            practice_agent,
            "I'll connect you with my Practice Coach. "
            "You won't need to repeat what you're working on."
        )

# ============================================================
# LIVEKIT SERVER
# ============================================================

server = AgentServer()


def prewarm(proc: JobProcess):

    proc.userdata["vad"] = silero.VAD.load()


server.setup_fnc = prewarm


# ============================================================
# AGENT SESSION
# ============================================================

@server.rtc_session(agent_name="my-agent")
async def my_agent(ctx: JobContext):

    # --------------------------------------------------------
    # CURRENT USER
    # --------------------------------------------------------

    # For now we are using a fixed user.
    # Later we will connect this to frontend authentication.
    user_id = "user_001"

    # --------------------------------------------------------
    # LOAD MEMORY
    # --------------------------------------------------------

    user_memory = get_user_memory(user_id)
    learner_name = (
    user_memory.get("name", "")
    if user_memory
    else ""
    )

    if user_memory:

        memory_context = f"""
The current learner is a returning learner.

Name:
{user_memory.get("name")}

Learning level:
{user_memory.get("learning_level")}

Previously covered topics:
{user_memory.get("topics_covered")}

Recurring mistakes:
{user_memory.get("recurring_mistakes")}

Use this information naturally when relevant.
"""

    else:

        memory_context = """
No previous learner information is available.

Treat this as a new learner.

Do not pretend to know the learner's name or previous topics.
"""

    # --------------------------------------------------------
    # LOGGING
    # --------------------------------------------------------

    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    # --------------------------------------------------------
    # AGENT SESSION
    # --------------------------------------------------------

    session = AgentSession(

        stt=deepgram.STT(
            model="nova-3",
            language="multi",
        ),

        llm=google.LLM(
            model="gemini-3.5-flash-lite",
        ),

        tts=murf.TTS(
            voice="Samar",
            style="Conversation",
            pitch=-5,
            tokenizer=tokenize.basic.SentenceTokenizer(
                min_sentence_len=2
            ),
            text_pacing=True,
        ),

        turn_detection=MultilingualModel(),

        vad=ctx.proc.userdata["vad"],

        preemptive_generation=True,
    )

    # --------------------------------------------------------
    # ASSISTANT INSTANCE
    # --------------------------------------------------------

    assistant = Assistant(
        memory_context=memory_context,
        user_id=user_id,
    )
    assistant.learner_name = learner_name
    # --------------------------------------------------------
    # CONNECT
    # --------------------------------------------------------

    await ctx.connect()

    # --------------------------------------------------------
    # SESSION START
    # --------------------------------------------------------

    await session.start(
        agent=assistant,
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

    # IMPORTANT:
    # There is intentionally NO additional generate_reply()
    # here. The Assistant.on_enter() hook handles the greeting.


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":
    cli.run_app(server)