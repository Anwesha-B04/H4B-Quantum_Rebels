# embedding/app.py

from fastapi import FastAPI, HTTPException, Depends
from contextlib import asynccontextmanager
import httpx
from datetime import datetime
import traceback
from dotenv import load_dotenv
load_dotenv()
from . import services, db, model, config, schemas

http_client: httpx.AsyncClient

@asynccontextmanager
async def lifespan(app: FastAPI):
    global http_client
    print(f"Starting up {config.APP_NAME} v{config.APP_VERSION}...")
    db.init_db()
    model.load_model()
    http_client = httpx.AsyncClient()
    print("Startup complete. Service is ready.")
    yield
    print("Shutting down...")
    await http_client.aclose()
    print("Shutdown complete.")

app = FastAPI(
    title=config.APP_NAME,
    version=config.APP_VERSION,
    lifespan=lifespan
)

@app.post(
    "/index/profile/{user_id}", response_model=schemas.IndexProfileResponse, tags=["Indexing"]
)
async def index_user_profile(user_id: str):
    """Manually triggers indexing for a user. The /retrieve endpoint now does this automatically if needed."""
    try:
        total_chunks = await services.index_profile_from_db(user_id)
        return {"status": "success", "message": f"Profile indexed successfully into {total_chunks} chunks."}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        tb_str = traceback.format_exc()
        raise HTTPException(status_code=500, detail=f"Error during indexing: {e}\n{tb_str}")

@app.post("/retrieve/{user_id}", response_model=schemas.RetrieveResponse, tags=["Retrieval"])
async def retrieve_similar_chunks(user_id: str, request: schemas.RetrieveRequest):
    """
    Retrieves chunks for a user. If the user has not been indexed yet,
    this endpoint will autonomously trigger the indexing process first.
    """
    try:
        last_indexed = db.get_user_index_status(user_id)
        
        if not last_indexed:
            print(f"User '{user_id}' not indexed. Triggering autonomous indexing...")
            try:
                await services.index_profile_from_db(user_id)
                print(f"Autonomous indexing for user '{user_id}' complete.")
            except ValueError as e:
                raise HTTPException(status_code=404, detail=f"Profile for user_id '{user_id}' not found in database for indexing.")

        search_results = db.search_chunks_vector(
            user_id=user_id,
            namespace=request.index_namespace,
            query_vector=request.query_embedding,
            top_k=request.top_k,
            filter_by_section_ids=request.filter_by_section_ids
        )
        
        results = [schemas.ChunkItem(**res) for res in search_results]
        return schemas.RetrieveResponse(results=results)

    except HTTPException:
        raise
    except Exception as e:
        tb_str = traceback.format_exc()
        raise HTTPException(status_code=500, detail=f"An internal error occurred during retrieval: {e}\n{tb_str}")

@app.post(
    "/index/{user_id}/section", response_model=schemas.IndexSectionResponse, tags=["Indexing"]
)
async def index_resume_section(user_id: str, request: schemas.IndexSectionRequest):
    try:
        new_chunk_ids = await services.index_resume_section(
            user_id, request.section_id, request.text
        )
        return {
            "status": "success",
            "section_id": request.section_id,
            "chunk_ids": new_chunk_ids
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error indexing section: {e}")

@app.delete(
    "/index/{user_id}/section/{section_id}",
    response_model=schemas.DeleteSectionResponse,
    tags=["Indexing"],
)
async def delete_resume_section(user_id: str, section_id: str):
    try:
        deleted_count = db.delete_chunks_by_section_id(user_id, section_id)
        return schemas.DeleteSectionResponse(
            status=f"Deleted {deleted_count} chunks for section {section_id}.",
            section_id=section_id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting section: {e}")

@app.post("/embed", response_model=schemas.EmbedResponse, tags=["Utilities"])
async def embed_text_endpoint(request: schemas.EmbedRequest):
    try:
        embedding_vector = model.embed_text(request.text)
        return schemas.EmbedResponse(embedding=embedding_vector.tolist())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating embedding: {e}")

@app.get("/health", tags=["Utilities"])
async def health_check():
    return {"status": "healthy", "service": config.APP_NAME, "backend": "mongodb"}