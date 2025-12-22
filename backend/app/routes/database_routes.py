from fastapi import APIRouter, HTTPException
from app.models.database_models import (
    QueryRequest,
    TableQueryRequest,
    QueryResponse,
    TablesResponse,
    TableSchemaResponse,
    ConnectionTestResponse
)
from app.services.database_service import database_service
import traceback

router = APIRouter(prefix="/api/database", tags=["Database"])


@router.post("/query", response_model=QueryResponse)
async def execute_query(request: QueryRequest):
    """
    Execute a custom SQL query

    Supports parameterized queries for security
    """
    try:
        # Convert list params to tuple if provided
        params = tuple(request.params) if request.params else None

        results = database_service.execute_query(request.query, params)

        return QueryResponse(
            data=results,
            row_count=len(results)
        )
    except ValueError as e:
        print(f"ValueError: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Exception: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Query execution failed: {str(e)}")


@router.post("/table", response_model=QueryResponse)
async def get_table_data(request: TableQueryRequest):
    """
    Fetch data from a specific table

    Provides a simplified interface for common table queries
    """
    try:
        results = database_service.get_table_data(
            table_name=request.table_name,
            columns=request.columns,
            where_clause=request.where_clause,
            limit=request.limit
        )

        return QueryResponse(
            data=results,
            row_count=len(results)
        )
    except ValueError as e:
        print(f"ValueError: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Exception: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch table data: {str(e)}")


@router.get("/tables", response_model=TablesResponse)
async def list_tables():
    """
    Get list of all tables in the database
    """
    try:
        tables = database_service.get_tables()
        return TablesResponse(tables=tables)
    except Exception as e:
        print(f"Exception: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch tables: {str(e)}")


@router.get("/schema/{table_name}", response_model=TableSchemaResponse)
async def get_table_schema(table_name: str):
    """
    Get schema information for a specific table
    """
    try:
        columns = database_service.get_table_schema(table_name)
        return TableSchemaResponse(
            table_name=table_name,
            columns=columns
        )
    except Exception as e:
        print(f"Exception: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch schema: {str(e)}")


@router.get("/test", response_model=ConnectionTestResponse)
async def test_connection():
    """
    Test database connection and return connection info
    """
    try:
        result = database_service.test_connection()
        return ConnectionTestResponse(**result)
    except Exception as e:
        print(f"Exception: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Connection test failed: {str(e)}")
