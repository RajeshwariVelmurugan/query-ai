import sys
import os

# Add the parent directory to sys.path to allow importing from the package
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.nlp.prompt_builder import PromptBuilder
from app.services.nlp.mocks import MockSchemaService

def test_prompt_builder():
    builder = PromptBuilder()
    schema_service = MockSchemaService()
    
    # 1. Test Ecommerce Schema with PostgreSQL awareness
    ecommerce_schema = schema_service.get_schema("tenant_ecom")
    prompt_ecom = builder.build(ecommerce_schema, "Total revenue this month?")
    
    print("--- Hardened Ecommerce Prompt ---")
    print(prompt_ecom)
    
    # Verify improvements
    assert "queries for a postgresql database" in prompt_ecom
    assert "SELECT 1 WHERE 1=0 LIMIT 1000" in prompt_ecom
    assert "Table: orders" in prompt_ecom
    assert "total_amount (decimal)" in prompt_ecom
    # Verify conciseness (no "You are an expert...")
    assert "You are an expert" not in prompt_ecom

    # 2. Test Banking Schema (Implicitly "SQL" if db_type missing)
    banking_schema = {
        "tables": {
            "accounts": {
                "columns": {
                    "account_id": {"type": "uuid"},
                    "balance": {"type": "numeric"}
                }
            }
        }
    }
    
    prompt_banking = builder.build(banking_schema, "Show me accounts with balance > 5000")
    print("\n--- Banking Prompt (Default SQL Dialect) ---")
    print(prompt_banking)
    
    assert "queries for a SQL database" in prompt_banking
    assert "Table: accounts" in prompt_banking

    print("\n✅ Hardened Prompt Builder verified successfully!")

if __name__ == "__main__":
    test_prompt_builder()
