from flask import Blueprint, jsonify, request
from app.models.CollegeModel import CollegeModel

college_bp = Blueprint("college_bp", __name__, url_prefix="/colleges")

# GET (Pagination)
@college_bp.route("/")
@college_bp.route("/page/<int:page>")
def get_college(page=1):
    limit = 9
    offset = (page - 1) * limit
    colleges = CollegeModel.sort_college("collegecode", limit + 1, offset)
    has_next = len(colleges) > limit

    return jsonify({
        "colleges": colleges[:limit],
        "has_next": has_next
    })

# SORT
@college_bp.route("/sort")
def sort_college():
    key = request.args.get("key", "collegecode")
    page = int(request.args.get("page", 1))
    limit = 9
    offset = (page - 1) * limit

    colleges = CollegeModel.sort_college(key, limit + 1, offset)
    has_next = len(colleges) > limit

    return jsonify({
        "colleges": colleges[:limit],
        "has_next": has_next
    })

# SEARCH (now paginated + structured like students/programs)
@college_bp.route("/search")
def search_college():
    query = request.args.get("q", "").strip()
    page = int(request.args.get("page", 1))
    limit = 9
    offset = (page - 1) * limit

    try:
        colleges = CollegeModel.search_college(query, limit + 1, offset)
        has_next = len(colleges) > limit
        return jsonify({
            "colleges": colleges[:limit],
            "has_next": has_next
        })
    except Exception as e:
        print("❌ College search error:", e)
        return jsonify({"error": "Failed to search colleges"}), 500

# POST (Add)
@college_bp.route("/", methods=["POST"])
def add_college():
    data = request.get_json() or {}

    required_fields = ["collegecode", "collegename"]
    for field in required_fields:
        if not data.get(field) or str(data.get(field)).strip() == "":
            return jsonify({"error": f"{field} is required"}), 400

    code = data["collegecode"]
    name = data["collegename"]

    # 🔒 BACKEND DUPLICATE CHECKS
    if CollegeModel.college_code_exists(code):
        return jsonify({"error": "A college with this code already exists."}), 400

    if CollegeModel.college_name_exists(name):
        return jsonify({"error": "A college with this name already exists."}), 400

    try:
        CollegeModel.add_college(code, name)
        return jsonify({"message": "College added successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# PUT (Update)
@college_bp.route("/<string:collegecode>", methods=["PUT"])
def update_college(collegecode):
    data = request.get_json() or {}

    required_fields = ["collegecode", "collegename"]
    for field in required_fields:
        if not data.get(field) or str(data.get(field)).strip() == "":
            return jsonify({"error": f"{field} is required"}), 400

    new_code = data["collegecode"]
    new_name = data["collegename"]

    # 🔒 BACKEND DUPLICATE CHECKS (ignore the college being edited)
    if CollegeModel.college_code_exists(new_code, exclude_code=collegecode):
        return jsonify({"error": "A college with this code already exists."}), 400

    if CollegeModel.college_name_exists(new_name, exclude_code=collegecode):
        return jsonify({"error": "A college with this name already exists."}), 400

    try:
        updated = CollegeModel.update_college(
            collegecode,
            new_code,
            new_name
        )

        if not updated:
            return jsonify({"error": "College not found"}), 404

        return jsonify({"message": "College updated successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# DELETE
@college_bp.route("/<string:collegecode>", methods=["DELETE"])
def delete_college(collegecode):
    try:
        deleted = CollegeModel.delete_college(collegecode)

        if not deleted:
            return jsonify({
                "error": "Cannot delete college because there are programs linked to it."
            }), 400

        return jsonify({"message": "College deleted successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ALL (for dropdowns / global validation)
@college_bp.route("/all", methods=["GET"])
def get_all_colleges_route():
    colleges = CollegeModel.get_all_colleges()
    return jsonify({"colleges": colleges}), 200
