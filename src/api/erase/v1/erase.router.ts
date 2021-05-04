import erase from './erase.controller';
import { Express } from 'express';

export default function (app: Express): void {
  app.route('/api/erase').post(erase.remove);
}
