from app.models.databaseconnection import get_connection
import psycopg2.extras

class LoginModel:
    @staticmethod
    def check_credentials(username,password):
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        try:
            query = """
                SELECT * FROM login
                WHERE username = %s AND password = %s

            """
            cursor.execute(query,(username,password))
            user = cursor.fetchone()
            return user
        
        finally:
            cursor.close()
            conn.close()
            