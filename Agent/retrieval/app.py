import logging
import os
import time
from typing import Dict, Any

import httpx
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from .schemas import (
    FullRetrieveRequest,
    SectionRetrieveRequest,
    RetrieveResponse,
    HealthResponse,
)
from .utils import embed_text, retrieve_profile_chunks, retrieve_section_chunks

load_dotenv()

log_level = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app_state: Dict[str, Any] = {}

app = FastAPI(
    title="CVisionary Retrieval Service",
    description="Context retrieval service for resume generation and editing",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting CVisionary Retrieval Service")
    embedding_service_url = os.getenv("EMBEDDING_SERVICE_URL")
    if not embedding_service_url:
        raise RuntimeError("EMBEDDING_SERVICE_URL environment variable is required")

    app_state["http_client"] = httpx.AsyncClient(timeout=30.0)

    try:
        health_url = f"{embedding_service_url.rstrip('/')}/health"
        response = await app_state["http_client"].get(health_url)
        response.raise_for_status()
        logger.info(f"Successfully connected to Embedding Service at {embedding_service_url}")
    except Exception as e:
        logger.error(f"Could not connect to Embedding Service: {e}")
    logger.info("Service startup complete")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down Retrieval Service")
    client: httpx.AsyncClient = app_state.get("http_client")
    if client:
        await client.aclose()

async def get_http_client() -> httpx.AsyncClient:
    return app_state["http_client"]

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    logger.info(f"{request.method} {request.url.path} - Response {response.status_code} in {duration:.2f}s")
    return response

@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="ok", service="retrieval")

@app.post("/retrieve/full", response_model=RetrieveResponse)
async def retrieve_full_context(
    request: FullRetrieveRequest, client: httpx.AsyncClient = Depends(get_http_client)
):
    logger.info(f"Full context retrieval for user_id={request.user_id}")
    embedding = await embed_text(client, request.job_description)
    chunks = await retrieve_profile_chunks(
        client, user_id=request.user_id, embedding=embedding, top_k=request.top_k
    )
    logger.info(f"Full context retrieval complete: retrieved {len(chunks)} chunks")
    return RetrieveResponse(results=chunks)

@app.post("/retrieve/section", response_model=RetrieveResponse)
async def retrieve_section_context(
    request: SectionRetrieveRequest, client: httpx.AsyncClient = Depends(get_http_client)
):
    logger.info(f"Section context retrieval for user_id={request.user_id}, section_id={request.section_id}")
    embedding = await embed_text(client, request.job_description)
    chunks = await retrieve_section_chunks(
        client,
        user_id=request.user_id,
        section_id=request.section_id,
        embedding=embedding,
        top_k=request.top_k,
    )
    logger.info(f"Section context retrieval complete: retrieved {len(chunks)} chunks")
    return RetrieveResponse(results=chunks)