from fastapi import FastAPI, HTTPException, Depends
from contextlib import asynccontextmanager
import httpx
import uuid
import numpy as np
from typing import List
from dotenv import load_dotenv
from datetime import datetime
import pytz
load_dotenv()

from .model import load_model, embed_text
from .db import (
    init_db,
    store_chunk,
    get_chunk_by_id,
    mark_user_indexed,
    get_user_index_status,
    delete_user_chunks,
    delete_chunks_by_section_id,
    search_chunks_vector,
)
from .schemas import (
    EmbedRequest,
    EmbedResponse,
    IndexProfileResponse,
    RetrieveRequest,
    RetrieveResponse,
    ChunkItem,
    IndexSectionRequest,
    IndexSectionResponse,
    DeleteSectionResponse,
)
from .chunking import chunk_text, extract_text_fields

http_client: httpx.AsyncClient


@asynccontextmanager
async def lifespan(app: FastAPI):
    global http_client
    
    print("Starting up embedding service with MongoDB backend...")
    init_db()
    load_model()
    http_client = httpx.AsyncClient()
    print("Startup complete. Service is ready.")
    
    yield
    
    print("Shutting down embedding service...")
    await http_client.aclose()
    print("Shutdown complete.")


app = FastAPI(
    title="CVisionary Embedding Service",
    version="1.2.0-mongo",
    lifespan=lifespan
)

async def get_http_client() -> httpx.AsyncClient:
    return http_client


@app.post(
    "/index/profile/{user_id}", response_model=IndexProfileResponse, tags=["Indexing"]
)
async def index_user_profile(
    user_id: str, client: httpx.AsyncClient = Depends(get_http_client)
):
    try:
        delete_user_chunks(user_id, namespace="profile")
        response = await client.get(f"http://localhost:5000/profile/{user_id}")
        response.raise_for_status()

        profile_data = response.json()
        text_fields = extract_text_fields(profile_data)

        total_chunks = 0
        for source_type, source_id, text in text_fields:
            chunks = chunk_text(text)
            for chunk_text_content in chunks:
                chunk_id = str(uuid.uuid4())
                embedding_vector = embed_text(chunk_text_content)

                store_chunk(
                    chunk_id,
                    user_id,
                    "profile",
                    None,
                    source_type,
                    source_id,
                    chunk_text_content,
                    embedding_vector,
                )
                total_chunks += 1
        
        mark_user_indexed(user_id)
        return {"status": "success", "message": "Profile indexed successfully"}
        
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503, detail=f"Failed to fetch profile from backend: {str(e)}"
        )
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Backend service returned an error: {e.response.text}",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during indexing: {str(e)}")


@app.post(
    "/index/{user_id}/section", response_model=IndexSectionResponse, tags=["Indexing"]
)
async def index_resume_section(user_id: str, request: IndexSectionRequest) -> IndexSectionResponse:
    try:
        delete_chunks_by_section_id(user_id, request.section_id)

        chunks = chunk_text(request.text)
        new_chunk_ids = []
        for i, chunk_text_content in enumerate(chunks):
            chunk_id = str(uuid.uuid4())
            embedding_vector = embed_text(chunk_text_content)

            store_chunk(
                chunk_id=chunk_id,
                user_id=user_id,
                namespace="resume_sections",
                section_id=request.section_id,
                source_type="user_edited",
                source_id=str(i),
                text=chunk_text_content,
                embedding_vector=embedding_vector,
            )
            new_chunk_ids.append(chunk_id)

        mark_user_indexed(user_id)
        return {
            "status": "success",
            "section_id": request.section_id,
            "chunk_ids": new_chunk_ids
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error indexing section: {str(e)}")


@app.delete(
    "/index/{user_id}/section/{section_id}",
    response_model=DeleteSectionResponse,
    tags=["Indexing"],
)
async def delete_resume_section(user_id: str, section_id: str):
    try:
        deleted_count = delete_chunks_by_section_id(user_id, section_id)
        return DeleteSectionResponse(
            status=f"Deleted {deleted_count} chunks for section {section_id}.",
            section_id=section_id,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error deleting section: {str(e)}"
        )


@app.post("/retrieve/{user_id}", response_model=RetrieveResponse, tags=["Retrieval"])
async def retrieve_similar_chunks(user_id: str, request: RetrieveRequest) -> RetrieveResponse:
    try:
        last_indexed = get_user_index_status(user_id)
        if not last_indexed:
            raise HTTPException(
                status_code=404,
                detail="No indexed data found for user. Please index data first."
            )        
        if (datetime.now(pytz.utc) - last_indexed).days > 7:
            print(f"Warning: User {user_id}'s data was last indexed {last_indexed}")
        
        search_results = search_chunks_vector(
            user_id=user_id,
            namespace=request.index_namespace,
            query_vector=request.query_embedding,
            top_k=request.top_k,
            filter_by_section_ids=request.filter_by_section_ids
        )

        results = [ChunkItem(**res) for res in search_results]

        return RetrieveResponse(results=results)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during retrieval: {str(e)}")


@app.post("/embed", response_model=EmbedResponse, tags=["Utilities"])
async def embed_text_endpoint(request: EmbedRequest):
    try:
        embedding_vector = embed_text(request.text)
        return EmbedResponse(embedding=embedding_vector.tolist())
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error generating embedding: {str(e)}"
        )


@app.get("/health", tags=["Utilities"])
async def health_check():
    return {"status": "healthy", "service": "embedding_service", "backend": "mongodb"}