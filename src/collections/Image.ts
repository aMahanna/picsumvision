/**
 * This @file manages the Images Document Collection in ArangoDB
 */

import { Vertice, Connection, ArangoImage, ArangoImageInfo, ArangoDBMetrics } from '../interfaces';
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
  public async insertImage(document: imageModel): Promise<{ id: string; alreadyExists?: true }> {
    const imageAlreadyExists: ArangoImage = await ImageCollection.document({ _key: document._key }, true);
    if (imageAlreadyExists) return { id: imageAlreadyExists._id, alreadyExists: true };
    else {
      const insert = await ImageCollection.save(document, { overwriteMode: 'ignore', waitForSync: true });
      return { id: insert._id };
    }
  }

  /**
   * @method used to remove an image
   * This is currently only in use for when the Vision API has returned no metadata for an inserted image
   *
   * @param the id of the image
   */
  public async removeImage(id: string): Promise<void> {
    await ImageCollection.remove(id, { waitForSync: true });
  }

  /**
   * @method allows the user to query by multiple keys (e.g author, label, web detection,...)
   * - Iterates through the searchView, a collection of reverse indexes
   * - Uses ArangoSearch for text detection
   * - Sorts results using the BM25 Ranking Algorithm (@see https://en.wikipedia.org/wiki/Okapi_BM25)
   * - Takes the first 3 highest data matches (label nodes)
   * - Uses those 3 nodes to find the Images with the highest confidence & count to those nodes
   * - Returns the top 5 @todo Maybe increase?
   * - Returns an empty array if nothing is found
   * @param targetLabels An array of targetted words
   */
  public async query_mixed_keys(targetLabels: string): Promise<ArangoImage[]> {
    const matches = await (
      await db.query(aql`
        WITH Labels, Authors, Images, BestGuess
        LET t = TOKENS(${targetLabels}, 'text_en')
        FOR doc IN searchview 
          SEARCH ANALYZER(
            doc.data IN t ||
            BOOST(doc.label IN t, 2) ||
            BOOST(doc.name IN t, 2) ||
            BOOST(doc.bestGuess IN t, 3)
          , 'text_en') 
          SORT BM25(doc, 1.2, 0) DESC 
          LIMIT 3
          FOR v, e IN 1..1 OUTBOUND doc LabelOf, AuthorOf, BestGuessOf OPTIONS {bfs: true, uniqueVertices: 'global' }
            SORT e._score DESC
            COLLECT img = v WITH COUNT INTO num
            SORT num DESC
            LIMIT 5
            RETURN img
      `)
    ).all();

    return matches;
  }

  /**
   * @method Returns a max of 4 random labels for user input
   * - Picks a random image
   * - Iterates through its neighbouring nodes (which are labels)
   * - Picks 3 of them randomly, and returns them as a string
   * @returns a random collection of labels (e.g 'mountain blue sky')
   */
  public async fetch_surprise_keys(): Promise<string> {
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
  }

  /**
   * @method Returns information about an Image
   * - Fetches first the Image object (through a simple FILTER query)
   * - Fetches the image's best guess
   * - Fetches all the image's labels, containing their confidence score
   */
  public async fetch_image_info(id: string): Promise<ArangoImageInfo[]> {
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
                SORT e._score DESC
                RETURN {score: e._score, label: v.label, _id: v._id}
            )
            RETURN {image, bestGuess, labels}
        `)
    ).all();
    result[0].similar = await this.fetch_discovery([id], 4);

    return result[0];
  }

  /**
   * @method Returns images similar to the user's visited Image pages
   * @todo Maybe also include favourited images? Or does that become too "vague"
   *  - A user may click on similar images, but may favourite a collection of completely different ones
   *  - This would water down the attempt of trying to find a pattern, not sure yet
   *
   * - Fetches the top 4 labels that belong to the images that the user has clicked on
   * - Traverses the graphs with those 4 labels to find the images that have those labels the most
   */
  public async fetch_discovery(clickedImages: string[], resultsLimit: number): Promise<ArangoImage[]> {
    const result = await (
      await db.query(aql`
        WITH Labels
        FOR i IN Images
          FILTER i._key IN ${clickedImages}
          LET labels = (
            FOR v, e IN 1..1 INBOUND i LabelOf OPTIONS {bfs: true, uniqueVertices: 'global' }
              SORT e._score DESC
              LIMIT 4
              RETURN {label: v.label, _id: v._id}
          )
          Let images = (
            FOR l IN labels
              FOR v2, e2 IN 1..1 OUTBOUND l LabelOf OPTIONS {bfs: true, uniqueVertices: 'global' }
                FILTER v2._key NOT IN ${clickedImages}
                SORT e2._score DESC
                COLLECT img = v2 WITH COUNT INTO num
                SORT num DESC
                LIMIT ${resultsLimit}
                RETURN img
          )
          RETURN {images, labels}
        `)
    ).all();

    return result[0];
  }

  /**
   * @method Returns vertices & edges of a search result for visualization
   * - Fetches the vertices similar to the labels provided
   * - Appends the unsimilar vertices as well
   *  - Color-codes the vertices using the ArangoSearch BM25 Ranking Algorithm
   * - Collects the edge documents related to each Image contained in the collection @param
   *
   * @param collection - The images to visualize
   * @param labels - The labels that queried the search results
   * @returns the nodes & edges for VISJS to use client-side
   *
   */
  public async fetch_visualizer_info(
    collection: ArangoImage[],
    labels: string,
  ): Promise<{ vertices: Vertice[]; connections: Connection[] }> {
    const result = await (
      await db.query(aql`
        WITH Labels, Authors, BestGuess
        LET vertices = FIRST(
          LET similar = (
            LET t = TOKENS(${labels}, 'text_en')
            FOR doc IN searchview 
              SEARCH ANALYZER(
                doc.data IN t ||
                BOOST(doc.label IN t, 2) ||
                BOOST(doc.name IN t, 2) ||
                BOOST(doc.bestGuess IN t, 3)
              , 'text_en') 
                LET score = BM25(doc, 1.2, 0)
                SORT score DESC
                LIMIT 3
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
  }

  /**
   * @method Returns database metrics for users to see

   * @returns counts for images, labels, edges, authors & guesses
   */
  public async fetch_db_metrics(): Promise<ArangoDBMetrics> {
    const result = await (
      await db.query(aql`
        LET image = LENGTH(Images)
        LET author = LENGTH(Authors)
        LET label = LENGTH(Labels)
        LET guess = LENGTH(BestGuess)
        LET edge = LENGTH(LabelOf) + LENGTH(AuthorOf) + LENGTH(BestGuessOf)
        RETURN {
            image,
            author,
            label,
            guess,
            edge
        }
      `)
    ).all();

    return result[0];
  }
}

export const imageObject: ImageObject = new ImageObject();
