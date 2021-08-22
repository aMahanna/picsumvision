import logging
from arango import ArangoClient


class ArangoDriver:
    def __init__(self, url, user, auth, db_name):
        client = ArangoClient(hosts=url)
        self.db = client.db(db_name, username=user, password=auth)
        logging.info(f"Arango: {self.db.name} database")

    def query(self, aql, bind_vars=None):
        return self.db.aql.execute(aql, bind_vars=bind_vars)
