import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
// Import MUI Components
import { Container, Button, createStyles, makeStyles, Theme } from '@material-ui/core';

// Import Props interface to define what this component can receive as props
/**
 * CreateStyles allows us to style MUI components
 * This @var is passed as a paramater in the export of the component
 * @see https://material-ui.com/styles/basics/
 */
const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    button: {
      '& > *': {
        color: '#2f2d2e',
        margin: theme.spacing(1),
        '&:hover': {
          transition: '0.3s ease-in',
          backgroundColor: '#2f2d2e',
          color: 'white',
        },
      },
    },
  }),
);

function HistoryComponent(props: { persistedState: any }) {
  const key: string = Object.keys(props.persistedState)[0];
  const search: string = key;
  const date: Date = props.persistedState[key].date;
  const results: number = props.persistedState[key].data.length;
  return (
    <div className="history">
      <h4>
        {' '}
        {search}: {date} ({results} results){' '}
      </h4>
      <Link
        to={{
          pathname: '/search',
          state: {
            fromHistory: key,
          },
        }}
      >
        View
      </Link>
    </div>
  );
}

const History = (props: any) => {
  const [t] = useTranslation();
  const classes = useStyles();
  const [makeHistory, setMakeHistory] = useState(''); // Provide some random labels for a quick search
  const [history] = useState(() => {
    const persistedState = localStorage.getItem('data');
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

  const clearCache = async () => {
    localStorage.removeItem('data');
    localStorage.removeItem('lastSearch');
    window.location.reload();
  };

  return (
    <Container component="main" maxWidth="md">
      {history && (
        <Button id="history-clear" className={classes.button} onClick={clearCache}>
          {t('historyPage.clear')}
        </Button>
      )}
      {!history && (
        <div className="history">
          <Link
            to={{
              pathname: '/search',
              state: {
                fromHistory: makeHistory,
              },
            }}
          >
            Make history!
          </Link>
        </div>
      )}
      {history && history.map((elem: any) => <HistoryComponent key={Object.keys(elem)[0]} persistedState={elem}></HistoryComponent>)}
    </Container>
  );
};
export default History;
