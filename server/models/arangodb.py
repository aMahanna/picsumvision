import logging
from arango import ArangoClient
from arango.result import Result
from arango.cursor import Cursor


class ArangoDriver:
    DOCUMENT_COLLECTIONS = ["Image", "Author", "Tag", "BestGuess"]
    EDGE_COLLECTIONS = ["AuthorOf", "TagOf", "BestGuessOf"]
    ARANGO_VIEW = "searchview"

    def __init__(self, url, user, auth, db_name):
        client = ArangoClient(hosts=url)
        self.db = client.db(db_name, username=user, password=auth)
        logging.info(f"Arango: {self.db.name} database")

    def query(self, aql, bind_vars=None) -> Result[Cursor]:
        return self.db.aql.execute(aql, bind_vars=bind_vars)

    def create_collection(self, name, is_edge_collection=False):
        logging.info(f"Creating {name} collection...")
        self.db.create_collection(name, edge=is_edge_collection)

    def clear_collection(self, name):
        logging.info(f"Clearing {name} collection...")
        self.db.collection(name).truncate()

    def restore_collection(self, name, data):
        logging.info(f"Restoring {name} collection...")
        self.db.collection(name).import_bulk(data, on_duplicate="error")

    def drop_all_collections(self):
        logging.info("Dropping existing collections...")
        for collection in self.DOCUMENT_COLLECTIONS + self.EDGE_COLLECTIONS:
            self.db.delete_collection(collection, ignore_missing=True)

    def create_analyzer(self, name, type, **properties):
        logging.info(f"Creating {name} analyzer...")
        self.db.delete_analyzer(name, force=True, ignore_missing=True)
        self.db.create_analyzer(name, type, properties)

    def create_view(self, name, type, properties):
        logging.info(f"Creating {name} view...")
        self.db.delete_view(name, ignore_missing=True)
        self.db.create_view(name, type, properties)

    def insert_doc(self, name, **document):
        collection = self.db.collection(name)
        existing_doc = collection.get(document["_key"]) if "_key" in document else None
        if existing_doc:
            return existing_doc, True
        else:
            new_doc = collection.insert(document, sync=True, return_new=True)
            return new_doc["new"], False

    def insert_edge(self, name, **edge):
        self.db.collection(name).insert(edge, return_new=True, sync=True)

    def remove_from(self, name, id):
        logging.info(f"Removing {id} from {name}...")
        self.db.collection(name).delete(id, ignore_missing=True)
