# --- START OF FILE chunking.py ---
import nltk
import logging
from typing import List, Tuple

# Configure logging
logger = logging.getLogger(__name__)

def _download_nltk_data():
    """Download required NLTK data if not already present."""
    required_data = ["punkt", "punkt_tab"]
    
    for data in required_data:
        try:
            nltk.data.find(f"tokenizers/{data}")
            logger.info(f"NLTK {data} tokenizer found")
        except LookupError:
            logger.info(f"Downloading NLTK {data} tokenizer...")
            try:
                nltk.download(data, quiet=True)
                logger.info(f"Successfully downloaded NLTK {data} tokenizer")
            except Exception as e:
                logger.error(f"Failed to download NLTK {data} tokenizer: {e}")
                # Try alternative download method
                try:
                    import ssl
                    import urllib.request
                    import shutil
                    
                    # Create nltk_data directory if it doesn't exist
                    nltk_dir = os.path.join(os.path.expanduser('~'), 'nltk_data')
                    os.makedirs(nltk_dir, exist_ok=True)
                    
                    # Download punkt data
                    url = f"https://raw.githubusercontent.com/nltk/nltk_data/gh-pages/packages/tokenizers/{data}.zip"
                    target_path = os.path.join(nltk_dir, f"{data}.zip")
                    
                    # Handle SSL certificate verification
                    ssl._create_default_https_context = ssl._create_unverified_context
                    
                    with urllib.request.urlopen(url) as response, open(target_path, 'wb') as out_file:
                        shutil.copyfileobj(response, out_file)
                    
                    # Extract the zip file
                    import zipfile
                    with zipfile.ZipFile(target_path, 'r') as zip_ref:
                        zip_ref.extractall(nltk_dir)
                    
                    logger.info(f"Successfully downloaded and extracted {data} from GitHub")
                except Exception as e2:
                    logger.error(f"Alternative download method also failed: {e2}")
                    raise

# Ensure required NLTK data is downloaded when module is imported
_download_nltk_data()

def chunk_text(text: str, max_words: int = 150) -> List[str]:
    """
    Split text into chunks of sentences, where each chunk has at most max_words.
    
    Args:
        text: The input text to chunk
        max_words: Maximum number of words per chunk
        
    Returns:
        List of text chunks
    """
    if not text or not text.strip():
        return []

    try:
        sentences = nltk.sent_tokenize(text)
    except LookupError:
        # If punkt isn't found, try downloading it again
        _download_nltk_data()
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