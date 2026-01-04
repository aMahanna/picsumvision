# picsumvision

[![Railway](https://img.shields.io/badge/Railway-%23131415.svg?style=for-the-badge&logo=railway&logoColor=white)](https://railway.app)
[![Last commit](https://img.shields.io/github/last-commit/aMahanna/picsumvision)](https://github.com/aMahanna/picsumvision/commits/main)

![Python](https://img.shields.io/static/v1?color=3776AB&style=for-the-badge&logo=python&logoColor=FFD43B&label=python&message=3.8%2B)

[![License](https://img.shields.io/github/license/aMahanna/picsumvision?color=9E2165&style=for-the-badge)](https://github.com/aMahanna/picsumvision/blob/main/LICENSE)
[![Ruff](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json&style=for-the-badge)](https://github.com/astral-sh/ruff)

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
   2. Windows: `.venv\Scripts\activate`
7. `pip install -e '.[dev]'`
8. `docker compose up -d`
9. `yarn db:onboard`
10. Import Picsum Vision Data
    1. Via data restore: `yarn db:restore`
    2. Via data insert: `yarn db:populate`
        1. Note: requires `GOOGLE_APPLICATION_CREDENTIALS` key
11. `yarn dev`

## Deployment

Deploy to Railway for free (with $5/month credits):

1. **Fork/Clone** this repository
2. **Sign up** at [railway.app](https://railway.app)
3. **Create project** → Deploy from GitHub repo
4. **Add ArangoDB** as a separate service (Docker: `arangodb/arangodb:3.12`)
5. **Set environment variables** (see [DEPLOYMENT.md](./DEPLOYMENT.md))
6. **Initialize database**: `railway run python scripts/onboard.py`
7. **Import data**: `railway run python scripts/restore.py`

📖 **Detailed deployment guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)

<br/>
<img width=100 src="./client/public/logo.svg" />
