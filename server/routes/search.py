from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from server import aql, vision
from server.utils import parse_visualization_info


search_bp = Blueprint("search_bp", __name__)


@search_bp.route("/search/keyword")
@cross_origin()
def from_keyword():
    if keyword := request.args.get("keyword"):
        images = aql.fetch_images(keyword)
        return jsonify({"data": images}), 200 if images else 204
    else:
        return jsonify("User must pass a keyword as a string to search"), 400


@search_bp.route("/search/url")
@cross_origin()
def from_url():
    if url := request.args.get("url"):
        keyword = vision.generate_keyword_from_url(url)
        images = aql.fetch_images(keyword)
        return jsonify({"data": images, "tags": keyword}), 200 if images else 204
    else:
        return jsonify("Invalid URL"), 400


@search_bp.route("/search/surpriseme")
@cross_origin()
def from_surprise():
    if tags := aql.fetch_surprise_tags():
        images = aql.fetch_images(tags)
        return jsonify({"data": images, "tags": tags}), 200
    else:
        return jsonify("Error fetching surprise tags"), 500


@search_bp.route("/search/discover")
@cross_origin()
def from_discovery():
    if clicked_images := request.args.get("IDs").split(","):
        discovery = aql.fetch_discovery(clicked_images)
        return jsonify({"data": discovery}), 200 if discovery else 204
    else:
        return jsonify("Invalid image IDs"), 400


@search_bp.route("/search/visualize", methods=["POST"])
@cross_origin()
def from_visualizer():
    body = request.get_json()
    data = {"vertices": [], "connections": []}

    is_search_visualization = request.args.get("type") == "search"
    if is_search_visualization:
        data = visualize_search(body.get("keyword"), body.get("lastSearchResult"))
    else:
        data = visualize_image(body.get("imageID"))

    if data["vertices"] and data["connections"]:
        graph_object = parse_visualization_info(data, is_search_visualization)
        return (
            jsonify(
                {
                    "graphObject": graph_object,
                    "verticeCount": len(data["vertices"]),
                    "imageCount": len(data["connections"]),
                }
            ),
            200,
        )
    else:
        return jsonify("Invalid Visualization"), 400


def visualize_search(keyword, last_search):
    if keyword and last_search:
        return aql.fetch_search_visualization(keyword, last_search)


def visualize_image(image_id):
    if image_id:
        return aql.fetch_image_visualization(image_id)
