import logging
from arango import ArangoClient


class ArangoDriver:
    document_collections = ["Image", "Author", "Tag", "BestGuess"]
    edge_collections = ["AuthorOf", "TagOf", "BestGuessOf"]
    view_name = "searchview"

    def __init__(self, url, user, auth, db_name):
        client = ArangoClient(hosts=url)
        self.db = client.db(db_name, username=user, password=auth)
        logging.info(f"Arango: {self.db.name} database")

    def query(self, aql, bind_vars=None):
        return self.db.aql.execute(aql, bind_vars=bind_vars)

    def create_collection(self, name, is_edge_collection=False):
        print(f"Creating {name} collection...")
        self.db.create_collection(name, edge=is_edge_collection)

    def clear_collection(self, name):
        print(f"Clearing {name} collection...")
        self.db.collection(name).truncate()

    def restore_collection(self, name, data):
        print(f"Restoring {name} collection...")
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

    def insert_document(self, name, **document):
        collection = self.db.collection(name)
        old_doc = collection.get(document["_key"]) if "_key" in document else None
        if old_doc:
            return old_doc, True
        else:
            new_doc = collection.insert(document, sync=True, return_new=True)
            return new_doc["new"], False

    def insert_edge(self, name, **edge):
        self.db.collection(name).insert(edge, return_new=True, sync=True)

    def remove_from(self, name, id):
        print(f"Removing {id} from {name} database...")
        self.db.collection(name).delete(id, ignore_missing=True)
