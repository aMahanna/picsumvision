import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
// Import MUI Components
import { withStyles } from '@material-ui/core/styles';
import {
  Container,
  Box,
  ImageList,
  ImageListItem,
  Tooltip,
  Button,
  Accordion,
  AccordionSummary as MuiAccordionSummary,
  AccordionDetails,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
// Import hooks
import usePersistedState from '../hooks/usePersistedState';

const AccordionSummary = withStyles({
  content: {
    flexGrow: 0,
  },
})(MuiAccordionSummary);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Info = (props: any) => {
  const [t] = useTranslation();

  const [id] = useState(props.match.params.id);
  const [url, setURL] = useState('');
  const [author, setAuthor] = useState('');
  const [bestGuess, setBestGuess] = useState([]);
  const [tags, setTags] = useState([]);
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
          setTags(result.data.tags);
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
        {tags.length !== 0 && (
          <Container maxWidth="sm">
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>{t('infoPage.tags')}</AccordionSummary>
              <AccordionDetails>
                {tags.map((tag: { tag: string; score: number }) => (
                  <Box key={tag.tag} mt={1}>
                    <span>
                      <b>{tag.tag}</b>: {tag.score.toFixed(2)}%
                    </span>
                  </Box>
                ))}
              </AccordionDetails>
            </Accordion>
          </Container>
        )}
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
