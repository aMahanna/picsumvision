from setuptools import setup

setup(
    name="picsumvision",
    packages=["server", "server.controllers", "server.routes"],
    version="1.0.0",
    install_requires=[
        "Flask",
        "Flask-Cors",
        "gunicorn",
        "python-dotenv",
        "python-arango",
        "requests",
        "colornamer"
    ],
)
