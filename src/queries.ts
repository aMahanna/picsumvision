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
      WITH Image, Author, Tag, BestGuess                            // Import Required Collections
      LET normTokens = TOKENS(${keyword}, 'norm_accent_lower')[0]   // Tokenize user input for exact matching
      LET textTokens = TOKENS(${keyword}, 'text_en_stopwords')      // Tokenize user input for close matching
      LET exactMatches = (
        FOR doc IN searchview                                       // Iterate through View documents
          SEARCH ANALYZER(                                          // Search with an overrided analyzer
            doc.tag == normTokens ||                                // Search for exact Tag matches 
            doc.bestGuess == normTokens ||                          // Search for exact BestGuess matches 
            doc.author == normTokens                                // Search for exact Author matches 
          , 'norm_accent_lower')
          FOR v, e IN 1..1 OUTBOUND doc AuthorOf, TagOf, BestGuessOf OPTIONS {bfs: true, uniqueVertices: 'global' } // For each View document found, perform a Graph Traversal
            SORT e._score DESC
            LIMIT 10
            RETURN DISTINCT v                                       // Return the images with the highest confidence scores
      )
      LET closeMatches = (
        FOR doc IN searchview                                       // Iterate through View documents
          SEARCH ANALYZER(                                          // Search with the text_en analyzer
            BOOST(doc.bestGuess IN textTokens, 2) ||                // Boost by 2 if match is a bestGuess
            BOOST(doc.tag IN textTokens, 3) ||                      // Boost by 3 if match is a Tag
            BOOST(doc.author IN textTokens, 4)                      // Boost by 4 if match is an Author
          , 'text_en') 
          SORT BM25(doc, 2.4, 1) DESC                               // Sort by BM25 Ranking Function
          FOR v, e IN 1..1 OUTBOUND doc AuthorOf, TagOf, BestGuessOf OPTIONS {bfs: true, uniqueVertices: 'global' } // For each View document, perform a Graph Traversal
            FILTER v NOT IN exactMatches                            // Skip images already found
            SORT  e._score DESC                                     // Sort results by confidence score
            COLLECT img = v WITH COUNT INTO num                     // Collect all vertices (i.e Images), count their number of occurences
            SORT num DESC
            LIMIT 5
            RETURN img                                              // Return the top 5
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
  const maxResults = Math.floor(Math.random() * 3) + 1;
  const result = await (
    await db.query(aql`
      With Tag
      FOR i IN Image
        SORT RAND()
        LIMIT 1
        FOR v, e IN 1..1 INBOUND i TagOf
          FILTER LOWER(v.tag) NOT IN ${ignoredwords}
          FILTER e._score >= 0.60
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
  result[0].similar = await fetch_discovery([id]);

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
 * @returns An array of images
 */
export async function fetch_discovery(clickedImages: string[]): Promise<ArangoImage[]> {
  const result = await (
    await db.query(aql`
      WITH Author, Tag, BestGuess                                           // Import collections
      LET commonMatches = (
        FOR i IN Image                                                      // Iterate through images
          FILTER i._key IN ${clickedImages}                                 // Filter for images already clicked
            FOR v1, e1 IN 1..1 INBOUND i AuthorOf, TagOf, BestGuessOf       // For each visited image, traverse its vertices (metadata)
              SORT e1._score DESC                                           // Sort metadata relationships by confidence
              FOR v2, e2 IN 1..1 OUTBOUND v1 AuthorOf, TagOf, BestGuessOf   // For each metadata vertice, traverse its vertices (images)
                FILTER v2._key NOT IN ${clickedImages}                      // Filter for images not already clicked
                COLLECT img = v2 WITH COUNT INTO num                        // Collect all vertices (i.e Images), count their number of occurences
                SORT num DESC
                LIMIT 6
                RETURN img                                                  // Return the top 6
      )
      // (This is still a Work in Progress)
      LET localizationMatches = (
        FOR i IN Image                                                      // Iterate through images
          FILTER i._key IN ${clickedImages}                                 // Filter for clicked images
          FOR v1, e1 IN 1..1 INBOUND i TagOf                                // For each image, traverse its Tag vertices
              FILTER e1._type == 'object'                                   // Filter for 'object' relationships
              FOR v2, e2 IN 1..1 OUTBOUND v1 TagOf                          // For each Tag vertice, traverse its vertices (images)
                FILTER e2._type == 'object' AND v2._key NOT IN ${clickedImages} // Filter for new 'object' relationships
                FILTER GEO_INTERSECTS(GEO_LINESTRING(e1._coord), GEO_LINESTRING(e2._coord)) // Filter for object coordinate intersection
                FILTER e2._score > 0.85
                SORT e2._score DESC                                         // Sort by confidence score
                LIMIT 4
                RETURN DISTINCT v2                                          // Return the top 4
      )
      // (This is still a Work in Progress)
      LET landmarkMatches = (
        FOR i IN Image                                                      // Iterate through images
          FILTER i._key IN ${clickedImages}                                 // Filter for clicked images
          FOR v1, e1 IN 1..1 INBOUND i TagOf                                // For each image, traverse its Tag vertices
            FILTER e1._type == 'landmark'                                   // Filter for 'landmark' relationships
            SORT e1._score DESC
            FOR i2 IN Image                                                 // Iterate through images (again)
              FILTER i2._key != i._key                                      // Filter for images not prev. clicked
              FOR v2, e2 IN 1..1 INBOUND i2 TagOf                           // For each non-clicked image, traverse its Tag vertices
                  FILTER e2._type == 'landmark' AND v2._key NOT IN ${clickedImages} // Filter for new 'landmark' relationships
                  LET dist = DISTANCE(e1._latitude, e1._longitude, e2._latitude, e2._longitude) // Calculate distance between landmark metadata
                  FILTER dist < 1000
                  SORT dist
                  RETURN DISTINCT i2                                        // Return all images within 1km
      )
      RETURN APPEND(landmarkMatches, commonMatches, true)
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
            FILTER v IN matchList // temporary measure to avoid clutter
            LET vertice = {
              _key: v._key,
              _id: v._id,
              data: v.author OR v.tag OR v.bestGuess,
              color: v.author ? '#E9D758' : (v.tag ? '#297373' : '#FF8552')
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
 * @returns the nodes & edges for VISJS to use client-side
 *
 */
export async function fetch_image_visualization(
  clickedImages: string[]
): Promise<{ vertices: Vertice[]; connections: Connection[] }> {
  const similarImages = await fetch_discovery(clickedImages);

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
              color: '#FF36AB',
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
              data: v.author OR v.tag OR v.bestGuess,
              color: v.author ? '#E9D758' : (v.tag ? '#297373' : '#FF8552')
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
