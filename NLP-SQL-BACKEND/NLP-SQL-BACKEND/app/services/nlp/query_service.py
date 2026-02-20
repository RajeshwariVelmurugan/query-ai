import time
import logging
import json
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.services.nlp.prompt_builder import PromptBuilder
from app.services.nlp.llm_client import LLMClient
from app.services.nlp.sql_validator import SQLValidator
from app.services.nlp.mql_validator import MQLValidator
from app.services.nlp.error_recovery import ErrorRecoveryService
import pymongo

# Configure logging
logger = logging.getLogger(__name__)


class QueryService:
    """
    The Orchestration Brain of the System.
    Connects Schema, Prompt, LLM, Validator, Cache, and DB.
    """

    def __init__(
        self,
        db_service,
        schema_service,
        cache_service,
        llm_client: Optional[LLMClient] = None,
        prompt_builder: Optional[PromptBuilder] = None,
        sql_validator: Optional[SQLValidator] = None,
        mql_validator: Optional[MQLValidator] = None,
        error_recovery: Optional[ErrorRecoveryService] = None
    ):
        self.db_service = db_service
        self.schema_service = schema_service
        self.cache_service = cache_service
        self.llm_client = llm_client or LLMClient()
        self.prompt_builder = prompt_builder or PromptBuilder()
        self.sql_validator = sql_validator or SQLValidator()
        self.mql_validator = mql_validator or MQLValidator()
        self.error_recovery = error_recovery or ErrorRecoveryService(
            self.llm_client,
            self.prompt_builder
        )

    def ask(self, tenant_id: str, question: str, user_id: int, db: Optional[Session] = None) -> Dict[str, Any]:
        """
        Executes the full NLP-to-Database workflow for a tenant.
        Supports both SQL (PostgreSQL/MySQL) and NoSQL (MongoDB).
        """
        start_time = time.time()
        
        # 1. Retrieve Schema
        schema = self.schema_service.get_schema(tenant_id, simplified=True)
        if not schema:
            raise ValueError(f"No schema found for tenant {tenant_id}")

        # Determine DB type
        from app.models import TenantConnection
        conn_record = db.query(TenantConnection).filter(TenantConnection.tenant_id == tenant_id).first()
        db_type = conn_record.db_type if conn_record else "postgresql"
        schema["db_type"] = db_type

        # 2. Build Prompt
        prompt = self.prompt_builder.build(schema, question)

        # 3. Generate Raw Query
        try:
            raw_query = self.llm_client.generate(prompt)
        except Exception as e:
            logger.error(f"LLM Generation failed: {str(e)}")
            execution_time = f"{time.time() - start_time:.2f}s"
            return {
                "answer": [],
                "sql": None,
                "error": str(e),
                "cache_hit": False,
                "execution_time": execution_time
            }

        # 4. Validate Query
        try:
            if db_type == "mongodb":
                validated_query = self.mql_validator.validate(raw_query, schema)
            else:
                validated_query = self.sql_validator.validate(raw_query, schema)
        except ValueError as e:
            logger.error(f"Validation failed: {str(e)}")
            execution_time = f"{time.time() - start_time:.2f}s"
            return {
                "answer": [],
                "sql": raw_query,
                "error": str(e),
                "cache_hit": False,
                "execution_time": execution_time
            }

        # 5. Check Cache
        normalized_cache_key = str(validated_query).lower().strip()
        cached_result = self.cache_service.get_cached_result(tenant_id, normalized_cache_key)
        
        if cached_result is not None:
            logger.info(f"Cache hit for tenant {tenant_id}")
            execution_time = f"{time.time() - start_time:.2f}s"
            return {
                "answer": cached_result,
                "sql": str(validated_query) if db_type == "mongodb" else validated_query,
                "cache_hit": True,
                "execution_time": execution_time
            }

        # 6. Execute Query
        logger.info(f"Executing {db_type} for tenant {tenant_id}")
        try:
            engine = self.db_service.get_engine(tenant_id, user_id=user_id, db=db)
            if not engine:
                raise ValueError(f"Access denied or connection not found for tenant {tenant_id}")
            
            if db_type == "mongodb":
                # MongoDB Execution logic
                db_name = conn_record.database_name or "test"
                mongo_db = engine[db_name]
                
                # Collection inference
                collection_name = self._infer_mongodb_collection(question, schema)
                if not collection_name:
                    raise ValueError("Could not determine which collection to query based on your question.")
                
                cursor = mongo_db[collection_name].aggregate(validated_query)
                result = []
                for doc in cursor:
                    if "_id" in doc:
                        doc["_id"] = str(doc["_id"])
                    result.append(doc)
                final_query_str = f"db.{collection_name}.aggregate({json.dumps(validated_query)})"
            else:
                # SQL Execution logic
                from sqlalchemy import text
                with engine.connect() as conn:
                    result_proxy = conn.execute(text(validated_query))
                    result = []
                    for row in result_proxy:
                        row_dict = {}
                        for column, value in row._mapping.items():
                            if hasattr(value, 'isoformat'):
                                row_dict[column] = value.isoformat()
                            else:
                                row_dict[column] = value
                        result.append(row_dict)
                final_query_str = validated_query

        except Exception as e:
            if db_type == "mongodb":
                logger.error(f"MongoDB Execution failed: {str(e)}")
                raise e
                
            logger.warning(f"SQL Execution failed, attempting repair: {str(e)}")
            try:
                # Attempt Repair
                repaired_sql = self.error_recovery.attempt_repair(
                    schema=schema,
                    question=question,
                    failed_sql=validated_query,
                    db_error=str(e)
                )
                repaired_sql = self.sql_validator.validate(repaired_sql, schema)

                with engine.connect() as conn:
                    result_proxy = conn.execute(text(repaired_sql))
                    result = []
                    for row in result_proxy:
                        row_dict = {}
                        for column, value in row._mapping.items():
                            if hasattr(value, 'isoformat'):
                                row_dict[column] = value.isoformat()
                            else:
                                row_dict[column] = value
                        result.append(row_dict)
                final_query_str = repaired_sql 

            except Exception as repair_error:
                logger.error(f"Repair attempt failed: {str(repair_error)}")
                execution_time = f"{time.time() - start_time:.2f}s"
                return {
                    "answer": [],
                    "sql": validated_query,
                    "error": str(repair_error),
                    "cache_hit": False,
                    "execution_time": execution_time
                }
        
        # 7. Store in Cache
        self.cache_service.cache_result(tenant_id, normalized_cache_key, result)

        execution_time = f"{time.time() - start_time:.2f}s"
        return {
            "answer": result,
            "sql": final_query_str,
            "cache_hit": False,
            "execution_time": execution_time
        }

    def _infer_mongodb_collection(self, question: str, schema: dict) -> Optional[str]:
        """Simple keyword based collection inference"""
        question_lower = question.lower()
        collections = list(schema.get("tables", {}).keys())
        for coll in collections:
            coll_lower = coll.lower()
            if coll_lower in question_lower or coll_lower.rstrip("s") in question_lower:
                return coll
        if len(collections) > 0:
            return collections[0]
        return None
