import os
import json
from assets.arangodb import arango


def main():
    for collection in arango.document_collections + arango.edge_collections:
        file = open(f"{os.path.abspath(os.curdir)}/arangodump/{collection}.json")
        data = json.load(file)
        arango.restore_collection(collection, data)


if __name__ == "__main__":
    main()
