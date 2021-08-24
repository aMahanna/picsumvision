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
    for image_obj in dataset:
        image, is_old_image = arango.insert_document(
            "Image",
            _key=image_obj["key"],
            author=image_obj["author"],
            url=image_obj["url"],
        )

        if is_old_image:
            print(f'Already exists: {image["_id"]}, skipping...')
            continue

        vision_data = vision.get_image_metadata(image["url"])
        if not vision_data or "error" in vision_data:
            print(f"Vision uncooperative, skipping...")
            arango.remove_from("Image", image["_id"])
            continue

        author = arango.insert_document(
            "Author", _key=string_to_ascii(image["author"]), author=image["author"]
        )[0]
        arango.insert_document(
            "AuthorOf", _from=author["_id"], _to=image["_id"], _score=2
        )

        if "webDetection" in vision_data:
            for vision_guess in vision_data["webDetection"]["bestGuessLabels"]:
                bestguess = arango.insert_document(
                    "BestGuess",
                    _key=string_to_ascii(vision_guess["label"]),
                    bestGuess=vision_guess["label"],
                )[0]

                arango.insert_document(
                    "BestGuessOf", _from=bestguess["_id"], _to=image["_id"], _score=1
                )

        if "landmarkAnnotations" in vision_data:
            for vision_landmark in vision_data["landmarkAnnotations"]:
                _key = string_to_ascii(vision_landmark["description"])
                _score = (
                    vision_landmark["score"] if vision_landmark["score"] < 1 else 0.999
                )

                _latitude, _longitude = 0, 0
                if "locations" in vision_landmark:
                    _latitude = vision_landmark["locations"][0]["latLng"]["latitude"]
                    _longitude = vision_landmark["locations"][0]["latLng"]["longitude"]

                try:
                    landmark = arango.insert_document(
                        "Tag",
                        _key=_key,
                        mid=vision_landmark["mid"],
                        tag=vision_landmark["description"],
                    )[0]

                    arango.insert_document(
                        "TagOf",
                        _type="landmark",
                        _key=_key + image["_key"],
                        _from=landmark["_id"],
                        _to=image["_id"],
                        _score=_score,
                        _latitude=_latitude,
                        _longitude=_longitude,
                    )
                except:
                    print(
                        f"ArangoDB Error Encountered. Most likely an Illegal document key. Skipping Landmark:"
                    )
                    print(json.dumps(landmark, indent=4))

        if "localizedObjectAnnotations" in vision_data:
            for vision_localized in vision_data["localizedObjectAnnotations"]:
                if is_valid_vision_data(vision_localized, {"mid", "name"}):
                    _key = string_to_ascii(vision_localized["name"])
                    _score = (
                        vision_localized["score"]
                        if vision_localized["score"] < 1
                        else 0.999
                    )

                    _coord = []
                    if "boundingPoly" in vision_localized:
                        _coord = [
                            [v["x"], v["y"]]
                            for v in vision_localized["boundingPoly"][
                                "normalizedVertices"
                            ]
                        ]
                        _coord.append(_coord[0])

                    try:
                        localized = arango.insert_document(
                            "Tag",
                            _key=_key,
                            mid=vision_localized["mid"],
                            tag=vision_localized["name"],
                        )[0]

                        # print(localized, _key + image["_key"])
                        arango.insert_document(
                            "TagOf",
                            _type="object",
                            _key=_key + image["_key"],
                            _from=localized["_id"],
                            _to=image["_id"],
                            _score=_score,
                            _coord=_coord,
                        )
                    except:
                        print(
                            f"ArangoDB Error Encountered. Most likely an Illegal document key. Skipping Localized:"
                        )
                        print(json.dumps(localized, indent=4))

        if "webDetection" in vision_data:
            for vision_entity in vision_data["webDetection"]["webEntities"]:
                if is_valid_vision_data(vision_entity, {"entityId", "description"}):
                    _key = string_to_ascii(vision_entity["description"])
                    _score = (
                        vision_entity["score"] if vision_entity["score"] < 1 else 0.999
                    )

                    try:
                        entity = arango.insert_document(
                            "Tag",
                            _key=_key,
                            mid=vision_entity["entityId"],
                            tag=vision_entity["description"],
                        )[0]

                        arango.insert_document(
                            "TagOf",
                            _type="object",
                            _key=_key + image["_key"],
                            _from=entity["_id"],
                            _to=image["_id"],
                            _score=_score,
                        )
                    except:
                        print(
                            f"ArangoDB Error Encountered. Most likely an Illegal document key. Skipping Entity:"
                        )
                        print(json.dumps(entity, indent=4))

        if "labelAnnotations" in vision_data:
            for vision_label in vision_data["labelAnnotations"]:
                if is_valid_vision_data(vision_label, {"mid", "description"}):
                    _key = string_to_ascii(vision_label["description"])
                    _score = (
                        vision_label["score"] if vision_label["score"] < 1 else 0.999
                    )

                    try:
                        label = arango.insert_document(
                            "Tag",
                            _key=_key,
                            mid=vision_label["mid"],
                            tag=vision_label["description"],
                        )[0]

                        arango.insert_document(
                            "TagOf",
                            _type="label",
                            _key=_key + image["_key"],
                            _from=label["_id"],
                            _to=image["_id"],
                            _score=_score,
                        )
                    except:
                        print(
                            f"ArangoDB Error Encountered. Most likely an Illegal document key. Skipping Label:"
                        )
                        print(json.dumps(label, indent=4))

        if "imagePropertiesAnnotation" in vision_data:
            clrs = vision_data["imagePropertiesAnnotation"]["dominantColors"]["colors"]
            for vision_color in clrs:
                if "color" in vision_color:
                    color_json = get_color_from_rgb(
                        [
                            vision_color["color"]["red"],
                            vision_color["color"]["green"],
                            vision_color["color"]["blue"],
                        ]
                    )
                    if color_json["color_family"] in ["black", "grey", "white"]:
                        continue  # I find these colors to be present almost everywhere, so skip them

                    color_family = color_json["color_family"]
                    color_hex = color_json["xkcd_color_hex"]

                    _key = string_to_ascii(color_family)
                    _score = vision_color["score"]
                    _pixel_fraction = vision_color["pixelFraction"]

                    try:
                        color = arango.insert_document(
                            "Tag", _key=_key, tag=color_family, hex=color_hex
                        )[0]

                        arango.insert_document(
                            "TagOf",
                            _type="label",
                            _key=_key + image["_key"],
                            _from=color["_id"],
                            _to=image["_id"],
                            _score=_score,
                            _pixel_fraction=_pixel_fraction,
                        )
                    except:
                        print(
                            f"ArangoDB Error Encountered. Most likely an Illegal document key. Skipping Color:"
                        )
                        print(json.dumps(color, indent=4))

        print(f"{image['_id']} complete")

    print("Success: Populating DB complete.")


def fetch_lorem_picsum_images():
    dataset = []

    page = 1
    while True:
        response = requests.get(f"https://picsum.photos/v2/list?limit=1&page={page}")
        response.raise_for_status()

        picsum_result = response.json()
        for picsum_object in picsum_result:
            dataset.append(
                {
                    "key": str(picsum_object["id"]),
                    "author": picsum_object["author"],
                    "url": picsum_object["download_url"],
                }
            )

        page += 1
        if len(picsum_result) == 0 or page > 2:
            return dataset


def string_to_ascii(string):
    return "".join(str(ord(c)) for c in string)


def is_valid_vision_data(vision_data, keys):
    return vision_data["score"] >= 0.2 and keys <= set(vision_data)


if __name__ == "__main__":
    main()
