from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
import psycopg2.extras

app = Flask(__name__)
CORS(app)

# PostgreSQL config
db_config = {
    "host": "localhost",
    "user": "postgres",      # change to your PostgreSQL user
    "password": "quinlob123",  # ⚠️ change to your actual password
    "dbname": "Informationsystem"
}

# helper function for connection
def get_connection():
    return psycopg2.connect(**db_config)

@app.route("/")
def home():
    return "Hello, Flask + PostgreSQL!"

# 🔹 GET students with pagination
@app.route("/students")
@app.route("/students/<int:page>")
def get_students(page=1):
    try:
        conn = get_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        limit = 11
        offset = (page - 1) * limit

        cursor.execute("""
            SELECT "IdNumber", "FirstName", "LastName", "YearLevel", "Gender", "ProgramCode"
            FROM student
            LIMIT %s OFFSET %s
        """, (limit, offset))

        students = cursor.fetchall()

        cursor.close()
        conn.close()

        # convert rows into list of dicts
        return jsonify([dict(row) for row in students])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 🔹 POST student
@app.route("/students", methods=["POST"])
def add_student():
    try:
        data = request.json  # read JSON from React
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
    
@app.route("/students/search")
def search_students():
    query = request.args.get("q", "")

    try:
        conn = psycopg2.connect(**db_config)
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



if __name__ == "__main__":
    app.run(debug=True)
