import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// import { useTranslation } from 'react-i18next';
// Import MUI Components
import { Container } from '@material-ui/core';

// Import Props interface to define what this component can receive as props
/**
 * CreateStyles allows us to style MUI components
 * This @var is passed as a paramater in the export of the component
 * @see https://material-ui.com/styles/basics/
 */
// const useStyles = makeStyles(() =>
//   createStyles({
//     avatar: {
//       backgroundColor: 'inherit',
//       color: '#2F2D2E',
//       margin: 'auto',
//     },
//     image: {
//       height: '50%',
//       width: '50%',
//       borderRadius: '1cm',
//     },
//   }),
// );

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
  //const [t] = useTranslation();
  //const classes = useStyles();
  const [makeHistory, setMakeHistory] = useState('');
  const [persistedData] = useState(() => {
    const persistedState = localStorage.getItem('data');
    return persistedState ? JSON.parse(persistedState) : {};
  });
  const history = Object.keys(persistedData).length === 0 ? undefined : Object.entries(persistedData).map(e => ({ [e[0]]: e[1] }));

  useEffect(() => {
    if (!history) {
      fetch('/api/info/randomkeys')
        .then(result => result.json())
        .then(response => {
          setMakeHistory(response.labels.join(' '));
        });
    }
  }, [history]);

  return (
    <Container component="main" maxWidth="md">
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
