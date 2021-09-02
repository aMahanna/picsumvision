import random
import math
from server import arango
from server.types import ArangoImage, ArangoImageInfo, VisualizationData

ignored_words = [
    "atmosphere",
    "cloud",
    "image",
    "stock.xchng",
    "sky",
    "wallpaper",
    "photograph",
    "image",
    "person",
]


def fetch_images(keyword: str) -> list[ArangoImage]:
    aql = """
      WITH Image, Author, Tag, BestGuess                          // Import Required Collections
      LET normTokens = TOKENS(@keyword, 'norm_accent_lower')[0]   // Tokenize user input for exact matching
      LET textTokens = TOKENS(@keyword, 'text_en_stopwords')      // Tokenize user input for close matching
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
    """

    bind_vars = {"keyword": keyword}

    result = arango.query(aql, bind_vars=bind_vars).next()
    return result


def fetch_surprise_tags() -> str:
    max_results = math.floor(random.random() * 3) + 1
    aql = """
      With Tag
      FOR i IN Image
        SORT RAND()
        LIMIT 1
        FOR v, e IN 1..1 INBOUND i TagOf
          FILTER LOWER(v.tag) NOT IN @ignored_words
          FILTER e._score >= 0.60
          SORT RAND()
          LIMIT @max_results
          RETURN v.tag
    """

    bind_vars = {"max_results": max_results, "ignored_words": ignored_words}

    result = arango.query(aql, bind_vars=bind_vars)
    return " ".join([tag for tag in result])


def fetch_image_info(id: str) -> ArangoImageInfo:
    aql = """
      WITH Image, Author, Tag, BestGuess 
      LET image = FIRST(FOR i IN Image FILTER i._key == @id RETURN i) 
      LET bestGuess = (FOR v IN 1..1 INBOUND image BestGuessOf RETURN v.bestGuess) 
      LET tags = (FOR v, e IN 1..1 INBOUND image TagOf SORT e._score DESC RETURN {_id: v._id, tag: v.tag, score: e._score}) 
      RETURN {image, bestGuess, tags}
    """

    bind_vars = {"id": id}

    result = arango.query(aql, bind_vars=bind_vars).next()
    result["similar"] = fetch_discovery([id])
    return result


def fetch_discovery(clicked_images: list[str]) -> list[ArangoImage]:
    aql = """
      WITH Author, Tag, BestGuess                                           // Import collections
      LET commonMatches = (
        FOR i IN Image                                                      // Iterate through images
          FILTER i._key IN @clicked_images                                  // Filter for images already clicked
            FOR v1, e1 IN 1..1 INBOUND i AuthorOf, TagOf, BestGuessOf       // For each visited image, traverse its vertices (metadata)
              SORT e1._score DESC                                           // Sort metadata relationships by confidence
              FOR v2, e2 IN 1..1 OUTBOUND v1 AuthorOf, TagOf, BestGuessOf   // For each metadata vertice, traverse its vertices (images)
                FILTER v2._key NOT IN @clicked_images                       // Filter for images not already clicked
                COLLECT img = v2 WITH COUNT INTO num                        // Collect all vertices (i.e Images), count their number of occurences
                SORT num DESC
                LIMIT 6
                RETURN img                                                  // Return the top 6
      )
      // (This is still a Work in Progress)
      LET localizationMatches = (
        FOR i IN Image                                                      // Iterate through images
          FILTER i._key IN @clicked_images                                  // Filter for clicked images
          FOR v1, e1 IN 1..1 INBOUND i TagOf                                // For each image, traverse its Tag vertices
              FILTER v1.tag NOT IN ['Person', 'Building', 'Lighting']       // Filter out "vague" tags
              FILTER e1._type == 'object' AND e1._score > 0.75              // Filter for confident 'object' relationships
              FOR v2, e2 IN 1..1 OUTBOUND v1 TagOf                          // For each Tag vertice, traverse its vertices (images)
                FILTER v2._key NOT IN @clicked_images
                FILTER e2._type == 'object' AND e2._score > 0.80            // Filter for new confident 'object' relationships
                FILTER GEO_INTERSECTS(GEO_LINESTRING(e1._coord), GEO_LINESTRING(e2._coord)) // Filter for object coordinate intersection
                SORT e2._score DESC                                         // Sort by confidence score
                LIMIT 4
                RETURN DISTINCT v2                                          // Return the top 2
      )
      LET landmarkMatches = (
        FOR i IN Image                                                      // Iterate through images
          FILTER i._key IN @clicked_images                                  // Filter for clicked images
          FOR v1, e1 IN 1..1 INBOUND i TagOf                                // For each image, traverse its Tag vertices
            FILTER e1._type == 'landmark'                                   // Filter for 'landmark' relationships
            SORT e1._score DESC
            FOR i2 IN Image                                                        // Iterate through images (again)
              FILTER i2._key != i._key                                             // Filter for images not prev. clicked
              FOR v2, e2 IN 1..1 INBOUND i2 TagOf                                  // For each non-clicked image, traverse its Tag vertices
                  FILTER e2._type == 'landmark' AND v2._key NOT IN @clicked_images // Filter for new 'landmark' relationships
                  LET dist = DISTANCE(e1._latitude, e1._longitude, e2._latitude, e2._longitude) // Calculate distance between landmark metadata
                  FILTER dist < 1000
                  SORT dist
                  RETURN DISTINCT i2                                        // Return all images within 1km
      )
      RETURN APPEND(landmarkMatches, APPEND(localizationMatches, commonMatches), true)
    """

    bind_vars = {"clicked_images": clicked_images}

    result = arango.query(aql, bind_vars=bind_vars).next()
    return result


def fetch_search_visualization(
    keyword: str, image_results: list[ArangoImage]
) -> VisualizationData:

    aql = """
      WITH Image, Author, Tag, BestGuess
      LET textTokens = TOKENS(@keyword, 'text_en_stopwords')
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
        FOR i IN @image_results
          FOR v, e IN 1..1 INBOUND i._id AuthorOf, TagOf, BestGuessOf OPTIONS {bfs: true, uniqueVertices: 'global' }
            FILTER v IN matchList
            LET vertice = {
              _key: v._key,
              _id: v._id,
              data: v.author OR v.tag OR v.bestGuess,
              color: v.author ? '#E9D758' : (v.tag ? '#297373' : '#FF8552')
            }
            RETURN DISTINCT vertice
      )
      LET connections = (
        FOR i IN @image_results
          LET edges = (FOR v, e IN 1..1 INBOUND i._id AuthorOf, TagOf, BestGuessOf RETURN e)
          RETURN {i, edges}
      )
      RETURN {vertices, connections}
    """

    bind_vars = {"keyword": keyword, "image_results": image_results}

    result = arango.query(aql, bind_vars=bind_vars).next()
    return result


def fetch_image_visualization(clicked_images: list[str]) -> VisualizationData:
    similar_images = fetch_discovery(clicked_images)

    aql = """
      WITH Image, Author, Tag, BestGuess
      LET startEdges = (
        FOR i IN Image
          FILTER i._key IN @clicked_images
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
          FILTER i._key IN @clicked_images
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
        FOR i IN @similar_images
          LET edges = (FOR v, e IN 1..1 INBOUND i._id AuthorOf, TagOf, BestGuessOf RETURN e)
          RETURN {i, edges}
      )
      RETURN {vertices, connections: APPEND(startEdges, endEdges)}
    """

    bind_vars = {"clicked_images": clicked_images, "similar_images": similar_images}

    result = arango.query(aql, bind_vars=bind_vars).next()
    return result


def fetch_db_metrics() -> dict[str, int]:
    aql = """
      RETURN {
        images: LENGTH(Image),
        authors: LENGTH(Author),
        guesses: LENGTH(BestGuess),
        tags: LENGTH(Tag),
        edges: LENGTH(AuthorOf) + LENGTH(TagOf) + LENGTH(BestGuessOf)
      }
    """

    result = arango.query(aql).next()
    return result
