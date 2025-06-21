import asyncio
import logging
import os
from typing import List, Dict, Any, Optional

import httpx
from fastapi import HTTPException

from .schemas import ChunkItem

logger = logging.getLogger(__name__)

RETRY_DELAY = 1.0
MAX_RETRIES = 2

async def embed_text(client: httpx.AsyncClient, job_description: str) -> List[float]:
    embedding_service_url = os.getenv("EMBEDDING_SERVICE_URL")
    if not embedding_service_url:
        raise HTTPException(status_code=500, detail="Embedding service URL not configured")

    url = f"{embedding_service_url.rstrip('/')}/embed"
    payload = {"text": job_description}
    logger.debug(f"POST {url}")

    try:
        response = await _make_request_with_retry(client, "POST", url, json=payload)
        if "embedding" not in response:
            raise HTTPException(status_code=502, detail="Invalid response format from embedding service")
        return response["embedding"]
    except Exception as e:
        logger.error(f"embed_text failed: {str(e)}")
        raise HTTPException(status_code=502, detail=f"Failed to generate embedding: {e}")

async def retrieve_profile_chunks(
    client: httpx.AsyncClient, user_id: str, embedding: List[float], top_k: int
) -> List[ChunkItem]:
    embedding_service_url = os.getenv("EMBEDDING_SERVICE_URL")
    if not embedding_service_url:
        raise HTTPException(status_code=500, detail="Embedding service URL not configured")

    url = f"{embedding_service_url.rstrip('/')}/retrieve/{user_id}"
    payload = {
        "query_embedding": embedding,
        "top_k": top_k,
        "index_namespace": "profile",
    }
    logger.debug(f"POST {url}")

    try:
        response = await _make_request_with_retry(client, "POST", url, json=payload)
        return _parse_chunks_response(response, user_id)
    except Exception as e:
        logger.error(f"retrieve_profile_chunks failed: {str(e)}")
        raise HTTPException(status_code=502, detail=f"Failed to retrieve profile chunks: {e}")

async def retrieve_section_chunks(
    client: httpx.AsyncClient, user_id: str, section_id: str, embedding: List[float], top_k: int
) -> List[ChunkItem]:
    embedding_service_url = os.getenv("EMBEDDING_SERVICE_URL")
    if not embedding_service_url:
        raise HTTPException(status_code=500, detail="Embedding service URL not configured")

    url = f"{embedding_service_url.rstrip('/')}/retrieve/{user_id}"
    payload = {
        "query_embedding": embedding,
        "top_k": top_k,
        "index_namespace": "resume_sections",
        "filter_by_section_ids": [section_id],
    }
    logger.debug(f"POST {url}")

    try:
        response = await _make_request_with_retry(client, "POST", url, json=payload)
        return _parse_chunks_response(response, user_id, section_id)
    except Exception as e:
        logger.error(f"retrieve_section_chunks failed: {str(e)}")
        raise HTTPException(status_code=502, detail=f"Failed to retrieve section chunks: {e}")

async def _make_request_with_retry(
    client: httpx.AsyncClient, method: str, url: str, **kwargs
) -> Dict[str, Any]:
    last_exception = None
    for attempt in range(MAX_RETRIES + 1):
        try:
            if attempt > 0:
                logger.debug(f"Retry attempt {attempt} for {method} {url}")
                await asyncio.sleep(RETRY_DELAY * attempt) # Exponential backoff

            response = await client.request(method, url, **kwargs)
            response.raise_for_status()
            return response.json()

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise HTTPException(status_code=404, detail="User not found or no chunks available") from e
            elif e.response.status_code >= 500:
                error_msg = f"Embedding service server error: {e.response.status_code}"
                logger.warning(f"Server error (attempt {attempt + 1}): {error_msg}")
                last_exception = HTTPException(status_code=502, detail=error_msg)
                continue
            else:
                raise HTTPException(status_code=502, detail=f"Embedding service client error: {e.response.text}") from e

        except (httpx.TimeoutException, httpx.ConnectError) as e:
            error_msg = f"Network error connecting to embedding service: {type(e).__name__}"
            logger.warning(f"Network error (attempt {attempt + 1}): {error_msg}")
            last_exception = HTTPException(status_code=502, detail=error_msg)
            continue

    raise last_exception or HTTPException(status_code=502, detail="Failed to connect to embedding service after retries")

def _parse_chunks_response(
    response: Dict[str, Any], user_id: str, section_id: Optional[str] = None
) -> List[ChunkItem]:
    if "results" not in response or not isinstance(response["results"], list):
        raise HTTPException(status_code=502, detail="Invalid response format from embedding service: missing 'results' list")

    chunks = [ChunkItem(**chunk_data) for chunk_data in response["results"]]
    logger.debug(f"Parsed {len(chunks)} valid chunks from {len(response['results'])} total")
    return chunks