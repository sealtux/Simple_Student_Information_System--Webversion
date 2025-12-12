import os
from flask import Flask, send_from_directory
from flask_cors import CORS

from app.controllers.student import student_bp
from app.controllers.program import program_bp
from app.controllers.college import college_bp
from app.controllers.login import login_bp
from app.controllers.signup import signup_bp


def create_app():
    # Path to React build folder: app/views/dist
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    static_dir = os.path.join(BASE_DIR, "views", "dist")

    # Tell Flask to serve static files from React's build directory
    app = Flask(
        __name__,
        static_folder=static_dir,   # where index.html & assets live
        static_url_path="/"         # serve them from root
    )

    CORS(app)

    # ✅ Blueprints already have url_prefix in their definitions
    app.register_blueprint(student_bp)
    app.register_blueprint(program_bp)
    app.register_blueprint(college_bp)
    app.register_blueprint(login_bp)
    app.register_blueprint(signup_bp)

    # ---------- SPA (React) fallback routes ----------
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_react(path):
        """
        If the file exists in dist/, serve it (JS, CSS, images).
        Otherwise, always return index.html so React Router can handle the route.
        """
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)

        # Fallback: always send React index.html
        return send_from_directory(app.static_folder, "index.html")

    return app


app = create_app()
