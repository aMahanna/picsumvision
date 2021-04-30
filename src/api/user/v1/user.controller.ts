/**
 * user.controller.ts Handles the fetching of level 1 salts & successful login requests
 */

import { UserObject, IUser } from '../../../model/User';
import { Request, Response } from 'express';
import { CallbackError } from 'mongoose';

namespace UserController {
  /**
   * @function Since the userAuth middleware arleady authenticates the user, all we need to do is return a 200
   * @param req
   * @param res
   */
  export function login(req: Request, res: Response): void {
    res.status(200).send({
      status: 200,
      message: 'Welcome',
    });
  }

  /**
   * @function Returns the level 1 salt of a valid user
   *
   * If Error, return 500
   * If No User (i.e sha value is not found in DB), return 418 as we don't want to handle it
   * Else, return 200 and provide the user's level 1 salt for slow-client-side hashing
   *
   * @param req
   * @param res
   */
  export function get_salt(req: Request, res: Response): void {
    const { sha }: { sha: string } = req.body;
    UserObject.findOne({ sha }, (err: CallbackError, user: IUser) => {
      if (err) {
        console.error(err); // eslint-disable-line no-console
        res.status(500).send({ status: 500, message: 'Error validating request' });
      } else if (!user) {
        res.status(418).send({ status: 418, message: 'Hi teapot!' });
      } else {
        const message = user.salt;
        res.status(200).send({ status: 200, message });
      }
    });
  }
}

export default UserController;
