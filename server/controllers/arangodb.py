import logging
from typing import Any, Sequence
from arango import ArangoClient
from arango.result import Result
from arango.cursor import Cursor
from arango.typings import Json


class ArangoDriver:
    DOCUMENT_COLLECTIONS = ["Image", "Author", "Tag", "BestGuess"]
    EDGE_COLLECTIONS = ["AuthorOf", "TagOf", "BestGuessOf"]
    EDGE_DEFINITIONS = [
        {
            "edge_collection": "TagOf",
            "from_vertex_collections": ["Tag"],
            "to_vertex_collections": ["Image"],
        },
        {
            "edge_collection": "AuthorOf",
            "from_vertex_collections": ["Author"],
            "to_vertex_collections": ["Image"],
        },
        {
            "edge_collection": "BestGuessOf",
            "from_vertex_collections": ["BestGuess"],
            "to_vertex_collections": ["Image"],
        },
    ]

    def __init__(self, url: str, user: str, password: str, db_name: str):
        client = ArangoClient(hosts=url)
        self.db = client.db(db_name, username=user, password=password)
        logging.info(f"Arango: {self.db.name} database")

    def query(self, aql: str, bind_vars: dict[str, Any] = None) -> Result[Cursor]:
        return self.db.aql.execute(aql, bind_vars=bind_vars)

    def create_collection(self, name: str, is_edge_collection: bool = False):
        logging.info(f"Creating {name} collection...")
        self.db.delete_collection(name, ignore_missing=True)
        self.db.create_collection(name, edge=is_edge_collection)

    def restore_collection(self, name: str, data: Sequence[Json]):
        logging.info(f"Restoring {name} collection...")
        self.db.collection(name).import_bulk(data, on_duplicate="error")

    def create_analyzer(self, name: str, type: str, **properties):
        logging.info(f"Creating {name} analyzer...")
        self.db.delete_analyzer(name, force=True, ignore_missing=True)
        self.db.create_analyzer(name, type, properties)

    def create_view(self, name: str, type: str, properties):
        logging.info(f"Creating {name} view...")
        self.db.delete_view(name, ignore_missing=True)
        self.db.create_view(name, type, properties)

    def create_graph(self, name: str, edge_definitions: list):
        logging.info(f"Creating {name} graph...")
        self.db.delete_graph(name, ignore_missing=True)
        self.db.create_graph(name, edge_definitions=edge_definitions)

    def nuke_database(self):
        logging.info("ALERT: Nuking database...")
        io = input("\nAre you sure? (y/yes/shutup): ")
        if io in ["y", "yes", "shutup"]:
            for col in self.db.collections():
                if col["system"] is False:
                    self.db.delete_collection(col["name"], ignore_missing=True)

            for graph in self.db.graphs():
                self.db.delete_graph(graph["name"], ignore_missing=True)

            for view in self.db.views():
                self.db.delete_view(view["name"])

            for analyzer in self.db.analyzers():
                try:
                    self.db.delete_analyzer(analyzer["name"], ignore_missing=True)
                except:
                    pass
        else:
            raise ValueError("User did not approve of nuke :(")

    def insert(self, doc_collection: str, **document):
        if "_key" not in document:
            raise KeyError("Missing _key")

        collection = self.db.collection(doc_collection)
        doc = collection.get(document["_key"])
        if doc:
            return doc, True

        new_doc = collection.insert(document, sync=True, return_new=True)
        return new_doc["new"], False

    def dissolve(self, image_id: str):
        logging.info(f"Dissolving: {image_id}...")
        aql = """
            FOR v,e IN 1..1 INBOUND @image_id TagOf, BestGuessOf, AuthorOf
                REMOVE e._key IN TagOf OPTIONS { ignoreErrors: true } 
                REMOVE e._key IN BestGuessOf OPTIONS { ignoreErrors: true } 
                REMOVE e._key IN AuthorOf OPTIONS { ignoreErrors: true }
        """
        bind_vars = {"image_id": image_id}

        self.query(aql, bind_vars)
        self.db.collection("Image").delete(image_id)
