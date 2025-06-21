import json
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional

# --- Request Schema ---

class AgentRequest(BaseModel):
    user_id: str = Field(..., description="The user's unique identifier.")
    job_description: str = Field(..., description="The target job description text.", min_length=20)
    target_score: Optional[float] = Field(None, description="Override the default target score for this request.", ge=0.5, le=1.0)
    max_refinements: Optional[int] = Field(None, description="Override the default max refinements for this request.", ge=0, le=5)

# --- Response Schemas ---

class RefinementStep(BaseModel):
    attempt: int
    reasoning: str
    final_score: float
    semantic_score: float
    keyword_score: float
    missing_keywords: List[str]

class AgentResponse(BaseModel):
    status: str = Field(..., description="The final status of the agent's task (e.g., 'Completed: Target score met').")
    final_resume: Dict[str, Any] = Field(..., description="The final, generated resume as a JSON object.")
    final_score: float = Field(..., description="The score of the final resume.", ge=0, le=1.0)
    refinement_history: List[RefinementStep] = Field([], description="A log of the agent's refinement attempts.")

# --- Downstream Service Schemas (for internal validation) ---

class GenerateRequest(BaseModel):
    user_id: str
    job_description: str

class GenerateResponse(BaseModel):
    generated_text: str

class ScoreRequest(BaseModel):
    job_description: str
    resume_text: str

class ScoreResponse(BaseModel):
    final_score: float
    semantic_score: float
    keyword_score: float
    missing_keywords: List[str]