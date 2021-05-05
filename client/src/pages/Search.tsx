import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
// Import MUI Components
import WhereToVoteOutlinedIcon from '@material-ui/icons/WhereToVoteOutlined';
import {
  Container,
  CssBaseline,
  makeStyles,
  createStyles,
  Theme,
  Avatar,
  TextField,
  Button,
  Box,
  Checkbox,
  FormControlLabel,
} from '@material-ui/core';

import Alert from '../components/Alert';
import usePersistedState from '../hooks/usePersistedState';

/**
 * CreateStyles allows us to style MUI components
 * This @var is passed as a paramater in the export of the component
 * @see https://material-ui.com/styles/basics/
 */
const useStyles = makeStyles((theme: Theme) =>
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
    button: {
      '& > *': {
        margin: theme.spacing(1),
      },
    },
  }),
);

const Search = (props: any) => {
  const [t, i18n] = useTranslation();
  const classes = useStyles();

  const [textFieldInput, setTextFieldInput] = useState('');
  const [results, setResults] = useState([]);
  const [isStrict, setIsStrict] = useState(false);
  const [inputPlaceholder, setInputPlaceholder] = useState('');

  const [suggestInput, setSuggestInput] = useState(false);
  const [frenchWarning, setFrenchWarning] = useState(true);

  const [persistedData, setPersistedData] = usePersistedState('data', {});

  useEffect(() => {
    const historyIndex: string = props.location.state?.fromHistory;
    if (historyIndex) {
      if (persistedData[historyIndex]) {
        setTextFieldInput(historyIndex.split('_').join(' '));
        setResults(persistedData[historyIndex].results);
      } else {
        setTextFieldInput(historyIndex);
        query(historyIndex);
      }
    } else {
      fetch('/api/info/randomkeys')
        .then(result => result.json())
        .then(response => {
          setInputPlaceholder(response.labels.join(' '));
        });
    }
  }, []);

  const handleChange = (setState: any) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setState(event.target.value);
  };

  const handleCheckboxChange = (setCheckedState: any) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setCheckedState(event.target.checked);
  };

  const isURLImageInput = (inputAttempt: string) => {
    var pattern = new RegExp(
      '^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$',
      'i',
    ); // fragment locator
    return pattern.test(inputAttempt);
  };

  const query = async (forceInput?: string) => {
    const input: string = (forceInput || textFieldInput).trim();
    const index: string = input.split(' ').sort().join('_').toLowerCase(); // For indexing the client-cache
    if (input === '') {
      const response = await fetch('/api/info/randomkeys');
      const result = await response.json();
      setSuggestInput(true);
      setInputPlaceholder(result.labels.join(' '));
    } else if (persistedData[index] && !isStrict) {
      setResults(persistedData[index].results);
    } else {
      const uri = isURLImageInput(input) ? `/api/search/extimage?url=${input}` : `/api/search/mixed?labels=${input}`;
      const response = await fetch(`${uri}${isStrict ? '&isStrict=true' : ''}`);
      if (response.status === 200) {
        const result = await response.json();
        setResults(result.result);
        updateCache(index, result.result);
      }
    }
  };

  const surpriseMe = async () => {
    const response = await fetch(`/api/search/surpriseme${isStrict ? '?isStrict=true' : ''}`);
    if (response.status === 200) {
      const result = await response.json();
      setTextFieldInput(result.labels.join(' '));
      setResults(result.result);
      updateCache(result.labels.join('_'), result.result);
    }
  };

  const updateCache = async (index: string, results: {}[]) => {
    if (results.length !== 0 && !isStrict) {
      /** @todo Figure how behaviour for isStrict requests */
      // for (const [key, value] of Object.entries(persistedData)) {
      //   if (JSON.stringify((value as any).results) === JSON.stringify(results))
      //     return; // No update to cache if result already exists in cache, regardless of the query
      // }
      setPersistedData({
        ...persistedData,
        [index]: {
          results,
          date: Date(),
        },
      });
    }
  };

  return (
    <Container maxWidth="lg">
      <Container maxWidth="sm">
        <CssBaseline />
        <Avatar className={classes.avatar}>
          <WhereToVoteOutlinedIcon fontSize="large" />
        </Avatar>
        <Box mt={2}>
          <TextField
            id="search-input"
            autoComplete="off"
            spellCheck
            value={textFieldInput}
            label={t('searchPage.inputLabel')}
            placeholder={inputPlaceholder}
            onChange={handleChange(setTextFieldInput)}
            fullWidth
          />
          <FormControlLabel
            value={isStrict}
            control={<Checkbox checked={isStrict} onChange={handleCheckboxChange(setIsStrict)} color="default" name="isStrict" />}
            label={t('searchPage.strictMode')}
            labelPlacement="end"
          />
        </Box>
        <div></div>
        <Box mt={2} className={classes.button}>
          <Button id="search-submit" onClick={() => query()} variant="outlined">
            {t('searchPage.query')}
          </Button>
          <Button id="search-surprise" onClick={surpriseMe} variant="outlined">
            {t('searchPage.surprise')}
          </Button>
        </Box>
      </Container>
      {results.length !== 0 && (
        <Box mt={3}>
          {results.map((data: { author: string; url: string }) => (
            <Box key={data.url} mt={3}>
              <h4>{data.author}</h4>
              <a href={`/info/${data.url.split('/')[4]}`}>
                <img alt={data.author} className={classes.image} src={data.url} />
              </a>
            </Box>
          ))}
        </Box>
      )}
      <Alert
        open={i18n.language === 'fr' && frenchWarning}
        message={t('searchPage.attention')}
        severity="warning"
        onSnackbarClose={(e, r) => {
          return r === 'clickaway' ? undefined : setFrenchWarning(false);
        }}
        onAlertClose={() => setFrenchWarning(false)}
      ></Alert>
      <Alert
        open={suggestInput}
        message={`${t('searchPage.suggestAlert')}${inputPlaceholder}`}
        severity="info"
        onSnackbarClose={(e, r) => {
          return r === 'clickaway' ? undefined : setSuggestInput(false);
        }}
        onAlertClose={() => setSuggestInput(false)}
      ></Alert>
    </Container>
  );
};
export default Search;
