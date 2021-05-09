[![Travis CI](https://travis-ci.com/aMahanna/shopify-F2021-A.svg?token=YaZuDiCeLyXhXEKjjUy2&branch=main)]()
[![dependencies Status](https://status.david-dm.org/gh/aMahanna/picsumvision.svg)](https://david-dm.org/aMahanna/picsumvision)
[![devDependencies Status](https://status.david-dm.org/gh/aMahanna/picsumvision.svg?type=dev)](https://david-dm.org/aMahanna/picsumvision?type=dev)
[![peerDependencies Status](https://status.david-dm.org/gh/aMahanna/picsumvision.svg?type=peer)](https://david-dm.org/aMahanna/picsumvision?type=peer)

# Picsum Vision
Backend & Data Developer Intern Challenge

Searchable images powered by Lorem Picsum, Google Vision, and ArangoDB.

**[Show, don't tell](https://picsumvision.mahanna.dev/)**

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
* GET `/api/search/randomkeys` - Returns random labels (generated from ArangoDB)


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

