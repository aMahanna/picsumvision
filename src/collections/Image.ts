/**
 * This @file manages the Images Document Collection in our ArangoDB
 * * @todo Add typing to parameter & return values
 */

import { Vertice, Connection, ArangoImage, ArangoImageInfo } from '../interfaces';
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
  public async query_mixed_keys(targetLabels: string): Promise<ArangoImage[] | undefined> {
    try {
      /**
       * @todo
       * Add back the following ANALYZER query: doc.data IN t
       * It is currently removed because the .data field of Labels is not populated with the best synonyms
       * (Cause: DataMuse API)
       */
      const matches = await (
        await db.query(aql`
          WITH Labels, Authors, Images, BestGuess
          LET t = TOKENS(${targetLabels}, 'text_en')
          FOR doc IN searchview 
            SEARCH ANALYZER(
              doc.label IN t ||
              BOOST(doc.name IN t, 2) ||
              BOOST(doc.bestGuess IN t, 3)
            , 'text_en') 
            SORT BM25(doc, 1.2, 0) DESC 
            LIMIT 3
            FOR v, e IN 1..1 OUTBOUND doc LabelOf, AuthorOf, BestGuessOf OPTIONS {bfs: true, uniqueVertices: 'global' }
              LIMIT 5
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
              LIMIT 3
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
   * WORK IN PRGORESS: @method Returns information about an Image
   */
  public async fetch_image_info(id: string): Promise<ArangoImageInfo[] | undefined> {
    try {
      const result = await (
        await db.query(aql`
          WITH Labels, Authors, BestGuess
            Let image = FIRST((
              FOR i IN Images
              FILTER i._key == ${id}
              LIMIT 1
              RETURN i
            ))
            LET bestGuess = (
              FOR v IN 1..1 INBOUND image BestGuessOf
                RETURN v.bestGuess
            )
            Let labels = (
              FOR v, e IN 1..1 INBOUND image LabelOf OPTIONS {bfs: true, uniqueVertices: 'global' }
                FILTER e._from == v._id
                SORT e._score DESC
                RETURN {score: e._score, data: v.label, _id: v._id}
            )
            RETURN {image, bestGuess, labels}
        `)
      ).all();
      result[0].similar = await this.fetch_discovery([id], 4);

      return result[0];
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  /**
   * WORK IN PRGORESS: @method Returns images similar to the user's visited Image pages
   */
  public async fetch_discovery(clickedImages: string[], resultsLimit: number): Promise<ArangoImage[] | undefined> {
    try {
      const result = await (
        await db.query(aql`
          WITH Labels
          FOR i IN Images
            FILTER i._key IN ${clickedImages}
            LET labels = (
              FOR v, e IN 1..1 INBOUND i LabelOf OPTIONS {bfs: true, uniqueVertices: 'global' }
                SORT e._score DESC
                LIMIT 3
                RETURN v
            )
            Let images = (
              FOR l IN labels
                FOR v2, e2 IN 1..1 OUTBOUND l LabelOf OPTIONS {bfs: true, uniqueVertices: 'global' }
                  FILTER v2._key NOT IN ${clickedImages}
                  SORT e2._score DESC
                  LIMIT ${resultsLimit}
                  RETURN v2
            )
            RETURN {images, labels}
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
   * Color-codes the vertices using the ArangoSearch BM25 Ranking Algorithm
   */
  public async fetch_visualizer_info(
    collection: ArangoImage[],
    labels: string,
  ): Promise<{ vertices: Vertice[]; connections: Connection[] } | undefined> {
    try {
      /**
       * @todo
       * Add back the following ANALYZER query: doc.data IN t
       * It is currently removed because the .data field of Labels is not populated with the best synonyms
       * (Cause: DataMuse API)
       */
      const result = await (
        await db.query(aql`
        WITH Labels, Authors, BestGuess
        LET vertices = FIRST(
          LET similar = (
            LET t = TOKENS(${labels}, 'text_en')
            FOR doc IN searchview 
                SEARCH ANALYZER(
                  doc.label IN t ||
                  BOOST(doc.name IN t, 2) ||
                  BOOST(doc.bestGuess IN t, 3)
                , 'text_en') 
                LET score = BM25(doc, 1.2, 0)
                SORT score DESC
                LIMIT 5
                RETURN {
                    _key: doc._key,
                    _id: doc._id,
                    data: doc.label OR doc.name OR doc.bestGuess,
                    color: '#FC7753'
                }
          ) 
          LET unsimilar = (
            FOR i IN ${collection}
            FOR v, e IN 1..1 INBOUND i._id LabelOf, AuthorOf, BestGuessOf OPTIONS {bfs: true, uniqueVertices: 'global' }
              LET isNewVertice = (FOR sV IN similar RETURN v._key != sV._key)
              FILTER false NOT IN isNewVertice
              COLLECT uV = v
              RETURN {
                _key: uV._key,
                _id: uV._id,
                data: uV.label OR uV.name OR uV.bestGuess,
                color: '#66D7D1'
              }
          )
          RETURN APPEND(similar, unsimilar)
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
      ).all();

      return result[0];
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }
}

export const imageObject: ImageObject = new ImageObject();
