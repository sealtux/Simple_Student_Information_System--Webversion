from app.models.databaseconnection import get_connection
import psycopg2.extras

class StudentModel:

    @staticmethod
    def get_students(limit=9, offset=0):
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            cursor.execute("""
                SELECT "IdNumber", "FirstName", "LastName", "YearLevel", "Gender", 
                       "ProgramCode", "profile_url"
                FROM student
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
                INSERT INTO student 
                ("IdNumber", "FirstName", "LastName", "YearLevel", "Gender", "ProgramCode", "profile_url")
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                data["IdNumber"],
                data["FirstName"],
                data["LastName"],
                data["YearLevel"],
                data["Gender"],
                data["ProgramCode"],
                data.get("profile_url")  # 🔥 new
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
            cursor.execute(
                'DELETE FROM student WHERE "IdNumber" = %s RETURNING "IdNumber"', 
                (id,)
            )
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
                    SELECT "IdNumber", "FirstName", "LastName", "YearLevel", "Gender", 
                           "ProgramCode", "profile_url"
                    FROM student
                    ORDER BY "IdNumber"
                    LIMIT %s OFFSET %s
                """, (limit, offset))
            else:
                q = f"%{query_text}%"
                cursor.execute("""
                    SELECT "IdNumber", "FirstName", "LastName", "YearLevel", "Gender", 
                           "ProgramCode", "profile_url"
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

    @staticmethod
    def sort_students(key="IdNumber", limit=9, offset=0):
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            valid_columns = {"IdNumber", "FirstName", "LastName", "YearLevel", "Gender", "ProgramCode"}
            if key not in valid_columns:
                key = "IdNumber"

            cursor.execute(f'''
                SELECT "IdNumber", "FirstName", "LastName", "YearLevel", "Gender", 
                       "ProgramCode", "profile_url"
                FROM student
                ORDER BY "{key}" ASC
                LIMIT %s OFFSET %s
            ''', (limit, offset))

            return cursor.fetchall()
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def update_student(old_id, data):
        conn = get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                UPDATE student
                SET "IdNumber" = %s,
                    "FirstName" = %s,
                    "LastName" = %s,
                    "YearLevel" = %s,
                    "Gender" = %s,
                    "ProgramCode" = %s,
                    "profile_url" = %s
                WHERE "IdNumber" = %s
                RETURNING "IdNumber"
            """, (
                data["IdNumber"],
                data["FirstName"],
                data["LastName"],
                data["YearLevel"],
                data["Gender"],
                data["ProgramCode"],
                data.get("profile_url"),  
                old_id
            ))
            updated = cursor.fetchone()
            conn.commit()
            return updated is not None
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def get_students_by_program(programcode):
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            cursor.execute("""
                SELECT "IdNumber", "FirstName", "LastName", "ProgramCode", "profile_url"
                FROM student
                WHERE LOWER("ProgramCode") = LOWER(%s)
            """, (programcode,))
            return cursor.fetchall()
        finally:
            cursor.close()
            conn.close()


    @staticmethod
    def id_exists(id_number, exclude_id=None):
        """
        Check if an IdNumber already exists.
        If exclude_id is given, ignore that IdNumber (for edits).
        """
        conn = get_connection()
        cursor = conn.cursor()
        try:
            if exclude_id:
                cursor.execute(
                    'SELECT 1 FROM student WHERE "IdNumber" = %s AND "IdNumber" <> %s LIMIT 1',
                    (id_number, exclude_id)
                )
            else:
                cursor.execute(
                    'SELECT 1 FROM student WHERE "IdNumber" = %s LIMIT 1',
                    (id_number,)
                )
            return cursor.fetchone() is not None
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def name_exists(first_name, last_name, exclude_id=None):
        """
        Check if a FirstName + LastName combination already exists
        (case-insensitive). If exclude_id is given, ignore that IdNumber.
        """
        conn = get_connection()
        cursor = conn.cursor()
        try:
            if exclude_id:
                cursor.execute(
                    '''
                    SELECT 1 FROM student
                    WHERE LOWER("FirstName") = LOWER(%s)
                      AND LOWER("LastName") = LOWER(%s)
                      AND "IdNumber" <> %s
                    LIMIT 1
                    ''',
                    (first_name, last_name, exclude_id)
                )
            else:
                cursor.execute(
                    '''
                    SELECT 1 FROM student
                    WHERE LOWER("FirstName") = LOWER(%s)
                      AND LOWER("LastName") = LOWER(%s)
                    LIMIT 1
                    ''',
                    (first_name, last_name)
                )
            return cursor.fetchone() is not None
        finally:
            cursor.close()
            conn.close()

    @staticmethod
    def get_students_filtered(
        yearlevel=None,
        gender=None,
        programcode=None,
        query_text="",
        sortkey="IdNumber",
        limit=9,
        offset=0
    ):
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            base_query = """
                SELECT "IdNumber", "FirstName", "LastName",
                    "YearLevel", "Gender", "ProgramCode", "profile_url"
                FROM student
            """
            conditions = []
            params = []

            if yearlevel:
                conditions.append('"YearLevel" = %s')
                params.append(yearlevel)

            if gender:
                conditions.append('"Gender" = %s')
                params.append(gender)

            if programcode:
                conditions.append('LOWER("ProgramCode") = LOWER(%s)')
                params.append(programcode)

            if query_text:
                q = f"%{query_text}%"
                conditions.append(
                    '('
                    '"IdNumber" ILIKE %s OR '
                    '"FirstName" ILIKE %s OR '
                    '"LastName" ILIKE %s OR '
                    '"YearLevel" ILIKE %s OR '
                    '"Gender" ILIKE %s OR '
                    '"ProgramCode" ILIKE %s'
                    ')'
                )
                params.extend([q, q, q, q, q, q])

            if conditions:
                base_query += " WHERE " + " AND ".join(conditions)

            # validate sortkey to avoid SQL injection
            valid_columns = {
                "IdNumber",
                "FirstName",
                "LastName",
                "YearLevel",
                "Gender",
                "ProgramCode",
            }
            if sortkey not in valid_columns:
                sortkey = "IdNumber"

            base_query += f' ORDER BY "{sortkey}" LIMIT %s OFFSET %s'
            params.extend([limit, offset])

            cursor.execute(base_query, params)
            return cursor.fetchall()
        finally:
            cursor.close()
            conn.close()

