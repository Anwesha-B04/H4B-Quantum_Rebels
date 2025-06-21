Of course. It's essential that the foundational `Embedding Service` has a clear and comprehensive `README.md`. This document will explain its critical role, its API, and the specific setup steps required to get it running correctly, including the crucial MongoDB Atlas configuration.

Here is a detailed `README.md` file for the `Embedding Service`.

---

# CVisionary Embedding Service

This is the foundational data processing and retrieval engine for the CVisionary ecosystem. It is a high-performance FastAPI microservice responsible for chunking text, generating sentence embeddings, and managing the low-level storage and retrieval of vectors in a MongoDB Atlas database.

## 🚀 Technology Stack

The service is built on a powerful stack designed for machine learning and data-intensive applications:

-   **FastAPI** - High-performance, asynchronous web framework for building the API.
-   **Sentence Transformers** - State-of-the-art Python library for generating high-quality text embeddings.
-   **MongoDB Atlas Vector Search** - The core database technology for storing and efficiently searching high-dimensional vector data.
-   **Pydantic** - Robust data validation and API schemas.
-   **NLTK** - Used for intelligent sentence tokenization during the text chunking process.

## 🏗️ Architecture & Core Concepts

This service is the lowest-level component in the stack. It is directly called by the `Retrieval Service` or by backend processes for data ingestion. It has no knowledge of upstream services.

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

### 1. Text Chunking & Embedding

The service does not store entire documents for search. Instead, it implements a sophisticated chunking strategy:
1.  It ingests raw text from different sections of a user's profile (e.g., summary, experience).
2.  It uses NLTK to split the text into individual sentences.
3.  It groups these sentences into optimal "chunks" of around 150 words.
4.  Each chunk is then converted into a 384-dimensional vector (an "embedding") using a Sentence Transformer model. This vector numerically represents the semantic meaning of the chunk.

### 2. Vector Database & Search

The generated chunks and their corresponding vectors are stored in a `chunks` collection in MongoDB. This collection is powered by an **Atlas Vector Search Index**, which allows for incredibly fast and efficient similarity searches. When a query vector is provided, the index can find the chunks whose vectors are "closest" in semantic space, not just those with matching keywords.

### 3. On-Demand Indexing API

The primary workflow is on-demand. An external service (like a MERN backend) first saves the raw profile data to a `profiles` collection. It then calls this service's `POST /index/profile/{user_id}` endpoint. The Embedding Service then reads from the `profiles` collection, performs the chunking and embedding process, and populates the searchable `chunks` collection.

## 🚀 Getting Started

### Prerequisites

-   Python 3.9+
-   A **MongoDB Atlas M10 or higher cluster**. The free M0 tier **does not support** Atlas Vector Search.

### Local Setup

1.  **Clone the repository and navigate to the service directory:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>/embedding_service
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Download NLTK Data (CRITICAL STEP):**
    This is a one-time setup step required for text chunking.
    ```bash
    python -c "import nltk; nltk.download('punkt')"
    ```

5.  **Configure Environment Variables:**
    Create a `.env` file in the `embedding_service` directory.
    ```env
    # .env
    # REQUIRED: Your full connection string to an M10+ MongoDB Atlas cluster
    MONGO_URI="mongodb+srv://user:password@your-m10-cluster.mongodb.net/"

    # The name of the database to use
    MONGO_DB_NAME="cvisionary"
    ```

6.  **Create the Atlas Vector Search Index (CRITICAL STEP):**
    This index **must be created manually** via the MongoDB Atlas website. The application will not create it for you on compatible tiers.
    -   Navigate to your cluster -> Browse Collections -> `cvisionary` database -> `chunks` collection.
    -   Click the **Search** tab and create a new **Atlas Vector Search** index.
    -   Use the **JSON Editor** and paste the following exact configuration:
        ```json
        {
          "fields": [
            {
              "type": "vector",
              "path": "embedding",
              "numDimensions": 384,
              "similarity": "cosine"
            },
            {
              "type": "filter",
              "path": "user_id"
            },
            {
              "type": "filter",
              "path": "index_namespace"
            },
            {
              "type": "filter",
              "path": "section_id"
            }
          ]
        }
        ```
    -   Save the index and wait for its status to become **Active**.

7.  **Run the service:**
    This service runs on port `9999` to avoid conflicts with other services.
    ```bash
    uvicorn embedding_service.app:app --host 0.0.0.0 --port 9999 --reload
    ```

## 📚 API Documentation

### Indexing Endpoints

#### 1. Index a Full Profile
-   **Endpoint:** `POST /index/profile/{user_id}`
-   **Description:** Reads a user's full profile from the `profiles` collection, processes it, and populates the `chunks` collection for searching.
-   **cURL Example:**
    ```bash
    # Ensure a document with _id: "user12345" exists in the 'profiles' collection first!
    curl -X POST "http://localhost:9999/index/profile/user12345"
    ```
-   **Success Response:** `{"status":"success","message":"Profile indexed successfully into X chunks."}`

#### 2. Index a Specific Resume Section
-   **Endpoint:** `POST /index/{user_id}/section`
-   **Description:** Indexes a single piece of text into the `resume_sections` namespace. Used for user-edited content.
-   **cURL Example:**
    ```bash
    curl -X POST "http://localhost:9999/index/user12345/section" \
    -H "Content-Type: application/json" \
    -d '{
      "section_id": "exp-bullet-1",
      "text": "Engineered a real-time data processing pipeline using Kafka and Flink."
    }'
    ```
-   **Success Response:** `{"status":"success","section_id":"exp-bullet-1", ...}`

### Retrieval Endpoint

#### 1. Retrieve Similar Chunks
-   **Endpoint:** `POST /retrieve/{user_id}`
-   **Description:** The core search endpoint. Finds the `top_k` chunks most similar to a `query_embedding`. Can be filtered by namespace and section IDs. This is primarily used by the `Retrieval Service`.
-   **cURL Example:**
    ```bash
    # This requires a pre-computed 384-dimension vector.
    # The Retrieval Service handles this automatically.
    curl -X POST "http://localhost:9999/retrieve/user12345" \
    -H "Content-Type: application/json" \
    -d '{
      "query_embedding": [0.1, 0.2, ..., -0.5],
      "top_k": 5,
      "index_namespace": "profile"
    }'
    ```

### Utility Endpoints
-   `POST /embed`: Generates an embedding for a given string of text.
-   `GET /health`: A simple health check endpoint.

## ⚠️ Error Handling
-   **404 Not Found:** Returned by `/retrieve` if a user has not been indexed yet.
-   **500 Internal Server Error:** Can occur if there is a problem with the database connection or the Atlas Search Index configuration. Check the service logs for a detailed Python traceback.

## 📁 Project Structure

```
embedding_service/
├── .env
├── requirements.txt
└── embedding_service/
    ├── __init__.py
    ├── app.py            # Main FastAPI application and API endpoints
    ├── chunking.py       # Logic for splitting text into chunks
    ├── config.py         # Centralized configuration loader
    ├── db.py             # All MongoDB interaction logic
    ├── model.py          # Sentence Transformer model loading and embedding logic
    ├── schemas.py        # Pydantic models for API validation
    └── services.py       # Core business logic for indexing workflows
```