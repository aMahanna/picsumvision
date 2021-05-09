import http from 'http';
import app from './server';

if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  require('dotenv').config();
}
const port = process.env.PORT || 5000;

http.createServer(app).listen(port, () => console.log(`Listening on port ${port}`)); // eslint-disable-line no-console
