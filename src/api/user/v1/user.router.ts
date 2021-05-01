/**
 * The User API currently has two routes:
 * POST /api/login --> Authenticates the user through userAuthmiddleware
 */

import userAuth from '../../../middleware/userAuth';
import user from './user.controller';
import { Express } from 'express';

export default function (app: Express): void {
  app.route('/api/salt').post(user.get_salt);
  app.route('/api/login').post(user.login); // Passes through userAuth Middleware first
}
