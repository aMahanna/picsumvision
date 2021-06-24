/* eslint-disable no-console */
/**
 * This @file uses the ArangoJS driver to connect to ArangoOasis
 * - It also defines the list of collections & views currently needed
 * - @see scripts/onboard.ts to get set up with those collections
 */

import { Database } from 'arangojs';

if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  require('dotenv').config();
}

/** @see env.example */
const DB_URL: string = process.env.ARANGO_DB_URL!;
const DB_NAME: string = process.env.ARANGO_DB_NAME!;
const DB_PASS: string = process.env.ARANGO_PASS!;
const DB_USER: string = process.env.ARANGO_USER!;

const db = new Database({
  url: DB_URL,
  databaseName: DB_NAME,
  auth: { username: DB_USER, password: DB_PASS },
});

db.version().then(
  version => console.log(version),
  error => console.error(error),
);

export const documentCollections: string[] = ['Image', 'Author', 'Tag', 'BestGuess'];
export const edgeCollections: string[] = ['AuthorOf', 'TagOf', 'BestGuessOf'];
export const view = 'searchview';
export default db;
