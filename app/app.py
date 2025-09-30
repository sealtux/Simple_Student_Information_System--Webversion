# app.py
from flask import Flask
from flask_cors import CORS
from app.controllers.student import student_bp  

app = Flask(__name__)
CORS(app)

# 👇 important: mount blueprint under "/students"
app.register_blueprint(student_bp, url_prefix="/students")

if __name__ == "__main__":
    app.run(debug=True)
