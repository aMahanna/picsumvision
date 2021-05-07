/**
 * This @file manages the Images Document Collection in our ArangoDB
 * * @todo Add typing to parameter & return values
 */

import { Vertice, Connection } from '../interfaces';
import db from '../database';
import { aql } from 'arangojs';

interface imageModel {
  _key: string;
  author: string;
  url: string;
  date: string;
}

const ImageCollection = db.collection('Images');

class ImageObject {
  /**
   * @method used to insert the Picsum images generated from the `yarn picsum` script
   * Avoids Picsum image duplicates by checking the ID of each Picsum Image
   *
   * @param document implements the imageModel interface
   * @returns the ArangoID of the Image inserted
   */
  public async insertImage(document: imageModel): Promise<string | undefined> {
    const imageAlreadyExists = await ImageCollection.document({ _key: document._key }, true);
    return imageAlreadyExists
      ? undefined
      : (
          await ImageCollection.save(
            {
              _key: document._key,
              author: document.author,
              url: document.url,
              date: document.date,
            },
            { overwriteMode: 'ignore' },
          )
        )._id;
  }

  /**
   * WORK IN PRGORESS: @method allows the user to query by multiple keys (e.g author, label, color, face,...)
   *
   * @param targetLabels An array of targetted words
   */
  public async query_mixed_keys(targetLabels: string): Promise<{}[] | undefined> {
    try {
      //BOOST(doc.data IN TOKENS(FIRST(t), 'text_en'), 5) ||
      const matches = await (
        await db.query(aql`
          WITH Labels, Authors, Images, BestGuess
          LET t = TOKENS(${targetLabels}, 'text_en')
          FOR doc IN searchview 
            SEARCH ANALYZER(
              doc.data IN t || 
              BOOST(doc.label IN t, 3) ||
              BOOST(doc.name IN t, 4) ||
              BOOST(doc.bestGuess IN t, 5)
            , 'text_en') 
            SORT BM25(doc, 1.2, 0) DESC 
            FOR v, e IN 1..1 OUTBOUND doc LabelOf, AuthorOf, BestGuessOf OPTIONS {bfs: true, uniqueVertices: 'global' }
              RETURN DISTINCT v
        `)
      ).all();

      return matches;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  /**
   * WORK IN PRGORESS: @method Returns a max of 4 random labels for user input
   */
  public async fetch_surprise_keys(): Promise<string | undefined> {
    try {
      const result = await (
        await db.query(aql`
          With Labels, Authors
          FOR i IN Images
            SORT RAND()
            LIMIT 1
            FOR v IN 1..1 INBOUND i LabelOf, AuthorOf OPTIONS {bfs: true, uniqueVertices: 'global' }
              SORT RAND()
              LIMIT 4
              FILTER v.name != null OR v.label != null
              RETURN v.name != null ? v.name : v.label
        `)
      ).all();

      return result.join(' ');
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  /**
   * WORK IN PRGORESS: @method Returns a max of 4 random labels for user input
   */
  public async fetch_image_info(id: string): Promise<{}[] | undefined> {
    try {
      const result = await (
        await db.query(aql`
          WITH Labels, BestGuess
            Let image = FIRST((
              FOR i IN Images
              FILTER i._key == ${id}
              LIMIT 1
              RETURN i
            ))
            Let labels = (
              FOR v, e IN 1..1 INBOUND image LabelOf OPTIONS {bfs: true, uniqueVertices: 'global' }
              FILTER e._from == v._id
              SORT e._score DESC
              RETURN {score: e._score, data: v.label}
            )
            LET bestGuess = (
              FOR v IN 1..1 INBOUND image BestGuessOf
              RETURN v
            )
            RETURN {image, labels, bestGuess}
        `)
      ).all();

      return result[0];
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  /**
   * WORK IN PRGORESS: @method Returns vertices & edges for visualization tool
   */
  public async fetch_visualizer_info(collection: {}[]): Promise<{ vertices: Vertice[]; connections: Connection[] } | undefined> {
    try {
      return (
        await (
          await db.query(aql`
            WITH Labels, Authors, BestGuess
            LET vertices = (
              FOR i IN ${collection}
                FOR v IN 1..1 INBOUND i._id LabelOf, AuthorOf, BestGuessOf OPTIONS {bfs: true, uniqueVertices: 'global' }
                  RETURN DISTINCT v
            ) 
            LET connections = (
              FOR i IN ${collection}
                LET edges = (
                  FOR v, e IN 1..1 INBOUND i._id LabelOf, AuthorOf, BestGuessOf OPTIONS {bfs: true, uniqueVertices: 'global' }
                  RETURN e
                )
                RETURN {i, edges}
            )
            RETURN {vertices, connections}
          `)
        ).all()
      )[0];
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }
}

export const imageObject: ImageObject = new ImageObject();
