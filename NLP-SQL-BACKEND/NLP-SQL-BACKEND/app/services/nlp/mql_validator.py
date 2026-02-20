import json
import re

class MQLValidator:
    """
    Validates and normalizes MongoDB Query Language (MQL) queries.
    """
    
    FORBIDDEN_OPERATORS = [
        "$out", "$merge" # Prevent writing to collections
    ]

    def _clean_json_string(self, json_str: str) -> str:
        """
        Sanitizes potentially malformed JSON strings from LLMs.
        Handles single quotes, unquoted keys, and common escape issues.
        """
        # 1. Replace single quotes used for keys/values with double quotes
        # This is a bit risky but common in LLM outputs.
        # We only replace single quotes that are likely intended for JSON structure.
        s = json_str.replace("'", '"')
        
        # 2. Try to fix unquoted keys (e.g., { name: "val" } -> { "name": "val" })
        s = re.sub(r'(?<!")(\b\w+\b)(?=\s*:)', r'"\1"', s)
        
        return s

    def validate(self, query: str, schema: dict) -> dict:
        """
        Validates MQL query string (JSON object) and returns the parsed dict.
        """
        # 1. Basic JSON cleaning
        query = query.strip()
        if not (query.startswith("{") and query.endswith("}")):
            # Try to find the object if LLM was chatty
            match = re.search(r"(\{.*\})", query, re.DOTALL)
            if match:
                query = match.group(1)
            else:
                raise ValueError("Generated query is not a valid JSON object.")

        # 2. Parse JSON
        try:
            # Try strict first
            data = json.loads(query)
        except json.JSONDecodeError:
            try:
                # If strict fails, try cleaning first
                cleaned = self._clean_json_string(query)
                data = json.loads(cleaned)
            except json.JSONDecodeError as e:
                raise ValueError(f"Failed to parse MQL JSON: {str(e)}")

        if not isinstance(data, dict) or "collection" not in data or "pipeline" not in data:
            raise ValueError("MQL response must be a JSON object with 'collection' and 'pipeline' keys.")

        collection = data["collection"]
        pipeline = data["pipeline"]

        if not isinstance(pipeline, list):
            raise ValueError("MQL pipeline must be a list of stages.")

        # 3. Check for forbidden operators
        query_str_lowered = query.lower()
        for op in self.FORBIDDEN_OPERATORS:
            if op in query_str_lowered:
                raise ValueError(f"Forbidden MongoDB operator detected: {op}")

        # 4. Verify collection exists in schema
        available_collections = list(schema.get("tables", {}).keys())
        if collection and collection not in available_collections:
             # Try case-insensitive match
             matches = [c for c in available_collections if c.lower() == collection.lower()]
             if matches:
                 data["collection"] = matches[0]
             else:
                 raise ValueError(f"Collection '{collection}' not found in schema.")

        return data
