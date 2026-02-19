import sys
import os

# Add the parent directory to sys.path to allow importing from the package
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.nlp.sql_validator import SQLValidator
from app.services.nlp.mocks import MockSchemaService

def test_validator():
    validator = SQLValidator()
    mock_schema_service = MockSchemaService()
    schema = mock_schema_service.get_schema("tenant_1")

    print("--- Running Test Cases ---")

    # 1. Valid Query
    sql1 = "SELECT COUNT(*) FROM orders"
    validated1 = validator.validate(sql1, schema)
    print(f"✅ Valid (Simple): {validated1}")
    assert "LIMIT 1000" in validated1

    # 2. Valid (schema-qualified)
    sql2 = "SELECT * FROM public.orders"
    validated2 = validator.validate(sql2, schema)
    print(f"✅ Valid (Schema-qualified): {validated2}")
    assert "LIMIT 1000" in validated2

    # 3. Valid (multi-space normalization)
    sql3 = "SELECT    id   FROM     orders     "
    validated3 = validator.validate(sql3, schema)
    print(f"✅ Valid (Multi-space): '{validated3}'")
    assert " " not in validated3.split("FROM")[0].strip().replace("SELECT ", "")

    # 4. Invalid (Destructive)
    try:
        validator.validate("DELETE FROM orders", schema)
    except ValueError as e:
        print(f"❌ Invalid (DELETE): Correctly blocked - {e}")

    # 5. Invalid (Unknown Table)
    try:
        validator.validate("SELECT * FROM fake_table", schema)
    except ValueError as e:
        print(f"❌ Invalid (Unknown Table): Correctly blocked - {e}")

    # 6. Invalid (Multiple Statements)
    try:
        validator.validate("SELECT * FROM orders; DROP TABLE users", schema)
    except ValueError as e:
        print(f"❌ Invalid (Multiple Statements): Correctly blocked - {e}")

    # 7. Invalid (Comments)
    try:
        validator.validate("SELECT * FROM orders -- comment", schema)
    except ValueError as e:
        print(f"❌ Invalid (Comments): Correctly blocked - {e}")

    # 8. Invalid (UNION)
    try:
        validator.validate("SELECT id FROM orders UNION SELECT id FROM users", schema)
    except ValueError as e:
        print(f"❌ Invalid (UNION): Correctly blocked - {e}")

    # 9. Smart LIMIT detection (false positive prevention)
    sql9 = "SELECT * FROM orders WHERE status = 'limited'"
    validated9 = validator.validate(sql9, schema)
    print(f"✅ Smart LIMIT (False Positive Prevention): {validated9}")
    assert validated9.endswith("LIMIT 1000")

    print("\n--- All Tests Passed! ---")

if __name__ == "__main__":
    test_validator()
