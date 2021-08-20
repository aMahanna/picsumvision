from flask import Flask
from dotenv import load_dotenv
import logging
import os

from server.services.arango import ArangoDriver

load_dotenv()
logging.basicConfig(
    format=f"[%(asctime)s] [{os.getpid()}] [%(levelname)s] - %(name)s - %(message)s",
    level=logging.INFO,
    datefmt="%Y/%m/%d %H:%M:%S %z",
)


logger = logging.getLogger(__file__)
app = Flask(__name__, static_folder="build")
db = ArangoDriver(
    os.environ.get("ARANGO_DB_URL"),
    os.environ.get("ARANGO_USER"),
    os.environ.get("ARANGO_PASS"),
    os.environ.get("ARANGO_DB_NAME"),
)
