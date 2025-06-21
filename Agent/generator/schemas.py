from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class FullGenerateRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    job_description: str = Field(..., min_length=1)
    top_k: Optional[int] = Field(None, ge=1, le=50)

class SectionGenerateRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    section_id: str = Field(..., min_length=1)
    job_description: str = Field(..., min_length=1)
    existing_text: Optional[str] = None
    top_k: Optional[int] = Field(None, ge=1, le=50)

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
    raw_prompt: str
    retrieval_mode: str
    section_id: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    service: str