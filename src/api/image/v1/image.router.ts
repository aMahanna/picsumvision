/**
 * The User API currently has two routes:
 * POST /api/login --> Authenticates the user through userAuthmiddleware
 */

import userAuth from '../../../middleware/userAuth';
import image from './image.controller';
import { Express } from 'express';

export default function (app: Express): void {
  //app.route('/api/image/...').post();
}
