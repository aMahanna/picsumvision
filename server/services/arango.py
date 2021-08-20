import os
from dotenv import load_dotenv
from pyArango.connection import Connection

load_dotenv()

conn = Connection(
    arangoURL=os.environ.get("ARANGO_DB_URL"),
    username=os.environ.get("ARANGO_USER"),
    password=os.environ.get("ARANGO_PASS"),
)
db = conn[os.environ.get("ARANGO_DB_NAME")]

print(db, conn.getVersion())

document_collections = ['Image', 'Author', 'Tag', 'BestGuess']
edge_collections = ['AuthorOf', 'TagOf', 'BestGuessOf']
view_name = 'searchview'
