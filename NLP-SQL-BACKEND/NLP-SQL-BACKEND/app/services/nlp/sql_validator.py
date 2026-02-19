import re


class SQLValidator:
    FORBIDDEN_KEYWORDS = [
        "insert", "update", "delete",
        "drop", "alter", "truncate",
        "create", "grant", "revoke"
    ]

    def validate(self, sql: str, schema: dict) -> str:
        """
        Validates and normalizes SQL queries to ensure safety and correctness.
        """
        sql = self._normalize(sql)

        self._ensure_select(sql)
        self._block_multiple_statements(sql)
        self._block_comments(sql)
        self._block_forbidden_keywords(sql)
        self._validate_tables(sql, schema)
        sql = self._enforce_limit(sql)

        return sql

    def _normalize(self, sql: str) -> str:
        """
        Removes leading/trailing whitespace, trailing semicolons, 
        and collapses multiple spaces.
        """
        sql = sql.strip()
        sql = sql.rstrip(";")
        sql = re.sub(r"\s+", " ", sql)
        return sql

    def _ensure_select(self, sql: str):
        """Ensures the query starts with SELECT."""
        if not sql.lower().startswith("select"):
            raise ValueError("Only SELECT queries are allowed.")

    def _block_multiple_statements(self, sql: str):
        """Prevents execution of multiple SQL statements."""
        if ";" in sql:
            raise ValueError("Multiple SQL statements are not allowed.")

    def _block_comments(self, sql: str):
        """Blocks SQL comments to prevent injection attacks."""
        if "--" in sql or "/*" in sql or "*/" in sql:
            raise ValueError("SQL comments are not allowed.")

    def _block_forbidden_keywords(self, sql: str):
        """Blocks destructive SQL keywords and UNION using regex."""
        lowered = sql.lower()
        # Add UNION to forbidden keywords for extra safety
        keywords = self.FORBIDDEN_KEYWORDS + ["union"]
        for keyword in keywords:
            if re.search(rf"\b{keyword}\b", lowered):
                raise ValueError(f"Forbidden keyword detected: {keyword}")

    def _validate_tables(self, sql: str, schema: dict):
        """
        Ensures all referenced tables exist in the provided schema.
        Supports schema-qualified tables (e.g., public.orders).
        """
        # Improved regex to handle schema qualifications
        pattern = r"(?:from|join)\s+([a-zA-Z_][a-zA-Z0-9_\.]*)"
        matches = re.findall(pattern, sql.lower())

        allowed_tables = set(schema.get("tables", {}).keys())

        for match in matches:
            # Extract table name from schema-qualified string (e.g., 'public.orders' -> 'orders')
            table = match.split(".")[-1]
            if table not in allowed_tables:
                raise ValueError(f"Unknown table referenced: {table}")

    def _enforce_limit(self, sql: str) -> str:
        """Ensures a LIMIT clause is present using regex for accuracy."""
        if not re.search(r"\blimit\b", sql.lower()):
            sql += " LIMIT 1000"
        return sql
