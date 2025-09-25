from flask import Blueprint, jsonify, request
import psycopg2
import psycopg2.extras

student_bp = Blueprint("student_bp", __name__)  # blueprint name

# PostgreSQL config
db_config = {
    "host": "localhost",
    "user": "postgres",
    "password": "quinlob123",
    "dbname": "Informationsystem"
}

def get_connection():
    return psycopg2.connect(**db_config)

# GET students with pagination
@student_bp.route("/students")
@student_bp.route("/students/<int:page>")
def get_students(page=1):
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        limit = 9
        offset = (page - 1) * limit

        cursor.execute("""
            SELECT "IdNumber", "FirstName", "LastName", "YearLevel", "Gender", "ProgramCode"
            FROM student
            LIMIT %s OFFSET %s
        """, (limit, offset))

        students = cursor.fetchall()
        cursor.close()
        conn.close()

        return jsonify([dict(row) for row in students])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# POST student
@student_bp.route("/students", methods=["POST"])
def add_student():
    try:
        data = request.json
        conn = get_connection()
        cursor = conn.cursor()

        query = """
            INSERT INTO student ("IdNumber", "FirstName", "LastName", "YearLevel", "Gender", "ProgramCode")
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        values = (
            data["IdNumber"],
            data["FirstName"],
            data["LastName"],
            data["YearLevel"],
            data["Gender"],
            data["ProgramCode"],
        )

        cursor.execute(query, values)
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Student added successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Search students
@student_bp.route("/students/search")
def search_students():
    query = request.args.get("q", "")

    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cursor.execute("""
            SELECT "IdNumber", "FirstName", "LastName", "YearLevel", "Gender", "ProgramCode"
            FROM student
            WHERE "IdNumber" ILIKE %s 
               OR "FirstName" ILIKE %s
               OR "LastName" ILIKE %s
               OR "YearLevel" ILIKE %s
               OR "Gender" ILIKE %s
               OR "ProgramCode" ILIKE %s
        """, (f"%{query}%",)*6)

        students = cursor.fetchall()
        cursor.close()
        conn.close()

        return jsonify(students)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
