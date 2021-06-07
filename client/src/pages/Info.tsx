import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
// Import MUI Components
import { Container, Box, ImageList, ImageListItem, Tooltip, Button } from '@material-ui/core';
// Import hooks
import usePersistedState from '../hooks/usePersistedState';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Info = (props: any) => {
  const [t] = useTranslation(); // Translation use
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
    const fromSearch: string | undefined = props.location?.state?.fromSearch;
    fetch(`/api/info/image?id=${id}`)
      .then(response => (response.status === 200 ? response.json() : undefined))
      .then(result => {
        if (result.data?.image) {
          setURL(result.data.image.url);
          setAuthor(result.data.image.author);
          setBestGuess(result.data.bestGuess);
          setLabels(result.data.labels);
          setSimilar(result.data.similar);

          setImageIDs({
            ...imageIDs,
            [id]: {
              fromSearch,
              date: new Date(),
            },
          });
        } else {
          props.history.push('/');
        }
      });
  }, [id, props.history]);

  return (
    <Container component="main" maxWidth="md">
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
          labels.map((label: { label: string; score: number }) => (
            <Box key={label.label} mt={1}>
              <span>
                <b>{label.label}</b>: {label.score.toFixed(2)}%
              </span>
            </Box>
          ))}
        {similar !== undefined && similar.length !== 0 && (
          <Container maxWidth="sm">
            <Box mt={4}>
              <Tooltip title={`${t('infoPage.visualizeTip')}`} placement="right">
                <Button id="search-surprise" to={`/visualize/${id}`} color="inherit" component={Link}>
                  {t('infoPage.visualize')}
                </Button>
              </Tooltip>
            </Box>
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
    </Container>
  );
};
export default Info;
