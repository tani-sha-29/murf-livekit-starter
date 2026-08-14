from livekit.agents import Agent, RunContext, function_tool
from livekit.agents import Agent


PRACTICE_PROMPT = """
You are Saarthi's Practice Coach.

Your job is focused practice.

You:
- ask questions about the handed-off topic
- start at the learner's level
- gradually increase difficulty
- evaluate answers
- give brief feedback
- explain mistakes when necessary
- give hints
- ask follow-up questions based on the learner's answer

You may generate practice questions dynamically.

Stay strictly within the handed-off topic.

Do not suddenly switch to unrelated subjects.

If the learner asks to LEARN or UNDERSTAND the topic instead
of practicing it, explain that Main Saarthi can teach it and
return control to Main Saarthi.

At the beginning, acknowledge the learner's topic and goal,
then start with the first practice question.

============================================================
RETURN TO MAIN SAARTHI
============================================================

If the learner asks to:
- understand the concept
- learn the topic
- get a full explanation
- stop practicing and start learning

do not continue giving practice questions.

Say:

"I'll connect you back to Saarthi so it can explain
the concept properly."

Then use handoff_to_main.

Pass:
- topic
- what the learner is struggling with
- latest answer
- relevant conversation context
"""


class PracticeAgent(Agent):

    def __init__(
        self,
        user_id: str,
        learner_name: str,
        topic: str,
        level: str,
        learning_goal: str,
        conversation_context: str,
    ) -> None:

        self.user_id = user_id
        self.learner_name = learner_name
        self.topic = topic
        self.level = level
        self.learning_goal = learning_goal
        self.conversation_context = conversation_context

        super().__init__(
            instructions=f"""
{PRACTICE_PROMPT}

Learner:
{learner_name or "Unknown"}

Level:
{level}

Topic:
{topic}

Learning goal:
{learning_goal}

Relevant conversation context:
{conversation_context}
"""
        )

    @function_tool()
    async def handoff_to_main(
        self,
        context: RunContext,
        topic: str,
        learner_problem: str,
        latest_answer: str,
        conversation_context: str,
    ) -> tuple[Agent, str]:
        """
        Return the learner to Main Saarthi when they need
        concept teaching instead of practice.
        """

        from agent import Assistant

        main_agent = Assistant(
        memory_context=f"""
Learner: {self.learner_name}
Topic being learned: {topic}
Learning level: {self.level}

The learner was practicing this topic but needs
a conceptual explanation.

What the learner is struggling with:
{learner_problem}

Latest learner answer:
{latest_answer}

Continue from this context. Do not make the learner
repeat the problem.
""",
        user_id=self.user_id,
    )

        return (
            main_agent,
            "I'll connect you back to Saarthi so it can explain "
            "the concept properly."
        )