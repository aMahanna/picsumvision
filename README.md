# picsumvision

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
7. `pip install -e .`
8. `docker-compose up -d`
9. `yarn db:onboard`
10. Import Picsum Vision Data
   1. Via data dump restoration: `yarn db:restore`
   2. Via new data insertion (requires `GOOGLE_APPLICATION_CREDENTIALS` key): `yarn db:populate`