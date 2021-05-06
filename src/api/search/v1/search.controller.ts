import { Request, Response } from 'express';
import { imageObject } from '../../../collections/Image';
import parseGCPData from '../../../gcp';
import { vertice, connection } from '../../../interfaces';

namespace SearchController {
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

  export async function from_surprise_keys(req: Request, res: Response): Promise<void> {
    const labels: string[] | undefined = await imageObject.fetch_surprise_keys();
    if (!labels) res.status(500).json('Error fetching surprise keys');
    else {
      const data: {}[] | undefined = await fetch_data(req.query, labels);
      res.status(data ? 200 : 500).json(data ? { data, labels } : 'Error searching from mixed keys');
    }
  }

  export async function from_external_image(req: Request, res: Response): Promise<void> {
    const url: string = typeof req.query.url === 'string' ? req.query.url : '';
    if (url === '') res.status(400).json('Unacceptable URL');
    else {
      const labels: string[] | undefined = await parseGCPData(url);
      if (!labels) res.status(500).json('Error fetching surprise keys');
      else {
        const data: {}[] | undefined = await fetch_data(req.query, labels);
        res.status(data ? 200 : 500).json(data ? { data, labels } : 'Error searching from mixed keys');
      }
    }
  }

  async function fetch_data(queryParams: any, labels: string[]): Promise<{}[] | undefined> {
    return await (queryParams.isStrict ? imageObject.query_mixed_keys_strict(labels) : imageObject.query_mixed_keys(labels));
  }

  function parseVisualizationInfo(info: { vertices: vertice[]; connections: connection[] }) {
    let nodes: { id: string; label: string; color: string }[] = [];
    let edges: { id: string; from: string; to: string; label: string }[] = [];

    for (let i = 0; i < info.vertices.length; i++) {
      const vertice: vertice = info.vertices[i];
      nodes = nodes.concat([{ id: vertice._id, label: vertice.data, color: '#41BBD9' }]);
    }

    for (let j = 0; j < info.connections.length; j++) {
      const connect: connection = info.connections[j];
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
