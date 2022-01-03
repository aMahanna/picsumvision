from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from server import aql, vision
from server.typings import Edge, Node, ParsedVisualzationData, VisualizationData


search_bp = Blueprint("search_bp", __name__)


@search_bp.route("/search/keyword")
@cross_origin()
def from_keyword():
    keyword = request.args.get("keyword")
    if keyword:
        images = aql.fetch_images(keyword)
        return jsonify({"data": images}), 200 if images else 204
    else:
        return jsonify("User must pass a keyword as a string to search"), 400


@search_bp.route("/search/url")
@cross_origin()
def from_url():
    url = request.args.get("url")
    if not url:
        return jsonify("Invalid URL"), 400

    try:
        keyword = vision.generate_keyword_from_url(url)
    except:
        return jsonify("Unable to generate vision data from image url"), 500

    images = aql.fetch_images(keyword)
    return jsonify({"data": images, "keyword": keyword}), 200 if images else 204


@search_bp.route("/search/surpriseme")
@cross_origin()
def from_surprise():
    keyword = aql.fetch_surprise_tags()
    if keyword:
        images = aql.fetch_images(keyword)
        return jsonify({"data": images, "keyword": keyword}), 200
    else:
        return jsonify("Error fetching surprise tags"), 500


@search_bp.route("/search/discover")
@cross_origin()
def from_discovery():
    clicked_images = request.args.get("IDs").split(",")
    if clicked_images:
        discovery = aql.fetch_discovery(clicked_images)
        return jsonify({"data": discovery}), 200 if discovery else 204
    else:
        return jsonify("Invalid image IDs"), 400


@search_bp.route("/search/visualizesearch", methods=["POST"])
@cross_origin()
def from_search_visualizer():
    body: dict = request.get_json()
    data: VisualizationData = {"vertices": [], "connections": []}

    last_search = body.get("lastSearch")
    last_result = body.get("lastResult")
    if last_search and last_result:
        data = aql.fetch_search_visualization(last_search, last_result)

    return visualize_data(data, True)


@search_bp.route("/search/visualizeimage", methods=["POST"])
@cross_origin()
def from_image_visualizer():
    body: dict = request.get_json()
    data: VisualizationData = {"vertices": [], "connections": []}

    image_id = body.get("imageID")
    if image_id:
        data = aql.fetch_image_visualization(image_id)

    return visualize_data(data, False)


## Helper functions below ##


def visualize_data(data: VisualizationData, is_search_visualization):
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


def parse_visualization_info(
    info: VisualizationData, is_search_visualization: bool
) -> ParsedVisualzationData:

    nodes: list[Node] = []
    edges: list[Edge] = []
    edge_colors = ["#241023", "#4464AD", "#DC0073", "#47A025", "#FF7700", "#6B0504"]

    for vertice in info["vertices"]:
        nodes.append(
            {
                "id": vertice["_id"],
                "label": vertice["data"],
                "color": vertice["color"],
                "font": {"color": "white"},
            }
        )

    for index, connection in enumerate(info["connections"]):
        nodes.append(
            {
                "id": connection["i"]["_id"],
                "label": connection["i"]["_key"],
                "color": connection["i"].get("color", "#422040"),
                "font": {"color": "white"},
            }
        )

        edge_color = edge_colors[index % len(edge_colors)]
        for edge in connection["edges"]:
            edge_label = f"{edge['_score']:.2f}%" if is_search_visualization else None
            edges.append(
                {
                    "id": edge["_id"],
                    "from": edge["_from"],
                    "to": edge["_to"],
                    "label": edge_label,
                    "color": edge_color,
                }
            )

    return {"nodes": nodes, "edges": edges}
