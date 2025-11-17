# app.py
from flask import Flask
from flask_cors import CORS
from app.controllers.student import student_bp
from app.controllers.program import program_bp  # <-- add this
from app.controllers.college import college_bp
from app.controllers.login import login_bp

app = Flask(__name__)
CORS(app)

# register blueprints
app.register_blueprint(student_bp, url_prefix="/students")
app.register_blueprint(program_bp, url_prefix="/programs")  # <-- add this
app.register_blueprint(college_bp, url_prefix="/colleges")
app.register_blueprint(login_bp, url_prefix="/login")

if __name__ == "__main__":
    app.run(debug=True)
