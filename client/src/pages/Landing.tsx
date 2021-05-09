import React from 'react';
import { useTranslation } from 'react-i18next';
// Import MUI Components
import HomeIcon from '@material-ui/icons/BubbleChart';
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
 * Home page (@todo)
 */
const Landing = () => {
  const [t] = useTranslation();
  const classes = useStyles();

  return (
    <Container component="main" maxWidth="sm">
      <CssBaseline />
      <Avatar className={classes.avatar}>
        <HomeIcon fontSize="large" />
      </Avatar>
      <Box mt={4}>
        <h2>{t('landingPage.heading')}</h2>
        <h3>{t('landingPage.description')}</h3>
        <p>{t('landingPage.discover')}</p>
        <p>{t('landingPage.visualize')}</p>
        <p>{t('landingPage.info')}</p>
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
export default Landing;
