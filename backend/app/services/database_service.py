import pyodbc
from typing import List, Dict, Any, Optional
from app.config import settings


class DatabaseService:
    def __init__(self) -> None:
        self.connection_string: Optional[str] = None
        self._build_connection_string()

    def _build_connection_string(self) -> None:
        """Build MSSQL connection string from settings"""
        if not all([
            settings.MSSQL_SERVER,
            settings.MSSQL_DATABASE,
            settings.MSSQL_USERNAME,
            settings.MSSQL_PASSWORD
        ]):
            print("Warning: MSSQL configuration incomplete. Database features disabled.")
            return

        self.connection_string = (
            f"DRIVER={settings.MSSQL_DRIVER};"
            f"SERVER={settings.MSSQL_SERVER},{settings.MSSQL_PORT};"
            f"DATABASE={settings.MSSQL_DATABASE};"
            f"UID={settings.MSSQL_USERNAME};"
            f"PWD={settings.MSSQL_PASSWORD}"
        )

    def _get_connection(self) -> pyodbc.Connection:
        """Get database connection"""
        if not self.connection_string:
            raise Exception("Database not configured. Please check MSSQL settings in .env")

        try:
            connection = pyodbc.connect(self.connection_string)
            return connection
        except pyodbc.Error as e:
            raise Exception(f"Failed to connect to database: {str(e)}")

    def execute_query(
        self,
        query: str,
        params: Optional[tuple] = None
    ) -> List[Dict[str, Any]]:
        """
        Execute a SELECT query and return results as list of dictionaries

        Args:
            query: SQL query to execute
            params: Optional query parameters for parameterized queries

        Returns:
            List of dictionaries where keys are column names
        """
        connection = self._get_connection()
        try:
            cursor = connection.cursor()

            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)

            # Get column names
            columns = [column[0] for column in cursor.description] if cursor.description else []

            # Fetch all rows
            rows = cursor.fetchall()

            # Convert to list of dictionaries
            results: List[Dict[str, Any]] = []
            for row in rows:
                row_dict: Dict[str, Any] = {}
                for i, column in enumerate(columns):
                    row_dict[column] = row[i]
                results.append(row_dict)

            return results

        except pyodbc.Error as e:
            raise Exception(f"Query execution failed: {str(e)}")
        finally:
            connection.close()

    def get_table_data(
        self,
        table_name: str,
        columns: Optional[List[str]] = None,
        where_clause: Optional[str] = None,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Fetch data from a specific table

        Args:
            table_name: Name of the table to query
            columns: List of column names to fetch (None = all columns)
            where_clause: Optional WHERE clause (e.g., "age > 25")
            limit: Optional row limit

        Returns:
            List of dictionaries containing table data
        """
        # Build SELECT clause
        select_clause = ", ".join(columns) if columns else "*"

        # Build query
        query = f"SELECT {select_clause} FROM {table_name}"

        if where_clause:
            query += f" WHERE {where_clause}"

        if limit:
            query = f"SELECT TOP {limit} {select_clause} FROM {table_name}"
            if where_clause:
                query += f" WHERE {where_clause}"

        return self.execute_query(query)

    def get_tables(self) -> List[str]:
        """Get list of all tables in the database"""
        query = """
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
        """
        results = self.execute_query(query)
        return [row["TABLE_NAME"] for row in results]

    def get_table_schema(self, table_name: str) -> List[Dict[str, str]]:
        """
        Get schema information for a specific table

        Args:
            table_name: Name of the table

        Returns:
            List of dictionaries with column information (name, type, nullable)
        """
        query = """
        SELECT
            COLUMN_NAME,
            DATA_TYPE,
            IS_NULLABLE,
            CHARACTER_MAXIMUM_LENGTH
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
        """
        return self.execute_query(query, (table_name,))

    def test_connection(self) -> Dict[str, Any]:
        """Test database connection and return connection info"""
        try:
            connection = self._get_connection()
            cursor = connection.cursor()

            # Get database version
            cursor.execute("SELECT @@VERSION")
            version_row = cursor.fetchone()
            version = version_row[0] if version_row else "Unknown"

            # Get current database
            cursor.execute("SELECT DB_NAME()")
            db_row = cursor.fetchone()
            database = db_row[0] if db_row else "Unknown"

            connection.close()

            return {
                "connected": True,
                "database": database,
                "server": settings.MSSQL_SERVER,
                "version": version
            }

        except Exception as e:
            return {
                "connected": False,
                "error": str(e)
            }


database_service = DatabaseService()
