from .info import info_bp
from .search import search_bp


def init_app(app):
    app.register_blueprint(info_bp, url_prefix="/api")
    app.register_blueprint(search_bp, url_prefix="/api")