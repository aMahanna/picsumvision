import insert from './insert.controller';
import { Express } from 'express';

export default function (app: Express): void {
  app.route('/api/insert').post(insert.upload);
}
