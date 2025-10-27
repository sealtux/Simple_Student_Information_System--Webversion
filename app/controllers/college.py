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

# SEARCH
@college_bp.route("/search")
def search_college():
    query = request.args.get("q", "")
    results = CollegeModel.search_college(query)
    return jsonify(results)

# POST (Add)
@college_bp.route("/", methods=["POST"])
def add_college():
    data = request.get_json()
    required_fields = ["collegecode", "collegename"]
    if not all(field in data and data[field].strip() for field in required_fields):
        return jsonify({"error": "All fields are required"}), 400
    try:
        CollegeModel.add_college(data["collegecode"], data["collegename"])
        return jsonify({"message": "College added successfully!"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# PUT (Update)
@college_bp.route("/<string:collegecode>", methods=["PUT"])
def update_college(collegecode):
    data = request.get_json()
    if not data or "collegecode" not in data or "collegename" not in data:
        return jsonify({"error": "Missing fields"}), 400
    try:
        updated = CollegeModel.update_college(
            collegecode,
            data["collegecode"],
            data["collegename"]
        )
        if updated == 0:
            return jsonify({"error": "College not found"}), 404
        return jsonify({"message": "College updated successfully!"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# DELETE
@college_bp.route("/<string:collegecode>", methods=["DELETE"])
def delete_college(collegecode):
    try:
        CollegeModel.delete_college(collegecode)
        return jsonify({"message": "College deleted successfully!"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
