import sys
import os

# Add the parent directory to sys.path to allow importing from the package
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.nlp.llm_client import LLMClient
from app.services.nlp.prompt_builder import PromptBuilder
from app.services.nlp.mocks import MockSchemaService

def test_llm_client():
    print("--- Initializing Services ---")
    schema_service = MockSchemaService()
    schema = schema_service.get_schema("tenant_1")

    builder = PromptBuilder()
    prompt = builder.build(schema, "How many orders?")

    llm = LLMClient()
    
    print("\n--- Sending Prompt to LLM ---")
    print("Note: This requires Ollama running with llama3:8b locally.")
    
    try:
        sql = llm.generate(prompt)
        print("\n--- Generated and Cleaned SQL ---")
        print(sql)
        
        # Basic validation of expected output from llama3
        if "SELECT" in sql.upper() and "from orders" in sql.lower():
            print("\n✅ LLM Client verification successful!")
        else:
            print("\n⚠️ LLM returned unexpected output, please check cleaning logic.")
            
    except RuntimeError as e:
        print(f"\n❌ Test Failed: {e}")
        print("\nTIP: Make sure Ollama is running (`ollama serve`) and the model is pulled (`ollama pull llama3:8b`).")

if __name__ == "__main__":
    test_llm_client()
