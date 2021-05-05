import { Request, Response } from 'express';
import { imageObject } from '../../../collections/Image';
import parseGCPData from '../../../gcp';

namespace SearchController {
  export async function from_mixed_keys(req: Request, res: Response): Promise<void> {
    const labels: string[] = typeof req.query.labels === 'string' ? req.query.labels.split(' ') : [''];
    const data: {}[] | undefined = await (req.query.isStrict
      ? imageObject.query_mixed_keys_strict(labels)
      : imageObject.query_mixed_keys(labels));

    res.status(data ? 200 : 500).json(data ? { data } : 'Error searching from mixed keys');
  }

  export async function from_surprise_keys(req: Request, res: Response): Promise<void> {
    const labels: string[] | undefined = await imageObject.fetch_surprise_keys();
    if (!labels) res.status(500).json('Error fetching surprise keys');
    else {
      const data: {}[] | undefined = await (req.query.isStrict
        ? imageObject.query_mixed_keys_strict(labels)
        : imageObject.query_mixed_keys(labels));
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
        const data: {}[] | undefined = await (req.query.isStrict
          ? imageObject.query_mixed_keys_strict(labels)
          : imageObject.query_mixed_keys(labels));

        res.status(data ? 200 : 500).json(data ? { data } : 'Error searching from mixed keys');
      }
    }
  }
}

export default SearchController;
