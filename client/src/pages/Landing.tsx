import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
// Import MUI Components
import { Container, CssBaseline, Box, Link as MUILink } from '@material-ui/core';

/**
 * Home page
 */
const Landing = () => {
  const [t] = useTranslation();

  // Store the metrics of each collection
  const [imageCount, setImageCount] = useState('');
  const [tagCount, setTagCount] = useState('');
  const [edgeCount, setEdgeCount] = useState('');
  const [authorCount, setAuthorCount] = useState('');
  const [bestGuessCount, setBestGuessCount] = useState('');

  useEffect(() => {
    fetch('/api/info/metrics')
      .then(result => (result.status === 200 ? result.json() : undefined))
      .then(response => {
        if (response) {
          setImageCount(response.data.images);
          setAuthorCount(response.data.authors);
          setTagCount(response.data.tags);
          setBestGuessCount(response.data.guesses);
          setEdgeCount(response.data.edges);
        }
      });
  }, []);

  return (
    <Container component="main" maxWidth="sm">
      <CssBaseline />
      <Box mt={4}>
        <h3>{t('landingPage.description')}</h3>
        <p>
          {t('landingPage.discover')}
          <br></br>
          {t('landingPage.visualize')}
        </p>
        <p>{t('landingPage.info')}</p>
      </Box>
      {imageCount !== '' && (
        <Box mt={4}>
          <div>
            {t('landingPage.images')}: <b>{imageCount}</b>
            {' | '}
            {t('landingPage.authors')}: <b>{authorCount}</b>
          </div>
          <div>
            {t('landingPage.tags')}: <b>{tagCount}</b>
            {' | '}
            {t('landingPage.guesses')}: <b>{bestGuessCount}</b>
          </div>
          <div>
            {t('landingPage.edges')}: <b>{edgeCount}</b>
          </div>
        </Box>
      )}
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
export default Landing;
