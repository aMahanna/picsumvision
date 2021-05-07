/**
 * Interfaces commonly used by API & Collection functions.
 * @interface Vertice represents a Label
 * @interface Connection represents an Image, and its Edge links to labels or an author
 * @interface VisionAnnotation represents the metadata returned by the Vision API
 * @interface ArangoImage represents the Image structure stored in Arango
 * @interface ArangoImageInfo represents the result of an Image Info query (WIP)
 */
export interface Vertice {
  _id: string; // ArangoDB-generated ID
  _key: string; // The number section of ArangoDB-generated ID
  data: string; // The data it holds (label, author name, or best guess)
  color: string; // The color assigned to the vertice
}

export interface Connection {
  i: {
    // Represents the Image object
    _id: string; // ArangoDB-generated ID
    _key: string; // The number section of ArangoDB-generated ID
    author: string; // Image author
    url: string; // Image url
  };
  edges: {
    // Represents the array of edges associated to the Image object
    _id: string; // ArangoDB-generated ID
    _key: string; // The number section of ArangoDB-generated ID
    _from: string; // The source Vertice ID
    _to: string; // The target Vertice ID
    _score: number; // The confidence score of the Vertice data
  }[];
}

export interface VisionAnnotation {
  mid?: string; // A machine generated ID, used in OBJECT_LOCALIZATION & LABEL_DETECTION
  entityId?: string; // An ID designated to a Web Entity, used in WEB_DETECTION
  name?: string; // The name of the metadata, used in OBJECT_LOCALIZATION
  description?: string; // The description of the metadata, used in LABEL_DETECTION
  score: number; // The confidence score
}

export interface PicsumImage {
  id: number; // Image ID in Lorem Picsum
  author: string; // Image author
  width: number; // Image width
  height: number; // Image height
  url: string; // Image original URL (source site)
  download_url: string; // Image direct URL for download
}

export interface ArangoImage {
  author: string; // Author
  url: string; // Image url
  date: Date; // Insertion date
}

export interface ArangoImageInfo {
  image: ArangoImage;
  labels: {
    score: number;
    data: string;
  }[];
  bestGuess: string[];
}
