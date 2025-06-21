import logging
from contextlib import asynccontextmanager
import httpx
from fastapi import FastAPI, Depends, HTTPException, status

from . import config
from .agent import ResumeAgent
from .schemas import AgentRequest, AgentResponse

# Configure logging
logging.basicConfig(level=config.LOG_LEVEL, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Application state
app_state = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles startup and shutdown events."""
    logger.info("Starting up Orchestrator Service...")
    app_state["http_client"] = httpx.AsyncClient()
    logger.info("Orchestrator Service started successfully.")
    yield
    logger.info("Shutting down Orchestrator Service...")
    await app_state["http_client"].aclose()
    logger.info("Orchestrator Service shut down.")

app = FastAPI(
    title="CVisionary Agentic Orchestrator",
    description="An agent that uses other CVisionary services to generate and refine resumes.",
    version="1.0.0",
    lifespan=lifespan
)

def get_http_client() -> httpx.AsyncClient:
    return app_state["http_client"]

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "orchestrator-service"}

@app.post("/agent/generate-and-refine", response_model=AgentResponse)
async def generate_and_refine_resume(
    request: AgentRequest,
    client: httpx.AsyncClient = Depends(get_http_client)
):
    """
    Triggers the full agentic process to generate and iteratively refine a resume.
    """
    target_score = request.target_score or config.AGENT_TARGET_SCORE
    max_refinements = request.max_refinements if request.max_refinements is not None else config.AGENT_MAX_REFINEMENTS
    
    agent = ResumeAgent(
        client=client,
        user_id=request.user_id,
        job_description=request.job_description,
        target_score=target_score,
        max_refinements=max_refinements
    )
    
    try:
        await agent.run()
    except httpx.HTTPError as e:
        logger.error(f"A downstream service failed during agent execution: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"A downstream service is unavailable or returned an error: {e}"
        )
    except Exception as e:
        logger.error(f"An unexpected error occurred in the agent loop: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An internal error occurred in the agent: {e}"
        )

    return AgentResponse(
        status=agent.status,
        final_resume=agent.final_resume_json,
        final_score=agent.final_score,
        refinement_history=agent.refinement_history
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=config.PORT)