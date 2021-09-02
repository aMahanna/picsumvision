import logging
from server import arango
from assets.stopwords import stop_words


def main():
    arango.drop_all_collections()

    for collection in arango.DOCUMENT_COLLECTIONS:
        arango.create_collection(collection)

    for collection in arango.EDGE_COLLECTIONS:
        arango.create_collection(collection, is_edge_collection=True)

    arango.create_analyzer(
        name="text_en_stopwords",
        type="text",
        locale="en.utf-8",
        stemming=True,
        stopwords=stop_words,
    )
    arango.create_analyzer(
        name="norm_accent_lower",
        type="norm",
        locale="en.utf-8",
        stemming=False,
        case="lower",
    )

    arango.create_view(
        arango.ARANGO_VIEW,
        "arangosearch",
        {
            "links": {
                "Author": {
                    "analyzers": ["identity"],
                    "fields": {
                        "author": {
                            "analyzers": [
                                "text_en_stopwords",
                                "norm_accent_lower",
                                "text_en",
                            ],
                        },
                    },
                    "includeAllFields": True,
                    "storeValues": "none",
                    "trackListPositions": False,
                },
                "Tag": {
                    "analyzers": ["identity"],
                    "fields": {
                        "tag": {
                            "analyzers": [
                                "text_en_stopwords",
                                "norm_accent_lower",
                                "text_en",
                            ],
                        },
                        "data": {
                            "analyzers": ["text_en_stopwords", "text_en"],
                        },
                    },
                    "includeAllFields": True,
                    "storeValues": "none",
                    "trackListPositions": False,
                },
                "BestGuess": {
                    "analyzers": ["identity"],
                    "fields": {
                        "bestGuess": {
                            "analyzers": [
                                "text_en_stopwords",
                                "norm_accent_lower",
                                "text_en",
                            ],
                        },
                    },
                    "includeAllFields": True,
                    "storeValues": "none",
                    "trackListPositions": False,
                },
            }
        },
    )

    logging.info("Success: Onboarding complete.")


if __name__ == "__main__":
    main()
