# CVisionary Embedding Service

This is the foundational data processing and retrieval engine for the CVisionary ecosystem. It is a high-performance FastAPI microservice responsible for chunking text, generating sentence embeddings, and managing the low-level storage and retrieval of vectors in MongoDB Atlas.

## Overview

The Embedding Service is a critical component that processes and indexes user profile data for semantic search. It handles:
- Text chunking and processing
- High-dimensional vector embeddings
- Efficient vector storage and retrieval
- Integration with MongoDB Atlas for vector search

## 🚀 Technology Stack

- **FastAPI** - High-performance, asynchronous web framework
- **Sentence Transformers** - For generating high-quality text embeddings
- **MongoDB Atlas** - Vector search capabilities for efficient similarity search
- **Pydantic** - Data validation and settings management
- **NLTK** - Natural language processing for text chunking

## 🏗️ Architecture & Core Concepts

This service is the lowest-level component in the stack, directly called by the `Retrieval Service` or backend processes for data ingestion.

```mermaid
graph TD
    Title["<strong>Embedding Service Flow</strong>"]
    style Title fill:#222,stroke:#333,stroke-width:2px,color:#fff

    subgraph "Clients"
        Client1["Admin/Backend Process"]
        Client2["Retrieval Service"]
    end
    
    subgraph "Embedding Service"
        Client1 -- "POST /index/profile/{user_id}" --> EmbeddingAPI["FastAPI Endpoints"]
        Client2 -- "POST /retrieve/{user_id}" --> EmbeddingAPI
        
        EmbeddingAPI -- "Processes data" --> Logic["Chunking, Embedding, DB Logic"]
        Logic -- "Stores/Retrieves Chunks & Vectors" --> MongoDB["MongoDB Atlas (chunks collection)"]
    end
```

### Key Components

1. **Text Processing Pipeline**
   - Ingests raw text from user profiles
   - Splits text into semantic chunks
   - Generates vector embeddings
   - Stores data in MongoDB with vector indexes

2. **Vector Search**
   - Implements cosine similarity search
   - Supports filtering by user and section
   - Optimized for high-performance retrieval

## 🚀 Getting Started

### Prerequisites

- Python 3.9 or later
- MongoDB Atlas M10 or higher cluster (M0 tier not supported for vector search)
- Git for version control

### Local Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd <repository-directory>/embedding
   ```

2. **Set up a virtual environment**
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Download NLTK data**
   ```bash
   python -c "import nltk; nltk.download('punkt')"
   ```

5. **Configure environment variables**
   Create a `.env` file with your MongoDB connection details:
   ```env
   MONGO_URI="mongodb+srv://username:password@your-cluster.mongodb.net/"
   MONGO_DB_NAME="cvisionary"
   ```

6. **Set up MongoDB Atlas Vector Search**
   - Go to your MongoDB Atlas dashboard
   - Navigate to your database and the `chunks` collection
   - Click on "Search" and create a new search index
   - Use the JSON editor to paste the following configuration:
     ```json
     {
       "fields": [
         {
           "type": "vector",
           "path": "embedding",
           "numDimensions": 384,
           "similarity": "cosine"
         },
         {"type": "filter", "path": "user_id"},
         {"type": "filter", "path": "index_namespace"},
         {"type": "filter", "path": "section_id"}
       ]
     }
     ```
   - Save the index and wait for it to become active

7. **Start the service**
   ```bash
   uvicorn embedding.app:app --host 0.0.0.0 --port 8000 --reload
   ```
   The service will be available at `http://localhost:8000`

## 📚 API Documentation

### Indexing Endpoints

#### 1. Index Full Profile
```http
POST /index/profile/{user_id}
```

Indexes a user's full profile from the database.

**Request:**
- `user_id`: The ID of the user to index

**Example:**
```bash
curl -X POST "http://localhost:8000/index/profile/user123"
```

**Response:**
```json
{
  "status": "success",
  "message": "Profile indexed successfully into 12 chunks."
}
```

#### 2. Index Resume Section
```http
POST /index/{user_id}/section
```

Indexes a specific section of a resume.

**Request Body:**
```json
{
  "section_id": "experience-1",
  "text": "Your section content here..."
}
```

**Example:**
```bash
curl -X POST "http://localhost:8000/index/user123/section" \
  -H "Content-Type: application/json" \
  -d '{"section_id": "exp-1", "text": "Developed machine learning models..."}'
```

### Retrieval Endpoint

#### Search Similar Chunks
```http
POST /retrieve/{user_id}
```

Finds chunks similar to the provided query embedding.

**Request Body:**
```json
{
  "query_embedding": [0.1, 0.2, ...],
  "top_k": 5,
  "index_namespace": "profile"
}
```

**Example:**
```bash
curl -X POST "http://localhost:8000/retrieve/user123" \
  -H "Content-Type: application/json" \
  -d '{"query_embedding": [0.1, 0.2, ...], "top_k": 5}'
```

### Utility Endpoints

#### Generate Embedding
```http
POST /embed
```

Generates an embedding for the provided text.

**Request Body:**
```json
{
  "text": "Text to embed"
}
```

#### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "service": "embedding"
}
```

## ⚠️ Error Handling

| Status Code | Description |
|-------------|-------------|
| 400 | Invalid request parameters |
| 404 | User or resource not found |
| 422 | Validation error |
| 500 | Internal server error |

Check the service logs for detailed error information.

## 📁 Project Structure

```
embedding/
├── .env                    # Environment variables
├── requirements.txt        # Python dependencies
└── embedding/              # Source code
    ├── __init__.py         # Package initialization
    ├── app.py              # FastAPI application and routes
    ├── chunking.py         # Text processing and chunking
    ├── config.py           # Configuration management
    ├── db.py               # Database operations
    ├── model.py            # Embedding model handling
    ├── schemas.py          # Request/response models
    └── services.py         # Business logic
```

## 🛠 Development

### Running Tests
```bash
pytest tests/
```

### Code Formatting
```bash
black .
```

### Linting
```bash
flake8 .
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.