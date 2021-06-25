import { Request, Response } from 'express';
import { ArangoImageInfo } from '../../../interfaces';
import { fetch_image_info, fetch_surprise_tags, fetch_db_metrics } from '../../../queries';

/**
 * The @namespace for orchestrating Info operations
 */
namespace InfoController {
  /**
   * Handles request to the @endpoint /api/info/image
   * Returns information about an image, such as its author, url, associated tags, and similar images
   *
   * @param req Request
   * @param res Response
   */
  export async function fetch_image(req: Request, res: Response): Promise<void> {
    const id: string | undefined = typeof req.query.id === 'string' ? req.query.id : undefined;
    if (!id) res.status(400).json('User must pass image ID & previous search to view');
    else {
      const data: ArangoImageInfo[] = await fetch_image_info(id);
      res.status(data.length === 0 ? 204 : 200).json({ data });
    }
  }

  /**
   * Handles request to the @endpoint /api/info/randomtags
   * Returns random tags to the client user for query inspiration
   *
   * @param req Request
   * @param res Response
   */
  export async function fetch_tags(req: Request, res: Response): Promise<void> {
    const tags: string = await fetch_surprise_tags();
    if (tags.length === 0) res.status(500).json('Error fetching surprise keys');
    else {
      res.status(200).json({ tags });
    }
  }

  /**
   * Handles request to the @endpoint /api/info/metrics
   * Returns collection metrics
   *
   * @param req Request
   * @param res Response
   */
  export async function fetch_metrics(req: Request, res: Response): Promise<void> {
    const data = await fetch_db_metrics();
    if (!data.images) res.status(500).json('Error fetching metrics');
    else {
      res.status(200).json({ data });
    }
  }
}

export default InfoController;
