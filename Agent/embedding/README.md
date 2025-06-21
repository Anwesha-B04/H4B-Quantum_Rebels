# CVisionary Embedding Service

A high-performance embedding service for processing, embedding, and searching profile data using sentence transformers and MongoDB Atlas. This service provides robust text processing, embedding generation, and vector search capabilities.

## Features

- **Text Processing**: Advanced chunking and field extraction from profile data using NLTK
- **High-Quality Embeddings**: Utilizes the `all-MiniLM-L6-v2` sentence transformer model (384-dimensional embeddings)
- **Efficient Vector Search**: MongoDB Atlas-based vector search with optimized indexing
- **RESTful API**: Simple and well-documented endpoints for all operations
- **Modular Architecture**: Clean separation of concerns with dedicated modules for model, database, and API

## System Architecture

```
embedding/
├── app.py           # FastAPI application and endpoint definitions
├── chunking.py      # Text processing and chunking logic
├── config.py        # Configuration and environment variables
├── db.py            # MongoDB operations and vector search
├── model.py         # Sentence transformer model handling
└── README.md        # This documentation
```

## Prerequisites

- Python 3.8+
- MongoDB Atlas (or local MongoDB instance with replica set)
- NLTK data (automatically downloaded on first run)
- Required Python packages (see `requirements.txt`)

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd embedding
   ```

2. **Create and activate a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   Create a `.env` file in the project root:
   ```env
   MONGO_URI="your_mongodb_atlas_connection_string"
   MONGO_DB_NAME="cvisionary"  # or your preferred database name
   ```

5. **Download NLTK data** (handled automatically on first run)
   ```python
   import nltk
   nltk.download('punkt')
   nltk.download('punkt_tab')
   ```

## API Endpoints

### Indexing

- **`POST /index/profile/{user_id}`**  
  Index a user's profile data from the database.
  
- **`POST /index/{user_id}/section`**  
  Index a single section of text (e.g., from a resume editor).
  
- **`DELETE /index/{user_id}/section/{section_id}`**  
  Delete all chunks associated with a specific section.

### Retrieval

- **`POST /retrieve/{user_id}`**  
  Search for chunks similar to the provided query.

### Utilities

- **`POST /embed`**  
  Generate an embedding for the provided text.
  
- **`GET /health`**  
  Health check endpoint.

### Testing

- **`POST /testing/create_profile`**  
  Create a test profile (for development and testing purposes).

## Configuration

The service can be configured using the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | Required |
| `MONGO_DB_NAME` | Database name | `cvisionary` |
| `MODEL_NAME` | Sentence transformer model name | `all-MiniLM-L6-v2` |
| `EMBEDDING_DIM` | Dimensionality of embeddings | `384` |

## Running the Service

To start the service in development mode with auto-reload:

```bash
uvicorn embedding.app:app --reload
```

For production, consider using a production ASGI server like Gunicorn:

```bash
gunicorn -w 4 -k uvicorn.workers.UvicornWorker embedding.app:app
```

The API will be available at `http://localhost:8000` with interactive documentation at `http://localhost:8000/docs`.

## Error Handling

The service includes comprehensive error handling and logging. Check the logs for detailed error messages if you encounter any issues.

## Dependencies

- FastAPI
- Sentence Transformers
- PyMongo
- NLTK
- Python-dotenv
- Numpy

## License

[Your License Here]

## Support

For support, please contact [Your Support Email] or open an issue in the repository.