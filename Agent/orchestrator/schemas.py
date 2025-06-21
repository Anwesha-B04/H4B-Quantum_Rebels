# orchestrator/schemas.py

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

# --- Public API Schemas ---

class ChatRequest(BaseModel):
    session_id: str = Field(..., min_length=1)
    user_message: str = Field(..., min_length=1)
    user_id: Optional[str] = None
    job_description: Optional[str] = None

class ChatResponse(BaseModel):
    agent_response: str
    session_id: str
    resume_state: Optional[Dict[str, Any]] = None

class HealthResponse(BaseModel):
    status: str
    service: str
    redis_connected: bool


# --- Internal Schemas (for validating responses from other services) ---

class ChunkItem(BaseModel):
    """
    Internal model to validate a single context chunk received from the Retrieval Service.
    """
    chunk_id: str
    user_id: str
    index_namespace: str
    section_id: Optional[str]
    source_type: str
    source_id: str
    text: str
    score: float
    created_at: datetime

class RetrieveResponse(BaseModel):
    """
    Internal model to validate the full response from the Retrieval Service.
    """
    results: List[ChunkItem]

class GenerateResponse(BaseModel):
    """
    Internal model to validate the full response from the Generation Service.
    """
    generated_text: str
    raw_prompt: Optional[str] = None
    retrieval_mode: Optional[str] = None
    section_id: Optional[str] = None

class ScoreResponse(BaseModel):
    """
    Internal model to validate the response from the Scoring Service's /score endpoint.
    This now correctly matches the scoring service's output.
    """
    final_score: float
    semantic_score: float
    keyword_score: float
    missing_keywords: List[str]

class SuggestionResponse(BaseModel):
    """
    Internal model to validate the response from the Scoring Service's /suggest endpoint.
    """
    suggestions: List[str]