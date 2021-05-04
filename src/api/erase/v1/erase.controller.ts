import { Request, Response } from 'express';
import { imageObject } from '../../../collections/Image';

namespace EraseController {
  export async function remove(req: Request, res: Response): Promise<void> {
    const URLArray: string[] = req.body.URLArray;
    res.status(202).json('TODO!');
  }
}

export default EraseController;
