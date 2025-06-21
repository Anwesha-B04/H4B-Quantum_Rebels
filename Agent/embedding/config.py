import os
from dotenv import load_dotenv

load_dotenv()
APP_NAME = "CVisionary Embedding Service"
APP_VERSION = "1.3.0-refactored"

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise ValueError("MONGO_URI environment variable not set.")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "test")

MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDING_DIM = 384