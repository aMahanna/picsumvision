import { Request, Response } from 'express';

namespace EraseController {
  /**
   * @todo
   * A placeholder method, if I ever wanted to add in any erase features
   * - (Client) User navigates to singular image menu, clicks on delete button
   * - Endpoint is called, passing the ID of the image to remove
   * - ArangoDB removes the image, as well as all related Edges that point to the image
   *    - Remove Author node only if it points to that single image
   *    - Remove any Label or BestGuess nodes only if they point to that single image
   * - Respond back to client with a 200 if successful
   *
   *
   * @param req Response
   * @param res Request
   */
  export async function remove(req: Request, res: Response): Promise<void> {
    res.status(200).json('TODO!');
  }
}

export default EraseController;
