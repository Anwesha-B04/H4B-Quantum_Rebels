import logging
import json
from typing import List, Dict, Any, Optional

import httpx

from . import clients, config
from .schemas import RefinementStep

logger = logging.getLogger(__name__)

class ResumeAgent:
    """An agent that generates and iteratively refines a resume to meet a target score."""

    def __init__(
        self,
        client: httpx.AsyncClient,
        user_id: str,
        job_description: str,
        target_score: float,
        max_refinements: int,
    ):
        self.client = client
        self.user_id = user_id
        self.original_job_description = job_description
        self.current_job_description = job_description
        self.target_score = target_score
        self.max_refinements = max_refinements
        
        self.final_resume_json: Dict[str, Any] = {}
        self.final_score: float = 0.0
        self.refinement_history: List[RefinementStep] = []
        self.status: str = "Initialized"

    async def run(self):
        """Executes the main agentic loop."""
        logger.info(f"Agent starting for user {self.user_id}. Target score: {self.target_score}, Max refinements: {self.max_refinements}")

        # --- Step 1: Initial Generation ---
        logger.info("Phase 1: Initial resume generation.")
        generated_text = await self._generate_resume()
        
        # --- Step 2: Initial Scoring and Evaluation ---
        logger.info("Phase 2: Initial scoring and evaluation.")
        score_data = await self._score_resume(generated_text)
        self.final_score = score_data.final_score
        self.final_resume_json = json.loads(generated_text)
        
        self._log_attempt(
            attempt=0,
            reasoning="Initial draft generation.",
            score_data=score_data,
        )

        # --- Step 3: Refinement Loop ---
        for i in range(self.max_refinements):
            if self.final_score >= self.target_score:
                self.status = f"Completed: Target score of {self.target_score} met or exceeded."
                logger.info(self.status)
                return

            logger.info(f"Phase 3.{i+1}: Entering refinement loop. Current score {self.final_score} is below target {self.target_score}.")

            # Plan the refinement
            reason, refined_job_desc = self._plan_refinement(score_data.missing_keywords)
            self.current_job_description = refined_job_desc
            
            # Execute the refinement
            refined_text = await self._generate_resume()
            
            # Evaluate the refinement
            score_data = await self._score_resume(refined_text)

            # Decide whether to keep the new version
            if score_data.final_score > self.final_score:
                logger.info(f"Refinement successful. Score improved from {self.final_score:.3f} to {score_data.final_score:.3f}.")
                self.final_resume_json = json.loads(refined_text)
                self.final_score = score_data.final_score
            else:
                logger.warning(f"Refinement did not improve score. Keeping previous version. (New: {score_data.final_score:.3f}, Old: {self.final_score:.3f})")

            self._log_attempt(
                attempt=i + 1,
                reasoning=reason,
                score_data=score_data,
            )

        # --- Step 4: Final Status ---
        if self.final_score >= self.target_score:
            self.status = f"Completed: Target score of {self.target_score} met in final attempt."
        else:
            self.status = f"Completed: Maximum refinements ({self.max_refinements}) reached. Final score {self.final_score:.3f} is below target {self.target_score}."
        
        logger.info(self.status)

    async def _generate_resume(self) -> str:
        """Calls the generator client and returns the generated text."""
        response = await clients.call_generator_service(
            self.client, self.user_id, self.current_job_description
        )
        return response.generated_text

    async def _score_resume(self, resume_text: str):
        """Calls the scoring client and returns the score data."""
        return await clients.call_scoring_service(
            self.client, self.original_job_description, resume_text
        )

    def _plan_refinement(self, missing_keywords: List[str]):
        """Creates a new prompt to guide the LLM for refinement."""
        reasoning = f"Refining based on low score. Key missing keywords: {', '.join(missing_keywords[:5])}."
        logger.info(f"Agent Reasoning: {reasoning}")

        # This is where the agent "thinks". It modifies its own instructions for the next call.
        refinement_instruction = (
            "This is a refinement attempt. The previous version was good but lacked focus. "
            f"Pay special attention to highlighting experience and skills related to these critical keywords: {', '.join(missing_keywords)}. "
            "Integrate them naturally into the summary, experience, and skills sections.\n\n"
            "--- Original Job Description ---\n"
        )
        
        refined_job_description = refinement_instruction + self.original_job_description
        return reasoning, refined_job_description

    def _log_attempt(self, attempt: int, reasoning: str, score_data):
        """Adds a step to the refinement history."""
        step = RefinementStep(
            attempt=attempt,
            reasoning=reasoning,
            final_score=score_data.final_score,
            semantic_score=score_data.semantic_score,
            keyword_score=score_data.keyword_score,
            missing_keywords=score_data.missing_keywords,
        )
        self.refinement_history.append(step)