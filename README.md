# picsumvision

[![Travis CI](https://travis-ci.com/aMahanna/picsumvision.svg?branch=main)]()
[![dependencies Status](https://status.david-dm.org/gh/aMahanna/picsumvision.svg)](https://david-dm.org/aMahanna/picsumvision)
[![devDependencies Status](https://status.david-dm.org/gh/aMahanna/picsumvision.svg?type=dev)](https://david-dm.org/aMahanna/picsumvision?type=dev)
[![peerDependencies Status](https://status.david-dm.org/gh/aMahanna/picsumvision.svg?type=peer)](https://david-dm.org/aMahanna/picsumvision?type=peer)

An image repository powered by Lorem Picsum, Google Vision, and ArangoDB, allowing you to:
* Search for images by keyword or URL
* Discover images similar to click history
* Visualize image results as a graph network

**[Show, don't tell](https://picsumvision.mahanna.dev/)**

This project was submitted as a Shopify Developer Challenge on May 9th, but has continued to grow since. If you would like to see the state of the project as of May 9th only, you can rollback to the following commit: [53e84e8](https://github.com/aMahanna/picsumvision/commit/53e84e86a1a61560acead5ff91cf3d86f6c94f0e)

_Disclaimer: Searching is far from being optimized._

## Setup

1. `git clone https://github.com/aMahanna/picsumvision.git`
2. `cd picsumvision`
3. `cp .env.example .env` (For fast setup, **do not modify anything**.)
4. `yarn install && yarn client:install`
5. `docker-compose up -d` to create your local DB instance
    * Verify at `http://localhost:8529/` with `root` // `rootpassword`
6. `python3 -m venv .venv && source .venv/bin/activate`
7. `pip install -e .`
8. Run `yarn db:onboard` (configures your DB with Collections, Analyzers, and a View)
9. Run `yarn db:restore` (restores your DB with data from latest ArangoDB dump)

**Good to go:**
* Run `yarn dev`.

## Google Vision API Usage

PicsumVision relies on the Google Vision API for two things:
1. Metadata generation of images, via the `yarn db:populate` command.
2. Search for images via an Image URL, instead of searching via keyword.

If you would like to mess around with any of these, you will need a Google Vision API Key, set as `GOOGLE_APPLICATION_CREDENTIALS`:
* Setup here: https://cloud.google.com/docs/authentication/api-keys)

For fast setup, I recommend you use the `yarn db:restore` command instead of `yarn db:populate`, as the former doesn't require a Google Vision API key. **Keep in mind however that you will not be able to search for images via image URls without a Vision key..**

## Configuring New Image Datasets

File: `scripts/populate.py`

If you want to substitute Lorem Picsum for another image dataset (e.g Unsplash), add a handler function in `populate.py`, similar to `fetch_lorem_picsum_images()`. This method will need to fetch your JSON payload from the dataset source, and format each image to the `AbstractImage` interface standard:

```python
class AbstractImage(TypedDict):
    key: str
    author: str
    url: str
```

Once you have a `list[AbstractImage]`, you can pass it to the `populate_db()` function, which takes care of the rest. 

## Configuring New Collections

File: The `server/controller/arangodb.py`

1. Update `DOCUMENT_COLLECTIONS` or `EDGE_COLLECTIONS`, depending on the collection type you want to add.
    * Keep in mind that most graph db collections are created in pairs. You create a Document collection to store the data you want to add, and you create an Edge collection to connect your Document collection with other Document collections
2. Update `populate.py` to to generate some data into your new collections.
3. Consider creating a dump of the newly added collections via the `arangodump` command, and adding it in `arangodump/` for the `restore.py` to use.

## Configuring New Queries

File: `server/aql.py`

Simply create a new function in `aql.py`, and you can begin to reference it in an existing Search / Info API Route, or create a new one.

## Routes

* GET `/api/search/keyword` - Queries images based the keyword provided (e.g 'cloud sky plant')
* GET `/api/search/url` - Queries images based on user url (e.g [dog](https://post.medicalnewstoday.com/wp-content/uploads/sites/3/2020/02/322868_1100-1100x628.jpg))
* GET `/api/search/surpriseme` - Queries images based on random tags (generated from ArangoDB)
* GET `/api/search/discover` - Recommends images a user may like based on history
* GET `/api/search/visualizesearch` - Represents the user's last search results as a graph network
* GET `/api/search/visualizeimage` - Represents the user's last clicked image as a graph network

* GET `/api/info/image` - Returns metadata of an image using its ID
* GET `/api/info/randomtags` - Returns random tags (picked from a random image)
* GET `/api/info/metrics` - Returns database collection counts

### An idea of what the ArangoDB graph looks like:
<img src="https://user-images.githubusercontent.com/43019056/117744883-78573c00-b1d7-11eb-9a8f-6cf332d154a2.png"  width="400"/>
<img src="https://user-images.githubusercontent.com/43019056/117744933-9886fb00-b1d7-11eb-95f2-98874027311d.png"  width="400"/>
