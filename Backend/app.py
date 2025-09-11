from flask import Flask, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)  

db_config = {
    "host": "localhost",      
    "user": "root",           
    "password": "password",  
    "database": "informationsystem"   
}

@app.route("/")
def home():
    return "Hello, Flask + MySQL!"

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



if __name__ == "__main__":
    app.run(debug=True)
