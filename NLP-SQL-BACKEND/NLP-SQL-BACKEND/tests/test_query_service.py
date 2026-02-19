import sys
import os

# Add the parent directory to sys.path to allow importing from the package
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.nlp.query_service import QueryService

from app.services.nlp.mocks import MockDBService, MockSchemaService, MockCacheService

def test_query_service():
    print("--- Initializing Brain Orchestration ---")
    
    # Setup Mocks
    db_service = MockDBService()
    schema_service = MockSchemaService()
    cache_service = MockCacheService()
    
    # Initialize Service (will use default LLM/PromptBuilder/Validator)
    service = QueryService(
        db_service=db_service,
        schema_service=schema_service,
        cache_service=cache_service
    )
    
    tenant_id = "tenant_1"
    question = "Total revenue?"

    print(f"\n--- Processing Question: '{question}' ---")
    print("Note: This will attempt to call Ollama. If it fails, we catch the error.")
    
    try:
        response = service.ask(tenant_id, question)
        
        print("\n--- Service Response ---")
        print(f"SQL: {response.get('sql')}")
        print(f"Answer: {response.get('answer')}")
        print(f"Cache Hit: {response.get('cache_hit')}")
        print(f"Execution Time: {response.get('execution_time')}")
        
        if "error" in response:
            print(f"⚠️ Service returned error: {response['error']}")
        else:
            print("\n✅ Query Service orchestration verified successfully!")
            
    except Exception as e:
        print(f"\n❌ Test Crashed: {str(e)}")

if __name__ == "__main__":
    test_query_service()
