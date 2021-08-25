from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from server import aql, vision
from server.utils import parse_visualization_info


search_bp = Blueprint("search_bp", __name__)


@search_bp.route("/search/keyword")
@cross_origin()
def from_keyword():
    keyword = request.args.get("keyword")
    if not keyword:
        return jsonify("User must pass a keyword as a string to search"), 400

    images = aql.fetch_images(keyword)
    return jsonify({"data": images}), 200 if len(images) > 0 else 204


@search_bp.route("/search/url")
@cross_origin()
def from_url():
    url = request.args.get("url")
    if not url:
        return jsonify("Invalid URL"), 400

    keyword = vision.generate_keyword_from_url(url)
    if not keyword:
        return jsonify("Error fetching vision keyword"), 500

    images = aql.fetch_images(keyword)
    return jsonify({"data": images, "tags": keyword}), 200 if len(images) > 0 else 204


@search_bp.route("/search/surpriseme")
@cross_origin()
def from_surprise():
    tags = aql.fetch_surprise_tags()
    if not tags:
        return jsonify("Error fetching surprise tags"), 500

    images = aql.fetch_images(tags)
    return jsonify({"data": images, "tags": tags}), 200


@search_bp.route("/search/discover")
@cross_origin()
def from_discovery():
    clicked_images = request.args.get("IDs").split(",")
    if not clicked_images:
        return jsonify("Invalid image IDs"), 500

    discovery = aql.fetch_discovery(clicked_images)
    return jsonify({"data": discovery}), 200 if len(discovery) > 0 else 204


@search_bp.route("/search/visualize", methods=["POST"])
@cross_origin()
def from_visualizer():
    body = request.get_json()
    data = {"vertices": [], "connections": []}

    is_search_visualization = True if request.args.get("type") == "search" else False
    if is_search_visualization:
        keyword = body["keyword"]
        last_search_result = body["lastSearchResult"]

        if not keyword:
            return jsonify("Missing keyword for visualization"), 400
        elif not last_search_result:
            return jsonify("Missing search result for visualization"), 400

        data = aql.fetch_search_visualization(keyword, last_search_result)

    else:
        image_id = body["imageID"]
        if not image_id:
            return jsonify("Missing image ID for image visualization."), 400

        data = aql.fetch_image_visualization(image_id)

    if len(data["vertices"]) == 0:
        return jsonify("No visualization info found :/"), 204

    graph_object = parse_visualization_info(data, is_search_visualization)
    return jsonify(
        {
            "graphObject": graph_object,
            "verticeCount": len(data["vertices"]),
            "imageCount": len(data["connections"]),
        }
    )
