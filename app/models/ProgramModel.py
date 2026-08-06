from app.models.databaseconnection import get_connection
import psycopg2.extras


class ProgramModel:
    @staticmethod
    def get_program(limit=9, offset=0):
        conn = get_connection()
        cursor = conn.cursor(
            cursor_factory=psycopg2.extras.RealDictCursor
        )

        try:
            cursor.execute(
                """
                SELECT
                    "programcode",
                    "programname",
                    "collegecode"
                FROM program
                ORDER BY "programcode" ASC
                LIMIT %s OFFSET %s
                """,
                (limit, offset),
            )

            return cursor.fetchall()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def add_program(programcode, programname, collegecode):
        conn = get_connection()
        cursor = conn.cursor()

        try:
            cursor.execute(
                """
                INSERT INTO program (
                    "programcode",
                    "programname",
                    "collegecode"
                )
                VALUES (%s, %s, %s)
                """,
                (
                    programcode,
                    programname,
                    collegecode,
                ),
            )

            conn.commit()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def program_code_exists(
        programcode,
        exclude_code=None,
    ):
        conn = get_connection()
        cursor = conn.cursor()

        try:
            if exclude_code:
                cursor.execute(
                    """
                    SELECT 1
                    FROM program
                    WHERE LOWER("programcode") = LOWER(%s)
                      AND LOWER("programcode") <> LOWER(%s)
                    LIMIT 1
                    """,
                    (
                        programcode,
                        exclude_code,
                    ),
                )
            else:
                cursor.execute(
                    """
                    SELECT 1
                    FROM program
                    WHERE LOWER("programcode") = LOWER(%s)
                    LIMIT 1
                    """,
                    (programcode,),
                )

            return cursor.fetchone() is not None
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def program_name_exists(
        programname,
        exclude_code=None,
    ):
        conn = get_connection()
        cursor = conn.cursor()

        try:
            if exclude_code:
                cursor.execute(
                    """
                    SELECT 1
                    FROM program
                    WHERE LOWER("programname") = LOWER(%s)
                      AND "programcode" <> %s
                    LIMIT 1
                    """,
                    (
                        programname,
                        exclude_code,
                    ),
                )
            else:
                cursor.execute(
                    """
                    SELECT 1
                    FROM program
                    WHERE LOWER("programname") = LOWER(%s)
                    LIMIT 1
                    """,
                    (programname,),
                )

            return cursor.fetchone() is not None
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def update_program(
        original_code,
        programcode,
        programname,
        collegecode,
    ):
        """
        Returns True when a program was updated.
        Also updates student ProgramCode when the code changes.
        """

        conn = get_connection()
        cursor = conn.cursor()

        try:
            cursor.execute(
                """
                UPDATE program
                SET "programcode" = %s,
                    "programname" = %s,
                    "collegecode" = %s
                WHERE "programcode" = %s
                """,
                (
                    programcode,
                    programname,
                    collegecode,
                    original_code,
                ),
            )

            updated_rows = cursor.rowcount

            if (
                updated_rows > 0
                and programcode != original_code
            ):
                cursor.execute(
                    """
                    UPDATE student
                    SET "ProgramCode" = %s
                    WHERE "ProgramCode" = %s
                    """,
                    (
                        programcode,
                        original_code,
                    ),
                )

            conn.commit()

            return updated_rows > 0
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def delete_program(programcode):
        conn = get_connection()
        cursor = conn.cursor()

        try:
            cursor.execute(
                """
                DELETE FROM program
                WHERE "programcode" = %s
                """,
                (programcode,),
            )

            conn.commit()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def search_program(
        query,
        limit=9,
        offset=0,
    ):
        conn = get_connection()
        cursor = conn.cursor(
            cursor_factory=psycopg2.extras.RealDictCursor
        )

        try:
            search_value = f"%{query}%"

            cursor.execute(
                """
                SELECT
                    "programcode",
                    "programname",
                    "collegecode"
                FROM program
                WHERE LOWER("programname") LIKE LOWER(%s)
                   OR LOWER("programcode") LIKE LOWER(%s)
                   OR LOWER("collegecode") LIKE LOWER(%s)
                ORDER BY "programcode" ASC
                LIMIT %s OFFSET %s
                """,
                (
                    search_value,
                    search_value,
                    search_value,
                    limit,
                    offset,
                ),
            )

            return cursor.fetchall()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def sort_programs(
        key="programcode",
        direction="asc",
        limit=9,
        offset=0,
    ):
        conn = get_connection()
        cursor = conn.cursor(
            cursor_factory=psycopg2.extras.RealDictCursor
        )

        try:
            valid_columns = {
                "programcode",
                "programname",
                "collegecode",
            }

            if key not in valid_columns:
                key = "programcode"

            direction = str(direction).lower()

            if direction not in {"asc", "desc"}:
                direction = "asc"

            sql_direction = (
                "ASC"
                if direction == "asc"
                else "DESC"
            )

            if key == "programcode":
                order_clause = (
                    f'"programcode" {sql_direction}'
                )
            else:
                order_clause = (
                    f'"{key}" {sql_direction}, '
                    f'"programcode" ASC'
                )

            query = f"""
                SELECT
                    "programcode",
                    "programname",
                    "collegecode"
                FROM program
                ORDER BY {order_clause}
                LIMIT %s OFFSET %s
            """

            cursor.execute(
                query,
                (
                    limit,
                    offset,
                ),
            )

            return cursor.fetchall()
        finally:
            cursor.close()
            conn.close()

    # Unified search, sorting, and pagination
    @staticmethod
    def filter_programs(
        query="",
        sort_key=None,
        direction=None,
        limit=9,
        offset=0,
    ):
        conn = get_connection()
        cursor = conn.cursor(
            cursor_factory=psycopg2.extras.RealDictCursor
        )

        try:
            valid_sort_keys = {
                "programcode",
                "programname",
                "collegecode",
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

            where_clause = ""
            parameters = []

            if query:
                search_value = f"%{query}%"

                where_clause = """
                    WHERE LOWER("programcode") LIKE LOWER(%s)
                       OR LOWER("programname") LIKE LOWER(%s)
                       OR LOWER("collegecode") LIKE LOWER(%s)
                """

                parameters.extend([
                    search_value,
                    search_value,
                    search_value,
                ])

            if sort_key and direction:
                sql_direction = (
                    "ASC"
                    if direction == "asc"
                    else "DESC"
                )

                if sort_key == "programcode":
                    order_clause = (
                        f'"programcode" {sql_direction}'
                    )
                else:
                    order_clause = (
                        f'"{sort_key}" {sql_direction}, '
                        f'"programcode" ASC'
                    )
            else:
                order_clause = '"programcode" ASC'

            sql = f"""
                SELECT
                    "programcode",
                    "programname",
                    "collegecode"
                FROM program
                {where_clause}
                ORDER BY {order_clause}
                LIMIT %s OFFSET %s
            """

            parameters.extend([
                limit,
                offset,
            ])

            cursor.execute(
                sql,
                tuple(parameters),
            )

            return cursor.fetchall()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def get_all_programs():
        conn = get_connection()
        cursor = conn.cursor(
            cursor_factory=psycopg2.extras.RealDictCursor
        )

        try:
            cursor.execute(
                """
                SELECT
                    "collegecode",
                    "programcode",
                    "programname"
                FROM program
                ORDER BY "programcode" ASC
                """
            )

            return cursor.fetchall()
        finally:
            cursor.close()
            conn.close()