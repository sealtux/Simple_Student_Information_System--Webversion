from app.models.databaseconnection import get_connection
import psycopg2.extras


class CollegeModel:
    @staticmethod
    def get_college(limit=9, offset=0):
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            cursor.execute("""
                SELECT "collegecode", "collegename"
                FROM college
                LIMIT %s OFFSET %s
            """, (limit, offset))
            return cursor.fetchall()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def add_college(collegecode, collegename):
        conn = get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                INSERT INTO college ("collegecode", "collegename")
                VALUES (%s, %s)
            """, (collegecode, collegename))
            conn.commit()
        finally:
            cursor.close()
            conn.close()

    # 🔹 Check if a college code exists (optional: ignore one code)
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

    # 🔹 Check if a college name exists (optional: ignore one code)
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
            # 1️⃣ Update the college itself
            cursor.execute("""
                UPDATE college
                SET "collegecode" = %s,
                    "collegename" = %s
                WHERE "collegecode" = %s
            """, (collegecode, collegename, original_code))

            updated_rows = cursor.rowcount

            # 2️⃣ Then update all programs that reference it
            if updated_rows > 0 and collegecode != original_code:
                cursor.execute("""
                    UPDATE program
                    SET "collegecode" = %s
                    WHERE "collegecode" = %s
                """, (collegecode, original_code))

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
            # 1️⃣ Check if there are programs using this collegecode
            cursor.execute("""
                SELECT 1
                FROM program
                WHERE "collegecode" = %s
                LIMIT 1
            """, (collegecode,))

            if cursor.fetchone():
                # ❌ There is at least one program linked to this college
                return False

            # 2️⃣ Safe to delete
            cursor.execute("""
                DELETE FROM college
                WHERE "collegecode" = %s
            """, (collegecode,))
            conn.commit()
            return True
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def search_college(query, limit=9, offset=0):
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            cursor.execute("""
                SELECT "collegecode", "collegename"
                FROM college
                WHERE LOWER("collegecode") LIKE LOWER(%s)
                   OR LOWER("collegename") LIKE LOWER(%s)
                ORDER BY "collegecode"
                LIMIT %s OFFSET %s
            """, (f"%{query}%", f"%{query}%", limit, offset))
            return cursor.fetchall()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def sort_college(key="collegecode", limit=9, offset=0):
        valid_keys = {"collegecode", "collegename"}
        if key not in valid_keys:
            key = "collegecode"

        conn = get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            cursor.execute(f"""
                SELECT "collegecode", "collegename"
                FROM college
                ORDER BY "{key}"
                LIMIT %s OFFSET %s
            """, (limit, offset))
            return cursor.fetchall()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def get_all_colleges():
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            cursor.execute("""
                SELECT "collegecode", "collegename"
                FROM college
                ORDER BY "collegecode"
            """)
            return cursor.fetchall()
        finally:
            cursor.close()
            conn.close()
