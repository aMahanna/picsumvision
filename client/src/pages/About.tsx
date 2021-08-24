import React from 'react';
// Import MUI Components
import { Container, Box, Link as MUILink } from '@material-ui/core';

/**
 * About page (@todo)
 */
const About = () => {
  return (
    <Container component="main" maxWidth="md">
      {/** @todo - Time permitted, move descriptions to locale */}
      <Box mt={4}>
        <h3>
          Picsum Vision is an Image Repository built to expirement with graph-based searching functionalities. Images are generated via{' '}
          <a href="https://picsum.photos/">Lorem Picsum</a>, metadata is populated by{' '}
          <a href="https://cloud.google.com/vision">Google Vision</a> & <a href="http://www.datamuse.com/api/">Datamuse</a>, and data
          relationships are stored in <a href="https://www.arangodb.com/">ArangoDB</a>.
        </h3>
        <h4>
          It was presented as ArangoDB's{' '}
          <a href="https://www.youtube.com/watch?v=M4w4IuSbsRg&list=PL0tn-TSss6NXXvzRtAwyh50CGQ5MkfUyh&index=1">
            first Community Pioneer initiative of 2021.
          </a>
        </h4>
      </Box>
      <Box mt={3}>
        <h4>Features</h4>
        <div>
          <b>Query</b>: Search images by keyword / url in the text bar.
        </div>
        <div>
          <b>Surprise Me</b>: Search images from a random image's primary tags.
        </div>
        <div>
          <b>Discover</b>: View images similar to the images you have previously viewed (i.e clicked on).
        </div>
        <div>
          <b>Visualize</b>: Turn your last search results into a graph network to visualize image relationships.
        </div>
        <div>
          <b>Interact</b>: Click on an image to see its tags, its best guess, and its visually similar images.
        </div>
        <div>
          <b>History</b>: Review & playback your searches, image clicks, and favourites.
        </div>
      </Box>
      <Box mt={3}>
        <h4>How it works</h4>
        <div>
          <b>DB Architecture:</b> Images, Tags, Best Guesses & Authors have their own vertices.{' '}
        </div>
        <div>They are connected via ranked edges. Graph traversal is now accessible via a spiderweb of sub-graphs.</div>
        <br></br>
        <div>
          <b>Query</b>: Combine <a href="https://www.arangodb.com/community-server/arangosearch/">ArangoSearch</a> and the{' '}
          <a href="https://en.wikipedia.org/wiki/Okapi_BM25">Okapi BM25</a> ranking function with standard graph traversals.
        </div>
        <div>
          <b>Surprise Me</b> Pick a random image, create a keyword from its top tags, and perform a Query search.
        </div>
        <div>
          <b>Discover</b>: For all images clicked on, perform a 2-step graph traversal to collect images with most matches.
        </div>
        <div>
          <b>Visualize</b>: Perform a regular Query, but collect vertice <b>and</b> edge data through graph traversal.
        </div>
        <div>
          <b>Interact</b>: Perform 1-step graph traversal to fetch its tags, and run Discovery to fetch similar images.
        </div>
        <div>
          <b>History</b>: Use client-side caching (i.e local storage) to keep track of user clicks, searches & favourites
        </div>
      </Box>
      <Box>
        <img alt="Picsum Vision stack" src="/stack.png" style={{ height: '100%', width: '100%' }}></img>
      </Box>
      <Box mt={4}>
        <p>
          <MUILink color="inherit" href="https://mahanna.dev/">
            aMahanna
          </MUILink>
          {' © ' + new Date().getFullYear()}
        </p>
      </Box>
    </Container>
  );
};
export default About;
