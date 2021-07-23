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

## How to run

1. Run `git clone https://github.com/aMahanna/picsumvision.git`
2. Run `cd picsumvision`
3. Run `cp .env.example .env` (For fast setup, **do not modify anything**.)
4. Run `yarn install && yarn client:install`
5. Run `docker-compose up -d` to create your local DB instance
    * Verify at `http://localhost:8529/` with `root` // `rootpassword`
5. Run `yarn db:onboard` (configures your DB with Collections, Analyzers, and a View)
6. Run `yarn db:restore` (restores your DB with data from latest ArangoDB dump)

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

Context: The `populate.ts` script.

If you want to substitute Lorem Picsum for another image dataset (e.g Unsplash), add a handler function in `populate.ts`, similar to `fetchLoremPicsumImages()`. This method will need to fetch your JSON payload from the dataset source, and format each image to the `AbstractImage` interface standard:

```typescript
export interface AbstractImage {
  id: string; // An Image ID
  author: string; // An Image author
  url: string; // Image original URL (source site)
}
```

Once you have an array of type `AbstractImage[]`, you can pass it to the `populateDB()`  function, which takes care of the rest. 

## Configuring New Collections

Context: The `picsumvision/src/collections` directory.

Adding a new collections is a simple as creating a file under `/src/collections`, and updating the `documentCollections` and `edgeCollections` arrays in `database.ts` to indicate that you have added new collections.

Keep in mind that collections are created in pairs. You create a Document collection to store the data you want to add, and you create an Edge collection to connect your Document collection with other Document collections. 

If you would like as well, you can update the `populate.ts` to generate some data into your new collections. However, you do not need to modify the `onboard.ts` or `clear.ts` scripts, as it will take into account your changes, based on the `documentCollections` and `edgeCollections` values.

## Configuring New Queries

Context: The `queries.ts` file.

Simply create a new `export async function...` in `/src/queries.ts`, and you can begin to reference it in an existing Search / Info API Route, or create a new API / Endpoint.

## Routes

* GET `/api/search/keyword` - Queries images based the keyword provided (e.g 'cloud sky plant')
* GET `/api/search/url` - Queries images based on user url (e.g [dog](https://post.medicalnewstoday.com/wp-content/uploads/sites/3/2020/02/322868_1100-1100x628.jpg))
* GET `/api/search/surpriseme` - Queries images based on random tags (generated from ArangoDB)
* GET `/api/search/discover` - Recommends images a user may like based on history
* GET `/api/search/visualize` - Represents the user's last search results as a graph network

* GET `/api/info/image` - Returns metadata of an image using its ID
* GET `/api/info/randomtags` - Returns random tags (picked from a random image)
* GET `/api/info/metrics` - Returns database collection counts

### An idea of what the ArangoDB graph looks like:
<img src="https://user-images.githubusercontent.com/43019056/117744883-78573c00-b1d7-11eb-9a8f-6cf332d154a2.png"  width="400"/>
<img src="https://user-images.githubusercontent.com/43019056/117744933-9886fb00-b1d7-11eb-95f2-98874027311d.png"  width="400"/>
