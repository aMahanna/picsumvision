import { Request, Response } from 'express';
import { imageObject } from '../../../collections/Image';

namespace SearchController {
  export async function from_author(req: Request, res: Response): Promise<void> {
    const author: string = req.body.author || '%';
    const result: {}[] = await imageObject.simpleQuery('author', author);
    res.status(200).json(result);
  }

  export async function ping(req: Request, res: Response): Promise<void> {
    res.status(200).json('pong');
  }
}

export default SearchController;
