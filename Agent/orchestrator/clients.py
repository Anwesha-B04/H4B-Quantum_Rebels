import logging
import httpx
from typing import Dict, Any

from . import config
from .schemas import GenerateRequest, GenerateResponse, ScoreRequest, ScoreResponse

logger = logging.getLogger(__name__)

async def call_generator_service(
    client: httpx.AsyncClient, user_id: str, job_description: str
) -> GenerateResponse:
    """Calls the Generator Service to produce resume content."""
    url = f"{config.GENERATOR_SERVICE_URL.rstrip('/')}/generate/full"
    request_payload = GenerateRequest(user_id=user_id, job_description=job_description)
    
    logger.info(f"Calling Generator Service at {url} for user {user_id}")
    try:
        response = await client.post(url, json=request_payload.model_dump(), timeout=90.0)
        response.raise_for_status()
        return GenerateResponse(**response.json())
    except httpx.HTTPStatusError as e:
        logger.error(f"Generator service returned error {e.response.status_code}: {e.response.text}")
        raise
    except httpx.RequestError as e:
        logger.error(f"Could not connect to Generator service: {e}")
        raise

async def call_scoring_service(
    client: httpx.AsyncClient, job_description: str, resume_text: str
) -> ScoreResponse:
    """Calls the Scoring Service to evaluate the resume."""
    url = f"{config.SCORING_SERVICE_URL.rstrip('/')}/score"
    request_payload = ScoreRequest(job_description=job_description, resume_text=resume_text)
    
    logger.info(f"Calling Scoring Service at {url}")
    try:
        response = await client.post(url, json=request_payload.model_dump(), timeout=45.0)
        response.raise_for_status()
        return ScoreResponse(**response.json())
    except httpx.HTTPStatusError as e:
        logger.error(f"Scoring service returned error {e.response.status_code}: {e.response.text}")
        raise
    except httpx.RequestError as e:
        logger.error(f"Could not connect to Scoring service: {e}")
        raise