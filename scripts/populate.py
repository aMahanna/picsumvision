import json
import logging
import requests
from colornamer import get_color_from_rgb
from server import arango, vision

from typing import Tuple, Optional
from server.typings import (
    AbstractImage,
    ArangoImage,
    VisionAnnotation,
    LandmarkAnnotation,
    LocalizedObjectAnnotation,
    VisionColor,
    VisionGuess,
    VisionImageProperties,
    VisionWebDetection,
    VisionResult,
)


def main():
    picsum_dataset: list[AbstractImage] = fetch_lorem_picsum_images()
    # unsplash_dataset: list[AbstractImage] = fetch_unsplash_images()

    populate_db(picsum_dataset)


def populate_db(dataset: list[AbstractImage]) -> None:
    logging.info(f"Generating metadata for {len(dataset)} images. Please standby...")

    for image in dataset:
        try:
            img_doc: ArangoImage
            img_doc, is_old_img = arango.insert(
                "Image",
                _key=image["key"],
                author=image["author"],
                url=image["url"],
            )

            if is_old_img:
                logging.info(f'Already exists: {img_doc["_id"]}, skipping...')
                continue

            vision_data: dict = vision.get_image_metadata(img_doc["url"])
            if not vision_data or "error" in vision_data:
                logging.info(f"Error: Vision uncooperative")
                print(json.dumps(vision_data.get("error"), indent=4))
                arango.dissolve(img_doc["_id"])

            author = img_doc["author"]
            insert_author(img_doc, author)

            landmarks = vision_data.get("landmarkAnnotations", None)
            if landmarks:
                insert_landmarks(img_doc, landmarks)

            web_detection: dict = vision_data.get("webDetection", None)
            if web_detection:
                guesses = web_detection.get("bestGuessLabels", None)
                if guesses:
                    insert_guesses(img_doc, guesses)

                entities = web_detection.get("webEntities", None)
                if entities:
                    insert_entities(img_doc, entities)

            localized_objects = vision_data.get("localizedObjectAnnotations", None)
            if localized_objects:
                insert_localized_objects(img_doc, localized_objects)

            labels = vision_data.get("labelAnnotations", None)
            if labels:
                insert_labels(img_doc, labels)

            properties = vision_data.get("imagePropertiesAnnotation", None)
            if properties:
                colors = properties["dominantColors"]["colors"]
                insert_colors(img_doc, colors)

            logging.info(f"Success: {img_doc['_id']}")

        except:
            logging.info(f'Error: {img_doc["_id"]}')
            arango.dissolve(img_doc["_id"])

    logging.info("Success: Populating DB complete.")


def insert_author(image: ArangoImage, author: str):
    _key = string_to_ascii(author)

    try:
        author, _ = arango.insert("Author", _key=_key, author=author)
        arango.insert(
            "AuthorOf",
            _key=_key + image["_key"],
            _from=author["_id"],
            _to=image["_id"],
            _score=2,
        )
    except BaseException as e:
        logging.info(f"ArangoDB Error: {author} (Author)")
        print(e)


def insert_landmarks(image: ArangoImage, landmarks: list[LandmarkAnnotation]):
    for landmark in landmarks:
        if is_valid_vision_data(landmark, {"description", "locations", "mid"}):
            _key, _score = fetch_key_and_score(landmark, "description")

            _latitude = landmark["locations"][0]["latLng"]["latitude"]
            _longitude = landmark["locations"][0]["latLng"]["longitude"]

            try:
                landmark_doc, _ = arango.insert(
                    "Tag",
                    _key=_key,
                    mid=landmark["mid"],
                    tag=landmark["description"],
                )

                arango.insert(
                    "TagOf",
                    _key=_key + image["_key"],
                    _from=landmark_doc["_id"],
                    _to=image["_id"],
                    _type="landmark",
                    _score=_score,
                    _latitude=_latitude,
                    _longitude=_longitude,
                )
            except BaseException as e:
                logging.info(f'ArangoDB Error: {landmark["description"]} (Landmark)')
                print(e)


def insert_guesses(image: ArangoImage, guesses: list[VisionGuess]):
    for guess in guesses:
        if {"label"} <= set(guess):
            _key = string_to_ascii(guess["label"])

            try:
                guess_doc, _ = arango.insert(
                    "BestGuess",
                    _key=_key,
                    bestGuess=guess["label"],
                )

                arango.insert(
                    "BestGuessOf",
                    _key=_key + image["_key"],
                    _from=guess_doc["_id"],
                    _to=image["_id"],
                    _score=1,
                )
            except BaseException as e:
                logging.info(f'ArangoDB Error: {guess["label"]} (BestGuess)')
                print(e)


def insert_entities(image: ArangoImage, entities: list[VisionAnnotation]):
    for entity in entities:
        if is_valid_vision_data(entity, {"entityId", "description"}):
            _key, _score = fetch_key_and_score(entity, "description")

            try:
                entity_doc, _ = arango.insert(
                    "Tag",
                    _key=_key,
                    mid=entity["entityId"],
                    tag=entity["description"],
                )

                arango.insert(
                    "TagOf",
                    _key=_key + image["_key"],
                    _from=entity_doc["_id"],
                    _to=image["_id"],
                    _type="label",
                    _score=_score,
                )
            except BaseException as e:
                logging.info(f'ArangoDB Error: {entity["description"]} (Entity)')
                print(e)


def insert_localized_objects(
    image: ArangoImage, localized_objects: list[LocalizedObjectAnnotation]
):
    for localized_object in localized_objects:
        if is_valid_vision_data(localized_object, {"mid", "name", "boundingPoly"}):
            _key, _score = fetch_key_and_score(localized_object, "name")

            vertices = localized_object["boundingPoly"]["normalizedVertices"]
            _coord = [[v.get("x", 0), v.get("y", 0)] for v in vertices]
            _coord.append(_coord[0])

            try:
                localized_object_doc, _ = arango.insert(
                    "Tag",
                    _key=_key,
                    mid=localized_object["mid"],
                    tag=localized_object["name"],
                )

                arango.insert(
                    "TagOf",
                    _key=_key + image["_key"],
                    _from=localized_object_doc["_id"],
                    _to=image["_id"],
                    _type="object",
                    _score=_score,
                    _coord=_coord,
                )
            except BaseException as e:
                logging.info(f'ArangoDB Error: {localized_object["name"]} (Object)')
                print(e)


def insert_labels(image: ArangoImage, labels: list[VisionAnnotation]):
    for label in labels:
        if is_valid_vision_data(label, {"mid", "description"}):
            _key, _score = fetch_key_and_score(label, "description")

            try:
                label_doc, _ = arango.insert(
                    "Tag",
                    _key=_key,
                    mid=label["mid"],
                    tag=label["description"],
                )

                arango.insert(
                    "TagOf",
                    _key=_key + image["_key"],
                    _from=label_doc["_id"],
                    _to=image["_id"],
                    _type="label",
                    _score=_score,
                )
            except BaseException as e:
                logging.info(f'ArangoDB Error: {label["description"]} (Label)')
                print(e)


def insert_colors(image: ArangoImage, colors: list[VisionColor]):
    for color in colors:
        if "color" not in color:
            continue

        color_json = get_color_from_rgb(
            [
                color["color"].get("red", 0),
                color["color"].get("green", 0),
                color["color"].get("blue", 0),
            ]
        )

        if color_json["color_family"] in ["black", "grey", "white"]:
            continue  # I find these colors to be present almost everywhere, so skip them

        family: str = color_json["color_family"]
        hex: str = color_json["xkcd_color_hex"]

        _key = string_to_ascii(family)
        _score = color["score"]
        _pixel_fraction = color["pixelFraction"]

        try:
            color_doc, _ = arango.insert("Tag", _key=_key, tag=family, hex=hex)

            arango.insert(
                "TagOf",
                _key=_key + image["_key"],
                _from=color_doc["_id"],
                _to=image["_id"],
                _type="label",
                _score=_score,
                _pixel_fraction=_pixel_fraction,
            )
        except BaseException as e:
            logging.info(f"ArangoDB Error: {family} (Color)")
            print(e)


def fetch_lorem_picsum_images() -> list[AbstractImage]:
    dataset: list[AbstractImage] = []

    page = 1
    url = "https://picsum.photos/v2/list?limit=100&page="
    picsum_result = fetch_from_endpoint(f"{url}{page}")
    while picsum_result:
        for picsum_object in picsum_result:
            dataset.append(
                {
                    "key": str(picsum_object["id"]),
                    "author": picsum_object["author"],
                    "url": picsum_object["download_url"],
                }
            )

        page += 1
        picsum_result = fetch_from_endpoint(f"{url}{page}")

    return dataset


def fetch_from_endpoint(url: str):
    response = requests.get(url)
    response.raise_for_status()
    return response.json()


def string_to_ascii(string: str) -> str:
    return "".join(str(ord(c)) for c in string)


def is_valid_vision_data(vision_data: dict, keys: list[str]) -> bool:
    return keys <= set(vision_data) and vision_data.get("score", 0) >= 0.3


def fetch_key_and_score(vision_data: dict, key: str) -> Tuple[str, float]:
    score = vision_data.get("score", 1)
    return (
        string_to_ascii(vision_data[key]),
        score if score < 1 else 0.999,
    )


if __name__ == "__main__":
    main()
