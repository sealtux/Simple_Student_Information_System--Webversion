# controllers/student_controller.py
from flask import Blueprint, jsonify, request
from app.models.StudentModel import StudentModel

from app.database import get_connection
student_bp = Blueprint("student_bp", __name__, url_prefix="/students")

@student_bp.route("/")
@student_bp.route("/page/<int:page>")
@student_bp.route("/page/<int:page>")
def get_students(page=1):
    limit = 9
    offset = (page - 1) * limit + 0  # offset calculation
    students = StudentModel.get_students(limit + 1, offset)  # fetch one extra row
    has_next = len(students) > limit

    # only return the limit number of students
    return jsonify({
        "students": students[:limit],
        "has_next": has_next
    })



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

    # fetch one extra to determine if there’s a next page
    students = StudentModel.search_students(query_text, limit + 1, offset)
    has_next = len(students) > limit

    return jsonify({
        "students": students[:limit],
        "has_next": has_next
    })

@student_bp.route("/sort")
def sort_students():
    key = request.args.get("key", "IdNumber")
    page = int(request.args.get("page", 1))
    limit = 9
    offset = (page - 1) * limit

    try:
        students = StudentModel.sort_students(key, limit + 1, offset)
        has_next = len(students) > limit
        return jsonify({
            "students": students[:limit],
            "has_next": has_next
        }), 200
    except Exception as e:
        print("❌ Sort error:", e)
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
@student_bp.route("/by-program/<string:programcode>")
def get_students_by_program(programcode):
    from app.models.StudentModel import StudentModel
    students = StudentModel.get_students_by_program(programcode)
    return jsonify({"students": students}), 200
