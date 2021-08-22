from flask import Blueprint, jsonify, request
from server import aql

info_bp = Blueprint("info_bp", __name__)


@info_bp.route("/info/image")
def fetch_image():
    id = request.args.get("id")
    if not (id or id.isdigit()):
        return jsonify("User must pass image ID to view."), 400
    else:
        data = aql.fetch_image_info(id)
        return jsonify({"data": data}), 200


@info_bp.route("/info/randomtags")
def fetch_random_tags():
    tags = aql.fetch_surprise_tags()
    if len(tags) == 0:
        return jsonify("Error fetching surprise keys"), 500
    else:
        return jsonify({"tags": tags}), 200


@info_bp.route("/info/metrics")
def fetch_metrics():
    data = aql.fetch_db_metrics()
    if not data:
        return jsonify("Error fetching metrics"), 500
    else:
        return jsonify({"data": data}), 200
