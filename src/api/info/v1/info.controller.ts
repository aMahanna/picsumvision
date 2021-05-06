import { Request, Response } from 'express';
import { imageObject } from '../../../collections/Image';

/**
 * The @namespace for orchestrating Info operations
 * Currently a Work In Progress
 */
namespace InfoController {
  /**
   * Handles request to the @endpoint /api/info/image
   * Returns information about an image, such as its author, url, and associated labels
   *
   * @param req Request
   * @param res Response
   */
  export async function fetch_image(req: Request, res: Response): Promise<void> {
    const id: string = typeof req.query.id === 'string' ? req.query.id : '0';
    const data: {}[] | undefined = await imageObject.fetch_image_info(id);
    res.status(200).json({ data });
  }

  /**
   * Handles request to the @endpoint /api/info/randomkeys
   * Returns random labels to the client user for query inspiration
   *
   * @param req Request
   * @param res Response
   */
  export async function fetch_surprise_keys(req: Request, res: Response): Promise<void> {
    const labels: string | undefined = await imageObject.fetch_surprise_keys();
    if (!labels) res.status(500).json('Error fetching surprise keys');
    if (labels) {
      res.status(200).json({ labels });
    }
  }
}

export default InfoController;
