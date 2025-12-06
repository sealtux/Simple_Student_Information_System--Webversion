from flask import Flask
from flask_cors import CORS

from app.controllers.student import student_bp
from app.controllers.program import program_bp
from app.controllers.college import college_bp
from app.controllers.login import login_bp
from app.controllers.signup import signup_bp


def create_app():
    app = Flask(__name__)
    CORS(app)

  
    app.register_blueprint(student_bp, url_prefix="/students")
    app.register_blueprint(program_bp, url_prefix="/programs")
    app.register_blueprint(college_bp, url_prefix="/colleges")
    app.register_blueprint(login_bp, url_prefix="/login")
    app.register_blueprint(signup_bp, url_prefix="/signup")

    return app



app = create_app()
