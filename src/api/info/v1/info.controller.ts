import { Request, Response } from 'express';
import { imageObject } from '../../../collections/Image';
import { ArangoImageInfo } from '../../../interfaces';

/**
 * The @namespace for orchestrating Info operations
 */
namespace InfoController {
  /**
   * Handles request to the @endpoint /api/info/image
   * Returns information about an image, such as its author, url, and associated labels
   * Will also try to display similar images, based on the user's last search
   *
   * @param req Request
   * @param res Response
   */
  export async function fetch_image(req: Request, res: Response): Promise<void> {
    const id: string | undefined = typeof req.query.id === 'string' ? req.query.id : undefined;
    const searches: string | undefined = typeof req.query.searches === 'string' ? req.query.searches : undefined;
    if (!id) res.status(400).json('User must pass image ID & previous search to view');
    else {
      const data: ArangoImageInfo[] = await imageObject.fetch_image_info(id, searches);
      res.status(data.length === 0 ? 204 : 200).json({ data });
    }
  }

  /**
   * Handles request to the @endpoint /api/info/randomkeys
   * Returns random labels to the client user for query inspiration
   *
   * @param req Request
   * @param res Response
   */
  export async function fetch_surprise_keys(req: Request, res: Response): Promise<void> {
    const labels: string = await imageObject.fetch_surprise_keys();
    if (labels.length === 0) res.status(500).json('Error fetching surprise keys');
    else {
      res.status(200).json({ labels });
    }
  }

  /**
   * Handles request to the @endpoint /api/info/metrics
   * Returns collection metrics
   *
   * @param req Request
   * @param res Response
   */
  export async function fetch_db_metrics(req: Request, res: Response): Promise<void> {
    const data = await imageObject.fetch_db_metrics();
    if (!data.image) res.status(500).json('Error fetching metrics');
    else {
      res.status(200).json({ data });
    }
  }
}

export default InfoController;
