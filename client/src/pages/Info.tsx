import React, { useEffect, useState } from 'react';
// import { useTranslation } from 'react-i18next';
// Import MUI Components
import ImageSearchIcon from '@material-ui/icons/ImageSearch';
import { Container, CssBaseline, Box, makeStyles, Avatar, createStyles, ImageList, ImageListItem } from '@material-ui/core';
import { default as MUILink } from '@material-ui/core/Link';
import usePersistedState from '../hooks/usePersistedState';

/**
 * CreateStyles allows us to style MUI components
 * This @var is passed as a paramater in the export of the component
 * @see https://material-ui.com/styles/basics/
 */
const useStyles = makeStyles(() =>
  createStyles({
    avatar: {
      backgroundColor: 'inherit',
      color: '#2F2D2E',
      margin: 'auto',
    },
  }),
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Info = (props: any) => {
  //const [t] = useTranslation();
  const classes = useStyles();
  const [id] = useState(props.match.params.id);
  const [url, setURL] = useState('');
  const [author, setAuthor] = useState('');
  const [bestGuess, setBestGuess] = useState([]);
  const [labels, setLabels] = useState([]);
  const [similar, setSimilar] = useState([]);

  const [imageIDs, setImageIDs] = usePersistedState('clicks', {}); // Persist user clicks to use for Discovery searches

  /**
   *
   * @useEffect Fetches & sets the information of an image
   * If no image is found, redirect to landing page
   */
  useEffect(() => {
    setImageIDs({
      ...imageIDs,
      [id]: {
        date: new Date(),
      },
    });
    fetch(`/api/info/image?id=${id}`)
      .then(response => (response.status === 200 ? response.json() : undefined))
      .then(result => {
        if (result) {
          setURL(result.data.image.url);
          setAuthor(result.data.image.author);
          setBestGuess(result.data.bestGuess);
          setLabels(result.data.labels);
          setSimilar(result.data.similar?.images);
        } else {
          props.history.push('/');
        }
      });
  }, [id, props.history]);

  return (
    <Container component="main" maxWidth="md">
      <CssBaseline />
      <Avatar className={classes.avatar}>
        <ImageSearchIcon fontSize="large" />
      </Avatar>
      <Box mt={4}>
        {url !== '' && author !== '' && (
          <div>
            <img alt={author} style={{ height: '50%', width: '50%', borderRadius: '0.5cm' }} src={url} />
            <h3>{author}</h3>
            <h5>{url}</h5>
          </div>
        )}
        {bestGuess.length !== 0 &&
          bestGuess.map((guess: string) => (
            <div key={guess}>
              <h4>{`« ${guess} »`}</h4>
            </div>
          ))}
        {labels.length !== 0 &&
          labels.map((label: { data: string; score: number }) => (
            <Box key={label.data} mt={1}>
              <span>
                <b>{label.data}</b>: {label.score.toFixed(2)}%
              </span>
            </Box>
          ))}
        {similar !== undefined && similar.length !== 0 && (
          <Container maxWidth="sm">
            <Box mt={3}>
              <ImageList variant="standard" style={{ overflowY: 'hidden' }} cols={2}>
                {similar.map((item: { url: string; _key: string; author: string }) => (
                  <ImageListItem key={item.url}>
                    <a href={`/info/${item._key}`}>
                      <img
                        src={item.url}
                        alt={item.author}
                        style={{ height: '100%', width: '100%', borderRadius: '0.5cm' }}
                        loading="lazy"
                      />
                    </a>
                  </ImageListItem>
                ))}
              </ImageList>
            </Box>
          </Container>
        )}
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
export default Info;
