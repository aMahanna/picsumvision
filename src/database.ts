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
const ENCODED_CA: string = process.env.ARANGO_ENCODED_CA!;
const DB_PASS: string = process.env.ARANGO_PASS!;

const db = new Database({
  url: DB_URL,
  databaseName: DB_NAME,
  agentOptions: { ca: Buffer.from(ENCODED_CA, 'base64') },
});

db.useBasicAuth('root', DB_PASS); // Logging in with root user for now
db.version().then(
  version => console.log(version),
  error => console.error(error),
);

export const documentCollections: string[] = ['Images', 'Authors', 'Labels', 'BestGuess'];
export const edgeCollections: string[] = ['LabelOf', 'AuthorOf', 'BestGuessOf'];
export const view = 'searchview';
export default db;
