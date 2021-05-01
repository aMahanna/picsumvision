// Define required libraries.
import express from 'express';
import http from 'http';
import path from 'path';
import user_routes from './src/api/user/v1/user.router';

const app = express();

if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  require('dotenv').config();
}
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'client', 'build')));

/** @todo Re-enable the RateLimiter if needed */

// Route build files from client.
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, "client", "build", "index.html"));
});

// Add app reference to routes.
user_routes(app);

http.createServer(app).listen(port, () => console.log(`Listening on port ${port}`)); // eslint-disable-line no-console
