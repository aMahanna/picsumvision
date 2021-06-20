import db from './database';
import { aql } from 'arangojs';
import { Vertice, Connection, ArangoImage, ArangoImageInfo, ArangoDBMetrics } from './interfaces';

/**
 * @method allows the user to query by keyword (i.e by author name, label, bestGuess)
 * - First, search for exact matches using a custom ArangoSearch "norm" analyzer
 *    - Sort by confidence score
 *    - Select the first 10 images
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
export async function fetch_images(targetLabels: string): Promise<ArangoImage[]> {
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
            LIMIT 10
            RETURN DISTINCT v
      )
      LET closeMatches = (
        FOR doc IN searchview 
          SEARCH ANALYZER(
            BOOST(doc.label IN textTokens, 2) ||
            BOOST(doc.bestGuess IN textTokens, 3) ||
            BOOST(doc.name IN textTokens, 4)
          , 'text_en') 
          SORT BM25(doc, 1.2, 0) DESC 
          LIMIT 25
          FOR v, e IN 1..1 OUTBOUND doc LabelOf, AuthorOf, BestGuessOf OPTIONS {bfs: true, uniqueVertices: 'global' }
            FILTER v NOT IN exactMatches
            COLLECT img = v WITH COUNT INTO num
            SORT num DESC
            LIMIT 10
            RETURN img
      )
      RETURN APPEND(exactMatches, closeMatches)
    `)
  ).all();

  return matches[0];
}

/**
 * @method Returns 3 random labels for user input
 * - Pick a random image
 * - Branch out to its labels
 * - Omit 'sky' and 'cloud', filter for over 60% confidence score
 * - Randomly select X amount of labels
 *    - X ranges from 1 to 3
 * @returns a random collection of labels (e.g 'mountain blue sky')
 */
export async function fetch_surprise_keys(): Promise<string> {
  const maxResults = Math.floor(Math.random() * 3) + 1;
  const ignoredLabels = ['sky', 'cloud', 'stock.xchng']; // Some labels to skip over for now
  const result = await (
    await db.query(aql`
      With Labels
      FOR i IN Images
        SORT RAND()
        LIMIT 1
        FOR v, e IN 1..1 INBOUND i LabelOf
          FILTER LOWER(v.label) NOT IN ${ignoredLabels}
          FILTER e._score >= 0.60
          SORT RAND()
          LIMIT ${maxResults}
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
 * - Fetches the top 4 similar images, according to shared metadata
 */
export async function fetch_image_info(id: string): Promise<ArangoImageInfo[]> {
  const result = await (
    await db.query(aql`
      WITH Labels, Authors, BestGuess
      Let image = FIRST(FOR i IN Images FILTER i._key == ${id} RETURN i)
      LET bestGuess = (FOR v IN 1..1 INBOUND image BestGuessOf RETURN v.bestGuess)
      Let labels = (
        FOR v, e IN 1..1 INBOUND image LabelOf
          SORT e._score DESC
          RETURN {score: e._score, label: v.label, _id: v._id}
      )
      RETURN {image, bestGuess, labels}
    `)
  ).all();

  // Fetch similar images in respect to the shared metadata
  result[0].similar = await fetch_discovery([id], 4);

  return result[0];
}

/**
 * @method Returns images similar to the user's visited Images
 * - Traverses the graphs starting from click images to find common labels
 * - Returns the images that have the most "collisions" to those labels
 *
 * @todo Maybe also include favourited images? Or does that become too "vague"
 *  - A user may click on similar images, but may favourite a collection of completely different ones
 *  - This would water down the attempt of trying to find a pattern, not sure yet
 *
 * @param clickedImages The images the user has viewed
 * @param maxResults Number of "similar" images to return
 * @returns An array of images
 */
export async function fetch_discovery(clickedImages: string[], maxResults: number): Promise<ArangoImage[]> {
  const result = await (
    await db.query(aql`
      WITH Labels, Authors, BestGuess
      FOR i IN Images
        FILTER i._key IN ${clickedImages}
        FOR v, e IN 1..1 INBOUND i LabelOf, AuthorOf, BestGuessOf OPTIONS {bfs: true, uniqueVertices: 'global' }
          SORT e._score DESC
          FOR v2, e2 IN 1..1 OUTBOUND v LabelOf, AuthorOf, BestGuessOf OPTIONS {bfs: true, uniqueVertices: 'global' }
            FILTER v2._key != i._key
            COLLECT img = v2 WITH COUNT INTO num
            SORT num DESC
            LIMIT ${maxResults}
            RETURN img
    `)
  ).all();

  return result;
}

/**
 * @method Returns vertices & edges of a search result for visualization
 * - Fetches the vertices and color-codes them by similarity to the user's search
 * - Collects the edge documents related to each Image contained in the collection @param
 *
 * @param collection - The images to visualize
 * @param labels - The labels that queried the search results
 * @returns the nodes & edges for VISJS to use client-side
 *
 */
export async function fetch_search_visualization(
  searchResult: ArangoImage[],
  searchInput: string,
): Promise<{ vertices: Vertice[]; connections: Connection[] }> {
  const result = await (
    await db.query(aql`
      WITH Images, Labels, Authors, BestGuess
      LET textTokens = TOKENS(${searchInput}, 'text_en_stopwords')
      LET matchList = (
        FOR doc IN searchview
          SEARCH ANALYZER(
            BOOST(doc.label IN textTokens, 2) ||
            BOOST(doc.bestGuess IN textTokens, 3) ||
            BOOST(doc.name IN textTokens, 4)
          , 'text_en')
          RETURN doc
      )
      LET vertices = (
        FOR i IN ${searchResult}
          FOR v, e IN 1..1 INBOUND i._id LabelOf, AuthorOf, BestGuessOf OPTIONS {bfs: true, uniqueVertices: 'global' }
            LET vertice = {
              _key: v._key,
              _id: v._id,
              data: v.label OR v.name OR v.bestGuess,
              color: v IN matchList ? '#FC7753' : '#66D7D1'
            }
            RETURN DISTINCT vertice
      )
      LET connections = (
        FOR i IN ${searchResult}
          LET edges = (FOR v, e IN 1..1 INBOUND i._id LabelOf, AuthorOf, BestGuessOf RETURN e)
          RETURN {i, edges}
      )
      RETURN {vertices, connections} 
      `)
  ).all();

  return result[0];
}

/**
 * @method Returns vertices & edges of image relationships for visualization
 * @param collection - The images to visualize
 * @param labels - The labels that queried the search results
 * @returns the nodes & edges for VISJS to use client-side
 *
 */
export async function fetch_image_visualization(
  clickedImages: string[],
  maxResults: number,
): Promise<{ vertices: Vertice[]; connections: Connection[] }> {
  const similarImages = await fetch_discovery(clickedImages, maxResults);

  const result = await (
    await db.query(aql`
      WITH Images, Labels, Authors, BestGuess
      LET startEdges = (
        FOR i IN Images
          FILTER i._key IN ${clickedImages}
          LET edges = (FOR v, e IN 1..1 INBOUND i._id LabelOf, AuthorOf, BestGuessOf RETURN e)
          RETURN {
            i : {
              _id: i._id,
              _key: i._key,
              author: i.author,
              url: i.url,
              color: '#FC7753',
            },
            edges
          }
      )
      LET vertices = (
        FOR i IN Images
          FILTER i._key IN ${clickedImages}
          FOR v, e IN 1..1 INBOUND i LabelOf, AuthorOf, BestGuessOf OPTIONS {bfs: true, uniqueVertices: 'global' }
            LET vertice = {
              _key: v._key,
              _id: v._id,
              data: v.label OR v.name OR v.bestGuess
            }
            RETURN DISTINCT vertice
      )
      LET endEdges = (
        FOR i IN ${similarImages}
          LET edges = (FOR v, e IN 1..1 INBOUND i._id LabelOf, AuthorOf, BestGuessOf RETURN e)
          RETURN {i, edges}
      )
      RETURN {vertices, connections: APPEND(startEdges, endEdges)}
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
