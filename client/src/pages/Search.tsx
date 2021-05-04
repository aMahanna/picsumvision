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
      height: '60%',
      width: '60%',
      borderRadius: '1cm',
    },
    button: {
      '& > *': {
        margin: theme.spacing(1),
      },
    },
  }),
);

const Search = () => {
  const [t, i18n] = useTranslation();
  const classes = useStyles();
  const [input, setInput] = useState('');
  const [results, setResults] = useState([]);
  const [isStrict, setIsStrict] = useState(false);
  const [inputPlaceholder, setInputPlaceholder] = useState('');

  const [suggestInput, setSuggestInput] = useState(false);
  const [frenchWarning, setFrenchWarning] = useState(true);

  useEffect(() => {
    fetch('/api/search/randomkeys')
      .then(result => result.json())
      .then(response => {
        setInputPlaceholder(response.labels.join(' ').toLowerCase());
      });
  }, []);

  const handleChange = (setState: any) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setState(event.target.value);
  };

  const handleCheckboxChange = (setCheckedState: any) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setCheckedState(event.target.checked);
  };

  const query = async () => {
    const labels = input.trim(); /** @todo Figure our more "cleanup" features to add in order to refine the search */
    if (labels === '') {
      fetch('/api/search/randomkeys')
        .then(result => result.json())
        .then(response => {
          setSuggestInput(true);
          setInputPlaceholder(response.labels.join(' ').toLowerCase());
        });
    } else {
      const result = await fetch(`/api/search/mixed?labels=${labels.toUpperCase()}${isStrict ? '&isStrict=true' : ''}`);
      if (result.status === 200) {
        const response = await result.json();
        setResults(response.result[0]);
      }
    }
  };

  const surpriseMe = async () => {
    const result = await fetch(`/api/search/surpriseme${isStrict ? '?isStrict=true' : ''}`);
    if (result.status === 200) {
      const response = await result.json();
      setInput(response.labels.join(' ').toLowerCase());
      setResults(response.result[0]);
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
            value={input}
            label={t('searchPage.inputLabel')}
            placeholder={inputPlaceholder}
            onChange={handleChange(setInput)}
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
          <Button id="search-submit" onClick={query} variant="outlined">
            {t('searchPage.query')}
          </Button>
          <Button id="search-surprise" onClick={surpriseMe} variant="outlined">
            {t('searchPage.surprise')}
          </Button>
        </Box>
      </Container>
      {results.length !== 0 &&
        results.map((data: { author: string; url: string }) => (
          <Box key={data.url} mt={3}>
            <h4>{data.author}</h4>
            <img alt={data.author} className={classes.image} src={data.url} />
          </Box>
        ))}
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
        message={`${t('searchPage.suggestAlert')}${inputPlaceholder}'?`}
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
