from flask import Blueprint, jsonify, request
from app.models.ProgramModel import ProgramModel


program_bp = Blueprint(
    "program_bp",
    __name__,
    url_prefix="/programs",
)


@program_bp.route("/")
@program_bp.route("/page/<int:page>")
def get_program(page=1):
    if page < 1:
        page = 1

    limit = 9
    offset = (page - 1) * limit

    try:
        programs = ProgramModel.get_program(
            limit + 1,
            offset,
        )

        has_next = len(programs) > limit

        return jsonify({
            "programs": programs[:limit],
            "has_next": has_next,
        }), 200

    except Exception as error:
        print("Program fetch error:", error)

        return jsonify({
            "error": "Failed to fetch programs."
        }), 500


@program_bp.route("/all", methods=["GET"])
def get_all_programs_route():
    try:
        programs = ProgramModel.get_all_programs()

        return jsonify({
            "programs": programs
        }), 200

    except Exception as error:
        print("Fetch all programs error:", error)

        return jsonify({
            "error": "Failed to fetch all programs."
        }), 500


# Unified search, sorting, and pagination
@program_bp.route("/filter", methods=["GET"])
def filter_programs():
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
        "programcode",
        "programname",
        "collegecode",
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
        programs = ProgramModel.filter_programs(
            query=query,
            sort_key=sort_key,
            direction=direction,
            limit=limit + 1,
            offset=offset,
        )

        has_next = len(programs) > limit

        return jsonify({
            "programs": programs[:limit],
            "has_next": has_next,
            "page": page,
            "query": query,
            "sort_key": sort_key,
            "sort_direction": direction,
        }), 200

    except Exception as error:
        print("Program filter error:", error)

        return jsonify({
            "error": "Failed to filter programs."
        }), 500


@program_bp.route("/", methods=["POST"])
def add_program():
    data = request.get_json() or {}

    required_fields = [
        "programcode",
        "programname",
        "collegecode",
    ]

    for field in required_fields:
        value = data.get(field)

        if not value or str(value).strip() == "":
            return jsonify({
                "error": f"{field} is required"
            }), 400

    code = str(data["programcode"]).strip()
    name = str(data["programname"]).strip()
    college = str(data["collegecode"]).strip()

    if ProgramModel.program_code_exists(code):
        return jsonify({
            "error": (
                "A program with this code already exists."
            )
        }), 400

    if ProgramModel.program_name_exists(name):
        return jsonify({
            "error": (
                "A program with this name already exists."
            )
        }), 400

    try:
        ProgramModel.add_program(
            code,
            name,
            college,
        )

        return jsonify({
            "message": "Program added successfully!"
        }), 201

    except Exception as error:
        print("Add program error:", error)

        return jsonify({
            "error": str(error)
        }), 500


@program_bp.route(
    "/<string:programcode>",
    methods=["PUT"],
)
def update_program(programcode):
    data = request.get_json() or {}

    required_fields = [
        "programcode",
        "programname",
        "collegecode",
    ]

    for field in required_fields:
        value = data.get(field)

        if not value or str(value).strip() == "":
            return jsonify({
                "error": f"{field} is required"
            }), 400

    new_code = str(data["programcode"]).strip()
    new_name = str(data["programname"]).strip()
    new_college = str(data["collegecode"]).strip()

    if ProgramModel.program_code_exists(
        new_code,
        exclude_code=programcode,
    ):
        return jsonify({
            "error": (
                "A program with this code already exists."
            )
        }), 400

    if ProgramModel.program_name_exists(
        new_name,
        exclude_code=programcode,
    ):
        return jsonify({
            "error": (
                "A program with this name already exists."
            )
        }), 400

    try:
        updated = ProgramModel.update_program(
            programcode,
            new_code,
            new_name,
            new_college,
        )

        if not updated:
            return jsonify({
                "error": "Program not found"
            }), 404

        return jsonify({
            "message": "Program updated successfully!"
        }), 200

    except Exception as error:
        print("Update program error:", error)

        return jsonify({
            "error": str(error)
        }), 500


@program_bp.route(
    "/<string:programcode>",
    methods=["DELETE"],
)
def delete_program(programcode):
    try:
        ProgramModel.delete_program(programcode)

        return jsonify({
            "message": "Program deleted successfully!"
        }), 200

    except Exception as error:
        print("Delete program error:", error)

        return jsonify({
            "error": str(error)
        }), 500


@program_bp.route("/search", methods=["GET"])
def search_program():
    query = request.args.get("q", "").strip()

    try:
        page = int(request.args.get("page", 1))
    except ValueError:
        page = 1

    if page < 1:
        page = 1

    limit = 9
    offset = (page - 1) * limit

    try:
        programs = ProgramModel.search_program(
            query,
            limit + 1,
            offset,
        )

        has_next = len(programs) > limit

        return jsonify({
            "programs": programs[:limit],
            "has_next": has_next,
        }), 200

    except Exception as error:
        print("Search error:", error)

        return jsonify({
            "error": "Failed to search programs."
        }), 500


@program_bp.route("/sort", methods=["GET"])
def sort_programs():
    key = request.args.get(
        "key",
        "programcode",
    ).lower()

    direction = request.args.get(
        "direction",
        "asc",
    ).lower()

    try:
        page = int(request.args.get("page", 1))
    except ValueError:
        page = 1

    if page < 1:
        page = 1

    valid_keys = {
        "programcode",
        "programname",
        "collegecode",
    }

    valid_directions = {
        "asc",
        "desc",
    }

    if key not in valid_keys:
        key = "programcode"

    if direction not in valid_directions:
        direction = "asc"

    limit = 9
    offset = (page - 1) * limit

    try:
        programs = ProgramModel.sort_programs(
            key=key,
            direction=direction,
            limit=limit + 1,
            offset=offset,
        )

        has_next = len(programs) > limit

        return jsonify({
            "programs": programs[:limit],
            "has_next": has_next,
            "sort_key": key,
            "sort_direction": direction,
            "page": page,
        }), 200

    except Exception as error:
        print("Sort error:", error)

        return jsonify({
            "error": "Failed to sort programs."
        }), 500