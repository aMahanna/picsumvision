import { Request, Response } from 'express';

namespace InsertController {
  /**
   * @todo
   * A placeholder method, if I ever wanted to add in any upload features
   * - Upload via URL:
   *    - Validate that the url points to an image
   * - Upload via file:
   *    - (Client) Check extension type, convert to base64 uri
   *
   * - Use vision.ts @file to fetch Vision metadata for that image
   * - Use Vision's SAFE_SEARCH metadata to verify that the image is not explicit
   * - Perform document & edge insertions, similar to the populate.ts @file
   * - Respond back to client with a 201 if successful
   *
   * - @todo Figure out how to check for duplicate insertion attempts
   *
   * @param req Response
   * @param res Request
   */
  export async function upload(req: Request, res: Response): Promise<void> {
    res.status(201).json('TODO!');
  }
}

export default InsertController;
