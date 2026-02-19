import sys
import os
import logging

# Add the parent directory to sys.path to allow importing from the package
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.nlp.query_service import QueryService
from app.services.nlp.mocks import MockDBService, MockSchemaService, MockCacheService, MockResultProxy

# Mock DB Service that fails on the first attempt and succeeds on the second
class FailingDBService(MockDBService):
    def __init__(self):
        self.attempts = 0

    def get_engine(self, tenant_id):
        return self

    def connect(self):
        return self

    def __enter__(self):
        return self

    def __exit__(self, *args):
        pass

    def execute(self, *args, **kwargs):
        self.attempts += 1
        if self.attempts == 1:
            raise Exception("Column 'revenue' does not exist")
        return MockResultProxy([{"total_amount": 1000}])

def test_error_recovery():
    print("--- Initializing Error Recovery Test ---")
    
    db_service = FailingDBService()
    schema_service = MockSchemaService()
    cache_service = MockCacheService()
    
    service = QueryService(
        db_service=db_service,
        schema_service=schema_service,
        cache_service=cache_service
    )
    
    tenant_id = "tenant_1"
    question = "What is the total revenue?" # Designed to trigger the 'revenue' vs 'total_amount' mismatch

    print(f"\n--- Processing Question: '{question}' ---")
    print("This test simulates a DB error and checks if the LLM repairs the query.")

    try:
        response = service.ask(tenant_id, question)
        
        print("\n--- Service Response ---")
        print(f"Final SQL: {response.get('sql')}")
        print(f"Answer: {response.get('answer')}")
        
        if db_service.attempts == 2:
            print("\n✅ Error Recovery verified! Service retried after DB failure.")
        else:
            print(f"\n❌ Error Recovery failed. DB attempts: {db_service.attempts}")
            
    except Exception as e:
        print(f"\n❌ Test Crashed: {str(e)}")

if __name__ == "__main__":
    test_error_recovery()
