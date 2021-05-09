import React from 'react';
import { useTranslation } from 'react-i18next';
// Import MUI Components
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import { Container, CssBaseline, Box, Avatar, Link as MUILink } from '@material-ui/core';
import { makeStyles, createStyles } from '@material-ui/styles';

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
      height: '100%',
      width: '100%',
    },
  }),
);

/**
 * About page (@todo)
 */
const About = () => {
  const [t] = useTranslation();
  const classes = useStyles();

  return (
    <Container component="main" maxWidth="sm">
      <CssBaseline />
      <Avatar className={classes.avatar}>
        <InfoOutlinedIcon fontSize="large" />
      </Avatar>
      <Box mt={4}>
        <h2>{t('aboutPage.heading')}</h2>
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
