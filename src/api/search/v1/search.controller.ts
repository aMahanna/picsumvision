import { Request, Response } from 'express';
import { imageObject } from '../../../collections/Image';
import fetchVisionMetadata from '../../../vision';
import { Vertice, Connection, VisionAnnotation, ArangoImage } from '../../../interfaces';

/**
 * Builds an array of nodes & edges, to provide formatted data to the React Graph Visualizer tool
 *
 * @param info An array of vertices, and an array of connections
 * @returns {nodes, edges}
 */
function parseVisualizationInfo(info: { vertices: Vertice[]; connections: Connection[] }) {
  let nodes: { id: string; label: string; color: string }[] = [];
  let edges: { id: string; from: string; to: string; label: string }[] = [];

  for (let i = 0; i < info.vertices.length; i++) {
    const vertice: Vertice = info.vertices[i];
    nodes = nodes.concat([{ id: vertice._id, label: vertice.data!, color: vertice.color }]);
  }

  for (let j = 0; j < info.connections.length; j++) {
    const connect: Connection = info.connections[j];
    nodes = nodes.concat([{ id: connect.i._id, label: connect.i._key, color: '#399E5A' }]);
    for (let t = 0; t < connect.edges.length; t++) {
      const edge = connect.edges[t];
      edges = edges.concat([{ id: edge._id, from: edge._from, to: edge._to, label: String(edge._score) }]);
    }
  }
  return { nodes, edges };
}

/**
 * The @namespace for orchestrating Search operations
 * Currently a Work In Progress
 */
namespace SearchController {
  /**
   * Handles requests to the @endpoint /api/search/mixed
   * Using the labels provides, returns the result of an ArangoDB query
   * The result depends on the isVisualizeRequest query parameter provided
   *
   * @param req Request
   * @param res Response
   */
  export async function from_mixed_keys(req: Request, res: Response): Promise<void> {
    const labels: string | undefined = typeof req.query.labels === 'string' ? req.query.labels : undefined;
    if (!labels) res.status(400).json('User must pass labels as a string to search');
    else {
      const data: ArangoImage[] = await imageObject.query_mixed_keys(labels);
      if (!req.query.isVisualizeRequest) {
        res.status(data.length === 0 ? 204 : 200).json({ data, labels: labels.split(' ').sort().join(' ') }); // Return a sorted version of the labels
      } else {
        const visualizationInfo = await imageObject.fetch_visualizer_info(data, labels);
        if (visualizationInfo.vertices.length === 0) {
          res.status(204).json('No visualization info found :/');
        } else {
          const graphObject = parseVisualizationInfo(visualizationInfo);
          res.status(200).json({ graphObject });
        }
      }
    }
  }

  /**
   * Handles request to the @endpoint /api/search/extImage
   * Using the url provided, fetch the associated Vision metadata
   * Query the Arango DB using the Vision metadata found
   *
   * @param req Request
   * @param res Response
   */
  export async function from_external_image(req: Request, res: Response): Promise<void> {
    const url: string | undefined = typeof req.query.url === 'string' ? req.query.url : undefined;
    if (!url) res.status(400).json('Unacceptable URL');
    else {
      const labels: string | undefined = await parseVisionData(url);
      if (!labels) res.status(500).json('Error fetching surprise keys');
      else {
        const data: ArangoImage[] = await imageObject.query_mixed_keys(labels);
        res.status(data.length === 0 ? 204 : 200).json({ data, labels });
      }
    }
  }

  /**
   * Handles requests to the @endpoint /api/search/surpriseme
   * Will fetch random labels, and then query the result
   *
   * @param req Request
   * @param res Response
   */
  export async function from_surprise_keys(req: Request, res: Response): Promise<void> {
    const labels: string = await imageObject.fetch_surprise_keys();
    if (labels.length === 0) res.status(500).json('Error fetching surprise keys');
    else {
      const data: ArangoImage[] = await imageObject.query_mixed_keys(labels);
      res.status(200).json({ data, labels });
    }
  }

  /**
   * Handles requests to the @endpoint /api/search/discovery
   * Will return Images with similar labels to the images that the user has clicked on
   *
   * @param req Request
   * @param res Response
   */
  export async function from_discovery(req: Request, res: Response): Promise<void> {
    const imageIDs: string[] | undefined = typeof req.query.IDs === 'string' ? req.query.IDs.split(',') : undefined;
    if (!imageIDs) res.status(400).json('Unacceptable image IDs format');
    else {
      const data: ArangoImage[] = await imageObject.fetch_discovery(imageIDs, 5);
      res.status(data.length === 0 ? 204 : 200).json({ data });
    }
  }

  /**
   *
   * @param url The url to pass to the Vision API
   * @returns An array of labels representing the image in question
   */
  export async function parseVisionData(url: string): Promise<string | undefined> {
    const VISION_DATA = await fetchVisionMetadata(url); // Set max results to 3 for now
    if (!VISION_DATA || VISION_DATA.error) {
      return undefined; // Exit early if Vision does not find anything
    }

    // Parse, sort & unify the metadata to ensure there are no conflicting values
    const VISION_LABEL_OBJECT_ANNOTATIONS: VisionAnnotation[] = VISION_DATA.labelAnnotations
      ?.concat(VISION_DATA.localizedObjectAnnotations ? VISION_DATA.localizedObjectAnnotations : [])
      .sort((a: VisionAnnotation, b: VisionAnnotation) => (a.score > b.score ? 1 : a.score === b.score ? 0 : -1));
    const UNIQUE_LABELS: VisionAnnotation[] = [
      ...new Map(VISION_LABEL_OBJECT_ANNOTATIONS.map((elem: VisionAnnotation) => [elem.mid, elem])).values(),
    ];

    // Iterate through the Unique Labels array the labels
    const labelsObject: string[] = [];
    for (let t = 0; t < UNIQUE_LABELS.length; t++) {
      const elem: VisionAnnotation = UNIQUE_LABELS[t];
      labelsObject.push((elem.description || elem.name)!.toLowerCase());
    }
    return labelsObject.join(' ') + VISION_DATA.webDetection?.bestGuessLabels[0]?.label;
  }
}

export default SearchController;
