import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
// Import MUI Components
import { Container, Button, Table, TableBody, TableContainer, TableHead, TableRow, TableCell, Paper, Box } from '@material-ui/core';

const History = () => {
  const [t, i18n] = useTranslation();
  const [makeHistory, setMakeHistory] = useState(''); // Provide some random labels for a quick search

  const [history] = useState(() => {
    const persistedState = localStorage.getItem('data');
    const persistedData = persistedState ? JSON.parse(persistedState) : {};
    return Object.keys(persistedData).length === 0 ? undefined : Object.entries(persistedData).map(e => ({ [e[0]]: e[1] }));
  });
  const [favourites] = useState(() => {
    // Fetch the history cache values
    const persistedState = localStorage.getItem('favourites');
    const persistedData = persistedState ? JSON.parse(persistedState) : {};
    return Object.keys(persistedData).length === 0 ? undefined : Object.entries(persistedData).map(e => ({ [e[0]]: e[1] }));
  });

  /**
   * @useEffect Sets some random labels for a quick search
   * (if user has no history)
   */
  useEffect(() => {
    if (!history) {
      fetch('/api/info/randomkeys')
        .then(result => result.json())
        .then(response => {
          setMakeHistory(response.labels);
        });
    }
  }, [history]);

  /**
   * Removes the history cache from the user's session
   * Forces a reload to clear up the table
   */
  const clearCache = async () => {
    localStorage.removeItem('data');
    localStorage.removeItem('lastSearch');
    localStorage.removeItem('favourites');
    window.location.reload();
  };

  /**
   * Renders the table row of each history stored in the cache
   * @param props The current history iteration
   * @returns An MUI TableRow component
   */
  const HistoryRow = (props: { persistedState: any }) => {
    const key: string = Object.keys(props.persistedState)[0];
    const date: Date = new Date(props.persistedState[key].date);
    const results: number = props.persistedState[key].data.length;
    return (
      <TableRow key={key}>
        <TableCell component="th" scope="row">
          {key}
        </TableCell>
        <TableCell align="center">{results}</TableCell>
        <TableCell align="center">{`${date.toLocaleTimeString(i18n.language)} (${date.toLocaleDateString(i18n.language)})`}</TableCell>
        <TableCell align="center" className="search">
          <Link to={{ pathname: '/search', state: { fromHistory: key } }}>{t('historyPage.view')}</Link>
        </TableCell>
      </TableRow>
    );
  };

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

  return (
    <Container component="main" maxWidth="md">
      {!history && (
        <div className="search">
          <Link to={{ pathname: '/search', state: { fromHistory: makeHistory } }}>{t('historyPage.makehistory')}</Link>
        </div>
      )}
      {(history || favourites) && (
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
    </Container>
  );
};
export default History;
