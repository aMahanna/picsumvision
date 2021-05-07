import React, { useEffect, useState } from 'react';
// import { useTranslation } from 'react-i18next';
// Import MUI Components
import WhereToVoteOutlinedIcon from '@material-ui/icons/WhereToVoteOutlined';
import { Container, CssBaseline, Box, makeStyles, Avatar, createStyles } from '@material-ui/core';
import { default as MUILink } from '@material-ui/core/Link';
// Import Props interface to define what this component can receive as props

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
    image: {
      height: '50%',
      width: '50%',
      borderRadius: '1cm',
    },
  }),
);

const Info = (props: any) => {
  //const [t] = useTranslation();
  const classes = useStyles();
  const [id] = useState(props.match.params.id);
  const [url, setURL] = useState('');
  const [author, setAuthor] = useState('');
  const [labels, setLabels] = useState([]);
  const [bestGuess, setBestGuess] = useState([]);

  /**
   *
   * @useEffect Fetches & sets the information of an image
   * If no image is found, redirect to landing page
   */
  useEffect(() => {
    fetch(`/api/info/image?id=${id}`)
      .then(response => response.json())
      .then(result => {
        if (result.data.image) {
          setURL(result.data.image.url);
          setAuthor(result.data.image.author);
          setLabels(result.data.labels);
          setBestGuess(result.data.bestGuess);
        } else {
          props.history.push('/');
        }
      });
  }, [id, props.history]);

  return (
    <Container component="main" maxWidth="md">
      <CssBaseline />
      <Avatar className={classes.avatar}>
        <WhereToVoteOutlinedIcon fontSize="large" />
      </Avatar>
      <Box mt={4}>
        {url !== '' && author !== '' && labels.length !== 0 && (
          <Box>
            <img alt={author} className={classes.image} src={url} />
            <h3>{author}</h3>
            {bestGuess.map((guess: string) => (
              <div key={guess}>
                <h4>{`« ${guess} »`}</h4>
              </div>
            ))}
            <h5>{url}</h5>
            {labels.map((label: { data: string; score: number }) => (
              <Box key={label.data} mt={1}>
                <span>
                  <b>{label.data}</b>: {label.score.toFixed(2)}%
                </span>
              </Box>
            ))}
          </Box>
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
