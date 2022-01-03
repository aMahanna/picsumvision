from setuptools import setup

setup(
    name="picsumvision",
    author="Anthony Mahanna",
    author_email="anthony.mahanna@gmail.com",
    version="1.0.0",
    description="A graph-based searchable image repository.",
    url="https://github.com/aMahanna/picsumvision",
    keywords=["searchable", "image", "repository", "arangodb"],
    python_requires=">=3.6",
    license="MIT License",
    packages=["server", "server.controllers", "server.routes"],
    install_requires=[
        "colornamer==0.2.0",
        "Flask==2.0.1",
        "Flask-Cors==3.0.10",
        "gunicorn==20.1.0",
        "python-arango==7.2.0",
        "python-dotenv==0.19.0",
        "requests==2.26.0"
    ],
)
