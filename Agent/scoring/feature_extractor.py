import logging
import json
from typing import List
import httpx
from jinja2 import Template

from .llm_client import invoke_gemini, LLMError

logger = logging.getLogger(__name__)

KEYWORD_EXTRACTION_TEMPLATE = Template("""
You are an expert ATS (Applicant Tracking System) parser. Your sole task is to analyze the following job description and extract the most critical hard skills, technologies, programming languages, and frameworks.

**JOB DESCRIPTION:**
{{ job_description }}

**INSTRUCTIONS:**
1.  Identify only the essential hard skills. Ignore soft skills like "team player" or "good communication".
2.  Prioritize specific technologies (e.g., "React", "AWS S3", "Kubernetes", "FastAPI") and programming languages (e.g., "Python", "Java").
3.  Return your response as a single, raw, valid JSON object containing a single key "skills", which is a list of strings.
4.  Do not include any text, explanation, or markdown formatting before or after the JSON object.

**Example Output:**
{
  "skills": ["Python", "FastAPI", "AWS", "Docker", "Kubernetes", "PostgreSQL", "Terraform"]
}
""")

async def extract_required_keywords(client: httpx.AsyncClient, job_description: str) -> List[str]:
    if not job_description:
        return []
    
    prompt = KEYWORD_EXTRACTION_TEMPLATE.render(job_description=job_description)
    
    try:
        response_text = await invoke_gemini(client, prompt)
        data = json.loads(response_text)
        skills = data.get("skills", [])
        
        if isinstance(skills, list):
            logger.info(f"Extracted {len(skills)} keywords from job description.")
            return sorted(list(set(skills)))
        else:
            logger.warning("LLM returned 'skills' but it was not a list.")
            return []

    except (json.JSONDecodeError, LLMError) as e:
        logger.error(f"Failed to extract keywords via LLM: {e}")
        return []

def identify_missing_keywords(required_keywords: List[str], resume_text: str) -> List[str]:
    if not required_keywords:
        return []
    if not resume_text:
        return required_keywords
        
    resume_lower = resume_text.lower()
    missing = [
        skill for skill in required_keywords 
        if skill.lower() not in resume_lower
    ]
    return missing