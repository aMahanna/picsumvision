import { Request, Response, NextFunction } from 'express';

if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  require('dotenv').config();
}

/**
 * @todo If needed
 * @function Responsible for something
 *
 * @param req
 * @param res
 * @param next
 * @returns void
 */
const middleware = function (req: Request, res: Response, next: NextFunction): void {
  next();
};

export default middleware;
