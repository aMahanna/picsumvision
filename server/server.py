import logging
from os.path import exists, join
from flask import send_from_directory

from server import app, routes


logger = logging.getLogger(__file__)

routes.init_app(app)


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def catch_all(path):
    file_to_serve = (
        path if path and exists(join(app.static_folder, path)) else "index.html"
    )
    return send_from_directory(app.static_folder, file_to_serve)


if __name__ == "__main__":
    app.run()
