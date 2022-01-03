from flask import Blueprint, jsonify, request
from flask_cors import cross_origin

from server import aql

info_bp = Blueprint("info_bp", __name__)


@info_bp.route("/info/image")
@cross_origin()
def fetch_image():
    img_id = request.args.get("id")
    if img_id and img_id.isdigit():
        data = aql.fetch_image_info(img_id)
        return jsonify({"data": data}), 200
    else:
        return jsonify("User must pass image ID to view."), 400


@info_bp.route("/info/randomtags")
@cross_origin()
def fetch_random_tags():
    keyword = aql.fetch_surprise_tags()
    if keyword:
        return jsonify({"keyword": keyword}), 200
    else:
        return jsonify("Error fetching surprise keys"), 500


@info_bp.route("/info/metrics")
@cross_origin()
def fetch_metrics():
    data = aql.fetch_db_metrics()
    if data:
        return jsonify({"data": data}), 200
    else:
        return jsonify("Error fetching metrics"), 500
