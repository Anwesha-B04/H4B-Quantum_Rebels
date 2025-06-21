
import json
import os
from typing import Optional, List
import httpx
from langchain.tools import tool
from fastapi import HTTPException, status

from .memory import get_session_context, update_session_context
from .schemas import RetrieveResponse, GenerateResponse, ScoreResponse, SuggestionResponse

SCORING_SERVICE_URL = os.getenv("SCORING_SERVICE_URL")
RETRIEVAL_SERVICE_URL = os.getenv("RETRIEVAL_SERVICE_URL")
GENERATION_SERVICE_URL = os.getenv("GENERATION_SERVICE_URL")

def _format_context_for_prompt(chunks: List) -> str:
    if not chunks: return "No relevant context was found from the user's profile."
    formatted_strings = [f"- {c.text.strip()} (Source: {c.source_type}, Score: {c.score:.2f})" for c in chunks]
    return "\n".join(formatted_strings)

class ToolBox:
    def __init__(self, client: httpx.AsyncClient, session_id: str):
        if not all([SCORING_SERVICE_URL, RETRIEVAL_SERVICE_URL, GENERATION_SERVICE_URL]):
            raise ValueError("One or more service URLs are not configured in environment variables.")
        self.http_client = client
        self.session_id = session_id
        
        self.retrieve_context_tool = tool(self._retrieve_context_tool)
        self.generate_text_tool = tool(self._generate_text_tool)
        self.get_current_resume_section_tool = tool(self._get_current_resume_section_tool)
        self.update_resume_in_memory_tool = tool(self._update_resume_in_memory_tool)
        self.score_resume_text_tool = tool(self._score_resume_text_tool)
        self.get_improvement_suggestions_tool = tool(self._get_improvement_suggestions_tool)
        self.get_full_resume_text_tool = tool(self._get_full_resume_text_tool)

    async def _call_service(self, method: str, url: str, **kwargs):
        try:
            response = await self.http_client.request(method, url, **kwargs)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            detail = e.response.json().get("detail", e.response.text)
            raise HTTPException(status_code=e.response.status_code, detail=f"Error from downstream service at {url}: {detail}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Could not connect to service at {url}: {e}")

    async def _retrieve_context_tool(self, section_id: Optional[str] = None) -> str:
        context = get_session_context(self.session_id)
        if not context: raise ValueError("Session not found.")
        
        endpoint = f"{RETRIEVAL_SERVICE_URL}/retrieve/{'section' if section_id else 'full'}"
        payload = {"user_id": context["user_id"], "job_description": context["job_description"]}
        if section_id: payload["section_id"] = section_id
        
        response_data = await self._call_service("POST", endpoint, json=payload)
        return _format_context_for_prompt(RetrieveResponse(**response_data).results)

    async def _generate_text_tool(self, section_id: Optional[str] = None, existing_text: Optional[str] = None, context: Optional[str] = None) -> str:
        session_context = get_session_context(self.session_id)
        if not session_context: raise ValueError("Session not found.")
        
        endpoint = f"{GENERATION_SERVICE_URL}/generate/{'section' if section_id else 'full'}"
        payload = {"user_id": session_context["user_id"], "job_description": session_context["job_description"]}
        if section_id: payload.update({"section_id": section_id, "existing_text": existing_text})
        
        response_data = await self._call_service("POST", endpoint, json=payload)
        return GenerateResponse(**response_data).generated_text

    def _get_current_resume_section_tool(self, section_id: str) -> str:
        context = get_session_context(self.session_id)
        if not context: raise ValueError("Session not found.")
        section_content = context.get("resume_state", {}).get(section_id)
        return json.dumps({section_id: section_content}) if section_content else f"Section '{section_id}' is currently empty."
    
    def _get_full_resume_text_tool(self) -> str:
        context = get_session_context(self.session_id)
        if not context or not context.get("resume_state"): raise ValueError("Resume is currently empty.")
        
        parts = [f"### {sec.upper()}\n{json.dumps(val, indent=2)}" for sec, val in context["resume_state"].items()]
        return "\n\n".join(parts)

    def _update_resume_in_memory_tool(self, new_content_json: str) -> str:
        context = get_session_context(self.session_id)
        if not context: raise ValueError("Session not found.")
        try:
            new_content = json.loads(new_content_json)
            context["resume_state"].update(new_content)
            update_session_context(self.session_id, context)
            return f"Success: Resume updated with sections: {', '.join(new_content.keys())}."
        except json.JSONDecodeError:
            raise ValueError("Invalid JSON provided in `new_content_json`.")

    async def _score_resume_text_tool(self, resume_text: str) -> str:
        context = get_session_context(self.session_id)
        if not context: raise ValueError("Session not found.")
        
        endpoint = f"{SCORING_SERVICE_URL}/score"
        payload = {"job_description": context["job_description"], "resume_text": resume_text}
        
        response_data = await self._call_service("POST", endpoint, json=payload)
        score_data = ScoreResponse(**response_data)
        return f"Scoring Result: Final Score = {score_data.final_score:.2f}, Missing Keywords = {score_data.missing_keywords}"

    async def _get_improvement_suggestions_tool(self, missing_keywords: List[str]) -> str:
        if not missing_keywords: return "No missing keywords to get suggestions for."
        
        endpoint = f"{SCORING_SERVICE_URL}/suggest"
        payload = {"missing_keywords": missing_keywords}
        
        response_data = await self._call_service("POST", endpoint, json=payload)
        suggestions = SuggestionResponse(**response_data).suggestions
        return "Here are some suggestions for improvement:\n- " + "\n- ".join(suggestions)