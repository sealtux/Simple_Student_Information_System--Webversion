from flask import Blueprint, jsonify, request
from app.models.LoginModel import LoginModel

login_bp = Blueprint("login_bp", __name__, url_prefix="/login")

@login_bp.route("/", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"success": False, "error": "Username and password are required"}), 400

    user = LoginModel.check_credentials(username, password)

    if user:
        return jsonify({"success": True, "message": "Login successful", "user": user}), 200
    else:
        return jsonify({"success": False, "error": "Invalid username or password"}), 401

