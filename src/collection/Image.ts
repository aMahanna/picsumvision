/**
 * This @file manages the Images Document Collection in our ArangoDB
 */

import db from '../database';
import { aql } from 'arangojs';

interface imageModel {
  id: number;
  author: string;
  url: string;
  date: string;
}

const ImageCollection = db.collection('Images');

export async function insertImage(document: imageModel): Promise<string> {
  const imageExitsQuery = await db.query(aql`
    FOR i IN Images
    FILTER i._key == ${document.id}
    LIMIT 1
    RETURN i
  `);
  const queryResult = await imageExitsQuery.map(doc => doc._id);
  console.log(queryResult.length > 0 ? `Duplicate image found! ${queryResult[0]}` : '');

  return queryResult.length === 0
    ? (
        await ImageCollection.save({
          _key: `${document.id}`,
          author: document.author,
          url: document.url,
          date: document.date,
        })
      )._id
    : queryResult[0];
}
