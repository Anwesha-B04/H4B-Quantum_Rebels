# --- START OF FILE README.md ---
# Embedding Service

An on-demand service for processing, embedding, and searching profile data using sentence transformers and MongoDB Atlas.

## Features

- Text chunking and granular field extraction from profile data.
- High-quality sentence transformer embeddings with normalization.
- Efficient vector search using MongoDB Atlas.
- A simple, robust API for on-demand indexing and retrieval.

## Workflow

This service is designed to work in tandem with another backend (e.g., a MERN application).

1.  **Data Ingestion**: The MERN backend scrapes profile data and stores it in a designated `profiles` collection in MongoDB.
2.  **Indexing Trigger**: After successfully saving a profile, the MERN backend makes a `POST` request to this service's `/index/profile/{user_id}` endpoint.
3.  **Processing**: The embedding service fetches the profile data from the database, chunks it, generates embeddings, and stores them in the `chunks` collection, ready for searching.

## Setup

1.  Create a Python virtual environment and activate it.
2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Set up environment variables in a `.env` file. A `.env.example` should be provided.
    ```
    # .env
    MONGO_URI="your_mongodb_atlas_connection_string"
    MONGO_DB_NAME="cvisionary"
    ```
4.  Download NLTK data (only needs to be done once):
    ```python
    import nltk
    nltk.download('punkt')
    ```

## API Endpoints

-   `POST /index/profile/{user_id}`: **(Primary)** Triggers indexing for a user profile stored in the database.
-   `POST /index/{user_id}/section`: Indexes a single, manually provided text section (e.g., from a resume editor).
-   `DELETE /index/{user_id}/section/{section_id}`: Deletes the chunks associated with a specific section.
-   `POST /retrieve/{user_id}`: Searches for chunks similar to a query embedding.
-   `POST /embed`: A utility endpoint to generate an embedding for a given string.
-   `GET /health`: Health check endpoint.

## Running the Service

Use Uvicorn to run the FastAPI application:

```bash
uvicorn your_package_name.app:app --reload