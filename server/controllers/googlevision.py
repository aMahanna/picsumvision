import requests
from server.types import VisionResult


class VisionDriver:
    def __init__(self, auth) -> None:
        self.endpoint = f"https://vision.googleapis.com/v1/images:annotate?key={auth}"
        self.headers = {"Content-Type": "application/json"}
        self.features = [
            {"maxResults": 50, "type": "LABEL_DETECTION"},
            {"maxResults": 50, "type": "WEB_DETECTION"},
            {"maxResults": 50, "type": "OBJECT_LOCALIZATION"},
            {"maxResults": 50, "type": "LANDMARK_DETECTION"},
            {"maxResults": 5, "type": "IMAGE_PROPERTIES"}
            # {"maxResults": 5, "type": "FACE_DETECTION"},
            # {"maxResults": 5, "type": "TEXT_DETECTION"},
        ]

    def get_image_metadata(self, image_uri: str) -> VisionResult:
        body = {
            "requests": [
                {
                    "features": self.features,
                    "image": {
                        "source": {
                            "imageUri": image_uri,
                        },
                    },
                }
            ]
        }

        response = requests.post(self.endpoint, headers=self.headers, json=body)
        response.raise_for_status()

        return response.json()["responses"][0]

    def generate_keyword_from_url(self, url) -> str:
        """Returns vision data in a string for a url.

        Raises:
            ValueError: When no google vision data is found
        """
        vision_data = self.get_image_metadata(url)
        if not vision_data or "error" in vision_data:
            raise ValueError("Google Vision Uncooperative")

        if landmarks := vision_data.get("landmarkAnnotations"):
            return landmarks[0]["description"]

        elif web_detection := vision_data.get("webDetection"):
            return self.format_keyword(web_detection["webEntities"][:3], "description")

        elif localized_objects := vision_data.get("localizedObjectAnnotations"):
            return self.format_keyword(localized_objects[:3], "name")

        else:
            best_labels = vision_data["labelAnnotations"][:4]
            return self.format_keyword(best_labels, "description")

    def format_keyword(self, data, key: str) -> str:
        return " ".join([doc[key] for doc in data])
