import search from './search.controller';
import { Express } from 'express';

export default function (app: Express): void {
  app.route('/api/search/keyword').get(search.from_keyword);
  app.route('/api/search/url').get(search.from_url);
  app.route('/api/search/surpriseme').get(search.from_surprise);
  app.route('/api/search/discover').get(search.from_discovery);
  app.route('/api/search/visualize').post(search.from_visualizer);
}
