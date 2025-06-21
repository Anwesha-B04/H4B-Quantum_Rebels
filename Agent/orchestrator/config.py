import os
from dotenv import load_dotenv

load_dotenv()

# Service Configuration
PORT = int(os.getenv("PORT", 8005))
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

# Downstream Service URLs
GENERATOR_SERVICE_URL = os.getenv("GENERATOR_SERVICE_URL")
if not GENERATOR_SERVICE_URL:
    raise ValueError("GENERATOR_SERVICE_URL environment variable is not set.")

SCORING_SERVICE_URL = os.getenv("SCORING_SERVICE_URL")
if not SCORING_SERVICE_URL:
    raise ValueError("SCORING_SERVICE_URL environment variable is not set.")

# Agent Configuration
AGENT_TARGET_SCORE = float(os.getenv("AGENT_TARGET_SCORE", 0.88))
AGENT_MAX_REFINEMENTS = int(os.getenv("AGENT_MAX_REFINEMENTS", 2))