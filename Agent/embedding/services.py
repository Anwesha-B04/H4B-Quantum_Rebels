import uuid
from typing import List, Optional
import numpy as np

from . import db, chunking, model

async def process_and_store_text_chunks(
    user_id: str,
    namespace: str,
    text_items: List[tuple[str, str, str]],
    section_id: Optional[str] = None,
) -> List[str]:
    all_chunk_ids = []
    for source_type, source_id, text in text_items:
        chunks = chunking.chunk_text(text)
        if not chunks:
            continue

        embeddings = model.embed_text(chunks)
        
        for i, chunk_text in enumerate(chunks):
            chunk_id = str(uuid.uuid4())
            embedding_vector = embeddings[i]

            chunk_section_id = section_id if section_id is not None else source_type

            db.store_chunk(
                chunk_id=chunk_id,
                user_id=user_id,
                namespace=namespace,
                section_id=chunk_section_id,
                source_type=source_type,
                source_id=f"{source_id}_{i}",
                text=chunk_text,
                embedding_vector=embedding_vector,
            )
            all_chunk_ids.append(chunk_id)
            
    db.mark_user_indexed(user_id)
    return all_chunk_ids

async def index_profile_from_db(user_id: str) -> int:
    db.delete_user_chunks(user_id, namespace="profile")
    profile_data = db.get_profile_by_id(user_id)
    if not profile_data:
        raise ValueError(f"Profile with user_id '{user_id}' not found in the database.")

    text_fields = chunking.extract_text_fields(profile_data)
    if not text_fields:
        db.mark_user_indexed(user_id)
        return 0
    chunk_ids = await process_and_store_text_chunks(
        user_id=user_id,
        namespace="profile",
        text_items=text_fields
    )
    
    return len(chunk_ids)

async def index_resume_section(user_id: str, section_id: str, text: str) -> List[str]:
    db.delete_chunks_by_section_id(user_id, section_id)
    text_item = [("user_edited", section_id, text)]
    chunk_ids = await process_and_store_text_chunks(
        user_id=user_id,
        namespace="resume_sections",
        text_items=text_item,
        section_id=section_id
    )
    return chunk_ids