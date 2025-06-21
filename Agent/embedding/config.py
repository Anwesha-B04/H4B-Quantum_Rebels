# --- START OF FILE config.py ---
import os
from dotenv import load_dotenv

load_dotenv()

# --- General ---
APP_NAME = "CVisionary Embedding Service"
APP_VERSION = "1.3.0-refactored"

# --- MongoDB ---
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise ValueError("MONGO_URI environment variable not set.")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "cvisionary")

# --- Model ---
# Using a specific model for consistency
MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDING_DIM = 384  # Dimension for all-MiniLM-L6-v2