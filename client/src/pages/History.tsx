import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
// Import MUI Components
import { Container, Button, Table, TableBody, TableContainer, TableHead, TableRow, TableCell, Paper, Box } from '@material-ui/core';
import getPersistedState from '../hooks/getPersistedState';

const History = () => {
  const [t, i18n] = useTranslation();
  const [makeHistory, setMakeHistory] = useState(''); // Provide some random tags for a quick search

  const [history] = getPersistedState('data');
  const [favourites] = getPersistedState('favourites');
  const [imageClicks] = getPersistedState('clicks');

  /**
   * @useEffect Sets some random tags for a quick search
   * (if user has no history)
   */
  useEffect(() => {
    if (!history) {
      fetch('/api/info/randomtags')
        .then(result => result.json())
        .then(response => {
          setMakeHistory(response.tags);
        });
    }
  }, [history]);

  /**
   * Removes the history cache from the user's session
   * Forces a reload to clear up the table
   */
  const clearCache = () => {
    localStorage.removeItem('data');
    localStorage.removeItem('lastSearch');
    localStorage.removeItem('favourites');
    localStorage.removeItem('clicks');
    window.location.reload();
  };

  /**
   * Renders the table row of each history stored in the cache
   * @param props The current history iteration
   * @returns An MUI TableRow component
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const HistoryRow = (props: { persistedState: any }) => {
    const key: string = Object.keys(props.persistedState)[0];
    const input: number = props.persistedState[key].input;
    const results: number = props.persistedState[key].data.length;
    const date: Date = new Date(props.persistedState[key].date);
    return (
      <TableRow key={key}>
        <TableCell component="th" scope="row">
          {input}
        </TableCell>
        <TableCell align="center">{results}</TableCell>
        <TableCell align="center">{`${date.toLocaleTimeString(i18n.language)} (${date.toLocaleDateString(i18n.language)})`}</TableCell>
        <TableCell align="center" className="search">
          <Link to={{ pathname: '/search', state: { fromHistory: key } }}>{t('historyPage.view')}</Link>
        </TableCell>
      </TableRow>
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const FavouritesRow = (props: { persistedState: any }) => {
    const key: string = Object.keys(props.persistedState)[0];
    const date: Date = new Date(props.persistedState[key].date);
    const author: string = props.persistedState[key].author;
    return (
      <TableRow key={key}>
        <TableCell component="th" scope="row">
          {key}
        </TableCell>
        <TableCell align="center">{author}</TableCell>
        <TableCell align="center">{`${date.toLocaleTimeString(i18n.language)} (${date.toLocaleDateString(i18n.language)})`}</TableCell>
        <TableCell align="center" className="search">
          <Link to={{ pathname: `/info/${key}` }}>{t('historyPage.view')}</Link>
        </TableCell>
      </TableRow>
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ClicksRow = (props: { persistedState: any }) => {
    const key: string = Object.keys(props.persistedState)[0];
    const date: Date = new Date(props.persistedState[key].date);
    return (
      <TableRow key={key}>
        <TableCell component="th" scope="row">
          {key}
        </TableCell>
        <TableCell align="center">{`${date.toLocaleTimeString(i18n.language)} (${date.toLocaleDateString(i18n.language)})`}</TableCell>
        <TableCell align="center" className="search">
          <Link to={{ pathname: `/info/${key}` }}>{t('historyPage.view')}</Link>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Container component="main" maxWidth="md">
      {!history && (
        <div className="search">
          <Link to={{ pathname: '/search', state: { fromHistory: makeHistory } }}>{t('historyPage.makehistory')}</Link>
        </div>
      )}
      {(history || favourites || imageClicks) && (
        <Button id="history-clear" style={{ color: '#2f2d2e' }} onClick={clearCache}>
          {t('historyPage.clear')}
        </Button>
      )}
      {history && (
        <Box mt={3}>
          <h3>{t('historyPage.searches')}</h3>
          <TableContainer component={Paper} style={{ maxHeight: '32vh' }}>
            <Table aria-label="history-table" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>{t('historyPage.search')}</TableCell>
                  <TableCell align="center">{t('historyPage.results')}</TableCell>
                  <TableCell align="center">{t('historyPage.date')}</TableCell>
                  <TableCell align="center">{t('historyPage.view')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map(elem => (
                  <HistoryRow key={Object.keys(elem)[0]} persistedState={elem} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
      {favourites && (
        <Box mt={3}>
          <h3>{t('historyPage.favourites')}</h3>
          <TableContainer component={Paper} style={{ maxHeight: '32vh' }}>
            <Table aria-label="history-table" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>{t('historyPage.imageID')}</TableCell>
                  <TableCell align="center">{t('historyPage.author')}</TableCell>
                  <TableCell align="center">{t('historyPage.date')}</TableCell>
                  <TableCell align="center">{t('historyPage.view')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {favourites.map(elem => (
                  <FavouritesRow key={Object.keys(elem)[0]} persistedState={elem} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
      {imageClicks && (
        <Box mt={3} mb={5}>
          <h3>{t('historyPage.imageClicks')}</h3>
          <TableContainer component={Paper} style={{ maxHeight: '32vh' }}>
            <Table aria-label="history-table" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>{t('historyPage.imageID')}</TableCell>
                  <TableCell align="center">{t('historyPage.date')}</TableCell>
                  <TableCell align="center">{t('historyPage.view')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {imageClicks.map(elem => (
                  <ClicksRow key={Object.keys(elem)[0]} persistedState={elem} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Container>
  );
};
export default History;
