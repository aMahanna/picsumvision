import json
import os

from server import arango


def main():
    for collection in arango.DOCUMENT_COLLECTIONS + arango.EDGE_COLLECTIONS:
        file = open(f"{os.path.abspath(os.curdir)}/backup/{collection}.json")
        arango.restore_collection(collection, json.load(file))


if __name__ == "__main__":
    main()
