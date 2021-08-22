from setuptools import setup

setup(
    name="picsumvision",
    packages=['server', 'server.models', 'server.routes'],
    version='1',
    install_requires=[
        'Flask',
        'python-dotenv',
        'python-arango'
        'requests'
    ],
)
