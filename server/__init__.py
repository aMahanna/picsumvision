import os
import logging
from pathlib import Path
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

from server.controllers.arangodb import ArangoDriver
from server.controllers.googlevision import VisionDriver

load_dotenv()
logging.basicConfig(
    format=f"[%(asctime)s] [{os.getpid()}] [%(levelname)s] - %(name)s: %(message)s",
    level=logging.INFO,
    datefmt="%Y/%m/%d %H:%M:%S %z",
)


logger = logging.getLogger(__file__)
app = Flask(
    __name__,
    static_folder=f"{Path(__file__).parent.parent}/client/build/",
    static_url_path="",
)
cors = CORS(app)

arango = ArangoDriver(
    os.environ.get("ARANGO_DB_URL"),
    os.environ.get("ARANGO_USER"),
    os.environ.get("ARANGO_PASS"),
    os.environ.get("ARANGO_DB_NAME"),
)
vision = VisionDriver(os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"))