import { Request, Response } from 'express';
import { imageObject } from '../../../collections/Image';

namespace SearchController {
  export async function from_mixed_keys(req: Request, res: Response): Promise<void> {
    const Labels: string[] = typeof req.query.labels === 'string' ? req.query.labels.split(' ') : [''];
    const result: {}[] | undefined = await (req.query.isStrict
      ? imageObject.query_mixed_keys_strict(Labels)
      : imageObject.query_mixed_keys(Labels));

    if (!result) res.status(500).json('Error searching from mixed keys');
    res.status(200).json({ result });
  }

  export async function from_surprise_keys(req: Request, res: Response): Promise<void> {
    const labels: string[] | undefined = await imageObject.fetch_surprise_keys();
    if (!labels) res.status(500).json('Error fetching surprise keys');
    if (labels) {
      const result: {}[] | undefined = await (req.query.isStrict
        ? imageObject.query_mixed_keys_strict(labels)
        : imageObject.query_mixed_keys(labels));
      if (!result) res.status(500).json('Error searching from surprise keys');
      res.status(200).json({ result, labels });
    }
  }

  export async function fetch_surprise_keys(req: Request, res: Response): Promise<void> {
    const labels: string[] | undefined = await imageObject.fetch_surprise_keys();
    if (!labels) res.status(500).json('Error fetching surprise keys');
    if (labels) {
      res.status(200).json({ labels });
    }
  }
}

export default SearchController;
