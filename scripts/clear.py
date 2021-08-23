from server import arango


def main():
    for collection in arango.document_collections + arango.edge_collections:
        arango.clear_collection(collection)


if __name__ == "__main__":
    main()
