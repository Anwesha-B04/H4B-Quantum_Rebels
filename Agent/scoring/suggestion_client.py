import logging
import json
from typing import List
import httpx
from jinja2 import Template

from .llm_client import invoke_gemini, LLMError

logger = logging.getLogger(__name__)

SUGGESTION_TEMPLATE = Template("""
You are a helpful and concise career coach. A candidate's resume is missing the following important skills required by a job description: {{ skills_list }}.

**TASK:**
Provide three concise, actionable suggestions on how the candidate could better showcase these skills on their resume. Frame the suggestions as direct advice.

**INSTRUCTIONS:**
1.  Focus only on the provided skills.
2.  Each suggestion must be a complete sentence.
3.  Return your response as a single, raw, valid JSON object with a single key "suggestions", which is a list of three strings.
4.  Do not include any text, explanation, or markdown formatting before or after the JSON object.
""")

async def generate_suggestions(client: httpx.AsyncClient, missing_keywords: List[str]) -> List[str]:
    if not missing_keywords:
        return []
        
    prompt = SUGGESTION_TEMPLATE.render(skills_list=", ".join(missing_keywords[:5]))
    
    try:
        response_text = await invoke_gemini(client, prompt)
        data = json.loads(response_text)
        suggestions = data.get("suggestions", [])
        
        if isinstance(suggestions, list):
            return suggestions[:3]
        return []

    except (json.JSONDecodeError, LLMError) as e:
        logger.error(f"Failed to generate suggestions via LLM: {e}")
        return []