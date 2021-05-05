import { Request, Response } from 'express';

namespace EraseController {
  export async function remove(req: Request, res: Response): Promise<void> {
    const URLArray: string[] = req.body.URLArray;
    res.status(202).json('TODO!');
  }
}

export default EraseController;
