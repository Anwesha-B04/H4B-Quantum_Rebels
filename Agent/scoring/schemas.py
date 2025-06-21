from pydantic import BaseModel, Field
from typing import List

class ScoreRequest(BaseModel):
    job_description: str = Field(..., min_length=1)
    resume_text: str = Field(..., min_length=1)

class ScoreResponse(BaseModel):
    final_score: float = Field(..., description="The final weighted ATS score from 0 to 1.", ge=0.0, le=1.0)
    semantic_score: float = Field(..., description="The semantic similarity score component (0 to 1).", ge=0.0, le=1.0)
    keyword_score: float = Field(..., description="The keyword matching score component (0 to 1).", ge=0.0, le=1.0)
    missing_keywords: List[str] = Field(..., description="Important keywords from the job description missing from the resume.")

class SuggestionRequest(BaseModel):
    missing_keywords: List[str] = Field(..., min_length=1)

class SuggestionResponse(BaseModel):
    suggestions: List[str]

class HealthResponse(BaseModel):
    status: str
    service: str