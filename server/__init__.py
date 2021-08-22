import os
import logging
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

from server.models.arangodb import ArangoDriver
from server.models.googlevision import VisionDriver

load_dotenv()
logging.basicConfig(
    format=f"[%(asctime)s] [{os.getpid()}] [%(levelname)s] - %(name)s - %(message)s",
    level=logging.INFO,
    datefmt="%Y/%m/%d %H:%M:%S %z",
)


logger = logging.getLogger(__file__)
app = Flask(
    __name__, static_folder=f"{os.getcwd()}/../client/build", static_url_path=""
)
cors = CORS(app)

vision = VisionDriver(os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"))
arango = ArangoDriver(
    os.environ.get("ARANGO_DB_URL"),
    os.environ.get("ARANGO_USER"),
    os.environ.get("ARANGO_PASS"),
    os.environ.get("ARANGO_DB_NAME"),
)
