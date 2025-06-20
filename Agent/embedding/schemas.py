from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime

IndexNamespace = Literal['profile', 'resume_section']

class IndexSectionRequest(BaseModel):
    section_id: str = Field(..., description="A unique identifier for the section")
    text: str = Field(..., description="The text content of the section", min_length=1)

class IndexSectionResponse(BaseModel):
    status: str
    section_id: str
    chunk_ids: List[str]

class RetrieveRequest(BaseModel):
    query_embedding: List[float] = Field(..., description="The 384-dimensional embedding of the query", min_length=384, max_length=384)
    top_k: int = Field(default = 5, description="Number of top results to return", ge=1, le=100)
    index_namespace: IndexNamespace = Field(default='profile', description="The namespace of the index")
    filter_by_Section_ids: Optional[List[str]] = Field(default=None, description="Optional list of section IDs to filter by")

class ChunkItem(BaseModel):
    chunk_id: str = Field(..., description="A unique identifier for the chunk")
    user_id: str = Field(..., description="The ID of the user who owns the chunk")
    index_namespace: str = Field(..., description="The namespace of the index")
    section_id: Optional[str] = Field(default=None, description="The ID of the section the chunk belongs to")
    source_type: str = Field(..., description="The type of the source")
    source_id: str = Field(..., description="The ID of the source")
    text: str = Field(..., description="The text content of the chunk")
    score: float = Field(..., description="The score of the chunk")
    created_at: datetime = Field(..., description="The timestamp when the chunk was created")

class RetrieveResponse(BaseModel):
    results: List[ChunkItem]