from app.models.databaseconnection import get_connection
import psycopg2.extras


class CollegeModel:
    @staticmethod
    def get_college(limit=9, offset=0):
        return CollegeModel.filter_colleges(
            query="",
            sort_key=None,
            direction=None,
            limit=limit,
            offset=offset,
        )

    @staticmethod
    def add_college(collegecode, collegename):
        conn = get_connection()
        cursor = conn.cursor()

        try:
            cursor.execute(
                """
                INSERT INTO college ("collegecode", "collegename")
                VALUES (%s, %s)
                """,
                (collegecode, collegename),
            )

            conn.commit()
        finally:
            cursor.close()
            conn.close()

    # Check if a college code exists
    @staticmethod
    def college_code_exists(collegecode, exclude_code=None):
        conn = get_connection()
        cursor = conn.cursor()

        try:
            if exclude_code:
                cursor.execute(
                    """
                    SELECT 1
                    FROM college
                    WHERE LOWER("collegecode") = LOWER(%s)
                      AND LOWER("collegecode") <> LOWER(%s)
                    LIMIT 1
                    """,
                    (collegecode, exclude_code),
                )
            else:
                cursor.execute(
                    """
                    SELECT 1
                    FROM college
                    WHERE LOWER("collegecode") = LOWER(%s)
                    LIMIT 1
                    """,
                    (collegecode,),
                )

            return cursor.fetchone() is not None
        finally:
            cursor.close()
            conn.close()

    # Check if a college name exists
    @staticmethod
    def college_name_exists(collegename, exclude_code=None):
        conn = get_connection()
        cursor = conn.cursor()

        try:
            if exclude_code:
                cursor.execute(
                    """
                    SELECT 1
                    FROM college
                    WHERE LOWER("collegename") = LOWER(%s)
                      AND "collegecode" <> %s
                    LIMIT 1
                    """,
                    (collegename, exclude_code),
                )
            else:
                cursor.execute(
                    """
                    SELECT 1
                    FROM college
                    WHERE LOWER("collegename") = LOWER(%s)
                    LIMIT 1
                    """,
                    (collegename,),
                )

            return cursor.fetchone() is not None
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def update_college(original_code, collegecode, collegename):
        """
        Returns True if a college row was updated, False if not found.
        Also updates all programs that reference this college code.
        """
        conn = get_connection()
        cursor = conn.cursor()

        try:
            # Update the college itself
            cursor.execute(
                """
                UPDATE college
                SET "collegecode" = %s,
                    "collegename" = %s
                WHERE "collegecode" = %s
                """,
                (collegecode, collegename, original_code),
            )

            updated_rows = cursor.rowcount

            # Update programs that reference the old college code
            if updated_rows > 0 and collegecode != original_code:
                cursor.execute(
                    """
                    UPDATE program
                    SET "collegecode" = %s
                    WHERE "collegecode" = %s
                    """,
                    (collegecode, original_code),
                )

            conn.commit()

            return updated_rows > 0
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def delete_college(collegecode):
        conn = get_connection()
        cursor = conn.cursor()

        try:
            # Check whether programs use this college code
            cursor.execute(
                """
                SELECT 1
                FROM program
                WHERE "collegecode" = %s
                LIMIT 1
                """,
                (collegecode,),
            )

            if cursor.fetchone():
                return False

            cursor.execute(
                """
                DELETE FROM college
                WHERE "collegecode" = %s
                """,
                (collegecode,),
            )

            conn.commit()

            return True
        finally:
            cursor.close()
            conn.close()

    # Combined search, sorting, and pagination
    @staticmethod
    def filter_colleges(
        query="",
        sort_key=None,
        direction=None,
        limit=9,
        offset=0,
    ):
        valid_sort_keys = {
            "collegecode",
            "collegename",
        }

        valid_directions = {
            "asc",
            "desc",
        }

        if sort_key not in valid_sort_keys:
            sort_key = None

        if direction:
            direction = str(direction).lower()

        if direction not in valid_directions:
            direction = None

        query = str(query or "").strip()

        conn = get_connection()
        cursor = conn.cursor(
            cursor_factory=psycopg2.extras.RealDictCursor
        )

        try:
            where_clause = ""
            parameters = []

            if query:
                search_value = f"%{query}%"

                where_clause = """
                    WHERE LOWER("collegecode") LIKE LOWER(%s)
                       OR LOWER("collegename") LIKE LOWER(%s)
                """

                parameters.extend([
                    search_value,
                    search_value,
                ])

            if sort_key and direction:
                sql_direction = (
                    "ASC"
                    if direction == "asc"
                    else "DESC"
                )

                if sort_key == "collegecode":
                    order_clause = (
                        f'"collegecode" {sql_direction}'
                    )
                else:
                    order_clause = (
                        f'"collegename" {sql_direction}, '
                        f'"collegecode" ASC'
                    )
            else:
                # Default sorting
                order_clause = '"collegecode" ASC'

            query_sql = f"""
                SELECT
                    "collegecode",
                    "collegename"
                FROM college
                {where_clause}
                ORDER BY {order_clause}
                LIMIT %s OFFSET %s
            """

            parameters.extend([
                limit,
                offset,
            ])

            cursor.execute(
                query_sql,
                tuple(parameters),
            )

            return cursor.fetchall()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def search_college(
        query,
        limit=9,
        offset=0,
        sort_key=None,
        direction=None,
    ):
        return CollegeModel.filter_colleges(
            query=query,
            sort_key=sort_key,
            direction=direction,
            limit=limit,
            offset=offset,
        )

    @staticmethod
    def sort_college(
        key="collegecode",
        direction="asc",
        limit=9,
        offset=0,
    ):
        return CollegeModel.filter_colleges(
            query="",
            sort_key=key,
            direction=direction,
            limit=limit,
            offset=offset,
        )

    @staticmethod
    def get_all_colleges():
        conn = get_connection()
        cursor = conn.cursor(
            cursor_factory=psycopg2.extras.RealDictCursor
        )

        try:
            cursor.execute(
                """
                SELECT "collegecode", "collegename"
                FROM college
                ORDER BY "collegecode"
                """
            )

            return cursor.fetchall()
        finally:
            cursor.close()
            conn.close()