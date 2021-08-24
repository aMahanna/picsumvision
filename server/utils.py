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
