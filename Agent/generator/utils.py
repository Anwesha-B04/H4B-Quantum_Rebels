import logging
import os
from typing import List, Optional
import httpx
from .schemas import ChunkItem, RetrieveResponse

logger = logging.getLogger(__name__)

async def retrieve_full_context(
    client: httpx.AsyncClient, user_id: str, job_description: str, top_k: int
) -> List[ChunkItem]:
    retrieval_url = os.getenv("RETRIEVAL_SERVICE_URL")
    if not retrieval_url:
        raise ValueError("RETRIEVAL_SERVICE_URL is not configured")
        
    endpoint = f"{retrieval_url.rstrip('/')}/retrieve/full"
    payload = {
        "user_id": user_id,
        "job_description": job_description,
        "top_k": top_k
    }

    logger.info(f"Retrieving full context for user {user_id} from {endpoint}")
    response = await client.post(endpoint, json=payload, timeout=30.0)
    response.raise_for_status()
    
    result = response.json()
    return [ChunkItem(**item) for item in result.get("results", [])]

async def retrieve_section_context(
    client: httpx.AsyncClient,
    user_id: str,
    section_id: str,
    job_description: str,
    top_k: int = 5
) -> List[ChunkItem]:
    retrieval_url = os.getenv("RETRIEVAL_SERVICE_URL")
    if not retrieval_url:
        raise ValueError("RETRIEVAL_SERVICE_URL is not configured")
        
    endpoint = f"{retrieval_url.rstrip('/')}/retrieve/section"
    payload = {
        "user_id": user_id,
        "section_id": section_id,
        "job_description": job_description,
        "top_k": top_k
    }

    logger.info(
        f"Retrieving section context for user {user_id}, section {section_id} from {endpoint}"
    )
    response = await client.post(endpoint, json=payload, timeout=30.0)
    response.raise_for_status()
    
    result = response.json()
    chunks = [ChunkItem(**item) for item in result.get("results", [])]
    logger.info(f"Successfully retrieved {len(chunks)} chunks for section context")
    return chunks


def format_context_for_prompt(chunks: List[ChunkItem]) -> str:
    if not chunks:
        return "No relevant context found."
        
    formatted_items = []
    for chunk in chunks:
        source_label = f"Source: {chunk.source_type} (Relevance: {chunk.score:.2f})"
        formatted_items.append(f"{source_label}\nContent: {chunk.text.strip()}\n")

    return "\n".join(formatted_items)