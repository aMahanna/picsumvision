from . import routes
from flask import Flask, send_from_directory
import logging
import os
from os.path import exists, join

logging.basicConfig(
    format=f"[%(asctime)s] [{os.getpid()}] [%(levelname)s] - %(name)s - %(message)s",
    level=logging.INFO,
    datefmt="%Y/%m/%d %H:%M:%S %z",
)

logger = logging.getLogger(__file__)

app = Flask(__name__, static_folder="build")


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def catch_all(path):
    file_to_serve = (
        path if path and exists(join(app.static_folder, path)) else "index.html"
    )
    return send_from_directory(app.static_folder, file_to_serve)


routes.init_app(app)

if __name__ == "main":
    app.run()
