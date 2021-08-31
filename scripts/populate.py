import json
import requests
from colornamer import get_color_from_rgb

from server import arango, vision


def main():
    picsum_dataset = fetch_lorem_picsum_images()
    # unsplash_dataset = fetch_unsplash_images()

    populate_db(picsum_dataset)


def populate_db(dataset):
    print(f"Generating metadata for {len(dataset)} images. Please standby...")
    for image in dataset:
        img_doc, is_old_img = arango.insert_doc(
            "Image",
            _key=image["key"],
            author=image["author"],
            url=image["url"],
        )

        if is_old_img:
            print(f'Already exists: {img_doc["_id"]}, skipping...')
            continue

        vision_data = vision.get_image_metadata(img_doc["url"])
        if not vision_data or "error" in vision_data:
            print(f"Vision uncooperative, skipping...")
            arango.remove_from("Image", img_doc["_id"])
            continue

        auth = img_doc["author"]
        author, _ = arango.insert_doc("Author", _key=string_to_ascii(auth), author=auth)
        arango.insert_doc("AuthorOf", _from=author["_id"], _to=img_doc["_id"], _score=2)

        if landmarks := vision_data.get("landmarkAnnotations"):
            print("landmarks")
            insert_landmarks(img_doc, landmarks)

        if web_detection := vision_data.get("webDetection"):
            if guesses := web_detection.get("bestGuessLabels"):
                print("guesses")
                insert_guesses(img_doc, guesses)

            if entities := web_detection.get("webEntities"):
                print("entities")
                insert_entities(img_doc, entities)

        if localized_objects := vision_data.get("localizedObjectAnnotations"):
            print("localized_objects")
            insert_localized_objects(img_doc, localized_objects)

        if labels := vision_data.get("labelAnnotations"):
            print("labels")
            insert_labels(img_doc, labels)

        if properties := vision_data.get("imagePropertiesAnnotation"):
            if colors := properties["dominantColors"]["colors"]:
                print("colors")
                insert_colors(img_doc, colors)

        print(f"{img_doc['_id']} complete")

    print("Success: Populating DB complete.")


def insert_landmarks(image, landmarks):
    for landmark in landmarks:
        if is_valid_vision_data(landmark, {"description", "locations", "mid"}):
            _key, _score = fetch_key_and_score(landmark, "description")

            _latitude = landmark["locations"][0]["latLng"]["latitude"]
            _longitude = landmark["locations"][0]["latLng"]["longitude"]

            try:
                landmark_doc, _ = arango.insert_doc(
                    "Tag",
                    _key=_key,
                    mid=landmark["mid"],
                    tag=landmark["description"],
                )

                arango.insert_doc(
                    "TagOf",
                    _type="landmark",
                    _key=_key + image["_key"],
                    _from=landmark_doc["_id"],
                    _to=image["_id"],
                    _score=_score,
                    _latitude=_latitude,
                    _longitude=_longitude,
                )
            except:
                print(f"ArangoDB Error Encountered. Skipping Landmark:")
                print(json.dumps(landmark_doc, indent=4))


def insert_guesses(image, guesses):
    for guess in guesses:
        if {"label"} <= set(guess):
            try:
                guess_doc, _ = arango.insert_doc(
                    "BestGuess",
                    _key=string_to_ascii(guess["label"]),
                    bestGuess=guess["label"],
                )

                arango.insert_doc(
                    "BestGuessOf",
                    _from=guess_doc["_id"],
                    _to=image["_id"],
                    _score=1,
                )
            except:
                print(f"ArangoDB Error Encountered. Skipping Guess:")
                print(json.dumps(guess_doc, indent=4))


def insert_entities(image, entities):
    for entity in entities:
        if is_valid_vision_data(entity, {"entityId", "description"}):
            _key, _score = fetch_key_and_score(entity, "description")

            try:
                entity_doc, _ = arango.insert_doc(
                    "Tag",
                    _key=_key,
                    mid=entity["entityId"],
                    tag=entity["description"],
                )

                arango.insert_doc(
                    "TagOf",
                    _type="object",
                    _key=_key + image["_key"],
                    _from=entity_doc["_id"],
                    _to=image["_id"],
                    _score=_score,
                )
            except:
                print(f"ArangoDB Error Encountered. Skipping Entity:")
                print(json.dumps(entity_doc, indent=4))


def insert_localized_objects(image, localized_objects):
    for localized_object in localized_objects:
        if is_valid_vision_data(localized_object, {"mid", "name", "boundingPoly"}):
            _key, _score = fetch_key_and_score(localized_object, "name")

            vertices = localized_object["boundingPoly"]["normalizedVertices"]
            _coord = [[v.get("x", 0), v.get("y", 0)] for v in vertices]
            _coord.append(_coord[0])

            try:
                localized_object_doc, _ = arango.insert_doc(
                    "Tag",
                    _key=_key,
                    mid=localized_object["mid"],
                    tag=localized_object["name"],
                )

                arango.insert_doc(
                    "TagOf",
                    _type="object",
                    _key=_key + image["_key"],
                    _from=localized_object_doc["_id"],
                    _to=image["_id"],
                    _score=_score,
                    _coord=_coord,
                )
            except:
                print(f"ArangoDB Error Encountered. Skipping Object:")
                print(json.dumps(localized_object_doc, indent=4))


def insert_labels(image, labels):
    for label in labels:
        if is_valid_vision_data(label, {"mid", "description"}):
            _key, _score = fetch_key_and_score(label, "description")

            try:
                label_doc, _ = arango.insert_doc(
                    "Tag",
                    _key=_key,
                    mid=label["mid"],
                    tag=label["description"],
                )

                arango.insert_doc(
                    "TagOf",
                    _type="label",
                    _key=_key + image["_key"],
                    _from=label_doc["_id"],
                    _to=image["_id"],
                    _score=_score,
                )
            except:
                print(f"ArangoDB Error Encountered. Skipping Label:")
                print(json.dumps(label_doc, indent=4))


def insert_colors(image, colors):
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

        family = color_json["color_family"]
        hex = color_json["xkcd_color_hex"]

        _key = string_to_ascii(family)
        _score = color["score"]
        _pixel_fraction = color["pixelFraction"]

        try:
            color_doc, _ = arango.insert_doc("Tag", _key=_key, tag=family, hex=hex)

            arango.insert_doc(
                "TagOf",
                _type="label",
                _key=_key + image["_key"],
                _from=color_doc["_id"],
                _to=image["_id"],
                _score=_score,
                _pixel_fraction=_pixel_fraction,
            )
        except:
            print(f"ArangoDB Error Encountered. Skipping Color:")
            print(json.dumps(color_doc, indent=4))


def fetch_lorem_picsum_images():
    dataset = []

    page = 10
    url = "https://picsum.photos/v2/list?limit=100&page="
    while picsum_result := fetch_from_endpoint(f"{url}{page}"):
        for picsum_object in picsum_result:
            dataset.append(
                {
                    "key": str(picsum_object["id"]),
                    "author": picsum_object["author"],
                    "url": picsum_object["download_url"],
                }
            )

        page += 1

    return dataset


def fetch_from_endpoint(url):
    response = requests.get(url)
    response.raise_for_status()
    return response.json()


def string_to_ascii(string):
    return "".join(str(ord(c)) for c in string)


def is_valid_vision_data(vision_data, keys):
    return vision_data["score"] >= 0.2 and keys <= set(vision_data)


def fetch_key_and_score(vision_data, key):
    return (
        string_to_ascii(vision_data[key]),
        vision_data["score"] if vision_data["score"] < 1 else 0.999,
    )


if __name__ == "__main__":
    main()
