import re

class PromptBuilder:

    def build(self, schema: dict, question: str) -> str:
        """
        Builds a strict, schema-aware, and dialect-specific instruction 
        prompt for the LLM.
        """
        schema_text = self._format_schema(schema)
        db_type = schema.get("db_type", "SQL")

        if db_type == "mongodb":
            prompt = f"""
You generate MongoDB aggregation pipelines for a MongoDB database.

STRICT RULES:
- Return ONLY a JSON object with two keys: "collection" and "pipeline".
- "collection": The name of the collection to query.
- "pipeline": The array representing the aggregation stages.
- Example: {{ "collection": "users", "pipeline": [{{ "$match": {{ "status": "A" }} }}] }}
- Use ONLY collections and fields listed in the schema.
- IMPORTANT: Fields are already available in the collection. Do NOT use $lookup to join a collection with itself.
- Only use $lookup if the required information is strictly in a DIFFERENT collection.
- Exclude the "_id" field from results unless explicitly asked for internal IDs.
- Return ONLY the raw JSON object. No markdown, no explanations.
- If required info is missing, return: {{ "collection": "", "pipeline": [] }}

DATABASE SCHEMA:
{schema_text}

USER QUESTION:
{question}
"""
        else:
            prompt = f"""
You generate SQL queries for a {db_type} database.

STRICT RULES:
- Generate ONLY a SELECT query.
- Do NOT use INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, CREATE, GRANT, REVOKE.
- Use ONLY tables and columns listed in the schema.
- Always use clear table aliases (e.g., `FROM products p`).
- When joining tables, ensure every column reference is prefixed with its table alias (e.g., `p.name` instead of `name`).
- Verify that the column actually exists in the specific table it is being selected from.
- If no LIMIT is present, add LIMIT 1000.
- Return ONLY raw SQL.
- No explanations.
- No markdown.
- If required tables or columns are missing, return: SELECT 1 WHERE 1=0 LIMIT 1000

DATABASE SCHEMA:
{schema_text}

USER QUESTION:
{question}
"""
        return prompt.strip()

    def _format_schema(self, schema: dict) -> str:
        """
        Converts the schema dictionary into an LLM-friendly readable string
        using list accumulation for performance.
        """
        tables = schema.get("tables", {})
        lines = []

        for table_name, table_data in tables.items():
            lines.append(f"\nTable: {table_name}")
            lines.append("Columns:")

            columns = table_data.get("columns", {})
            for column_name, column_data in columns.items():
                col_type = column_data.get("type", "unknown")
                lines.append(f"  - {column_name} ({col_type})")

            relationships = table_data.get("relationships", [])
            if relationships:
                lines.append("Relationships:")
                for rel in relationships:
                    ref_table = rel.get("references", {}).get("table")
                    ref_column = rel.get("references", {}).get("column")
                    column = rel.get("column")
                    if ref_table and ref_column and column:
                        lines.append(f"  - {table_name}.{column} references {ref_table}.{ref_column}")

        return "\n".join(lines).strip()
