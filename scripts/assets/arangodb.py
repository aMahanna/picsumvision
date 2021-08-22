import os
from dotenv import load_dotenv

from arango import ArangoClient

load_dotenv()


class ArangoDriver:
    document_collections = ["Image", "Author", "Tag", "BestGuess"]
    edge_collections = ["AuthorOf", "TagOf", "BestGuessOf"]
    view_name = "searchview"

    def __init__(self, url, user, auth, db_name):
        client = ArangoClient(hosts=url)
        self.db = client.db(db_name, username=user, password=auth)
        print(f"Arango: {self.db.name} database")

    def create_collection(self, name, is_edge_collection=False):
        print(f"Creating {name} collection...")
        self.db.create_collection(name, edge=is_edge_collection)

    def clear_collection(self, name):
        print(f"Clearing {name} collection...")
        self.db.collection(name).truncate()

    def restore_collection(self, name, data):
        self.db.collection(name).import_bulk(data, on_duplicate="error")

    def drop_all_collections(self):
        print("Dropping existing collections...")
        for collection in self.document_collections + self.edge_collections:
            self.db.delete_collection(collection, ignore_missing=True)

    def create_analyzer(self, name, type, **properties):
        print(f"Creating {name} analyzer...")
        self.db.delete_analyzer(name, force=True, ignore_missing=True)
        self.db.create_analyzer(name, type, properties)

    def create_view(self, name, type, properties):
        print(f"Creating {name} view...")
        self.db.delete_view(name, ignore_missing=True)
        self.db.create_view(name, type, properties)


arango = ArangoDriver(
    os.environ.get("ARANGO_DB_URL"),
    os.environ.get("ARANGO_USER"),
    os.environ.get("ARANGO_PASS"),
    os.environ.get("ARANGO_DB_NAME"),
)
