[![Travis CI](https://travis-ci.com/aMahanna/shopify-F2021-A.svg?token=YaZuDiCeLyXhXEKjjUy2&branch=main)]()

# Picsum Vision
Backend & Data Developer Intern Challenge

Searchable images powered by Lorem Picsum, Google Vision, and ArangoDB.

**[Show, don't tell](https://picsumvision.herokuapp.com/)**

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
1. `yarn db:onboard` (root directory)
2. `yarn db:populate` (root directory)

Good to go:
* Run `yarn dev` (root directory)

## Routes

* GET `/api/search/mixed` - Queries images based on user labels (e.g 'cloud sky plant')
* GET `/api/search/extimage` - Queries images based on user url (e.g [dog](https://post.medicalnewstoday.com/wp-content/uploads/sites/3/2020/02/322868_1100-1100x628.jpg))
* GET `/api/search/surpriseme` - Queries images based on random labels (generated from ArangoDB)
* GET `/api/search/discovery` - Queries images based on user click history 

* GET `/api/info/image` - Returns metadata of an image using its ID
* GET `/api/search/randomkeys` - Returns random labels (generated from ArangoDB)

