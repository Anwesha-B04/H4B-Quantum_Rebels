# orchestrator/app/memory.py

import json
import os
from typing import Dict, Any, Optional
import redis
from langchain_community.chat_message_histories import RedisChatMessageHistory

# Initialize the Redis client from the environment variable.
# This client is used for storing session context (user_id, jd, resume_state).
# It's configured to decode responses from bytes to strings automatically.
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = redis.from_url(redis_url, decode_responses=True)

def get_session_history(session_id: str) -> RedisChatMessageHistory:
    """
    Retrieves a Redis-backed chat message history object for a given session.

    This object is directly compatible with LangChain's memory modules. It handles
    the storage and retrieval of individual chat messages (user and AI turns)
    under the hood, allowing the agent to have conversational memory.

    Args:
        session_id: The unique identifier for the user's session.

    Returns:
        An instance of RedisChatMessageHistory linked to the specified session.
    """
    return RedisChatMessageHistory(session_id=session_id, url=redis_url)

def get_session_context(session_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves the full context for a session from Redis.

    This context is a single JSON object that holds the "state" of the agent's
    work for a user, including the user_id, job_description, and the
    current state of the resume being built (`resume_state`).

    Args:
        session_id: The unique identifier for the user's session.

    Returns:
        A dictionary containing the session context if it exists, otherwise None.
    """
    key = f"session_context:{session_id}"
    data = redis_client.get(key)
    return json.loads(data) if data else None

def update_session_context(session_id: str, context_data: Dict[str, Any]) -> None:
    """
    Saves or overwrites the full session context in Redis.

    This function is used by the agent's tools (specifically `update_resume_in_memory_tool`)
    to persist changes to the `resume_state` after generating new content.

    Args:
        session_id: The unique identifier for the user's session.
        context_data: The complete dictionary of session data to be saved.
    """
    key = f"session_context:{session_id}"
    redis_client.set(key, json.dumps(context_data))

def initialize_session_context(session_id: str, user_id: str, job_description: str) -> Dict[str, Any]:
    """
    Creates and saves a new session context if one doesn't exist.

    This is called at the beginning of a conversation when no context is found
    for the given session_id. It establishes the foundational data for the
    agent's work.

    Args:
        session_id: The unique identifier for the new session.
        user_id: The user's unique ID.
        job_description: The target job description for this session.

    Returns:
        The newly created context dictionary.
    """
    context = {
        "user_id": user_id,
        "job_description": job_description,
        "resume_state": {}  # The resume starts as an empty object
    }
    update_session_context(session_id, context)
    return context