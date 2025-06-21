# --- START OF FILE chunking.py ---
import nltk
from typing import List, Tuple

try:
    nltk.data.find("tokenizers/punkt")
except LookupError:
    nltk.download("punkt")

def chunk_text(text: str, max_words: int = 150) -> List[str]:
    if not text or not text.strip():
        return []

    sentences = nltk.sent_tokenize(text)
    chunks = []
    current_chunk = []
    current_word_count = 0

    for sentence in sentences:
        words = len(sentence.split())
        if current_word_count + words > max_words and current_chunk:
            chunks.append(' '.join(current_chunk))
            current_chunk = [sentence]
            current_word_count = words
        else:
            current_chunk.append(sentence)
            current_word_count += words
    if current_chunk:
        chunks.append(' '.join(current_chunk))
    return chunks

def extract_text_fields(profile_data: dict) -> List[Tuple[str, str, str]]:
    text_fields = []
    
    if 'experience' in profile_data:
        for i, exp in enumerate(profile_data.get('experience', [])):
            if exp and 'description' in exp and exp['description']:
                text_fields.append(('experience', str(i), exp['description']))
    
    if 'projects' in profile_data:
        for i, project in enumerate(profile_data.get('projects', [])):
            if project and 'description' in project and project['description']:
                text_fields.append(('project', str(i), project['description']))
    
    if 'skills' in profile_data and profile_data['skills']:
        skills_text = ', '.join(str(skill) for skill in profile_data['skills']) if isinstance(profile_data['skills'], list) else str(profile_data['skills'])
        if skills_text:
            text_fields.append(('skills', '0', skills_text))
    
    if 'certifications' in profile_data:
        for i, cert in enumerate(profile_data.get('certifications', [])):
            if not cert: continue
            cert_text = []
            if 'name' in cert: cert_text.append(cert['name'])
            if 'issuer' in cert: cert_text.append(f"issued by {cert['issuer']}")
            if 'date' in cert: cert_text.append(f"on {cert['date']}")
            if cert_text: text_fields.append(('certification', str(i), ', '.join(cert_text)))
    
    if 'education' in profile_data:
        for i, edu in enumerate(profile_data.get('education', [])):
            if not edu: continue
            edu_text = []
            if 'degree' in edu: edu_text.append(edu['degree'])
            if 'field' in edu: edu_text.append(f"in {edu['field']}")
            if 'institution' in edu: edu_text.append(f"at {edu['institution']}")
            if 'description' in edu and edu['description']: edu_text.append(edu['description'])
            if edu_text: text_fields.append(('education', str(i), ' '.join(filter(None, edu_text))))
    
    for key in ['summary', 'bio', 'objective', 'interests', 'awards', 'headline']:
        if key in profile_data and profile_data[key]:
            text_fields.append((key, '0', str(profile_data[key])))
    
    return text_fields