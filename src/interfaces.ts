/**
 * Interfaces commonly used by API & Collection functions.
 * @interface vertice represents a Label
 * @interface connection represents an Image, and its Edge links to labels or an author
 */
export interface vertice {
  _id: string;
  _key: string;
  data: string;
}

export interface connection {
  i: {
    _id: string;
    _key: string;
    author: string;
    url: string;
    count: number;
  };
  edges: {
    _id: string;
    _key: string;
    _from: string;
    _to: string;
    _score: number;
  }[];
}
