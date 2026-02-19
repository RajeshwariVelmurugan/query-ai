import time
import logging
from typing import Dict, Any, Optional

from app.services.nlp.prompt_builder import PromptBuilder
from app.services.nlp.llm_client import LLMClient
from app.services.nlp.sql_validator import SQLValidator
from app.services.nlp.error_recovery import ErrorRecoveryService

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
        error_recovery: Optional[ErrorRecoveryService] = None
    ):
        self.db_service = db_service
        self.schema_service = schema_service
        self.cache_service = cache_service
        self.llm_client = llm_client or LLMClient()
        self.prompt_builder = prompt_builder or PromptBuilder()
        self.sql_validator = sql_validator or SQLValidator()
        self.error_recovery = error_recovery or ErrorRecoveryService(
            self.llm_client,
            self.prompt_builder
        )

    def ask(self, tenant_id: str, question: str) -> Dict[str, Any]:
        """
        Executes the full NLP-to-SQL workflow for a tenant.
        """
        start_time = time.time()
        
        # 1. Retrieve Schema
        schema = self.schema_service.get_schema(tenant_id, simplified=True)
        if not schema:
            raise ValueError(f"No schema found for tenant {tenant_id}")

        # 2. Build Prompt
        prompt = self.prompt_builder.build(schema, question)

        # 3. Generate SQL
        try:
            raw_sql = self.llm_client.generate(prompt)
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


        # 4. Validate SQL
        try:
            validated_sql = self.sql_validator.validate(raw_sql, schema)
        except ValueError as e:
            logger.error(f"SQL Validation failed: {str(e)}")
            execution_time = f"{time.time() - start_time:.2f}s"
            return {
                "answer": [],
                "sql": raw_sql,
                "error": str(e),
                "cache_hit": False,
                "execution_time": execution_time
            }

        # 5. Check Cache
        # Normalize SQL for more consistent cache hits
        normalized_sql = validated_sql.lower().strip()
        # In the integrated version, we use the backend's cache service which has its own key generation
        cached_result = self.cache_service.get_cached_result(tenant_id, normalized_sql)
        
        if cached_result is not None:
            logger.info(f"Cache hit for tenant {tenant_id}")
            execution_time = f"{time.time() - start_time:.2f}s"
            return {
                "answer": cached_result,
                "sql": validated_sql,
                "cache_hit": True,
                "execution_time": execution_time
            }

        # 6. Execute Query
        logger.info(f"Executing SQL for tenant {tenant_id}")
        try:
            engine = self.db_service.get_engine(tenant_id)
            if not engine:
                raise ValueError(f"No database connection for tenant {tenant_id}")
            
            from sqlalchemy import text
            with engine.connect() as conn:
                result_proxy = conn.execute(text(validated_sql))
                result = []
                for row in result_proxy:
                    row_dict = {}
                    for column, value in row._mapping.items():
                        if hasattr(value, 'isoformat'):
                            row_dict[column] = value.isoformat()
                        else:
                            row_dict[column] = value
                    result.append(row_dict)

        except Exception as e:
            logger.warning(f"Execution failed, attempting repair: {str(e)}")

            try:
                # Attempt Repair
                repaired_sql = self.error_recovery.attempt_repair(
                    schema=schema,
                    question=question,
                    failed_sql=validated_sql,
                    db_error=str(e)
                )

                # Validate repaired SQL
                repaired_sql = self.sql_validator.validate(repaired_sql, schema)

                # Retry execution once
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
                validated_sql = repaired_sql # Update validated_sql to the successfully repaired one

            except Exception as repair_error:
                logger.error(f"Repair attempt failed: {str(repair_error)}")
                execution_time = f"{time.time() - start_time:.2f}s"
                return {
                    "answer": [],
                    "sql": validated_sql,
                    "error": str(repair_error),
                    "cache_hit": False,
                    "execution_time": execution_time
                }
        
        # 7. Store in Cache (only on successful paths)
        self.cache_service.cache_result(tenant_id, validated_sql, result)

        execution_time = f"{time.time() - start_time:.2f}s"
        return {
            "answer": result,
            "sql": validated_sql,
            "cache_hit": False,
            "execution_time": execution_time
        }
