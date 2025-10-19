# controllers/student_controller.py
from flask import Blueprint, jsonify, request
from app.models.StudentModel import StudentModel

from app.database import get_connection
student_bp = Blueprint("student_bp", __name__, url_prefix="/students")

@student_bp.route("/")
@student_bp.route("/page/<int:page>")
def get_students(page=1):
    limit = 9
    offset = (page - 1) * limit
    students = StudentModel.get_students(limit, offset)
    return jsonify(students)


@student_bp.route("/", methods=["POST"])
def add_student():
    data = request.json
    required_fields = ["IdNumber", "FirstName", "LastName", "YearLevel", "Gender", "ProgramCode"]
    for field in required_fields:
        if not data.get(field) or str(data.get(field)).strip() == "":
            return jsonify({"error": f"{field} is required"}), 400
    try:
        StudentModel.add_student(data)
        return jsonify({"message": "Student added successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@student_bp.route("/<id>", methods=["DELETE"])
def delete_student(id):
    deleted = StudentModel.delete_student(id)
    if not deleted:
        return jsonify({"error": "Student not found"}), 404
    return jsonify({"message": f"Student {id} deleted successfully"})


@student_bp.route("/search")
def search_students():
    query_text = request.args.get("q", "").strip()
    page = int(request.args.get("page", 1))
    limit = 9
    offset = (page - 1) * limit
    students = StudentModel.search_students(query_text, limit, offset)
    return jsonify(students)

@student_bp.route("/sort")
def sort_students():
    key = request.args.get("key", "IdNumber")
    page = int(request.args.get("page", 1))
    limit = 9
    offset = (page - 1) * limit

    try:
        students = StudentModel.sort_students(key, limit, offset)
        return jsonify(students), 200
    except Exception as e:
        print("Error sorting students:", e)
        return jsonify({"error": "Failed to sort students"}), 500

@student_bp.route("/<id>", methods=["PUT"])
def update_student(id):
    data = request.json
    required_fields = ["FirstName", "LastName", "YearLevel", "Gender", "ProgramCode"]
    
    for field in required_fields:
        if not data.get(field) or str(data.get(field)).strip() == "":
            return jsonify({"error": f"{field} is required"}), 400

    try:
        updated = StudentModel.update_student(id, data)
        if not updated:
            return jsonify({"error": "Student not found"}), 404
        return jsonify({"message": f"Student {id} updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
