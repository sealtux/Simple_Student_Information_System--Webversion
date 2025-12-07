from app.models.databaseconnection import get_connection
import psycopg2.extras


class ProgramModel:
    @staticmethod
    def get_program(limit=9, offset=0):
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            cursor.execute("""
                SELECT "programcode", "programname", "collegecode"
                FROM program
                LIMIT %s OFFSET %s
            """, (limit, offset))
            return cursor.fetchall()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def add_program(programcode, programname, collegecode):
        conn = get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                INSERT INTO program ("programcode", "programname", "collegecode")
                VALUES (%s, %s, %s)
            """, (programcode, programname, collegecode))
            conn.commit()
        finally:
            cursor.close()
            conn.close()

    # 🔹 NEW: check if a program code already exists (optionally ignore one code)
    @staticmethod
    def program_code_exists(programcode, exclude_code=None):
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
                    (programcode, exclude_code),
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

    # 🔹 NEW: check if a program name already exists (optionally ignore one code)
    @staticmethod
    def program_name_exists(programname, exclude_code=None):
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
                    (programname, exclude_code),
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
    def update_program(original_code, programcode, programname, collegecode):
        """
        Returns True if a program row was updated, False if not found.
        Also updates student."ProgramCode" if the code changes.
        """
        conn = get_connection()
        cursor = conn.cursor()
        try:
            # Update the program row
            cursor.execute(
                """
                UPDATE program
                SET "programcode" = %s,
                    "programname" = %s,
                    "collegecode" = %s
                WHERE "programcode" = %s
                """,
                (programcode, programname, collegecode, original_code),
            )

            updated_rows = cursor.rowcount

            # If updated and program code changed, also update students
            if updated_rows > 0 and programcode != original_code:
                cursor.execute(
                    """
                    UPDATE student
                    SET "ProgramCode" = %s
                    WHERE "ProgramCode" = %s
                    """,
                    (programcode, original_code),
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
                """DELETE FROM program WHERE "programcode" = %s""",
                (programcode,),
            )
            conn.commit()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def search_program(query, limit=9, offset=0):
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            cursor.execute(
                """
                SELECT "programcode", "programname", "collegecode"
                FROM program
                WHERE LOWER("programname") LIKE LOWER(%s)
                   OR LOWER("programcode") LIKE LOWER(%s)
                   OR LOWER("collegecode") LIKE LOWER(%s)
                ORDER BY "programcode"
                LIMIT %s OFFSET %s
                """,
                (f"%{query}%", f"%{query}%", f"%{query}%", limit, offset),
            )
            return cursor.fetchall()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def sort_programs(key="programcode", limit=9, offset=0):
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            valid_columns = {"programcode", "programname", "collegecode"}
            if key not in valid_columns:
                key = "programcode"

            query = f'''
                SELECT "programcode", "programname", "collegecode"
                FROM program
                ORDER BY "{key}"
                LIMIT %s OFFSET %s
            '''
            cursor.execute(query, (limit, offset))
            return cursor.fetchall()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def get_all_programs():
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            cursor.execute(
                """
                SELECT "collegecode", "programcode", "programname"
                FROM program
                ORDER BY "programcode"
                """
            )
            return cursor.fetchall()
        finally:
            cursor.close()
            conn.close()
