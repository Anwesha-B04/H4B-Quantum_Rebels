# orchestrator/tools.py

import json
import os
from typing import Optional, List
import httpx
from langchain.tools import tool
from pydantic import ValidationError

from .memory import get_session_context, update_session_context
from .schemas import RetrieveResponse, GenerateResponse, ScoreResponse, SuggestionResponse, ChunkItem

# --- FIX: Updated default URLs to match the correct service ports ---
SCORING_SERVICE_URL = os.getenv("SCORING_SERVICE_URL", "http://localhost:8004")
RETRIEVAL_SERVICE_URL = os.getenv("RETRIEVAL_SERVICE_URL", "http://localhost:8002")
GENERATION_SERVICE_URL = os.getenv("GENERATION_SERVICE_URL", "http://localhost:8003") # Corrected from 8000

def format_context_for_prompt(chunks: List[ChunkItem]) -> str:
    """Formats retrieved chunks into a human-readable context string."""
    if not chunks:
        return "No relevant context was found from the user's profile."
    formatted_strings = [f"- From {c.index_namespace} ({c.source_type}): {c.text.strip()}" for c in chunks]
    return "\n".join(formatted_strings)

class ToolBox:
    """A container for agent tools that shares the HTTP client and session_id."""
    def __init__(self, client: httpx.AsyncClient, session_id: str):
        self.http_client = client
        self.session_id = session_id
        
        self.create_and_score_full_resume_tool = tool(self._create_and_score_full_resume)
        self.get_improvement_suggestions_tool = tool(self._get_improvement_suggestions_tool)
        self.score_resume_text_tool = tool(self._score_resume_text_tool)

    async def _create_and_score_full_resume(self) -> str:
        """
        Use this tool as the very first step when a user asks to create a new resume from scratch.
        This single tool handles the entire process: retrieving context, generating the full resume,
        saving it, scoring it, and returning a summary of the result.
        """
        # --- FIX: The tool now correctly gets its context from Redis ---
        context_data = get_session_context(self.session_id)
        if not context_data: return "Error: Session not found. Cannot create resume."

        try:
            gen_endpoint = f"{GENERATION_SERVICE_URL.rstrip('/')}/generate/full"
            gen_payload = {"user_id": context_data["user_id"], "job_description": context_data["job_description"]}
            gen_response = await self.http_client.post(gen_endpoint, json=gen_payload, timeout=90.0)
            gen_response.raise_for_status()
            generated_json_text = GenerateResponse(**gen_response.json()).generated_text
            generated_content = json.loads(generated_json_text)
        except Exception as e:
            return f"Error: Failed during resume generation step. Details: {e}"

        context_data["resume_state"].update(generated_content)
        update_session_context(self.session_id, context_data)
        
        full_resume_text = self._get_full_resume_text_from_state(context_data["resume_state"])
        if "Error" in full_resume_text:
            return "Error: Could not format the newly generated resume for scoring."

        try:
            score_endpoint = f"{SCORING_SERVICE_URL.rstrip('/')}/score"
            score_payload = {"job_description": context_data["job_description"], "resume_text": full_resume_text}
            score_response = await self.http_client.post(score_endpoint, json=score_payload, timeout=45.0)
            score_response.raise_for_status()
            score_data = ScoreResponse(**score_response.json())
        except Exception as e:
            return f"Error: Generated the resume but failed during the scoring step. Details: {e}"

        return (
            f"Successfully generated and scored the new resume. "
            f"Final Score: {score_data.final_score:.2f}. "
            f"Missing Keywords: {score_data.missing_keywords or 'None'}. "
            f"The resume has been saved to your session."
        )

    # ... (rest of the tools file remains the same) ...
    async def _score_resume_text_tool(self, resume_text: str) -> str:
        """Use this tool to explicitly re-score a resume's text if the user provides new text or asks for a re-evaluation."""
        context = get_session_context(self.session_id)
        if not context: return "Error: Session not found."
        endpoint = f"{SCORING_SERVICE_URL.rstrip('/')}/score"
        payload = {"job_description": context["job_description"], "resume_text": resume_text}
        try:
            response = await self.http_client.post(endpoint, json=payload)
            response.raise_for_status()
            score_data = ScoreResponse(**response.json())
            return f"Scoring Result: Final Score = {score_data.final_score:.2f}, Missing Keywords = {score_data.missing_keywords}"
        except Exception as e: return f"Error scoring text: {e}"

    async def _get_improvement_suggestions_tool(self, missing_keywords: List[str]) -> str:
        """Use this tool to get actionable suggestions for improvement based on a list of missing keywords, usually after a resume has been scored."""
        if not missing_keywords: return "No missing keywords provided, so no suggestions can be generated."
        endpoint = f"{SCORING_SERVICE_URL.rstrip('/')}/suggest"
        payload = {"missing_keywords": missing_keywords}
        try:
            response = await self.http_client.post(endpoint, json=payload)
            response.raise_for_status()
            suggestions = SuggestionResponse(**response.json()).suggestions
            if not suggestions: return "No specific suggestions were generated."
            return "Here are some suggestions for improvement:\n- " + "\n- ".join(suggestions)
        except Exception as e: return f"Error getting suggestions: {e}"

    def _get_full_resume_text_from_state(self, resume_state: dict) -> str:
        """Helper to format the resume state into a single string."""
        if not resume_state:
            return "Error: Resume is currently empty."
        
        text_parts = []
        for section, content in resume_state.items():
            text_parts.append(f"--- {section.upper()} ---")
            if isinstance(content, list):
                for item in content:
                    if isinstance(item, dict): text_parts.append(json.dumps(item))
                    else: text_parts.append(str(item))
            elif isinstance(content, dict):
                 text_parts.append(json.dumps(content))
            else:
                text_parts.append(str(content))
            text_parts.append("")
        
        return "\n".join(text_parts).strip()