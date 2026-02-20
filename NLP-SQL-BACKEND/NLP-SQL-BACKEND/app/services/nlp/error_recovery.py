class ErrorRecoveryService:
    """
    Handles one-time LLM retry when SQL execution fails.
    """

    def __init__(self, llm_client, prompt_builder):
        self.llm_client = llm_client
        self.prompt_builder = prompt_builder

    def attempt_repair(self, schema: dict, question: str, failed_sql: str, db_error: str) -> str:
        """
        Sends failed SQL and DB error back to LLM to generate corrected SQL.
        """

        schema_text = self.prompt_builder._format_schema(schema)
        repair_prompt = f"""
You previously generated the following SQL query:

{failed_sql}

The database returned this error:

{db_error}

Fix the query using the provided DATABASE SCHEMA.

DATABASE SCHEMA:
{schema_text}

STRICT RULES:
- Analyze the DATABASE ERROR and fix the root cause.
- Check specifically for:
  * Table alias hallucinations (e.g., using `ali.col` when `ali` isn't defined).
  * JOIN conditions using incorrect table names.
  * Columns being selected from the wrong tables.
- Generate ONLY a SELECT query.
- Use ONLY tables and columns from the schema.
- Return ONLY raw SQL.
- No explanations.
"""

        return self.llm_client.generate(repair_prompt)
