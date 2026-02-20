from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.auth_service import get_current_user
from dependencies import get_db_service
from app.models import TenantConnection, User
import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

router = APIRouter(prefix="/api/insights", tags=["Insights"])
logger = logging.getLogger(__name__)

class ChartDataRequest(BaseModel):
    tenant_id: str
    table_name: str
    x_column: str
    y_column: str
    chart_type: str = "bar"
    filters: Optional[Dict[str, Any]] = None

@router.post("/chart-data")
async def get_chart_data(
    request: ChartDataRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    db_service = Depends(get_db_service)
):
    try:
        tenant_id = request.tenant_id
        table_name = request.table_name
        x_column = request.x_column
        y_column = request.y_column
        chart_type = request.chart_type

        # 1. Get connection record to determine DB type
        conn_record = db.query(TenantConnection).filter(
            TenantConnection.tenant_id == tenant_id,
            TenantConnection.user_id == current_user.id
        ).first()

        if not conn_record:
            raise HTTPException(status_code=404, detail="Database connection not found.")

        # 2. Get engine/client
        engine = db_service.get_engine(tenant_id, current_user.id, db)
        if not engine:
            raise HTTPException(status_code=401, detail="Failed to retrieve database connection.")

        db_type = conn_record.db_type

        # 3. Data Retrieval Logic
        data = {"x": [], "y": []}

        def safe_float(val):
            if val is None: return 0.0
            try:
                return float(val)
            except (ValueError, TypeError):
                # If it's a date or category string, we can't plot it as the Y value in Line/Bar
                # unless we are counting, but here we just return 1.0 or 0.0
                return 0.0

        if db_type in ['mysql', 'postgresql']:
            # SQL Logic
            with engine.connect() as conn:
                if chart_type.lower() == 'pie':
                    # For Pie, we usually want count of occurrences of X
                    query = text(f"SELECT {x_column}, COUNT(*) as count FROM {table_name} GROUP BY {x_column}")
                else:
                    # For Line/Bar, we want X and Y
                    query = text(f"SELECT {x_column}, {y_column} FROM {table_name} ORDER BY {x_column} ASC")
                
                result_proxy = conn.execute(query)
                for row in result_proxy:
                    row_dict = row._mapping
                    data["x"].append(str(row_dict[x_column]))
                    
                    if chart_type.lower() == 'pie':
                        data["y"].append(safe_float(row_dict.get('count')))
                    else:
                        data["y"].append(safe_float(row_dict.get(y_column)))

        elif db_type == 'mongodb':
            # MongoDB Logic
            mongo_db = engine[conn_record.database_name or "test"]
            collection = mongo_db[table_name]

            if chart_type.lower() == 'pie':
                pipeline = [
                    {"$group": {"_id": f"${x_column}", "count": {"$sum": 1}}},
                    {"$sort": {"count": -1}}
                ]
                cursor = collection.aggregate(pipeline)
                for doc in cursor:
                    data["x"].append(str(doc["_id"]))
                    data["y"].append(safe_float(doc.get("count")))
            else:
                cursor = collection.find({}, {x_column: 1, y_column: 1, "_id": 0}).sort(x_column, 1)
                for doc in cursor:
                    data["x"].append(str(doc.get(x_column)))
                    data["y"].append(safe_float(doc.get(y_column)))

        return data

    except Exception as e:
        logger.error(f"Failed to fetch chart data: {e}")
        raise HTTPException(status_code=500, detail=str(e))
