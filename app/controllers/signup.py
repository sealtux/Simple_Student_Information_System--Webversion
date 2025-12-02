from flask import Blueprint,request,jsonify
from app.database import get_connection
import psycopg2.extras

signup_bp = Blueprint("signup_bp",__name__, url_prefix ="/signup")

@signup_bp.route("/",methods = ["POST"])
def signup():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error":"Username and password requires"}),400
    
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            "INSERT INTO login (username, password) VALUES (%s, %s)",
            (username,password)
        )
        conn.commit()
        return jsonify({"success":True,"message":"Signup successful"}), 201

    except psycopg2.Error:
        return jsonify({"error": "Username already exists"}),400
    
    finally:
        cur.close()
        conn.close()