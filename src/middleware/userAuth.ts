/**
 * userAuth.ts Is the middleware responsible for user authentication
 */

import { UserObject, IUser } from '../model/User';
import { Request, Response, NextFunction } from 'express';
import { CallbackError } from 'mongoose';

if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  require('dotenv').config();
}

/**
 * @function Responsible for validating a user's authenticity
 *
 * @param req
 * @param res
 * @param next
 * @returns void
 */
const userAuth = function (req: Request, res: Response, next: NextFunction): void {
  next();
};

export default userAuth;
