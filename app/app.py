from flask import Flask
from flask_cors import CORS
from controllers.student import student_bp  # import the corrected blueprint

app = Flask(__name__)
CORS(app)

app.register_blueprint(student_bp)  # register the student blueprint

if __name__ == "__main__":
    app.run(debug=True)
