import logging
from server import app, routes


logger = logging.getLogger(__file__)

routes.init_app(app)


@app.route("/")
def serve():
    return app.send_static_file("index.html")
