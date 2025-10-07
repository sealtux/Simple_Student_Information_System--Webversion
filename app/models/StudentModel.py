from app.database import get_connection
import psycopg2.extras

class StudentModel:

    @staticmethod
    def get_students(limit=9, offset=0):
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            cursor.execute("""
                SELECT "IdNumber", "FirstName", "LastName", "YearLevel", "Gender", "ProgramCode"
                FROM student
                ORDER BY "IdNumber"
                LIMIT %s OFFSET %s
            """, (limit, offset))
            return cursor.fetchall()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def add_student(data: dict):
        conn = get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                INSERT INTO student ("IdNumber", "FirstName", "LastName", "YearLevel", "Gender", "ProgramCode")
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                data["IdNumber"], data["FirstName"], data["LastName"],
                data["YearLevel"], data["Gender"], data["ProgramCode"]
            ))
            conn.commit()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def delete_student(id):
        conn = get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute('DELETE FROM student WHERE "IdNumber" = %s RETURNING "IdNumber"', (id,))
            deleted = cursor.fetchone()
            conn.commit()
            return deleted is not None
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def search_students(query_text="", limit=9, offset=0):
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            if query_text == "":
                cursor.execute("""
                    SELECT "IdNumber", "FirstName", "LastName", "YearLevel", "Gender", "ProgramCode"
                    FROM student
                    ORDER BY "IdNumber"
                    LIMIT %s OFFSET %s
                """, (limit, offset))
            else:
                q = f"%{query_text}%"
                cursor.execute("""
                    SELECT "IdNumber", "FirstName", "LastName", "YearLevel", "Gender", "ProgramCode"
                    FROM student
                    WHERE "IdNumber" ILIKE %s
                       OR "FirstName" ILIKE %s
                       OR "LastName" ILIKE %s
                       OR "YearLevel" ILIKE %s
                       OR "Gender" ILIKE %s
                       OR "ProgramCode" ILIKE %s
                    ORDER BY "IdNumber"
                    LIMIT %s OFFSET %s
                """, (q, q, q, q, q, q, limit, offset))
            return cursor.fetchall()
        finally:
            cursor.close()
            conn.close()
