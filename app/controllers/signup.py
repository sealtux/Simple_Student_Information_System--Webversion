from flask import Blueprint, request, jsonify
from app.models.databaseconnection import get_connection
import psycopg2.extras

signup_bp = Blueprint("signup_bp", __name__, url_prefix="/signup")

@signup_bp.route("/", methods=["POST"])
def signup():
    data = request.get_json() or {}

    # Trim spaces from username and password
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    conn = get_connection()
    cur = conn.cursor()

    try:
        # 1️⃣ Check if username already exists
        cur.execute(
            "SELECT 1 FROM login WHERE username = %s",
            (username,)
        )
        if cur.fetchone():
            # Username already taken
            return jsonify({"error": "Username already exists"}), 409

        # 2️⃣ Insert new user
        cur.execute(
            "INSERT INTO login (username, password) VALUES (%s, %s)",
            (username, password)
        )
        conn.commit()
        return jsonify({"success": True, "message": "Signup successful"}), 201

    except psycopg2.Error as e:
        # Something else went wrong (connection, syntax, etc.)
        conn.rollback()
        print("DB error in signup:", e)
        return jsonify({"error": "Database error"}), 500

    finally:
        cur.close()
        conn.close()
