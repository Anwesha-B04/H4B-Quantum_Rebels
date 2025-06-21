import os
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class FullRetrieveRequest(BaseModel):
    user_id: str = Field(..., description="User identifier for profile lookup", min_length=1)
    job_description: str = Field(..., description="Job posting text for relevance matching", min_length=1)
    top_k: int = Field(
        default_factory=lambda: int(os.getenv("DEFAULT_TOP_K", "5")),
        description="Number of chunks to retrieve",
        ge=1,
        le=50,
    )

class SectionRetrieveRequest(BaseModel):
    user_id: str = Field(..., description="User identifier for profile lookup", min_length=1)
    section_id: str = Field(..., description="Resume section identifier", min_length=1)
    job_description: str = Field(..., description="Job posting text for relevance matching", min_length=1)
    top_k: int = Field(
        default_factory=lambda: int(os.getenv("DEFAULT_TOP_K", "5")),
        description="Number of chunks to retrieve",
        ge=1,
        le=50,
    )

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
    results: List[ChunkItem] = Field(
        ..., description="List of retrieved chunks ordered by relevance score (descending)"
    )

class HealthResponse(BaseModel):
    status: str
    service: str