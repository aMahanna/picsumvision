import os
from dotenv import load_dotenv
import requests

load_dotenv()


def parse_vision_info(url):
    vision_data = fetch_vision_metadata(url)
    if not vision_data or "error" in vision_data:
        return None

    if "landmarkAnnotations" in vision_data:
        return vision_data["landmarkAnnotations"][0]["description"]
    elif "webDetection" in vision_data:
        return fetch_vision_keyword(
            vision_data["webDetection"]["webEntities"][0:3], "description"
        )
    elif "localizedObjectAnnotations" in vision_data:
        return fetch_vision_keyword(
            vision_data["localizedObjectAnnotations"][0:3], "name"
        )
    else:
        return fetch_vision_keyword(vision_data["labelAnnotations"][0:4], "description")


def fetch_vision_metadata(url):
    uri = f"https://vision.googleapis.com/v1/images:annotate?key={os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')}"
    body = {
        "requests": [
            {
                "features": [{"maxResults": 10, "type": "LABEL_DETECTION"}],
                "image": {
                    "source": {
                        "imageUri": url,
                    },
                },
            }
        ]
    }

    response = requests.post(
        uri, headers={"Content-Type": "application/json"}, json=body
    )
    response.raise_for_status()
    json_response = response.json()["responses"]

    return json_response[0]


def fetch_vision_keyword(vision_object, string_key):
    return " ".join(map(lambda x: x[string_key], vision_object))
