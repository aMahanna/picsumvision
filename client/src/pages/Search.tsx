import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
// Import MUI Components
import SearchIcon from '@material-ui/icons/Search';
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
  CircularProgress,
  Tooltip,
} from '@material-ui/core';

import Alert from '../components/Alert';
import Gallery from '../components/Gallery';
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
      height: '100%',
      width: '100%',
    },
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

/**
 * The page responsible for image search functionality
 *
 * @param props Used to accept searches from the History page
 * @returns
 */
const Search = (props: { location: any }) => {
  const [t, i18n] = useTranslation(); // Translation use
  const classes = useStyles();

  const [textFieldInput, setTextFieldInput] = useState(''); // The input of the search bar
  const [searchResult, setSearchResult] = useState([]); // The results of the search
  const [inputPlaceholder, setInputPlaceholder] = useState(''); // The placeholder of the search bar

  const [isLoading, setIsLoading] = useState(false);
  const [suggestInput, setSuggestInput] = useState(false); // Opens an alert to suggest a search topic
  const [frenchWarning, setFrenchWarning] = useState(true); // Opens an alert to warn about french searching
  const [resultIsEmpty, setResultIsEmpty] = useState(false); // Renders a "no search found" display

  const [persistedData, setPersistedData] = usePersistedState('data', {}); // Persist previous results to use for search history
  const [lastSearch, setLastSearch] = usePersistedState('lastSearch', ''); // Persist last search to use for visualization

  /**
   * @useEffect Determines whether to:
   * - Render search results based on previous history (if the user has requested to do so)
   * - Render search results based on the user's last search (if the user has exited the Search tab)
   * - Set random labels as the input placeholder for search inspiration
   */
  useEffect(() => {
    const historyIndex: string = props.location.state?.fromHistory;
    if (historyIndex) {
      if (persistedData[historyIndex]) {
        setTextFieldInput(historyIndex);
        setSearchResult(persistedData[historyIndex].data);
        setLastSearch(historyIndex);
      } else {
        setTextFieldInput(historyIndex);
        query(historyIndex);
      }
    } else if (lastSearch !== '') {
      setTextFieldInput(lastSearch);
      setSearchResult(persistedData[lastSearch]?.data || []);
    } else {
      fetch('/api/info/randomkeys')
        .then(result => result.json())
        .then(response => {
          setInputPlaceholder(response.labels);
        });
    }
  }, []);

  // Handles the change of any MUI component that isn't the Checkbox (so currently just the search bar)
  const handleChange = (setState: any) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setState(event.target.value);
  };

  /**
   * Handles behaviour when user clicks on the @button QUERY
   * - If the input is blank, suggest something to the user
   * - If the input already exists in client cache, render result from there
   * - Else, search by API
   *  - If the input is a URL, hit a different endpoint than normal
   * - Update cache with new search results
   * @param forceInput A forced label value, only used when the user has requested to see a previous search history result
   */
  const query = async (forceInput?: string) => {
    setIsLoading(true);

    const input: string = (forceInput || textFieldInput).trim();
    const index: string = input.split(' ').sort().join(' ').toLowerCase(); // For indexing the client-cache
    if (input === '') {
      setIsLoading(false);
      suggestUser();
    } else if (persistedData[index]) {
      setSearchResult(persistedData[index].data);
    } else {
      const uri = isURLImageInput(input) ? `/api/search/extimage?url=${input}` : `/api/search/mixed?labels=${input}`;
      const response = await fetch(uri);
      if (response.status === 200) {
        const result = await response.json();
        setSearchResult(result.data);
        setResultIsEmpty(result.data.length === 0);
        updateCache(result.labels, result.data);
        setIsLoading(false);
      }
    }
  };

  /**
   * Handles behaviour when user clicks on the @button SURPRISE ME
   * - Hits the /surpriseme endpoint
   * - Update cache with new search results
   */
  const surpriseMe = async () => {
    setIsLoading(true);

    const response = await fetch(`/api/search/surpriseme`);
    if (response.status === 200) {
      const result = await response.json();
      setTextFieldInput(result.labels);
      setSearchResult(result.data);
      setResultIsEmpty(result.data.length === 0);
      updateCache(result.labels, result.data); /** @todo Maybe don't include these types of searches in history */
      setIsLoading(false);
    }
  };

  /**
   * Handles behaviour when user clicks on the @button DISCOVER
   * - Hits the /discover endpoint
   * - Attempts to display relevant results based on the user's previous search history
   * @todo
   */
  const discover = async () => {
    suggestUser();
  };

  // Fetches random labels to user for search inspiration
  const suggestUser = async () => {
    const response = await fetch('/api/info/randomkeys');
    const result = await response.json();
    setSuggestInput(true);
    setInputPlaceholder(result.labels);
  };

  /**
   * Updates the cache with new search results
   * This way, users don't need make another API call to re-render previous search results
   *
   * @param index The index of the cache
   * @param data  The data to store
   */
  const updateCache = async (index: string, data: any[]) => {
    if (data.length !== 0) {
      setPersistedData({
        ...persistedData,
        [index]: {
          data,
          date: Date(),
        },
      });
      setLastSearch(index);
    }
  };

  /**
   * Returns whether the string is a url or not
   * - Removes the query parameter when comparing for easier Regex matching
   * @param inputAttempt The url attempt
   * @returns boolean
   */
  const isURLImageInput = (inputAttempt: string) => {
    const pattern = new RegExp(
      '^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$',
      'i',
    ); // fragment locator
    return pattern.test(inputAttempt.split('?')[0]);
  };

  return (
    <Container maxWidth="lg">
      <Container maxWidth="sm">
        <CssBaseline />
        <Avatar className={classes.avatar}>
          <SearchIcon fontSize="large" />
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
            variant="standard"
          />
        </Box>
        <Box mt={2}>
          {!isLoading && (
            <div className={classes.button}>
              <Tooltip title={`${t('searchPage.queryTip')}`} placement="left">
                <Button id="search-submit" onClick={() => query()}>
                  {t('searchPage.query')}
                </Button>
              </Tooltip>
              <Tooltip title={`${t('searchPage.surpriseTip')}`} placement="bottom">
                <Button id="search-surprise" onClick={surpriseMe}>
                  {t('searchPage.surprise')}
                </Button>
              </Tooltip>
              <Tooltip title={`${t('searchPage.discoverTip')}`} placement="bottom">
                <Button id="search-surprise" onClick={discover} disabled={lastSearch === ''}>
                  {t('searchPage.discover')}
                </Button>
              </Tooltip>
              <Tooltip title={`${t('searchPage.visualizeTip')}`} placement="right">
                <Button id="search-surprise" to="/visualize" component={Link} disabled={lastSearch === ''}>
                  {t('searchPage.visualize')}
                </Button>
              </Tooltip>
            </div>
          )}
        </Box>
      </Container>
      {isLoading && <CircularProgress color="inherit" />}
      {searchResult.length !== 0 && !resultIsEmpty && <Gallery data={searchResult} imageClass={classes.image} />}
      {resultIsEmpty && (
        <Box mt={3}>
          <h5>Shoot, no results found</h5>
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
