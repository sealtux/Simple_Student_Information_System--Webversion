from flask import Blueprint, jsonify, request
from app.models.ProgramModel import ProgramModel

program_bp = Blueprint("program_bp", __name__, url_prefix="/programs")


@program_bp.route("/")
@program_bp.route("/page/<int:page>")
def get_program(page=1):
    limit = 9
    offset = (page - 1) * limit
    programs = ProgramModel.get_program(limit + 1, offset)
    has_next = len(programs) > limit
    return jsonify({
        "programs": programs[:limit],
        "has_next": has_next
    })


@program_bp.route("/all", methods=["GET"])
def get_all_programs_route():
    programs = ProgramModel.get_all_programs()
    return jsonify({"programs": programs}), 200


@program_bp.route("/", methods=["POST"])
def add_program():
    data = request.get_json() or {}

    required_fields = ["programcode", "programname", "collegecode"]
    for field in required_fields:
        if not data.get(field) or str(data.get(field)).strip() == "":
            return jsonify({"error": f"{field} is required"}), 400

    code = data["programcode"]
    name = data["programname"]
    college = data["collegecode"]

    # 🔒 BACKEND DUPLICATE CHECKS
    if ProgramModel.program_code_exists(code):
        return jsonify({"error": "A program with this code already exists."}), 400

    if ProgramModel.program_name_exists(name):
        return jsonify({"error": "A program with this name already exists."}), 400

    try:
        ProgramModel.add_program(code, name, college)
        return jsonify({"message": "Program added successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@program_bp.route("/<string:programcode>", methods=["PUT"])
def update_program(programcode):
    data = request.get_json() or {}

    required_fields = ["programcode", "programname", "collegecode"]
    for field in required_fields:
        if not data.get(field) or str(data.get(field)).strip() == "":
            return jsonify({"error": f"{field} is required"}), 400

    new_code = data["programcode"]
    new_name = data["programname"]
    new_college = data["collegecode"]

    # 🔒 BACKEND DUPLICATE CHECKS (ignore the current program being edited)
    if ProgramModel.program_code_exists(new_code, exclude_code=programcode):
        return jsonify({"error": "A program with this code already exists."}), 400

    if ProgramModel.program_name_exists(new_name, exclude_code=programcode):
        return jsonify({"error": "A program with this name already exists."}), 400

    try:
        updated = ProgramModel.update_program(
            programcode,
            new_code,
            new_name,
            new_college
        )

        if not updated:
            return jsonify({"error": "Program not found"}), 404

        return jsonify({"message": "Program updated successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@program_bp.route("/<string:programcode>", methods=["DELETE"])
def delete_program(programcode):
    try:
        ProgramModel.delete_program(programcode)
        return jsonify({"message": "Program deleted successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@program_bp.route("/search")
def search_program():
    query = request.args.get("q", "")
    page = int(request.args.get("page", 1))
    limit = 9
    offset = (page - 1) * limit

    try:
        programs = ProgramModel.search_program(query, limit + 1, offset)
        has_next = len(programs) > limit
        return jsonify({
            "programs": programs[:limit],
            "has_next": has_next
        })
    except Exception as e:
        print("❌ Search error:", e)
        return jsonify({"error": "Failed to search programs"}), 500


@program_bp.route("/sort")
def sort_programs():
    key = request.args.get("key", "programcode")
    page = int(request.args.get("page", 1))
    limit = 9
    offset = (page - 1) * limit

    try:
        programs = ProgramModel.sort_programs(key, limit + 1, offset)
        has_next = len(programs) > limit
        return jsonify({
            "programs": programs[:limit],
            "has_next": has_next
        }), 200
    except Exception as e:
        print("❌ Sort error:", e)
        return jsonify({"error": "Failed to sort programs"}), 500
