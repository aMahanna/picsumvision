import { Request, Response } from 'express';
import { imageObject } from '../../../collections/Image';

namespace SearchController {
  export async function from_mixed_keys(req: Request, res: Response): Promise<void> {
    const Labels: string[] = typeof req.query.labels === 'string' ? req.query.labels.split(' ') : [''];
    const result: {}[] = await imageObject.query_mixed_keys(Labels);
    res.status(200).json(result);
  }
}

export default SearchController;
