import logging
from server import app, routes


logger = logging.getLogger(__file__)

routes.init_app(app)


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve():
    return app.send_static_file("index.html")


@app.errorhandler(404)
def not_found(e):
    return app.send_static_file("index.html")
