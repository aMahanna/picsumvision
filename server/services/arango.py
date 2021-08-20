from pyArango.connection import Connection


class ArangoDriver:
    document_collections = ["Image", "Author", "Tag", "BestGuess"]
    edge_collections = ["AuthorOf", "TagOf", "BestGuessOf"]
    view_name = "searchview"

    def __init__(self, url, user, auth, db_name):
        conn = Connection(arangoURL=url, username=user, password=auth)
        self.db = conn[db_name]
        print(self.db, conn.getVersion())

    def query(self, aql, rawResults=True, batchSize=1, bindVars=None):
        return self.db.AQLQuery(
            aql, rawResults=rawResults, batchSize=batchSize, bindVars=bindVars
        )
