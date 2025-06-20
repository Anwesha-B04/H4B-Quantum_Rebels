from pydantic import BaseModel, Field, AliasChoices
from typing import List, Optional, Literal
from datetime import datetime

IndexNamespace = Literal['profile', 'resume_section']

class Config:
    populate_by_name = True
    arbitrary_types_allowed = True

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
    chunk_id: str = Field(..., validation_alias=AliasChoices("chunk_id", "_id"))
    
    user_id: str = Field(..., description="User identifier")
    index_namespace: str = Field(
        ..., description="The namespace this chunk belongs to ('profile' or 'resume_sections')."
    )
    section_id: Optional[str] = Field(
        default=None, description="Identifier for a specific resume section, if applicable."
    )
    source_type: str = Field(
        ..., description="Original source type (e.g., 'experience', 'user_edited')."
    )
    source_id: str = Field(..., description="Original source identifier within type.")
    text: str = Field(..., description="Chunk text content")
    score: float = Field(..., description="Similarity score")
    created_at: datetime = Field(
        ..., description="Timestamp of when the chunk was created/updated."
    )

class RetrieveResponse(BaseModel):
    results: List[ChunkItem]