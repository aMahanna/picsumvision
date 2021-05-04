import { Request, Response } from 'express';
import { imageObject } from '../../../collections/Image';

namespace InsertController {
  export async function upload(req: Request, res: Response): Promise<void> {
    const URLArray: string[] = req.body.URLArray;
    res.status(201).json('TODO!');
  }
}

export default InsertController;
