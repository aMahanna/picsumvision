[![Travis CI](https://travis-ci.com/aMahanna/picsumvision.svg?branch=main)]()
[![dependencies Status](https://status.david-dm.org/gh/aMahanna/picsumvision.svg)](https://david-dm.org/aMahanna/picsumvision)
[![devDependencies Status](https://status.david-dm.org/gh/aMahanna/picsumvision.svg?type=dev)](https://david-dm.org/aMahanna/picsumvision?type=dev)
[![peerDependencies Status](https://status.david-dm.org/gh/aMahanna/picsumvision.svg?type=peer)](https://david-dm.org/aMahanna/picsumvision?type=peer)

# Picsum Vision
Searchable images powered by Lorem Picsum, Google Vision, and ArangoDB.

**[Show, don't tell](https://picsumvision.mahanna.dev/)**

**[View the tech stack on the About page](https://picsumvision.mahanna.dev/about)**

This project was submitted as a Shopify Developer Challenge on May 9th, but has continued to grow since then. If you would like to see the state of the project as of May 9th only, you can rollback to the following commit: https://github.com/aMahanna/picsumvision/commit/53e84e86a1a61560acead5ff91cf3d86f6c94f0e

_Disclaimer: Searching is far from being optimized._

## Configuration

Picsum Vision requires the following environment variables:
* GOOGLE_APPLICATION_CREDENTIALS
    - Setup here: https://cloud.google.com/docs/authentication/api-keys)

* ARANGO_DB_URL, ARANGO_DB_NAME, ARANGO_ENCODED_CA, ARANGO_PASS
    - Setup here: https://www.arangodb.com/docs/stable/oasis/getting-started.html

* Run `yarn install && yarn client:install` (root directory).
* Run `yarn build` (root directory).

## Running

After acquiring these variables, simply run the following scripts to onboard & populate your ArangoDB:
1. `yarn db:onboard` (root directory) - Creates your Search View, and Document / Edges collections
2. `yarn db:populate` (root directory) - Inserts the first 100 Picsum images (see below for how to generate more)

Good to go:
* Run `yarn dev` (root directory)

## Routes

* GET `/api/search/mixed` - Queries images based on user labels (e.g 'cloud sky plant')
* GET `/api/search/extimage` - Queries images based on user url (e.g [dog](https://post.medicalnewstoday.com/wp-content/uploads/sites/3/2020/02/322868_1100-1100x628.jpg))
* GET `/api/search/surpriseme` - Queries images based on random labels (generated from ArangoDB)
* GET `/api/search/discovery` - Queries images based on user click history 

* GET `/api/info/image` - Returns metadata of an image using its ID
* GET `/api/info/randomkeys` - Returns random labels (generated from ArangoDB)
* GET `/api/info/metrics` - Returns database collection counts

## Configuring New Collections

Adding a new collections is a simple as creating a file under `/src/collections`, and updating the `documentCollections` and `edgeCollections` arrays in `database.ts` to indicate that you have added new collections.

Keep in mind that collections are created in pairs. You create a Document collection to store the data you want to add, and you create an Edge collection to connect your Document collection with other Document collections. 

If you would like as well, you can update the `populate.ts` to generate some data into your new collections. However, you do not need to modify the `onboard.ts` or `clear.ts` scripts, as it will take into account your changes, based on the `documentCollections` and `edgeCollections` values.

## Configuring New Queries

Simply create a new `export async function...` in `/src/queries.ts`, and you can begin to reference it in an existing Search / Info API Route, or create a new API / Endpoint.

## Extra Information

**Generating more images from `populate.ts`**

```typescript
do {
    const PICSUM_RESPONSE = await fetch(`https://picsum.photos/v2/list?page=${pageCount}&limit=${limit}`);
    PICSUM_RESULT = await PICSUM_RESPONSE.json();

    PICSUM_LIST = PICSUM_LIST.concat(PICSUM_RESULT);
    pageCount++;
  } while (pageCount !== 2); // set to `pageCount < 12` to get all 993 images
```

([Source](https://github.com/aMahanna/picsumvision/blob/main/src/scripts/populate.ts#L59-#L65
)) To include all +900 Picsum Images in your database population, you can change `pageCount !== 2` to `pageCount < 12`. This will instead fetch all Picsum image lists pages, as opposed to just fetching the first.

### An idea of what the ArangoDB graph looks like:
<img src="https://user-images.githubusercontent.com/43019056/117744883-78573c00-b1d7-11eb-9a8f-6cf332d154a2.png"  width="400"/>
<img src="https://user-images.githubusercontent.com/43019056/117744933-9886fb00-b1d7-11eb-95f2-98874027311d.png"  width="400"/>
