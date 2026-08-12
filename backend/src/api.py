from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel

from .database import get_db_connection

app = FastAPI(title="Saarthi API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/support-requests")
def get_support_requests():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()

        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                reference_id,
                user_id,
                reason,
                topic,
                summary,
                urgency,
                status,
                assigned_to,
                staff_response,
                created_at,
                updated_at
            FROM support_requests
            ORDER BY
                CASE urgency
                    WHEN 'HIGH' THEN 1
                    WHEN 'MEDIUM' THEN 2
                    WHEN 'LOW' THEN 3
                END,
                created_at DESC
            """
        )

        return cursor.fetchall()

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch support requests: {e}",
        )


class SupportRequestUpdate(BaseModel):
    action: str
    assigned_to: str | None = None
    response: str | None = None

@app.patch("/support-requests/{reference_id}")
def update_support_request(
    reference_id: str,
    update: SupportRequestUpdate,
):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check that the request exists.
        cursor.execute(
            """
            SELECT reference_id
            FROM support_requests
            WHERE reference_id = %s
            """,
            (reference_id,),
        )

        request = cursor.fetchone()

        if request is None:
            raise HTTPException(
                status_code=404,
                detail="Support request not found",
            )

        if update.action == "assign":
            if not update.assigned_to:
                raise HTTPException(
                    status_code=400,
                    detail="assigned_to is required",
                )

            cursor.execute(
                """
                UPDATE support_requests
                SET
                    assigned_to = %s,
                    status = 'ASSIGNED'
                WHERE reference_id = %s
                """,
                (
                    update.assigned_to,
                    reference_id,
                ),
            )

        elif update.action == "respond":
            if not update.response or not update.response.strip():
                raise HTTPException(
                    status_code=400,
                    detail="response is required",
                )

            cursor.execute(
                """
                UPDATE support_requests
                SET
                    staff_response = %s,
                    status = 'ASSIGNED'
                WHERE reference_id = %s
                """,
                (
                    update.response.strip(),
                    reference_id,
                ),
            )

        elif update.action == "resolve":
            cursor.execute(
                """
                UPDATE support_requests
                SET status = 'RESOLVED'
                WHERE reference_id = %s
                """,
                (reference_id,),
            )

        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid action",
            )

        connection.commit()

        return {
            "success": True,
            "reference_id": reference_id,
            "action": update.action,
        }

    except HTTPException:
        raise

    except Exception as e:
        if connection:
            connection.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to update support request: {e}",
        )

@app.get("/support-requests/user/{user_id}")
def get_user_support_requests(user_id: str):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                reference_id,
                reason,
                topic,
                summary,
                urgency,
                status,
                assigned_to,
                staff_response,
                created_at,
                updated_at
            FROM support_requests
            WHERE user_id = %s
            ORDER BY created_at DESC
            """,
            (user_id,),
        )

        return cursor.fetchall()

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch learner support requests: {e}",
        )

    finally:
        if cursor:
            cursor.close()

        if connection:
            connection.close()

    
    