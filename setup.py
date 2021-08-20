from setuptools import setup

setup(
    name="picsumvision",
    packages=['server', 'server.controllers', 'server.routes', 'server.services'],
    version='1',
    install_requires=[
        'Flask',
        'python-dotenv',
        'pyArango',
        'requests'
    ],
)
