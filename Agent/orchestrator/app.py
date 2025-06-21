# orchestrator/app.py
from dotenv import load_dotenv
load_dotenv()

import os
import traceback
from contextlib import asynccontextmanager
import httpx
from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware

from .schemas import ChatRequest, ChatResponse, HealthResponse
from .agent import create_agent_executor
from .tools import ToolBox
from .memory import get_session_context, initialize_session_context, get_session_history

http_client: httpx.AsyncClient = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global http_client
    http_client = httpx.AsyncClient(timeout=90.0)
    yield
    await http_client.aclose()

app = FastAPI(title="Orchestrator Agent Service", version="1.3.0-final", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def get_http_client() -> httpx.AsyncClient:
    return http_client

@app.post("/v1/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest, client: httpx.AsyncClient = Depends(get_http_client)) -> ChatResponse:
    try:
        session_context = get_session_context(request.session_id)
        if not session_context:
            if not request.user_id or not request.job_description:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, "For a new session, `user_id` and `job_description` are required.")
            session_context = initialize_session_context(request.session_id, request.user_id, request.job_description)

        toolbox = ToolBox(client=client, session_id=request.session_id)
        agent_executor = create_agent_executor(toolbox, request.session_id)
        
        agent_input = {
            "input": request.user_message,
            "user_id": session_context["user_id"],
            "job_description": session_context["job_description"]
        }
        
        response = await agent_executor.ainvoke(agent_input)
        
        agent_response = response.get("output", "I'm sorry, I couldn't process your request.")
        
        # --- FIX: Manually save the conversation turn to Redis history ---
        chat_history = get_session_history(request.session_id)
        chat_history.add_user_message(request.user_message)
        chat_history.add_ai_message(agent_response)
        
        final_context = get_session_context(request.session_id)
        
        return ChatResponse(
            agent_response=agent_response,
            session_id=request.session_id,
            resume_state=final_context.get("resume_state", {})
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Agent execution error: {e}")

@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    import redis
    try:
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        r = redis.from_url(redis_url)
        r.ping()
        return HealthResponse(status="healthy", service="orchestrator-service", redis_connected=True)
    except Exception:
        return HealthResponse(status="unhealthy", service="orchestrator-service", redis_connected=False)