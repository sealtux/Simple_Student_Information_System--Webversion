# controllers/student_controller.py

from flask import Blueprint, jsonify, request
from app.models.StudentModel import StudentModel
from app.models.ProgramModel import ProgramModel


student_bp = Blueprint(
    "student_bp",
    __name__,
    url_prefix="/students"
)


@student_bp.route("/")
@student_bp.route("/page/<int:page>")
def get_students(page=1):
    limit = 9
    offset = (page - 1) * limit

    students = StudentModel.get_students(
        limit + 1,
        offset
    )

    has_next = len(students) > limit

    return jsonify({
        "students": students[:limit],
        "has_next": has_next
    })


@student_bp.route("/", methods=["POST"])
def add_student():
    data = request.json

    required_fields = [
        "IdNumber",
        "FirstName",
        "LastName",
        "YearLevel",
        "Gender",
        "ProgramCode"
    ]

    for field in required_fields:
        if (
            not data.get(field)
            or str(data.get(field)).strip() == ""
        ):
            return jsonify({
                "error": f"{field} is required"
            }), 400

    # Accept optional profile_url
    profile_url = data.get(
        "profile_url",
        None
    )

    data["profile_url"] = profile_url

    # Backend duplicate checks
    if StudentModel.id_exists(
        data["IdNumber"]
    ):
        return jsonify({
            "error":
                "A student with this ID Number already exists."
        }), 400

    if StudentModel.name_exists(
        data["FirstName"],
        data["LastName"]
    ):
        return jsonify({
            "error":
                "A student with the same First and Last name already exists."
        }), 400

    try:
        StudentModel.add_student(data)

        return jsonify({
            "message": "Student added successfully"
        }), 201

    except Exception as error:
        return jsonify({
            "error": str(error)
        }), 500


@student_bp.route("/<id>", methods=["DELETE"])
def delete_student(id):
    deleted = StudentModel.delete_student(id)

    if not deleted:
        return jsonify({
            "error": "Student not found"
        }), 404

    return jsonify({
        "message": f"Student {id} deleted successfully"
    })


@student_bp.route("/search")
def search_students():
    query_text = request.args.get(
        "q",
        ""
    ).strip()

    try:
        page = max(
            int(request.args.get("page", 1)),
            1
        )
    except ValueError:
        page = 1

    limit = 9
    offset = (page - 1) * limit

    try:
        students = StudentModel.search_students(
            query_text,
            limit + 1,
            offset
        )

        has_next = len(students) > limit

        return jsonify({
            "students": students[:limit],
            "has_next": has_next
        }), 200

    except Exception as error:
        print("Search error:", error)

        return jsonify({
            "error": "Failed to search students."
        }), 500


@student_bp.route("/sort")
def sort_students():
    key = request.args.get(
        "key",
        "IdNumber"
    ).strip()

    direction = request.args.get(
        "direction",
        "asc"
    ).strip().lower()

    allowed_keys = {
        "IdNumber",
        "FirstName",
        "LastName",
        "YearLevel",
        "Gender",
        "ProgramCode"
    }

    if key not in allowed_keys:
        return jsonify({
            "error": "Invalid sorting column."
        }), 400

    if direction not in {"asc", "desc"}:
        return jsonify({
            "error":
                "Direction must be asc or desc."
        }), 400

    try:
        page = max(
            int(request.args.get("page", 1)),
            1
        )
    except ValueError:
        page = 1

    limit = 9
    offset = (page - 1) * limit

    try:
        students = StudentModel.sort_students(
            key,
            direction,
            limit + 1,
            offset
        )

        has_next = len(students) > limit

        return jsonify({
            "students": students[:limit],
            "has_next": has_next
        }), 200

    except Exception as error:
        print("Sort error:", error)

        return jsonify({
            "error": "Failed to sort students."
        }), 500


@student_bp.route("/<id>", methods=["PUT"])
def update_student(id):
    data = request.json

    # IdNumber is required because it can be edited
    required_fields = [
        "IdNumber",
        "FirstName",
        "LastName",
        "YearLevel",
        "Gender",
        "ProgramCode"
    ]

    for field in required_fields:
        if (
            not data.get(field)
            or str(data.get(field)).strip() == ""
        ):
            return jsonify({
                "error": f"{field} is required"
            }), 400

    data["profile_url"] = data.get(
        "profile_url"
    )

    new_id = data["IdNumber"]

    # Ignore the current student during duplicate checks
    if StudentModel.id_exists(
        new_id,
        exclude_id=id
    ):
        return jsonify({
            "error":
                "A student with this ID Number already exists."
        }), 400

    if StudentModel.name_exists(
        data["FirstName"],
        data["LastName"],
        exclude_id=id
    ):
        return jsonify({
            "error":
                "A student with the same First and Last name already exists."
        }), 400

    try:
        updated = StudentModel.update_student(
            id,
            data
        )

        if not updated:
            return jsonify({
                "error": "Student not found"
            }), 404

        return jsonify({
            "message":
                f"Student {id} updated successfully"
        }), 200

    except Exception as error:
        return jsonify({
            "error": str(error)
        }), 500


@student_bp.route(
    "/by-program/<string:programcode>"
)
def get_students_by_program(programcode):
    students = (
        StudentModel.get_students_by_program(
            programcode
        )
    )

    return jsonify({
        "students": students
    }), 200


@student_bp.route("/filter")
def filter_students():
    yearlevel = (
        request.args.get(
            "yearlevel",
            ""
        ).strip()
        or None
    )

    gender = (
        request.args.get(
            "gender",
            ""
        ).strip()
        or None
    )

    programcode = (
        request.args.get(
            "programcode",
            ""
        ).strip()
        or None
    )

    query_text = request.args.get(
        "q",
        ""
    ).strip()

    # None means no active column sorting
    sortkey = (
        request.args.get(
            "sortkey",
            ""
        ).strip()
        or None
    )

    direction = (
        request.args.get(
            "direction",
            ""
        ).strip().lower()
        or None
    )

    allowed_keys = {
        "IdNumber",
        "FirstName",
        "LastName",
        "YearLevel",
        "Gender",
        "ProgramCode"
    }

    if (
        sortkey
        and sortkey not in allowed_keys
    ):
        return jsonify({
            "error": "Invalid sorting column."
        }), 400

    if (
        direction
        and direction not in {"asc", "desc"}
    ):
        return jsonify({
            "error":
                "Direction must be asc or desc."
        }), 400

    # No direction is needed in the default state
    if not sortkey:
        direction = None

    try:
        page = max(
            int(request.args.get("page", 1)),
            1
        )
    except ValueError:
        page = 1

    limit = 9
    offset = (page - 1) * limit

    try:
        students = (
            StudentModel.get_students_filtered(
                yearlevel=yearlevel,
                gender=gender,
                programcode=programcode,
                query_text=query_text,
                sortkey=sortkey,
                direction=direction,
                limit=limit + 1,
                offset=offset
            )
        )

        has_next = len(students) > limit

        return jsonify({
            "students": students[:limit],
            "has_next": has_next
        }), 200

    except Exception as error:
        print("Filter error:", error)

        return jsonify({
            "error":
                "Failed to filter students."
        }), 500