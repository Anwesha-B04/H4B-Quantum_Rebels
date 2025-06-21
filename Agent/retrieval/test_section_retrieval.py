import asyncio
import httpx
import json

async def test_section_retrieval():
    url = "http://localhost:8002/retrieve/section"
    
    # Sample request data
    payload = {
        "user_id": "test_user_123",
        "section_id": "education",
        "job_description": "Looking for a software engineer with Python experience",
        "top_k": 3
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, timeout=30.0)
            response.raise_for_status()
            print("Test successful!")
            print(json.dumps(response.json(), indent=2))
        except httpx.HTTPStatusError as e:
            print(f"HTTP error occurred: {e.response.status_code} - {e.response.text}")
        except Exception as e:
            print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_section_retrieval())
