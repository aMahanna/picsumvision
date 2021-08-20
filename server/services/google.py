import os
from dotenv import load_dotenv
import requests

load_dotenv()


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
