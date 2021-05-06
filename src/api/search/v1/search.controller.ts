import e, { Request, Response } from 'express';
import { imageObject } from '../../../collections/Image';
import parseGCPData from '../../../gcp';

namespace SearchController {
  export async function from_mixed_keys(req: Request, res: Response): Promise<void> {
    const labels: string[] = typeof req.query.labels === 'string' ? req.query.labels.split(' ') : [''];
    let data: {}[] | undefined = await fetch_data(req.query, labels);
    if (!data) res.status(500).json('Error searching from mixed keys');
    else {
      if (req.query.isVisualizeRequest) data = await imageObject.fetch_visualizer_info(data);

      res
        .status(data ? 200 : 500)
        .json(data ? { data, labels } : `Error ${req.query.isVisualizeRequest ? 'visualizing' : 'searching'} from mixed keys`);
    }
  }

  export async function from_surprise_keys(req: Request, res: Response): Promise<void> {
    const labels: string[] | undefined = await imageObject.fetch_surprise_keys();
    if (!labels) res.status(500).json('Error fetching surprise keys');
    else {
      const data: {}[] | undefined = await fetch_data(req.query, labels);
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
        const data: {}[] | undefined = await fetch_data(req.query, labels);
        res.status(data ? 200 : 500).json(data ? { data, labels } : 'Error searching from mixed keys');
      }
    }
  }

  async function fetch_data(queryParams: any, labels: string[]): Promise<{}[] | undefined> {
    return await (queryParams.isStrict ? imageObject.query_mixed_keys_strict(labels) : imageObject.query_mixed_keys(labels));
  }
}

export default SearchController;
