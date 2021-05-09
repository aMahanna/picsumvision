import info from './info.controller';
import { Express } from 'express';

export default function (app: Express): void {
  app.route('/api/info/image').get(info.fetch_image);
  app.route('/api/info/randomkeys').get(info.fetch_surprise_keys);
  app.route('/api/info/metrics').get(info.fetch_db_metrics);
}
