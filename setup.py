from setuptools import setup

setup(
    name="picsumvision",
    packages=['server', 'server.models', 'server.routes'],
    version='1.0.0',
    install_requires=[
        'Flask',
        'gunicorn',
        'python-dotenv',
        'python-arango'
        'requests'
    ],
)
