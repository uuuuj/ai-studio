from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class QueryRequest(BaseModel):
    query: str = Field(..., description="SQL query to execute")
    params: Optional[List[Any]] = Field(default=None, description="Optional query parameters")


class TableQueryRequest(BaseModel):
    table_name: str = Field(..., description="Name of the table to query")
    columns: Optional[List[str]] = Field(default=None, description="Columns to fetch (None = all)")
    where_clause: Optional[str] = Field(default=None, description="WHERE clause filter")
    limit: Optional[int] = Field(default=None, gt=0, description="Maximum number of rows")


class QueryResponse(BaseModel):
    data: List[Dict[str, Any]] = Field(..., description="Query results")
    row_count: int = Field(..., description="Number of rows returned")


class TablesResponse(BaseModel):
    tables: List[str] = Field(..., description="List of table names")


class TableSchemaResponse(BaseModel):
    table_name: str = Field(..., description="Name of the table")
    columns: List[Dict[str, str]] = Field(..., description="Column information")


class ConnectionTestResponse(BaseModel):
    connected: bool = Field(..., description="Whether connection was successful")
    database: Optional[str] = Field(default=None, description="Database name")
    server: Optional[str] = Field(default=None, description="Server address")
    version: Optional[str] = Field(default=None, description="Database version")
    error: Optional[str] = Field(default=None, description="Error message if connection failed")
