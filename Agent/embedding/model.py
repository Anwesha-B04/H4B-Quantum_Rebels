from sentence_transformers import SentenceTransformer
import numpy as np
from typing import Optional, List, Union
import logging
from . import config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_model: Optional[SentenceTransformer] = None

def load_model(model_name: str = config.MODEL_NAME) -> SentenceTransformer:
    global _model
    if _model is None:
        try:
            logger.info(f"Loading sentence transformer model: {model_name}")
            _model = SentenceTransformer(model_name)
            _ = _model.encode("test", convert_to_numpy=True)
            logger.info("Model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            _model = None
            raise
    return _model

def _normalize_embeddings(embeddings: np.ndarray) -> np.ndarray:
    if len(embeddings.shape) == 1:
        norm = np.linalg.norm(embeddings)
        return embeddings / norm if norm > 0 else embeddings
    else:
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        return np.divide(embeddings, norms, where=(norms > 0))

def embed_text(text: Union[str, List[str]], batch_size: int = 32) -> np.ndarray:
    if _model is None:
        raise RuntimeError("Model has not been loaded. Call load_model() first.")
    
    if not text:
        return np.array([])
    
    try:
        is_single = isinstance(text, str)
        texts = [text] if is_single else text
        
        embeddings = _model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=False,
            convert_to_numpy=True,
            normalize_embeddings=False
        )
        
        embeddings = embeddings.astype(np.float32)
        embeddings = _normalize_embeddings(embeddings)
        
        return embeddings[0] if is_single else embeddings
        
    except Exception as e:
        logger.error(f"Error generating embeddings: {e}")
        raise