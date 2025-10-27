from flask import Blueprint, jsonify, request
from app.models.ProgramModel import ProgramModel

program_bp = Blueprint("program_bp", __name__, url_prefix="/programs")

# GET (pagination)
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

# POST (add)
@program_bp.route("/", methods=["POST"])
def add_program():
    data = request.get_json()
    required_fields = ["programcode", "programname", "collegecode"]
    if not all(field in data and data[field].strip() for field in required_fields):
        return jsonify({"error": "All fields are required"}), 400

    try:
        ProgramModel.add_program(
            data["programcode"],
            data["programname"],
            data["collegecode"]
        )
        return jsonify({"message": "Program added successfully!"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# PUT (update)
@program_bp.route("/<string:programcode>", methods=["PUT"])
def update_program(programcode):
    data = request.get_json()
    try:
        ProgramModel.update_program(
            programcode,
            data["programcode"],
            data["programname"],
            data["collegecode"]
        )
        return jsonify({"message": "Program updated successfully!"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# DELETE
@program_bp.route("/<string:programcode>", methods=["DELETE"])
def delete_program(programcode):
    try:
        ProgramModel.delete_program(programcode)
        return jsonify({"message": "Program deleted successfully!"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# SEARCH
# SEARCH with pagination
@program_bp.route("/search")
def search_program():
    query = request.args.get("q", "")
    page = int(request.args.get("page", 1))
    limit = 9
    offset = (page - 1) * limit

    try:
        # fetch limit+1 to check if there is a next page
        programs = ProgramModel.search_program(query, limit + 1, offset)
        has_next = len(programs) > limit
        return jsonify({
            "programs": programs[:limit],
            "has_next": has_next
        })
    except Exception as e:
        print("❌ Search error:", e)
        return jsonify({"error": "Failed to search programs"}), 500


# SORT
@program_bp.route("/sort")
def sort_programs():
    key = request.args.get("key", "ProgramCode")
    page = int(request.args.get("page", 1))
    limit = 9
    offset = (page - 1) * limit

    try:
        programs = ProgramModel.sort_programs(key, limit + 1, offset)
        has_next = len(programs) > limit  # check if there’s another page
        return jsonify({
            "programs": programs[:limit],
            "has_next": has_next
        }), 200
    except Exception as e:
        print("❌ Sort error:", e)
        return jsonify({"error": "Failed to sort programs"}), 500




