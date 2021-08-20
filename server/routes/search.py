from flask import Blueprint, jsonify, request
from ..controllers import aql
from ..utils import parse_visualization_info, parse_vision_info


search_bp = Blueprint("search_bp", __name__)


@search_bp.route("/search/keyword")
def from_keyword():
    keyword = request.args.get("keyword")
    if not keyword:
        return jsonify("User must pass a keyword as a string to search"), 400
    else:
        data = aql.fetch_images(keyword)
        return jsonify({"data": data}), 200 if len(data) > 0 else 204


@search_bp.route("/search/url")
def from_url():
    url = request.args.get("url")
    if not url:
        return jsonify("Invalid URL"), 400
    else:
        tags = parse_vision_info(url)
        if not tags:
            return jsonify("Error fetching vision tags"), 500
        else:
            data = aql.fetch_images(tags)
            return jsonify({"data": data}), 200 if len(data) > 0 else 204


@search_bp.route("/search/surpriseme")
def from_surprise():
    tags = aql.fetch_surprise_tags()
    if not tags:
        jsonify("Error fetching surprise keys"), 500
    else:
        data = aql.fetch_images(tags)
        return jsonify({"data": data, "tags": tags}), 200


@search_bp.route("/search/discover")
def from_discovery():
    clicked_images = request.args.get("IDs").split(",")
    if not clicked_images:
        jsonify("Invalid image IDs"), 500
    else:
        data = aql.fetch_discovery(clicked_images)
        return jsonify({"data": data}), 200 if len(data) > 0 else 204


@search_bp.route("/search/visualize", methods=["POST"])
def from_visualizer():
    body = request.get_json()
    data = {"vertices": [], "connections": []}

    is_search_visualization = True if request.args.get("type") == "search" else False
    if is_search_visualization:
        keyword = body["keyword"]
        last_search_result = body["lastSearchResult"]

        if not (keyword or last_search_result):
            return (
                jsonify("Missing keyword and/or search result for visualization"),
                400,
            )
        else:
            data = aql.fetch_search_visualization(keyword, last_search_result)
    else:
        image_id = body["imageID"]
        if not image_id:
            return jsonify("Missing image ID for image visualization."), 400
        else:
            data = aql.fetch_image_visualization(image_id)

    if len(data["vertices"]) == 0:
        return jsonify("No visualization info found :/"), 204
    else:
        graph_object = parse_visualization_info(data, is_search_visualization)
        return jsonify(
            {
                "graphObject": graph_object,
                "verticeCount": len(data["vertices"]),
                "imageCount": len(data["connections"]),
            }
        )