/**
 * Interfaces commonly used by API & Collection functions.
 * @interface Vertice represents a Label
 * @interface Connection represents an Image, and its Edge links to labels or an author
 * @interface VisionResult represents the metadata structure returned by the Vision API
 * @interface VisionAnnotation represents certain metadata objects returned by the Vision API
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

export interface VisionResult {
  labelAnnotations: VisionAnnotation[];
  webDetection: {
    webEntities: VisionAnnotation[];
    bestGuessLabels: { label: string; languageCode: string }[];
  };
  localizedObjectAnnotations: VisionAnnotation[];
  error?: {
    code: number;
    message: string;
  };
}

export interface VisionAnnotation {
  mid?: string; // A machine generated ID, used in OBJECT_LOCALIZATION & LABEL_DETECTION
  entityId?: string; // An ID designated to a Web Entity, used in WEB_DETECTION
  name?: string; // The name of the metadata, used in OBJECT_LOCALIZATION
  description?: string; // The description of the metadata, used in LABEL_DETECTION
  label?: string; // The field of a GCP Best Guess, used in WEB_DETECTION
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
  _id: string;
  _key: string;
  _rev: string;
  author: string; // Author
  url: string; // Image url
  date: Date; // Insertion date
}

export interface ArangoImageInfo {
  image: ArangoImage;
  bestGuess: string[];
  labels: {
    score: number;
    data: string;
  }[];
  similar: ArangoImage[];
}

export interface ArangoDBMetrics {
  image: number;
  author: number;
  label: number;
  guess: number;
  edge: number;
}
