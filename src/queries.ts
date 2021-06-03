import db from './database';
import { aql } from 'arangojs';
import { Vertice, Connection, ArangoImage, ArangoImageInfo, ArangoDBMetrics } from './interfaces';

/**
 * @method allows the user to query by multiple keys (e.g author, label, web detection,...)
 * - First, search for exact matches using a custom ArangoSearch "norm" analyzer
 *    - Sort by confidence score
 *    - Select the first 5 images
 * - Second, search for close matches using a custom ArangoSearch "text_en" analyzer
 *     - Sort the ArangoDB View matches by the BM25 algorithm (@see https://en.wikipedia.org/wiki/Okapi_BM25)
 *     - Perform graph traversals on the first 15 View matches
 *     - Return the first 5 images with the highest number of "match collisions" (i.e reocurring the most)
 * - Lastly, combine the exactMatches and closeMatches results to form the final list
 *
 * - @todo Maybe reintroduce "doc.data IN t" to also search by Datamuse Keywords... (for closeMatches)
 * - @todo Maybe reintroduce SORT e._score to track highest match scores... (for closeMatches)
 *
 * @param targetLabels An array of targetted words
 * @returns an array of ArangoImages, or an empty array
 */
export async function query_mixed_keys(targetLabels: string): Promise<ArangoImage[]> {
  const matches = await (
    await db.query(aql`
        WITH Labels, Authors, Images, BestGuess
        LET normTokens = TOKENS(${targetLabels}, 'norm_accent_lower')[0]
        LET textTokens = TOKENS(${targetLabels}, 'text_en_stopwords')
        LET exactMatches = (
          FOR doc IN searchview
            SEARCH ANALYZER(
              doc.label == normTokens ||
              doc.bestGuess == normTokens ||
              doc.name == normTokens
            , 'norm_accent_lower')
            FOR v, e IN 1..1 OUTBOUND doc LabelOf, AuthorOf, BestGuessOf OPTIONS {bfs: true, uniqueVertices: 'global' }
              SORT e._score DESC
              LIMIT 5
              RETURN v
        )
        LET closeMatches = (
          FOR doc IN searchview 
            SEARCH ANALYZER(
              BOOST(doc.label IN textTokens, 2) ||
              BOOST(doc.bestGuess IN textTokens, 3) ||
              BOOST(doc.name IN textTokens, 4)
            , 'text_en') 
            SORT BM25(doc, 1.2, 0) DESC 
            LIMIT 15
            FOR v, e IN 1..1 OUTBOUND doc LabelOf, AuthorOf, BestGuessOf OPTIONS {bfs: true, uniqueVertices: 'global' }
              FILTER v NOT IN exactMatches
              COLLECT img = v WITH COUNT INTO num
              SORT num DESC
              LIMIT 5
              RETURN img
        )
        RETURN APPEND(exactMatches, closeMatches)
      `)
  ).all();

  return matches[0];
}

/**
 * @method Returns 3 random labels for user input
 * - Picks a random image
 * - Performs a 1-step graph traversal to its labels
 * - Picks 3 of them randomly (among the higher confidence labels), and returns them as a string
 * @returns a random collection of labels (e.g 'mountain blue sky')
 */
export async function fetch_surprise_keys(): Promise<string> {
  const result = await (
    await db.query(aql`
        With Labels
        FOR i IN Images
          SORT RAND()
          LIMIT 1
          FOR v, e IN 1..1 INBOUND i LabelOf OPTIONS {bfs: true, uniqueVertices: 'global' }
            SORT e._score DESC
            LIMIT 6
            SORT RAND()
            LIMIT 3
            RETURN v.label
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
export async function fetch_image_info(id: string, searches: string | undefined): Promise<ArangoImageInfo[]> {
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
  result[0].similar = await fetch_discovery([id], search);

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
export async function fetch_discovery(clickedImages: string[], searches?: string): Promise<ArangoImage[]> {
  const result = await (
    await db.query(aql`
        WITH Labels, Authors
        FOR i IN Images
          FILTER i._key IN ${clickedImages}
          LET searchTokens = TOKENS(${searches}, 'text_en_stopwords')
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
 * @todo - This query seems quite complicated for no reason, should look into refactoring it...
 *
 * @param collection - The images to visualize
 * @param labels - The labels that queried the search results
 * @returns the nodes & edges for VISJS to use client-side
 *
 */
export async function fetch_visualizer_info(
  collection: ArangoImage[],
  labels: string,
): Promise<{ vertices: Vertice[]; connections: Connection[] }> {
  const result = await (
    await db.query(aql`
        WITH Images, Labels, Authors, BestGuess
        LET vertices = FIRST(
          LET similar = (
            LET textTokens = TOKENS(${labels}, 'text_en_stopwords')
            FOR doc IN searchview 
              SEARCH ANALYZER(
                doc.label IN textTokens ||
                doc.bestGuess IN textTokens ||
                doc.name IN textTokens
              , 'text_en') 
                FOR v, e IN 1..1 OUTBOUND doc LabelOf, AuthorOf, BestGuessOf OPTIONS {bfs: true, uniqueVertices: 'global' }
                  FILTER v IN ${collection}
                  LET similarDoc = {
                    _key: doc._key,
                    _id: doc._id,
                    data: doc.label OR doc.name OR doc.bestGuess,
                    color: '#FC7753'
                  }
                  RETURN DISTINCT similarDoc
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
 * @method Fetches database metrics for users to see
 * @returns counts for images, labels, edges, authors & guesses
 */
export async function fetch_db_metrics(): Promise<ArangoDBMetrics> {
  const result = await (
    await db.query(aql`
      RETURN {
        image: LENGTH(Images),
        author: LENGTH(Authors),
        label: LENGTH(Labels),
        guess: LENGTH(BestGuess),
        edge: LENGTH(LabelOf) + LENGTH(AuthorOf) + LENGTH(BestGuessOf)
      }
    `)
  ).all();

  return result[0];
}