import { Request, Response } from 'express';
import { imageObject } from '../../../collections/Image';
import parseVisionData from '../../../vision';
import { Vertice, Connection } from '../../../interfaces';

/**
 * The @namespace for orchestrating Search operations
 * Currently a Work In Progress
 */
namespace SearchController {
  /**
   * Handles requests to the @endpoint /api/search/mixed
   * Using the labels provides, returns the result of an ArangoDB query
   * The result depends on the isStrict & isVisualizeRequest query parameters provided
   *
   * @param req Request
   * @param res Response
   */
  export async function from_mixed_keys(req: Request, res: Response): Promise<void> {
    const labels: string[] = typeof req.query.labels === 'string' ? req.query.labels.split(' ') : [''];
    let data: {}[] | undefined = await fetch_data(req.query, labels);
    if (!data) {
      res.status(500).json('Error searching from mixed keys');
    } else if (!req.query.isVisualizeRequest) {
      res.status(200).json({ data, labels });
    } else {
      const visualizationInfo = await imageObject.fetch_visualizer_info(data);
      if (!visualizationInfo) {
        res.status(500).json('Error visualizing from mixed keys');
      } else {
        const graphObject = parseVisualizationInfo(visualizationInfo);
        res.status(200).json({ graphObject });
      }
    }
  }

  /**
   * Handles requests to the @endpoint /api/search/surpriseme
   * Will fetch random labels, and then query the result
   * The result depends on the isStrict parameters provided
   *
   * @param req Request
   * @param res Response
   */
  export async function from_surprise_keys(req: Request, res: Response): Promise<void> {
    const labels: string[] | undefined = await imageObject.fetch_surprise_keys();
    if (!labels) res.status(500).json('Error fetching surprise keys');
    else {
      const data: {}[] | undefined = await fetch_data(req.query, labels);
      res.status(data ? 200 : 500).json(data ? { data, labels } : 'Error searching from mixed keys');
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
    const url: string = typeof req.query.url === 'string' ? req.query.url : '';
    if (url === '') res.status(400).json('Unacceptable URL');
    else {
      const labels: string[] | undefined = await parseVisionData(url);
      if (!labels) res.status(500).json('Error fetching surprise keys');
      else {
        const data: {}[] | undefined = await fetch_data(req.query, labels);
        res.status(data ? 200 : 500).json(data ? { data, labels } : 'Error searching from mixed keys');
      }
    }
  }

  /**
   * Queries the ArangoDB in either a "strict" or "loose" fahsion
   *
   * @param queryParams An object to check the req.query.isStrict value
   * @param labels The labels to target
   * @returns The data from ArangoDB
   */
  async function fetch_data(queryParams: any, labels: string[]): Promise<{}[] | undefined> {
    return await (queryParams.isStrict
      ? imageObject.query_mixed_keys_strict(labels)
      : imageObject.query_mixed_keys_loose(labels));
  }

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
      nodes = nodes.concat([{ id: vertice._id, label: vertice.data, color: '#41BBD9' }]);
    }

    for (let j = 0; j < info.connections.length; j++) {
      const connect: Connection = info.connections[j];
      nodes = nodes.concat([{ id: connect.i._id, label: connect.i._key, color: '#F18F01' }]);
      for (let t = 0; t < connect.edges.length; t++) {
        const edge = connect.edges[t];
        edges = edges.concat([{ id: edge._id, from: edge._from, to: edge._to, label: String(edge._score) }]);
      }
    }

    return { nodes, edges };
  }
}

export default SearchController;
