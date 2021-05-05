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
  const [imageID] = useState(props.match.params.id);
  const [imageURL, setImageURL] = useState('');
  const [imageAuthor, setImageAuthor] = useState('');
  const [imageLabels, setImageLabels] = useState([]);

  useEffect(() => {
    fetch(`/api/info/image?id=${imageID}`)
      .then(response => response.json())
      .then(result => {
        if (result.data.image) {
          setImageURL(result.data.image.url);
          setImageAuthor(result.data.image.author);
          setImageLabels(result.data.labels);
        } else {
          props.history.push('/search');
        }
      });
  }, [imageID, props.history]);

  return (
    <Container component="main" maxWidth="md">
      <CssBaseline />
      <Avatar className={classes.avatar}>
        <WhereToVoteOutlinedIcon fontSize="large" />
      </Avatar>
      <Box mt={4}>
        {imageURL !== '' && imageAuthor !== '' && imageLabels.length !== 0 && (
          <Box>
            <img alt={imageAuthor} className={classes.image} src={imageURL} />
            <h3>{imageAuthor}</h3>
            <h5>{imageURL}</h5>
            {imageLabels.map((label: { data: string; score: number }) => (
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
