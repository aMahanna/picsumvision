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
   * - Takes the first 10 highest data matches (label nodes)
   * - Uses those 10 matches to find the Images with the highest confidence & count to those matches
   * - Returns the top 7 @todo Maybe increase?
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
          LIMIT 10
          FOR v, e IN 1..1 OUTBOUND doc LabelOf, AuthorOf, BestGuessOf OPTIONS {bfs: true, uniqueVertices: 'global' }
            SORT e._score DESC
            COLLECT img = v WITH COUNT INTO num
            SORT num DESC
            LIMIT 9
            RETURN img
      `)
    ).all();

    return matches;
  }

  /**
   * @method Returns a max of 4 random labels for user input
   * - Picks a random image
   * - Iterates through its neighbouring nodes (which are labels)
   * - Picks 3 of them randomly (among the higher confidence labels), and returns them as a string
   * @returns a random collection of labels (e.g 'mountain blue sky')
   */
  public async fetch_surprise_keys(): Promise<string> {
    const result = await (
      await db.query(aql`
        With Labels, Authors
        FOR i IN Images
          SORT RAND()
          LIMIT 1
          FOR v,e IN 1..1 INBOUND i LabelOf, AuthorOf OPTIONS {bfs: true, uniqueVertices: 'global' }
            SORT e._score DESC
            LIMIT 6
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
   * - Calls fetch_discovery for this image to look for visually similar results
   */
  public async fetch_image_info(id: string, searches: string | undefined): Promise<ArangoImageInfo[]> {
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

    /**
     * If the last search is undefined (i.e user has navigated to an image, but not through the results panel),
     * then use the current image's top three labels to perform a discovery
     */
    const topThreeLabels = result[0].labels.map((object: any) => object.label).slice(0, 3);
    const search = searches === undefined ? topThreeLabels.join(' ') : searches;
    result[0].similar = await this.fetch_discovery([id], search);

    return result[0];
  }

  /**
   * @method Returns images similar to the user's visited Images & the user's recent search history
   * - Fetches the labels that match the user's recent search hsitor
   * - Traverses the graphs starting from these labels to find any colliding images
   * - Returns the images that have the most "collisions" to those labels
   *
   * @todo Maybe also include favourited images? Or does that become too "vague"
   *  - A user may click on similar images, but may favourite a collection of completely different ones
   *  - This would water down the attempt of trying to find a pattern, not sure yet
   *
   * @param clickedImages The images the user has viewed
   * @param searches The topics that the user has previously searched
   * @returns An array of images
   */
  public async fetch_discovery(clickedImages: string[], searches?: string): Promise<ArangoImage[]> {
    const result = await (
      await db.query(aql`
        WITH Labels, Authors
        FOR i IN Images
          FILTER i._key IN ${clickedImages}
          LET searchTokens = TOKENS(${searches}, 'text_en')
          FOR keyword IN searchTokens
            FOR v, e IN 1..1 INBOUND i LabelOf, AuthorOf OPTIONS {bfs: true, uniqueVertices: 'global' }
              FILTER CONTAINS(LOWER(v.label), keyword) OR CONTAINS(LOWER(v.data), keyword) OR CONTAINS(LOWER(v.name), keyword)
              SORT e._score DESC
              FOR v2, e2 IN 1..1 OUTBOUND v LabelOf, AuthorOf OPTIONS {bfs: true, uniqueVertices: 'global' }
                FILTER v2._key NOT IN ${clickedImages}
                SORT e._score DESC
                COLLECT img = v2 WITH COUNT INTO num
                SORT num DESC
                LIMIT 4
                RETURN img
        `)
    ).all();
    return result;
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
                LIMIT 10
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
