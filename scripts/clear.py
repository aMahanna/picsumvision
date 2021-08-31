from server import arango


def main():
    for collection in arango.DOCUMENT_COLLECTIONS + arango.EDGE_COLLECTIONS:
        arango.clear_collection(collection)


if __name__ == "__main__":
    main()
