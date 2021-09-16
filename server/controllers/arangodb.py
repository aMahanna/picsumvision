import logging
from typing import Any, Sequence
from arango import ArangoClient
from arango.result import Result
from arango.cursor import Cursor
from arango.typings import Json


class ArangoDriver:
    DOCUMENT_COLLECTIONS = ["Image", "Author", "Tag", "BestGuess"]
    EDGE_COLLECTIONS = ["AuthorOf", "TagOf", "BestGuessOf"]
    ARANGO_VIEW = "searchview"

    def __init__(self, url: str, user: str, password: str, db_name: str):
        client = ArangoClient(hosts=url)
        self.db = client.db(db_name, username=user, password=password)
        logging.info(f"Arango: {self.db.name} database")

    def query(self, aql: str, bind_vars: dict[str, Any] = None) -> Result[Cursor]:
        return self.db.aql.execute(aql, bind_vars=bind_vars)

    def create_collection(self, name: str, is_edge_collection: bool = False):
        logging.info(f"Creating {name} collection...")
        self.db.create_collection(name, edge=is_edge_collection)

    def clear_collection(self, name: str):
        logging.info(f"Clearing {name} collection...")
        self.db.collection(name).truncate()

    def restore_collection(self, name: str, data: Sequence[Json]):
        logging.info(f"Restoring {name} collection...")
        self.db.collection(name).import_bulk(data, on_duplicate="error")

    def drop_all_collections(self):
        logging.info("Dropping existing collections...")
        for collection in self.DOCUMENT_COLLECTIONS + self.EDGE_COLLECTIONS:
            self.db.delete_collection(collection, ignore_missing=True)

    def create_analyzer(self, name: str, type: str, **properties):
        logging.info(f"Creating {name} analyzer...")
        self.db.delete_analyzer(name, force=True, ignore_missing=True)
        self.db.create_analyzer(name, type, properties)

    def create_view(self, name: str, type: str, properties):
        logging.info(f"Creating {name} view...")
        self.db.delete_view(name, ignore_missing=True)
        self.db.create_view(name, type, properties)

    def insert(self, doc_collection: str, **document):
        if "_key" not in document:
            raise KeyError("Missing _key")

        collection = self.db.collection(doc_collection)
        if existing_doc := collection.get(document["_key"]):
            return existing_doc, True
        else:
            new_doc = collection.insert(document, sync=True, return_new=True)
            return new_doc["new"], False

    def remove_from(self, collection_name: str, id: str):
        logging.info(f"Removing {id} from {collection_name}...")
        self.db.collection(collection_name).delete(id, ignore_missing=True)
