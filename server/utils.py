def parse_visualization_info(info, is_search_visualization):
    EDGE_COLORS = ["#241023", "#4464AD", "#DC0073", "#47A025", "#FF7700", "#6B0504"]
    nodes = []
    edges = []

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
        node_col = connection["i"]["color"] if "color" in connection["i"] else "#422040"
        nodes.append(
            {
                "id": connection["i"]["_id"],
                "label": connection["i"]["_key"],
                "color": node_col,
                "font": {"color": "white"},
            }
        )

        edge_col = EDGE_COLORS[index % len(EDGE_COLORS)]
        for edge in connection["edges"]:
            edge_label = f"{edge['_score']:.2f}%" if is_search_visualization else None
            edges.append(
                {
                    "id": edge["_id"],
                    "from": edge["_from"],
                    "to": edge["_to"],
                    "label": edge_label,
                    "color": edge_col,
                }
            )

    return {"nodes": nodes, "edges": edges}


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
