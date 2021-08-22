import logging
from os.path import exists, join
from flask import send_from_directory

from server import app, routes


logger = logging.getLogger(__file__)

routes.init_app(app)


@app.route("/")
def serve():
    return send_from_directory(app.static_folder, 'index.html')