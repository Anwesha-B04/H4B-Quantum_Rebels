from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class ChatRequest(BaseModel):
    session_id: str = Field(..., description="A unique identifier for the user's session.", min_length=1)
    user_message: str = Field(..., description="The user's message or instruction to the agent.", min_length=1)
    user_id: Optional[str] = Field(None, description="The user's unique ID. Required only for the first message in a new session.")
    job_description: Optional[str] = Field(None, description="The job description text. Required only for the first message in a new session.")

class ChatResponse(BaseModel):
    agent_response: str = Field(..., description="The natural language response from the agent.")
    session_id: str = Field(..., description="The session identifier.")
    resume_state: Dict[str, Any] = Field(..., description="The current, complete state of the resume being built.")

class HealthResponse(BaseModel):
    status: str
    service: str
    redis_connected: bool

class ChunkItem(BaseModel):
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
    results: List[ChunkItem]

class GenerateResponse(BaseModel):
    generated_text: str

class ScoreResponse(BaseModel):
    final_score: float
    semantic_score: float
    keyword_score: float
    missing_keywords: List[str]

class SuggestionResponse(BaseModel):
    suggestions: List[str]