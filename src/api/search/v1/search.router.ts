import search from './search.controller';
import { Express } from 'express';

export default function (app: Express): void {
  app.route('/api/search/mixed').get(search.from_mixed_keys);
  app.route('/api/search/surpriseme').get(search.from_surprise_keys);
  app.route('/api/search/randomkeys').get(search.fetch_surprise_keys);
}
