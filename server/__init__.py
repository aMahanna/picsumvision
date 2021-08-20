from flask import Flask
import logging
import os

from services import arango, google

logging.basicConfig(
    format=f"[%(asctime)s] [{os.getpid()}] [%(levelname)s] - %(name)s - %(message)s",
    level=logging.INFO,
    datefmt="%Y/%m/%d %H:%M:%S %z",
)

logger = logging.getLogger(__file__)

app = Flask(__name__, static_folder="build")
