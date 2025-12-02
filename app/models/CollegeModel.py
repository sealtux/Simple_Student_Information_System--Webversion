from app.database import get_connection
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

    @staticmethod
    def update_college(original_code, collegecode, collegename):
        conn = get_connection()
        cursor = conn.cursor()
        try:
            # 1️⃣ Update the college itself first
            cursor.execute("""
                UPDATE college
                SET "collegecode" = %s, "collegename" = %s
                WHERE "collegecode" = %s
            """, (collegecode, collegename, original_code))

            if cursor.rowcount == 0:
                raise Exception("College not found")

            # 2️⃣ Then update all programs that reference it
            if collegecode != original_code:
                cursor.execute("""
                    UPDATE program
                    SET "collegecode" = %s
                    WHERE "collegecode" = %s
                """, (collegecode, original_code))

            conn.commit()
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
    def search_college(query):
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            cursor.execute("""
                SELECT "collegecode", "collegename"
                FROM college
                WHERE LOWER("collegecode") LIKE LOWER(%s)
                OR LOWER("collegename") LIKE LOWER(%s)
                ORDER BY "collegecode"
            """, (f"%{query}%", f"%{query}%"))
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