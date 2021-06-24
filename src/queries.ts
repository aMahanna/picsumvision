import db from './database';
import { aql } from 'arangojs';
import { Vertice, Connection, ArangoImage, ArangoImageInfo, ArangoDBMetrics } from './interfaces';
import ignoredwords from './assets/misc/ignoredwords';

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
 * @param keyword The search input
 * @returns an array of ArangoImages, or an empty array
 */
export async function fetch_images(keyword: string): Promise<ArangoImage[]> {
  const matches = await (
    await db.query(aql`
      WITH Image, Author, Tag, BestGuess
      LET normTokens = TOKENS(${keyword}, 'norm_accent_lower')[0]
      LET textTokens = TOKENS(${keyword}, 'text_en_stopwords')
      LET exactMatches = (
        FOR doc IN searchview
          SEARCH ANALYZER(
            doc.tag == normTokens ||
            doc.bestGuess == normTokens ||
            doc.author == normTokens
          , 'norm_accent_lower')
          FOR v, e IN 1..1 OUTBOUND doc AuthorOf, TagOf, BestGuessOf OPTIONS {bfs: true, uniqueVertices: 'global' }
            SORT e._type == 'landmark' DESC, e._type == 'object' DESC, e._score DESC
            LIMIT 5
            RETURN DISTINCT v
      )
      LET closeMatches = (
        FOR doc IN searchview 
          SEARCH ANALYZER(
            BOOST(doc.tag IN textTokens, 2) ||
            BOOST(doc.bestGuess IN textTokens, 3) ||
            BOOST(doc.author IN textTokens, 4)
          , 'text_en') 
          SORT BM25(doc, 1.2, 0) DESC 
          FOR v, e IN 1..1 OUTBOUND doc AuthorOf, TagOf, BestGuessOf OPTIONS {bfs: true, uniqueVertices: 'global' }
            FILTER v NOT IN exactMatches
            SORT e._type == 'landmark' DESC, e._type == 'object' DESC, e._score DESC
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
 * @method Returns 3 random tags for user input
 * - Pick a random image
 * - Branch out to its tags
 * - Omit certain tags, & filter for over 60% confidence score
 * - Randomly select X amount of tags
 *    - X ranges from 1 to 3
 * @returns a random collection of tags (e.g 'mountain blue sky')
 */
export async function fetch_surprise_tags(): Promise<string> {
  const maxResults = Math.floor(Math.random() * 4) + 1;
  const result = await (
    await db.query(aql`
      With Tag
      FOR i IN Image
        SORT RAND()
        LIMIT 1
        FOR v, e IN 1..1 INBOUND i TagOf
          FILTER LOWER(v.tag) NOT IN ${ignoredwords}
          SORT RAND()
          LIMIT ${maxResults}
          RETURN v.tag
    `)
  ).all();

  return result.join(' ');
}

/**
 * @method Returns information about an Image
 * - Fetches first the Image object (through a simple FILTER query)
 * - Fetches the image's best guess
 * - Fetches all the image's tags, containing their confidence score
 * - Fetches the top 4 similar images, according to shared metadata
 */
export async function fetch_image_info(id: string): Promise<ArangoImageInfo[]> {
  const result = await (
    await db.query(aql`
      WITH Image, Author, Tag, BestGuess
      Let image = FIRST(FOR i IN Image FILTER i._key == ${id} RETURN i)
      LET bestGuess = (FOR v IN 1..1 INBOUND image BestGuessOf RETURN v.bestGuess)
      Let tags = (
        FOR v, e IN 1..1 INBOUND image TagOf
          SORT e._score DESC
          RETURN {_id: v._id, tag: v.tag, score: e._score}
      )
      RETURN {image, bestGuess, tags}
    `)
  ).all();

  // Fetch similar images in respect to the shared metadata
  result[0].similar = await fetch_discovery([id], 4);

  return result[0];
}

/**
 * @method Returns images similar to the user's visited Images
 * - Traverses the graphs starting from click images to find common tags
 * - Returns the images that have the most "collisions" to those tags
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
    WITH Author, Tag, BestGuess
    FOR i IN Image
      FILTER i._key IN ${clickedImages}
        LET intersectMatches = (
          FOR v1, e1 IN 1..1 INBOUND i TagOf
            FILTER e1._type == 'object'
            SORT e1._score DESC
            FOR v2, e2 IN 1..1 OUTBOUND v1 TagOf
              FILTER e2._type == 'object' AND v2._key != i._key 
              FILTER GEO_INTERSECTS(GEO_LINESTRING(e1._coord), GEO_LINESTRING(e2._coord))
              COLLECT img = v2 WITH COUNT INTO intersectCount
              SORT intersectCount DESC
              LIMIT ${maxResults}
              RETURN img
        )
        LET commonMatches = (
          FOR v1, e1 IN 1..1 INBOUND i AuthorOf, TagOf, BestGuessOf
            SORT e1._score DESC
            FOR v2, e2 IN 1..1 OUTBOUND v1 AuthorOf, TagOf, BestGuessOf
              FILTER v2._key != i._key
              COLLECT img = v2 WITH COUNT INTO commonCount
              SORT commonCount DESC
              LIMIT ${maxResults}
              RETURN img
        )
        LET nearbyImages = (
          FOR v1, e1 IN 1..1 INBOUND i TagOf
            FILTER e1._type == 'landmark'
            SORT e1._score DESC
            FOR i2 IN Image
              FILTER i2._key != i._key
              FOR v2, e2 IN 1..1 INBOUND i2 TagOf
                  FILTER e2._type == 'landmark' AND v2._key != i._key 
                  LET dist = DISTANCE(e1._latitude, e1._longitude, e2._latitude, e2._longitude)
                  FILTER dist <= 100000
                  SORT dist
                  RETURN i2
        )
        RETURN APPEND(APPEND(intersectMatches, commonMatches, true), nearbyImages, true)
    `)
  ).all();

  return result[0];
}

/**
 * @method Returns vertices & edges of a search result for visualization
 * - Fetches the vertices and color-codes them by similarity to the user's search
 * - Collects the edge documents related to each Image contained in the collection @param
 *
 * @param keyword - The user search input
 * @param imageResults - The search's images result
 * @returns the nodes & edges for VISJS to use client-side
 *
 */
export async function fetch_search_visualization(
  keyword: string,
  imageResults: ArangoImage[],
): Promise<{ vertices: Vertice[]; connections: Connection[] }> {
  const result = await (
    await db.query(aql`
      WITH Image, Author, Tag, BestGuess
      LET textTokens = TOKENS(${keyword}, 'text_en_stopwords')
      LET matchList = (
        FOR doc IN searchview
          SEARCH ANALYZER(
            BOOST(doc.tag IN textTokens, 2) ||
            BOOST(doc.bestGuess IN textTokens, 3) ||
            BOOST(doc.author IN textTokens, 4)
          , 'text_en')
          RETURN doc
      )
      LET vertices = (
        FOR i IN ${imageResults}
          FOR v, e IN 1..1 INBOUND i._id AuthorOf, TagOf, BestGuessOf OPTIONS {bfs: true, uniqueVertices: 'global' }
            LET vertice = {
              _key: v._key,
              _id: v._id,
              data: v.author OR v.tag OR v.bestGuess,
              color: v IN matchList ? '#FC7753' : '#66D7D1'
            }
            RETURN DISTINCT vertice
      )
      LET connections = (
        FOR i IN ${imageResults}
          LET edges = (FOR v, e IN 1..1 INBOUND i._id AuthorOf, TagOf, BestGuessOf RETURN e)
          RETURN {i, edges}
      )
      RETURN {vertices, connections} 
      `)
  ).all();

  return result[0];
}

/**
 * @method Returns vertices & edges of image relationships for visualization
 * @param clickedImages - The images the user has previously clicked on
 * @param maxResults - The max number of images to return
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
      WITH Image, Author, Tag, BestGuess
      LET startEdges = (
        FOR i IN Image
          FILTER i._key IN ${clickedImages}
          LET edges = (FOR v, e IN 1..1 INBOUND i._id AuthorOf, TagOf, BestGuessOf RETURN e)
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
        FOR i IN Image
          FILTER i._key IN ${clickedImages}
          FOR v, e IN 1..1 INBOUND i AuthorOf, TagOf, BestGuessOf OPTIONS {bfs: true, uniqueVertices: 'global' }
            LET vertice = {
              _key: v._key,
              _id: v._id,
              data: v.author OR v.tag OR v.bestGuess
            }
            RETURN DISTINCT vertice
      )
      LET endEdges = (
        FOR i IN ${similarImages}
          LET edges = (FOR v, e IN 1..1 INBOUND i._id AuthorOf, TagOf, BestGuessOf RETURN e)
          RETURN {i, edges}
      )
      RETURN {vertices, connections: APPEND(startEdges, endEdges)}
    `)
  ).all();

  return result[0];
}

/**
 * @method Fetches database metrics for users to see
 * @returns counts for images, tags, edges, authors & guesses
 */
export async function fetch_db_metrics(): Promise<ArangoDBMetrics> {
  const result = await (
    await db.query(aql`
      RETURN {
        images: LENGTH(Image),
        authors: LENGTH(Author),
        guesses: LENGTH(BestGuess),
        tags: LENGTH(Tag),
        edges: LENGTH(AuthorOf) + LENGTH(TagOf) + LENGTH(BestGuessOf)
      }
    `)
  ).all();
  return result[0];
}
