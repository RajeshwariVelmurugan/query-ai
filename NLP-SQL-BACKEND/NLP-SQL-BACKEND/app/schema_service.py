from sqlalchemy import inspect, text
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

class SchemaExtractor:
    """
    Extracts database schema (tables, columns, relationships)
    """
    
    def __init__(self, db_service):
        self.db_service = db_service
        self.schemas: Dict[str, dict] = {}
        logger.info("SchemaExtractor initialized")
    
    def extract_and_store_schema(self, tenant_id: str) -> Optional[dict]:
        """Extract complete schema from tenant's database"""
        try:
            engine = self.db_service.get_engine(tenant_id)
            if not engine:
                logger.error(f"No engine found for tenant {tenant_id}")
                return None
            
            inspector = inspect(engine)
            schema = {}
            tables = inspector.get_table_names()
            logger.info(f"Found {len(tables)} tables for tenant {tenant_id}")
            
            for table_name in tables:
                columns = []
                for column in inspector.get_columns(table_name):
                    columns.append({
                        'name': column['name'],
                        'type': str(column['type']),
                        'nullable': column['nullable'],
                        'primary_key': column.get('primary_key', False)
                    })
                
                relations = []
                for fk in inspector.get_foreign_keys(table_name):
                    relations.append({
                        'column': fk['constrained_columns'][0],
                        'references_table': fk['referred_table'],
                        'references_column': fk['referred_columns'][0]
                    })
                
                indexes = []
                for idx in inspector.get_indexes(table_name):
                    indexes.append({
                        'name': idx['name'],
                        'columns': idx['column_names'],
                        'unique': idx['unique']
                    })
                
                schema[table_name] = {
                    'columns': columns,
                    'relations': relations,
                    'indexes': indexes,
                    'row_count': self._get_row_count(engine, table_name)
                }
            
            self.schemas[tenant_id] = schema
            simplified = self._create_simplified_schema(schema)
            self.schemas[f"{tenant_id}_simple"] = simplified
            
            logger.info(f"✅ Schema extracted for tenant {tenant_id}")
            return schema
            
        except Exception as e:
            logger.error(f"Schema extraction failed: {e}")
            return None
    
    def _get_row_count(self, engine, table_name: str) -> int:
        """Get approximate row count for a table"""
        try:
            with engine.connect() as conn:
                result = conn.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
                return result.scalar()
        except:
            return -1
    
    def _create_simplified_schema(self, full_schema: dict) -> dict:
        """Create a version for LLM prompts compatible with PromptBuilder"""
        tables = {}
        for table_name, table_info in full_schema.items():
            columns = {}
            for col in table_info['columns']:
                columns[col['name']] = {'type': col['type']}
            
            relationships = []
            for rel in table_info['relations']:
                relationships.append({
                    'column': rel['column'],
                    'references': {
                        'table': rel['references_table'],
                        'column': rel['references_column']
                    }
                })
            
            tables[table_name] = {
                'columns': columns,
                'relationships': relationships
            }
        return {"tables": tables}
    
    def get_schema(self, tenant_id: str, simplified: bool = False) -> Optional[dict]:
        """Get schema for a tenant"""
        key = f"{tenant_id}_simple" if simplified else tenant_id
        return self.schemas.get(key)
    
    def remove_schema(self, tenant_id: str):
        """Remove schema when tenant disconnects"""
        if tenant_id in self.schemas:
            del self.schemas[tenant_id]
        if f"{tenant_id}_simple" in self.schemas:
            del self.schemas[f"{tenant_id}_simple"]
        logger.info(f"Schema removed for tenant {tenant_id}")