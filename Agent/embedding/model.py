from sentence_transformers import SentenceTransformer
import numpy as np
from typing import Optional

_model: Optional[SentenceTransformer] = None

def load_model(model_name: str = "all-MiniLM-L6-v2") -> SentenceTransformer:
    global _model
    if _model is None:
        print(f"Loading sentence transformer model: {model_name}")
        _model = SentenceTransformer(model_name)
    return _model

def embed_text(text: str) -> np.ndarray:
    if _model is None:
        raise RuntimeError("Model has not been loaded. Call load_model() on application startup.")

    embedding = _model.encode(text, convert_to_numpy=True)
    embedding = embedding.astype(np.float32)
    norm = np.linalg.norm(embedding)
    if norm > 0:
        embedding /= norm
    return embedding