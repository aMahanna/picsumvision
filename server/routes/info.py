from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from server import aql

info_bp = Blueprint("info_bp", __name__)


@info_bp.route("/info/image")
@cross_origin()
def fetch_image():
    if (id := request.args.get("id")) and id.isdigit():
        data = aql.fetch_image_info(id)
        return jsonify({"data": data}), 200
    else:
        return jsonify("User must pass image ID to view."), 400


@info_bp.route("/info/randomtags")
@cross_origin()
def fetch_random_tags():
    if tags := aql.fetch_surprise_tags():
        return jsonify({"tags": tags}), 200
    else:
        return jsonify("Error fetching surprise keys"), 500


@info_bp.route("/info/metrics")
@cross_origin()
def fetch_metrics():
    if data := aql.fetch_db_metrics():
        return jsonify({"data": data}), 200
    else:
        return jsonify("Error fetching metrics"), 500
