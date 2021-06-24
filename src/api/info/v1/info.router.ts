import info from './info.controller';
import { Express } from 'express';

export default function (app: Express): void {
  app.route('/api/info/image').get(info.fetch_image);
  app.route('/api/info/randomtags').get(info.fetch_tags);
  app.route('/api/info/metrics').get(info.fetch_metrics);
}
