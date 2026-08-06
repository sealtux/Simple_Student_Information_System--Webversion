from flask import Blueprint, jsonify, request
from app.models.CollegeModel import CollegeModel


college_bp = Blueprint(
    "college_bp",
    __name__,
    url_prefix="/colleges",
)


# GET with pagination
@college_bp.route("/")
@college_bp.route("/page/<int:page>")
def get_college(page=1):
    if page < 1:
        page = 1

    limit = 9
    offset = (page - 1) * limit

    try:
        colleges = CollegeModel.get_college(
            limit=limit + 1,
            offset=offset,
        )

        has_next = len(colleges) > limit

        return jsonify({
            "colleges": colleges[:limit],
            "has_next": has_next,
            "page": page,
        }), 200

    except Exception as error:
        print("College fetch error:", error)

        return jsonify({
            "error": "Failed to fetch colleges."
        }), 500


# Combined search, sorting, and pagination
@college_bp.route("/filter", methods=["GET"])
def filter_colleges():
    query = request.args.get(
        "q",
        "",
    ).strip()

    sort_key = request.args.get(
        "sortkey"
    )

    direction = request.args.get(
        "direction"
    )

    try:
        page = int(
            request.args.get("page", 1)
        )
    except (TypeError, ValueError):
        page = 1

    if page < 1:
        page = 1

    valid_sort_keys = {
        "collegecode",
        "collegename",
    }

    valid_directions = {
        "asc",
        "desc",
    }

    if sort_key not in valid_sort_keys:
        sort_key = None

    if direction:
        direction = direction.lower()

    if direction not in valid_directions:
        direction = None

    limit = 9
    offset = (page - 1) * limit

    try:
        colleges = CollegeModel.filter_colleges(
            query=query,
            sort_key=sort_key,
            direction=direction,
            limit=limit + 1,
            offset=offset,
        )

        has_next = len(colleges) > limit

        return jsonify({
            "colleges": colleges[:limit],
            "has_next": has_next,
            "page": page,
            "query": query,
            "sort_key": sort_key,
            "sort_direction": direction,
        }), 200

    except Exception as error:
        print("College filter error:", error)

        return jsonify({
            "error": "Failed to filter colleges."
        }), 500


# SORT
@college_bp.route("/sort", methods=["GET"])
def sort_college():
    key = request.args.get(
        "key",
        "collegecode",
    )

    direction = request.args.get(
        "direction",
        "asc",
    ).lower()

    try:
        page = int(
            request.args.get("page", 1)
        )
    except (TypeError, ValueError):
        page = 1

    if page < 1:
        page = 1

    limit = 9
    offset = (page - 1) * limit

    try:
        colleges = CollegeModel.sort_college(
            key=key,
            direction=direction,
            limit=limit + 1,
            offset=offset,
        )

        has_next = len(colleges) > limit

        return jsonify({
            "colleges": colleges[:limit],
            "has_next": has_next,
            "page": page,
            "sort_key": key,
            "sort_direction": direction,
        }), 200

    except Exception as error:
        print("College sort error:", error)

        return jsonify({
            "error": "Failed to sort colleges."
        }), 500


# SEARCH with optional sorting and pagination
@college_bp.route("/search", methods=["GET"])
def search_college():
    query = request.args.get(
        "q",
        "",
    ).strip()

    sort_key = request.args.get(
        "sortkey"
    )

    direction = request.args.get(
        "direction"
    )

    try:
        page = int(
            request.args.get("page", 1)
        )
    except (TypeError, ValueError):
        page = 1

    if page < 1:
        page = 1

    limit = 9
    offset = (page - 1) * limit

    try:
        colleges = CollegeModel.search_college(
            query=query,
            limit=limit + 1,
            offset=offset,
            sort_key=sort_key,
            direction=direction,
        )

        has_next = len(colleges) > limit

        return jsonify({
            "colleges": colleges[:limit],
            "has_next": has_next,
            "page": page,
            "sort_key": sort_key,
            "sort_direction": direction,
        }), 200

    except Exception as error:
        print("College search error:", error)

        return jsonify({
            "error": "Failed to search colleges."
        }), 500


# POST Add
@college_bp.route("/", methods=["POST"])
def add_college():
    data = request.get_json() or {}

    required_fields = [
        "collegecode",
        "collegename",
    ]

    for field in required_fields:
        if (
            not data.get(field)
            or str(data.get(field)).strip() == ""
        ):
            return jsonify({
                "error": f"{field} is required"
            }), 400

    code = data["collegecode"]
    name = data["collegename"]

    if CollegeModel.college_code_exists(code):
        return jsonify({
            "error": "A college with this code already exists."
        }), 400

    if CollegeModel.college_name_exists(name):
        return jsonify({
            "error": "A college with this name already exists."
        }), 400

    try:
        CollegeModel.add_college(
            code,
            name,
        )

        return jsonify({
            "message": "College added successfully!"
        }), 201

    except Exception as error:
        return jsonify({
            "error": str(error)
        }), 500


# PUT Update
@college_bp.route(
    "/<string:collegecode>",
    methods=["PUT"],
)
def update_college(collegecode):
    data = request.get_json() or {}

    required_fields = [
        "collegecode",
        "collegename",
    ]

    for field in required_fields:
        if (
            not data.get(field)
            or str(data.get(field)).strip() == ""
        ):
            return jsonify({
                "error": f"{field} is required"
            }), 400

    new_code = data["collegecode"]
    new_name = data["collegename"]

    if CollegeModel.college_code_exists(
        new_code,
        exclude_code=collegecode,
    ):
        return jsonify({
            "error": "A college with this code already exists."
        }), 400

    if CollegeModel.college_name_exists(
        new_name,
        exclude_code=collegecode,
    ):
        return jsonify({
            "error": "A college with this name already exists."
        }), 400

    try:
        updated = CollegeModel.update_college(
            collegecode,
            new_code,
            new_name,
        )

        if not updated:
            return jsonify({
                "error": "College not found"
            }), 404

        return jsonify({
            "message": "College updated successfully!"
        }), 200

    except Exception as error:
        return jsonify({
            "error": str(error)
        }), 500


# DELETE
@college_bp.route(
    "/<string:collegecode>",
    methods=["DELETE"],
)
def delete_college(collegecode):
    try:
        deleted = CollegeModel.delete_college(
            collegecode
        )

        if not deleted:
            return jsonify({
                "error": (
                    "Cannot delete college because "
                    "there are programs linked to it."
                )
            }), 400

        return jsonify({
            "message": "College deleted successfully!"
        }), 200

    except Exception as error:
        return jsonify({
            "error": str(error)
        }), 500


# ALL for dropdowns and validation
@college_bp.route("/all", methods=["GET"])
def get_all_colleges_route():
    colleges = CollegeModel.get_all_colleges()

    return jsonify({
        "colleges": colleges
    }), 200