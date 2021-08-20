from .services import google


def parse_visualization_info(info, is_search_visualization):
    nodes = []
    edges = []
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

    for j, connection in enumerate(info["connections"]):
        node_color = (
            connection["i"]["color"] if "color" in connection["i"] else "#422040"
        )
        nodes.append(
            {
                "id": connection["i"]["_id"],
                "label": connection["i"]["_key"],
                "color": node_color,
                "font": {"color": "white"},
            }
        )

        edge_color = edge_colors[j % len(edge_colors)]
        for edge in connection["edges"]:
            edge_label = (
                f"{round(edge['_score'], 2)}%" if is_search_visualization else None
            )
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


def parse_vision_info(url):
    vision_data = google.fetch_vision_metadata(url)
    if not vision_data or "error" in vision_data:
        return None

    if "landmarkAnnotations" in vision_data:
        return vision_data["landmarkAnnotations"][0]["description"]
    elif "webDetection" in vision_data:
        return fetch_vision_keyword(
            vision_data["webDetection"]["webEntities"][0:3], "description"
        )
    elif "localizedObjectAnnotations" in vision_data:
        return fetch_vision_keyword(
            vision_data["localizedObjectAnnotations"][0:3], "name"
        )
    else:
        return fetch_vision_keyword(vision_data["labelAnnotations"][0:4], "description")


def fetch_vision_keyword(vision_object, string_key):
    return " ".join(map(lambda x: x[string_key], vision_object))


ignored_words = [
    "atmosphere",
    "cloud",
    "image",
    "stock.xchng",
    "sky",
    "wallpaper",
    "photograph",
    "image",
    "person",
]
stop_words = [
    "the",
    "a",
    "and",
    "or",
    "of",
    "with",
    "at",
    "an",
    "this",
    "that",
    "these",
    "those",
    "i",
    "my",
    "your",
    "his",
    "her",
    "their",
    "from",
    "into",
    "during",
    "including",
    "until",
    "against",
    "among",
    "throughout",
    "despite",
    "towards",
    "upon",
    "concerning",
    "to",
    "in",
    "for",
    "on",
    "by",
    "about",
    "like",
    "through",
    "over",
    "before",
    "between",
    "after",
    "since",
    "without",
    "under",
    "within",
    "along",
    "following",
    "across",
    "behind",
    "beyond",
    "plus",
    "except",
    "but",
    "up",
    "out",
    "around",
    "down",
    "off",
    "above",
    "near",
]
