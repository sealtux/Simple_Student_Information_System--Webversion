from app.database import get_connection
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

    @staticmethod
    def update_program(original_code, programcode, programname, collegecode):
        conn = get_connection()
        cursor = conn.cursor()
        try:
            # Update the program table (lowercase columns)
            cursor.execute("""
                UPDATE program
                SET programcode = %s, programname = %s, collegecode = %s
                WHERE programcode = %s
            """, (programcode, programname, collegecode, original_code))

            # Update the student table (capitalized "ProgramCode" column)
            if programcode != original_code:
                cursor.execute("""
                    UPDATE student
                    SET "ProgramCode" = %s
                    WHERE "ProgramCode" = %s
                """, (programcode, original_code))

            conn.commit()
        finally:
            cursor.close()
            conn.close()


    @staticmethod
    def delete_program(programcode):
        conn = get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""DELETE FROM program WHERE "programcode" = %s""", (programcode,))
            conn.commit()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def search_program(query, limit=9, offset=0):
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            cursor.execute("""
                SELECT "programcode", "programname", "collegecode"
                FROM program
                WHERE LOWER("programname") LIKE LOWER(%s)
                OR LOWER("programcode") LIKE LOWER(%s)
                OR LOWER("collegecode") LIKE LOWER(%s)
                ORDER BY "programcode"
                LIMIT %s OFFSET %s
            """, (f"%{query}%", f"%{query}%", f"%{query}%", limit, offset))
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
