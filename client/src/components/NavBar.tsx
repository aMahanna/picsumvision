import React from 'react';
import { Link } from 'react-router-dom';
// Import Material-UI Components
import LanguageIcon from '@material-ui/icons/Language';
import { CssBaseline, Container, Button, Link as MUILink } from '@material-ui/core';
// Import useTranslation hook to allow for bilingualism
import { useTranslation } from 'react-i18next';

/**
 * The Navigation Bar of the website holds the Logo, Title, and Search / About Buttons
 */
const NavBar = () => {
  const [t, i18n] = useTranslation();
  const lang = i18n.language; // Fetch the current language being used ('en'/'fr')

  return (
    <Container component="nav" maxWidth="md" className="navbar navbar-expand-sm navbar-light border-bottom justify-content-between">
      <CssBaseline />
      <div style={{ width: 'auto', display: 'inline-block' }}>
        <MUILink
          to={window.location}
          style={{ position: 'fixed', right: 15, top: 5, color: 'rgba(0, 0, 0, 0.87)', fontSize: '18px' }}
          className={'text-capitalize font-weight-normal nav-item nav-link active'}
          component={Link}
          onClick={() => i18n.changeLanguage(lang === 'en' ? 'fr' : 'en')}
        >
          <LanguageIcon style={{ fontSize: 11 }} /> {lang === 'en' ? 'en' : 'fr'}
        </MUILink>
      </div>
      <Container component="div" maxWidth="sm">
        <div style={{ width: 'auto', display: 'inline-block' }}>
          <a href="/">
            <img alt="Elections Logo" src={'/logo.svg'} className="nav--image" />
          </a>
        </div>
        <div style={{ width: 'auto', display: 'inline-block' }}>
          <h1 className="nav--title">{t('general.title')}</h1>
        </div>
        <Container component="div" maxWidth="md" className="navbar-nav--items">
          <Button size="large" to="/search" component={Link}>
            {t('general.searchButton')}
          </Button>
          <Button size="large" to="/about" component={Link}>
            {t('general.aboutButton')}
          </Button>
        </Container>
      </Container>
    </Container>
  );
};
export default NavBar;
