# picsumvision

[![Render](https://img.shields.io/badge/Render-%46E3B7.svg?style=for-the-badge&logo=render&logoColor=white)](https://picsumvision.mahanna.dev/)
[![Last commit](https://img.shields.io/github/last-commit/aMahanna/picsumvision)](https://github.com/aMahanna/picsumvision/commits/main)

![Python](https://img.shields.io/static/v1?color=3776AB&style=for-the-badge&logo=python&logoColor=FFD43B&label=python&message=3.6%20%7C%203.7%20%7C%203.8%20%7C%203.9)

[![License](https://img.shields.io/github/license/aMahanna/picsumvision?color=9E2165&style=for-the-badge)](https://github.com/aMahanna/picsumvision/blob/main/LICENSE)
[![Code style: black](https://img.shields.io/static/v1?style=for-the-badge&label=code%20style&message=black&color=black)](https://github.com/psf/black)

See it live: [picsumvision.mahanna.dev](https://picsumvision.mahanna.dev/)

An image repository allowing you to:
1. Search for images by keyword or URL
2. Discover images similar to click history
3. Visualize results as a graph network

Built with Lorem Picsum Photos, Google Vision, and ArangoDB 🥑

## Developer Setup (est time: 8 minutes)

Note: You can replace `yarn` with `npm run`.

1. `git clone https://github.com/aMahanna/picsumvision.git`
2. `cd picsumvision`
3. `cp .env.example .env`
4. `yarn setup`
5. `python -m venv .venv`
6. Activate Virtual Environment
   1. MacOS / Linux: `source .venv/bin/activate`
   2. Windows: `.venv/scripts/activate`
7. `pip install -e .[dev]`
8. `docker-compose up -d`
9. `yarn db:onboard`
10. Import Picsum Vision Data
     1. Via data restore: `yarn db:restore`
     2. Via data insert: `yarn db:populate`
         1. Note: requires `GOOGLE_APPLICATION_CREDENTIALS` key
11. `yarn dev`

<br/>
<img width=100 src="./client/public/logo.svg" />
