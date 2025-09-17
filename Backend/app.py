from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)

db_config = {
    "host": "localhost",
    "user": "root",
    "password": "password",  # ⚠️ replace with your actual password
    "database": "informationsystem"
}

@app.route("/")
def home():
    return "Hello, Flask + MySQL!"

# GET students
@app.route("/students")
@app.route("/students/<int:page>")
def get_students(page=1):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        limit = 11
        offset = (page - 1) * limit

        cursor.execute("""
            SELECT IdNumber, FirstName, LastName, YearLevel, Gender, ProgramCode
            FROM student
            LIMIT %s OFFSET %s
        """, (limit, offset))

        students = cursor.fetchall()

        cursor.close()
        conn.close()
        return jsonify(students)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 🔹 POST student
@app.route("/students", methods=["POST"])
def add_student():
    try:
        data = request.json  # read JSON from React
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        query = """
            INSERT INTO student (IdNumber, FirstName, LastName, YearLevel, Gender, ProgramCode)
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

if __name__ == "__main__":
    app.run(debug=True)
