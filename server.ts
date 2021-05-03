// Define required libraries.
import express from 'express';
import http from 'http';
import path from 'path';
import search_routes from './src/api/search/v1/search.router';

const app = express();

if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  require('dotenv').config();
}
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../client', 'build')));

// Add app reference to routes.
search_routes(app);

// Route build files from client.
app.get("/*", function (req, res) {
   res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
})

http.createServer(app).listen(port, () => console.log(`Listening on port ${port}`)); // eslint-disable-line no-console
