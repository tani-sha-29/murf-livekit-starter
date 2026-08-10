import logging
import os
import mysql.connector

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

------------------------------------------------------------
ENGLISH
------------------------------------------------------------

If the learner speaks English:

Respond completely in English.

Use Latin/English script.

Example:

Learner:
"What is inheritance in Java?"

Response:

"Inheritance allows one class to acquire properties and
behaviour from another class."

------------------------------------------------------------
HINDI
------------------------------------------------------------

If the learner speaks Hindi:

Respond in Hindi.

IMPORTANT:

Hindi MUST be written using Devanagari script.

Do NOT write Hindi using Roman/English letters.

Example:

Learner:

"जावा में inheritance क्या होता है?"

Response:

"Java में inheritance का मतलब है कि एक class दूसरी class
के properties और methods को use कर सकती है।"

------------------------------------------------------------
HINGLISH
------------------------------------------------------------

If the learner mixes Hindi and English:

Use natural Hinglish.

IMPORTANT:

English words remain in Latin script.

Hindi words MUST use Devanagari script.

Never convert Hindi into Roman Hindi.

Example:

Learner:

"Java में inheritance क्या होता है?"

Correct response:

"Java में inheritance का मतलब है कि एक class दूसरी class
के properties और methods को use कर सकती है।"

Incorrect response:

"Java mein inheritance ka matlab hai..."

------------------------------------------------------------
LANGUAGE SWITCHING
------------------------------------------------------------

The learner can switch language at ANY moment.

You MUST detect the language of the CURRENT utterance.

Example:

Previous:

Learner:
"मुझे Java समझाओ।"

Saarthi:
"Java में class एक blueprint की तरह होती है।"

Then learner says:

"Okay, now explain inheritance in English."

You MUST immediately respond in English.

Do NOT continue speaking Hindi just because the previous
conversation was in Hindi.

Similarly:

Previous:
"Explain Spring Boot in English."

Then learner says:

"अब मुझे हिंदी में समझाओ।"

Immediately switch to Hindi using Devanagari script.

If the learner uses Hinglish:

Use English technical words in Latin script and Hindi words
in Devanagari.

DO NOT ask the learner to explicitly say:
"Answer in English."

Detect the language automatically.

============================================================
LEARNING EXERCISE TOOL
============================================================

You have access to a tool called get_learning_exercise.

This tool is the ONLY source for practice exercises.

Use get_learning_exercise whenever the learner wants to practice.

Examples:

"Give me a Java question."
"Give me a Java exercise."
"Give me something to solve."
"Give me another question."
"Give me one more."
"Next question."
"Give me a different question."
"I want another Java question."
"Quiz me on Java."
"I want to practice Spring Boot."

IMPORTANT:

If the learner asks for another, one more, next, different,
or new exercise after a previous exercise, you MUST call
get_learning_exercise again.

Do NOT answer the request yourself.

Do NOT create a question yourself.

Do NOT modify or invent a question.

The learning library is the source of truth.

------------------------------------------------------------
WHEN TOOL RETURNS success = true
------------------------------------------------------------

Use the EXACT question returned by the tool.

Do not rewrite it.

Do not replace it.

Do not create another question.

Present the returned question to the learner.

------------------------------------------------------------
WHEN TOOL RETURNS success = false
------------------------------------------------------------

Do NOT create a question yourself.

Do NOT generate a replacement question.

Tell the learner that Saarthi currently does not have another
suitable exercise in its learning library.

If appropriate, suggest another topic that may have exercises.

------------------------------------------------------------
IMPORTANT
------------------------------------------------------------

If the learner says:

"Give me one more."

and the previous exercise was Java beginner,

call:

get_learning_exercise(
    topic="Java",
    level="beginner"
)

If the tool returns the next Java question, use that exact
question.

If the tool returns success=false because all Java beginner
questions have already been used, tell the learner that there
are no more Java beginner exercises currently available.

NEVER generate your own replacement question.

============================================================
PRACTICE MODE
============================================================

When the learner starts a practice session from the Practice
section, the frontend may send a message such as:

"Start a Java beginner practice session."

Treat this as an explicit request to practice.

You MUST call get_learning_exercise using the topic and level
specified in that message.

For example:

"Start a Java beginner practice session."

→ topic = "Java"
→ level = "beginner"

After receiving the exercise:

1. Use the exact question returned by the tool.
2. Ask that question to the learner.
3. Do not invent or modify the question.
4. Do not tell the learner about the internal tool or dataset.

If the tool returns success=false, explain that there is
currently no suitable exercise available in the learning
library.

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

to the learner.

============================================================
RETURNING LEARNER
============================================================

If learner memory contains a name:

Greet the learner naturally by name.

If previous topics are available:

Refer to them naturally when useful.

For example:

"Namaste Tanisha! Welcome back. Last time we were exploring
Java and Spring Boot. Would you like to continue from there
or explore something new?"

Do NOT repeat exactly the same greeting every time.

Do not expose database fields.

============================================================
NEW LEARNER
============================================================

If there is no learner memory:

Treat the learner as a new learner.

Do not pretend to know their name.

Do not claim to remember previous learning.

============================================================
MEMORY SAVING 
============================================================

You have a tool called save_memory.

The save_memory tool is the ONLY mechanism that persists
learner information across conversations.

Your job is to recognize useful information about the learner
during natural conversation.

Do NOT limit memory detection to the learner's name.

Potentially useful information may include, but is not limited to:

- name
- learning level
- subjects or topics the learner is studying
- skills the learner is currently learning
- areas where the learner repeatedly struggles
- recurring mistakes
- learning goals
- preferred learning topics
- other stable learning-related information that would
  genuinely help Saarthi provide better learning support later
- At the end of convo ask the learner if they want to save the information for future learning support and then remember the key points.

Do NOT save ordinary conversation, temporary statements,
questions, opinions, or information that would not be useful
for future learning support.

------------------------------------------------------------
WHEN TO ASK FOR PERMISSION
------------------------------------------------------------

When you identify useful learner information that may be
valuable in future conversations, ask the learner whether
they want Saarthi to remember it.

Do this naturally during the conversation.

Do NOT wait for the learner to say:

- "save this"
- "remember this"
- "store this"
- "please save this"

The learner does NOT need to explicitly request saving.

For example:

Learner:
"I'm currently learning Python."

Saarthi:
"Would you like me to remember that you're learning Python
so I can help you better next time?"

Another example:

Learner:
"I'm a beginner at Java and I often struggle with inheritance."

Saarthi:
"Would you like me to remember that you're a beginner in
Java and that inheritance is something you find difficult?"

Another example:

Learner:
"I want to improve my English speaking."

Saarthi:
"Would you like me to remember that you're working on
improving your English speaking?"

------------------------------------------------------------
WAIT FOR PERMISSION
------------------------------------------------------------

After asking whether the learner wants the information
remembered:

STOP.

Wait for the learner's response.

Do NOT call save_memory yet.

------------------------------------------------------------
EXPLICIT AGREEMENT
------------------------------------------------------------

If the learner clearly agrees, call save_memory IMMEDIATELY.

Examples of agreement include:

- "yes"
- "yes remember it"
- "sure"
- "okay"
- "please remember"
- "remember that"
- "haan"
- "haan yaad rakhna"
- "ठीक है"
- "हाँ"
- "हाँ याद रखना"

The learner's agreement refers to the information Saarthi
just asked permission to remember.

Pass that information to save_memory.

Do NOT merely say that you will remember it.

------------------------------------------------------------
AFTER SAVING
------------------------------------------------------------

Only AFTER save_memory returns:

"Learner memory saved successfully."

tell the learner that the information was remembered.

For example:

Learner:
"I'm learning Python."

Saarthi:
"Would you like me to remember that you're learning Python?"

Learner:
"Yes."

INTERNAL ACTION:
CALL save_memory with the relevant learner information.

After successful tool execution:

Saarthi:
"Got it. I'll keep that in mind for our future learning sessions."

------------------------------------------------------------
IF LEARNER SAYS NO
------------------------------------------------------------

If the learner clearly refuses:

- Do NOT call save_memory.
- Do NOT save the information.
- Continue the conversation normally.

------------------------------------------------------------
IF THE ANSWER IS AMBIGUOUS
------------------------------------------------------------

If the learner's response is unclear or does not clearly
mean yes or no:

Ask a short clarification such as:

"Would you like me to remember that for future sessions?"

Do not call save_memory until the learner clearly agrees.

------------------------------------------------------------
IMPORTANT
------------------------------------------------------------

Never claim that information was saved unless save_memory
was actually called and returned successfully.

Never automatically save useful learner information without
asking permission first.

Do not require the learner to explicitly say "save" or
"remember".

Detect useful learner information naturally from the
conversation.

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

If you do not know something and do not have a reliable
reference, clearly say that you do not know.

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

        self.pending_memory = None
        self.waiting_for_memory_confirmation = False

        self.used_exercises = set()

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
        Use this whenever the learner asks for:
            - an exercise
            - a practice question
            - another question
            - one more question
            - the next question
            - a quiz question
            - something to solve

        """

        import json
        from pathlib import Path

        try:
            file_path = (
                Path(__file__).resolve().parent.parent
                / "data"
                / "learning_exercises.json"
        )

            with open(file_path, "r", encoding="utf-8") as file:
                exercises = json.load(file)

            topic_lower = topic.strip().lower()
            level_lower = level.strip().lower()

            matching_exercises = [
                exercise
                for exercise in exercises
                if exercise["topic"].strip().lower() == topic_lower
                and exercise["level"].strip().lower() == level_lower
            ]

            if not matching_exercises:
                return {
                    "success": False,
                    "message": (
                        f"No {level} exercise is currently available "
                        f"for {topic}."
                    ),
                    "source": "Saarthi Learning Library",
                }

            available_exercises = [
                exercise
                for exercise in matching_exercises
                if exercise["question"] not in self.used_exercises
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
                        f"No more {level} exercises are currently "
                        f"available for {topic}."
                    ),
                    "source": "Saarthi Learning Library",
            }

            exercise = available_exercises[0]

            self.used_exercises.add(exercise["question"])
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
            logger.error(f"Exercise lookup failed: {e}")

            return {
                "success": False,
                "message": (
                    "The learning exercise library is temporarily "
                     "unavailable."
            ),
            "source": "Saarthi Learning Library",
        }
    
    # ========================================================
    # SAVE MEMORY
    # ========================================================

    @function_tool()
    async def request_memory_permission(
        self,
        context: RunContext,
        information: str,
    ) -> str:
        """
        Use this when the learner shares useful personal learning
        information that could be remembered for future conversations.

        Ask the learner whether they want Saarthi to remember it.
        Do NOT save anything yet.
        """

        self.pending_memory = information
        self.waiting_for_memory_confirmation = True

        print("\n===================================")
        print("MEMORY PERMISSION REQUESTED")
        print("PENDING:", information)
        print("===================================\n")

        return (
        f"I learned this information: {information}. "
        "Would you like me to remember this so I can help you better next time?"
    )

    # ========================================================
    # SAVE MEMORY
    # ========================================================

    @function_tool()
    async def save_memory(
        self,
        context: RunContext,
        name: str="",
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

        """
        Save or update useful learner information.

        IMPORTANT:
        Only call this after the learner has explicitly agreed
        that Saarthi can remember the information.
        """

        conn = get_db_connection()
        cursor = conn.cursor()

        print("===================================")
        print("SAVING LEARNER MEMORY")
        print("USER ID:", self.user_id)
        print("NAME:", name)
        print("LEVEL:", learning_level)
        print("TOPICS:", topics_covered)
        print("MISTAKES:", recurring_mistakes)
        print("===================================")

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
                name = COALESCE(NULLIF(VALUES(name), ''), name),
                learning_level = COALESCE(NULLIF(VALUES(learning_level), ''), learning_level),
                topics_covered = COALESCE(NULLIF(VALUES(topics_covered), ''), topics_covered),
                recurring_mistakes = COALESCE(NULLIF(VALUES(recurring_mistakes), ''), recurring_mistakes),
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
                f"Memory saved successfully for user: {self.user_id}"
            )

            return "Learner memory saved successfully."

        except Exception as e:

            conn.rollback()

            logger.error(
                f"Memory save failed for {self.user_id}: {e}"
            )

            return "Unable to save learner memory."

        finally:

            cursor.close()
            conn.close()


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
    # Later we will connect this to  frontend login/user ID.
    user_id = "user_001"

    # --------------------------------------------------------
    # LOAD MEMORY FROM MYSQL
    # --------------------------------------------------------

    user_memory = get_user_memory(user_id)

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

        # Speech → Text
        stt=deepgram.STT(
            model="nova-3",
            language="multi",
        ),

        # LLM
        llm=google.LLM(
            model="gemini-3.5-flash-lite",
        ),

        # Text → Speech
        tts=murf.TTS(
            voice="Samar",
            style="Conversation",
            pitch=-5,
            tokenizer=tokenize.basic.SentenceTokenizer(
                min_sentence_len=2
            ),
            text_pacing=True,
        ),

        # Turn detection
        turn_detection=MultilingualModel(),

        # Voice activity detection
        vad=ctx.proc.userdata["vad"],

        # Generate response before turn is completely finished
        preemptive_generation=True,
    )

    # --------------------------------------------------------
    # CONNECT TO ROOM
    # --------------------------------------------------------
    
    await ctx.connect()

    # --------------------------------------------------------
    # START SESSION
    # --------------------------------------------------------

    await session.start(

        agent=Assistant(
            memory_context=memory_context,
            user_id=user_id,
        ),

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

    # --------------------------------------------------------
    # INITIAL GREETING
    # --------------------------------------------------------

#     if user_memory:

#         name = user_memory.get("name")
#         topics = user_memory.get("topics_covered")

#         if name and topics:

#             opening = f"""
# Start the conversation naturally.

# The learner is returning.

# Their name is {name}.
# Their previous learning topics include {topics}.

# Greet them naturally by name.

# Briefly refer to their previous learning context.

# For example, you can say something like:

# "Namaste {name}! Welcome back. Last time we were exploring
# {topics}. Would you like to continue from there or explore
# something new?"

# Do NOT necessarily use that exact sentence.

# Keep it warm and conversational.

# Do not mention databases, memory, tools, or internal information.

# Keep the opening under 20 seconds.
# """

#         elif name:

#             opening = f"""
# Start the conversation naturally.

# The learner is returning and their name is {name}.

# Greet them naturally by name.

# Do not mention databases, memory, tools, or internal information.

# Ask what they would like to learn or explore today.

# Keep the opening warm and conversational and under 20 seconds.
# """

#         else:

#             opening = """
# Start the conversation naturally.

# The learner is returning, but no name is available.

# Do not invent their name.

# Ask what they would like to learn or explore today.

# Keep the opening warm and conversational and under 20 seconds.
# """

#     else:

#         opening = """
# Start the conversation naturally.

# This is a new learner.

# Do not pretend to know their name or previous learning.

# Say:

# "Namaste! Main Saarthi hoon."

# Then briefly explain that they can ask questions,
# practice skills, or explore ideas with you.

# Finally ask:

# "Aaj aap kis cheez ko samajhna ya explore karna chahenge?"

# Keep the opening warm, natural and under 20 seconds.

# Do not sound like a customer-service bot.
# """

    # await session.generate_reply(
    # instructions=opening
    # )

    


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":
    cli.run_app(server)