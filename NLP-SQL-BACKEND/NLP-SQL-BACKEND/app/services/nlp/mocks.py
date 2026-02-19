class MockRow:
    def __init__(self, data):
        self._mapping = data

class MockResultProxy:
    def __init__(self, data):
        self.data = [MockRow(row) for row in data]
    def __iter__(self):
        return iter(self.data)

class MockConnection:
    def __enter__(self):
        return self
    def __exit__(self, *args):
        pass
    def execute(self, *args, **kwargs):
        return MockResultProxy([{"mock_result": 100}])

class MockEngine:
    def connect(self):
        return MockConnection()

class MockDBService:
    def get_engine(self, tenant_id):
        return MockEngine()

class MockSchemaService:
    def get_schema(self, tenant_id):
        return {
            "tenant_id": tenant_id,
            "db_type": "postgresql",
            "schema_version": 1,
            "extracted_at": "2026-02-18T10:00:00Z",
            "tables": {
                "orders": {
                    "columns": {
                        "id": {"type": "integer", "nullable": False, "primary_key": True},
                        "total_amount": {"type": "decimal", "nullable": False, "primary_key": False},
                        "created_at": {"type": "timestamp", "nullable": False, "primary_key": False}
                    },
                    "relationships": []
                }
            }
        }

class MockCacheService:
    def __init__(self):
        self.data = {}

    def get_cached_result(self, tenant_id, sql):
        key = f"{tenant_id}:{sql}"
        return self.data.get(key)

    def cache_result(self, tenant_id, sql, value):
        key = f"{tenant_id}:{sql}"
        self.data[key] = value
