"""Trigger an outbound Saarthi call through LiveKit + Linphone."""

import argparse
import asyncio
import json
import uuid

from dotenv import load_dotenv
from livekit import api

load_dotenv(".env.local")

AGENT_NAME = "outbound-agent"


async def dial(phone_number: str, room_name: str) -> None:
    """Create a room and dispatch Saarthi's outbound agent."""

    lk = api.LiveKitAPI()

    try:
        # Create a unique LiveKit room
        await lk.room.create_room(
            api.CreateRoomRequest(
                name=room_name
            )
        )

        # Tell the outbound agent which Linphone SIP address to call
        await lk.agent_dispatch.create_dispatch(
            api.CreateAgentDispatchRequest(
                agent_name=AGENT_NAME,
                room=room_name,
                metadata=json.dumps(
                    {
                        "phone_number": phone_number
                    }
                ),
            )
        )

    finally:
        await lk.aclose()


def main() -> None:

    parser = argparse.ArgumentParser(
        description="Place an outbound Saarthi call."
    )

    parser.add_argument(
        "--to",
        required=True,
        help="Linphone SIP address / phone number to call",
    )

    parser.add_argument(
        "--room",
        default=None,
        help="Optional LiveKit room name",
    )

    args = parser.parse_args()

    room_name = args.room or f"outbound-{uuid.uuid4().hex[:8]}"

    asyncio.run(
        dial(
            args.to,
            room_name
        )
    )

    print(
        f"Dispatched {AGENT_NAME} "
        f"to room '{room_name}' "
        f"to call {args.to}."
    )

    print("Watch the agent terminal for call progress.")


if __name__ == "__main__":
    main()