import json
import re

class MQLValidator:
    """
    Validates and normalizes MongoDB Query Language (MQL) queries.
    """
    
    FORBIDDEN_OPERATORS = [
        "$out", "$merge" # Prevent writing to collections
    ]

    def validate(self, query: str, schema: dict) -> list:
        """
        Validates MQL query string (JSON array) and returns the parsed pipeline.
        """
        # 1. Basic JSON cleaning
        query = query.strip()
        if not (query.startswith("[") and query.endswith("]")):
            # Try to find the array if LLM was chatty
            match = re.search(r"(\[.*\])", query, re.DOTALL)
            if match:
                query = match.group(1)
            else:
                raise ValueError("Generated query is not a valid JSON array.")

        # 2. Parse JSON
        try:
            pipeline = json.loads(query)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse MQL JSON: {str(e)}")

        if not isinstance(pipeline, list):
            raise ValueError("MQL pipeline must be a list of stages.")

        # 3. Check for forbidden operators
        query_str_lowered = query.lower()
        for op in self.FORBIDDEN_OPERATORS:
            if op in query_str_lowered:
                raise ValueError(f"Forbidden MongoDB operator detected: {op}")

        return pipeline
