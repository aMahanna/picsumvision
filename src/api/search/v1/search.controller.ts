import { Request, Response } from 'express';
import fetchVisionMetadata from '../../../vision';
import { Vertice, Connection, VisionAnnotation, ArangoImage } from '../../../interfaces';
import {
  fetch_images,
  fetch_surprise_tags,
  fetch_discovery,
  fetch_image_visualization,
  fetch_search_visualization,
} from '../../../queries';

/**
 * Builds an array of nodes & edges, to provide formatted data to the React Graph Visualizer tool
 *
 * @param info An array of vertices, and an array of connections
 * @returns {nodes, edges}
 */
function parseVisualizationInfo(info: { vertices: Vertice[]; connections: Connection[] }, isSearchVisualization: boolean) {
  const edgeColors = ['#241023', '#4464AD', '#DC0073', '#47A025', '#FF7700', '#6B0504'];
  let nodes: { id: string; label: string; font: { color: string }; color: string }[] = [];
  let edges: { id: string; from: string; to: string; label?: string; color?: string }[] = [];

  for (let i = 0; i < info.vertices.length; i++) {
    const vertice: Vertice = info.vertices[i];
    nodes = nodes.concat([{ id: vertice._id, label: vertice.data!, font: { color: 'white' }, color: vertice.color }]);
  }

  for (let j = 0; j < info.connections.length; j++) {
    const connect: Connection = info.connections[j];
    const edgeColor = edgeColors[j];
    nodes = nodes.concat([
      { id: connect.i._id, label: connect.i._key, font: { color: 'white' }, color: connect.i.color || '#422040' },
    ]);
    for (let t = 0; t < connect.edges.length; t++) {
      const edge = connect.edges[t];
      edges = edges.concat([
        {
          id: edge._id,
          from: edge._from,
          to: edge._to,
          label: isSearchVisualization ? `${edge._score.toFixed(2)}%` : undefined,
          color: edgeColor,
        },
      ]);
    }
  }
  return { nodes, edges };
}

/**
 * The @namespace for orchestrating Search operations
 */
namespace SearchController {
  /**
   * Handles requests to the @endpoint /api/search/keyword
   * Using the keyword provided, returns the result of an ArangoDB query
   *
   * @param req Request
   * @param res Response
   */
  export async function from_keyword(req: Request, res: Response): Promise<void> {
    const keyword: string | undefined = typeof req.query.keyword === 'string' ? req.query.keyword : undefined;
    if (!keyword) res.status(400).json('User must pass a keyword as a string to search');
    else {
      const data: ArangoImage[] = await fetch_images(keyword);
      res.status(data.length === 0 ? 204 : 200).json({ data });
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
  export async function from_url(req: Request, res: Response): Promise<void> {
    const url: string | undefined = typeof req.query.url === 'string' ? req.query.url : undefined;
    if (!url) res.status(400).json('Unacceptable URL');
    else {
      const tags: string | undefined = await parseVisionData(url);
      if (!tags) res.status(500).json('Error fetching surprise keys');
      else {
        const data: ArangoImage[] = await fetch_images(tags);
        res.status(data.length === 0 ? 204 : 200).json({ data, tags });
      }
    }
  }

  /**
   * Handles requests to the @endpoint /api/search/surpriseme
   * Will create a random keyword, and then query the result
   *
   * @param req Request
   * @param res Response
   */
  export async function from_surprise(req: Request, res: Response): Promise<void> {
    const tags: string = await fetch_surprise_tags();
    if (tags.length === 0) res.status(500).json('Error fetching surprise keys');
    else {
      const data: ArangoImage[] = await fetch_images(tags);
      res.status(200).json({ data, tags });
    }
  }

  /**
   * Handles requests to the @endpoint /api/search/discover
   * Will return Images with similar tags to the images that the user has clicked on
   * - Also takes into account the user's search history, as this provides better context
   *
   * @param req Request
   * @param res Response
   */
  export async function from_discovery(req: Request, res: Response): Promise<void> {
    const imageIDs: string[] | undefined = typeof req.query.IDs === 'string' ? req.query.IDs.split(',') : undefined;
    if (!imageIDs) res.status(400).json('Unacceptable image IDs format');
    else {
      const data: ArangoImage[] = await fetch_discovery(imageIDs, 6);
      res.status(data.length === 0 ? 204 : 200).json({ data });
    }
  }

  /**
   * Handles requests to the @endpoint /api/search/visualize
   *
   *
   * @param req Request
   * @param res Response
   */
  export async function from_visualizer(req: Request, res: Response): Promise<void> {
    const visualizationType: string = typeof req.query.type === 'string' ? req.query.type : 'search';
    let data: { vertices: Vertice[]; connections: Connection[] } = { vertices: [], connections: [] };

    if (!visualizationType) {
      res.status(400).json('Invalid visualization type. Must be "image" or "search".');
    } else if (visualizationType === 'image') {
      const imageID = req.body.imageID;

      if (!imageID) {
        res.status(400).json('Missing image ID for image visualization.');
      } else {
        data = await fetch_image_visualization([imageID], 6);
      }
    } else if (visualizationType === 'search') {
      const keyword = req.body.keyword;
      const lastSearchResult = req.body.lastSearchResult;

      if (!keyword || !lastSearchResult) {
        res.status(400).json('Missing keyword and/or search result for visualization');
      } else {
        data = await fetch_search_visualization(keyword, lastSearchResult);
      }
    }

    if (data.vertices.length === 0) {
      res.status(204).json('No visualization info found :/');
    } else {
      const graphObject = parseVisualizationInfo(data, visualizationType === 'search');
      res.status(200).json({ graphObject });
    }
  }

  /**
   *
   * @param url The url to pass to the Vision API
   * @returns A keyword representing the image in question
   */
  export async function parseVisionData(url: string): Promise<string | undefined> {
    const VISION_DATA = await fetchVisionMetadata(url); // Set max results to 3 for now
    if (!VISION_DATA || !VISION_DATA.labelAnnotations || VISION_DATA.error) {
      return undefined; // Exit early if Vision does not find anything
    }

    // Parse, sort & unify the metadata to ensure there are no conflicting values
    const LABEL_DATA = VISION_DATA.labelAnnotations.concat(
      VISION_DATA.webDetection?.webEntities ? VISION_DATA.webDetection.webEntities : [],
    );

    const uniqueLabelData = [
      ...new Map(LABEL_DATA.map((elem: VisionAnnotation) => [(elem.mid || elem.entityId)!, elem])).values(),
    ].sort((a: VisionAnnotation, b: VisionAnnotation) => (a.score > b.score ? -1 : a.score === b.score ? 0 : 1));

    // Return the Image's top 5 tags
    return uniqueLabelData
      .slice(0, 4)
      .map(tag => tag.description || tag.name)
      .join(' ');
  }
}

export default SearchController;
