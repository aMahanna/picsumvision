import requests


class VisionDriver:
    def __init__(self, auth) -> None:
        self.vision_url = f"https://vision.googleapis.com/v1/images:annotate?key={auth}"
        self.vision_features = [
            {"maxResults": 50, "type": "LABEL_DETECTION"},
            {"maxResults": 50, "type": "WEB_DETECTION"},
            {"maxResults": 50, "type": "OBJECT_LOCALIZATION"},
            {"maxResults": 50, "type": "LANDMARK_DETECTION"},
            {"maxResults": 5, "type": "IMAGE_PROPERTIES"}
            # {"maxResults": 5, "type": "FACE_DETECTION"},
            # {"maxResults": 5, "type": "TEXT_DETECTION"},
        ]

    def get_image_metadata(self, url):
        body = {
            "requests": [
                {
                    "features": self.vision_features,
                    "image": {
                        "source": {
                            "imageUri": url,
                        },
                    },
                }
            ]
        }

        response = requests.post(
            self.vision_url, headers={"Content-Type": "application/json"}, json=body
        )
        response.raise_for_status()
        json_response = response.json()["responses"]

        return json_response[0]

    def generate_keyword_from_url(self, url):
        vision_data = self.get_image_metadata(url)
        if not vision_data or "error" in vision_data:
            return None

        if "landmarkAnnotations" in vision_data:
            return vision_data["landmarkAnnotations"][0]["description"]
        elif "webDetection" in vision_data:
            best_entities = vision_data["webDetection"]["webEntities"][0:3]
            return self.format_keyword(best_entities, "description")
        elif "localizedObjectAnnotations" in vision_data:
            best_objects = vision_data["localizedObjectAnnotations"][0:3]
            return self.format_keyword(best_objects, "name")
        else:
            best_labels = vision_data["labelAnnotations"][0:4]
            return self.format_keyword(best_labels, "description")

    def format_keyword(data, key):
        return " ".join([doc[key] for doc in data])
