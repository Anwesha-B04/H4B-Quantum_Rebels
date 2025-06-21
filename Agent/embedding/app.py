# --- START OF FILE app.py ---
from fastapi import FastAPI, HTTPException, Depends
from contextlib import asynccontextmanager
import httpx
from datetime import datetime
import pytz
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

async def get_http_client() -> httpx.AsyncClient:
    return http_client

@app.post(
    "/testing/create_profile",
    response_model=schemas.IndexProfileResponse,
    tags=["Testing"],
    status_code=201,
)
async def create_test_profile(profile: schemas.CreateProfileRequest):
    """
    Create a test user profile in the database.
    
    This is a testing endpoint to create sample profiles for development.
    In production, profiles should be created through the main application.
    """
    from bson import ObjectId
    
    # Generate a new ObjectId
    user_id = str(ObjectId())
    
    # Convert the profile to a dictionary and add metadata
    profile_data = profile.dict()
    profile_data["_id"] = user_id
    profile_data["created_at"] = datetime.utcnow()
    profile_data["updated_at"] = datetime.utcnow()
    
    success = db.create_or_update_profile(profile_data)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to create profile")
    
    return {"status": "success", "message": f"Test profile created with ID: {user_id}"}

@app.post(
    "/index/profile/{user_id}", response_model=schemas.IndexProfileResponse, tags=["Indexing"]
)
async def index_user_profile(user_id: str):
    """
    Triggers the indexing of a user's profile, reading data directly from the database.
    This endpoint should be called by the MERN backend after it saves a profile.
    """
    try:
        total_chunks = await services.index_profile_from_db(user_id)
        return {"status": "success", "message": f"Profile indexed successfully into {total_chunks} chunks."}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during indexing: {e}")

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

@app.post("/retrieve/{user_id}", response_model=schemas.RetrieveResponse, tags=["Retrieval"])
async def retrieve_similar_chunks(user_id: str, request: schemas.RetrieveRequest):
    try:
        last_indexed = db.get_user_index_status(user_id)
        if not last_indexed:
            raise HTTPException(
                status_code=404,
                detail="No indexed data found for user. Please index data first."
            )
        if (datetime.now(pytz.utc) - last_indexed).days > 7:
            print(f"Warning: User {user_id}'s data was last indexed {last_indexed}")
        
        search_results = db.search_chunks_vector(
            user_id=user_id,
            namespace=request.index_namespace,
            query_vector=request.query_embedding,
            top_k=request.top_k,
            filter_by_section_ids=request.filter_by_section_ids
        )
        results = [schemas.ChunkItem(**res) for res in search_results]
        return schemas.RetrieveResponse(results=results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during retrieval: {e}")

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