import fs from 'fs';
import db, { documentCollections, edgeCollections, view } from '../database';

/**
 * @method handles DB data restoring from ArangoDB JSON dumps
 * - An alternative to populate.ts, where the user does not need to have a GCP API Key.
 */
async function restoreDB() {
  for (let i = 0; i < documentCollections.length; i++) {
    console.log(`Restoring ${documentCollections[i]} collection...`);
    const documentCollection = db.collection(documentCollections[i]);
    if (await documentCollection.exists()) {
      const docs = JSON.parse(fs.readFileSync(__dirname + `/../../../src/assets/dump/${documentCollections[i]}.json`, 'utf-8'));
      await documentCollection.import(docs);
    }
  }

  for (let i = 0; i < edgeCollections.length; i++) {
    console.log(`Restoring ${edgeCollections[i]} collection...`);
    const edgeCollection = db.collection(edgeCollections[i]);
    if (await edgeCollection.exists()) {
      const docs = JSON.parse(fs.readFileSync(__dirname + `/../../../src/assets/dump/${edgeCollections[i]}.json`, 'utf-8'));
      await edgeCollection.import(docs);
    }
  }
}

restoreDB();
