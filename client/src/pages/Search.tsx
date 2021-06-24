import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
// Import MUI Components
import { Container, TextField, Button, Box, CircularProgress, Tooltip } from '@material-ui/core';
import { makeStyles, createStyles } from '@material-ui/styles';

import Alert from '../components/Alert';
import Gallery from '../components/Gallery';
import usePersistedState from '../hooks/usePersistedState';
import getPersistedState from '../hooks/getPersistedState';

/**
 * CreateStyles allows us to style MUI components
 * This @var is passed as a paramater in the export of the component
 * @see https://material-ui.com/styles/basics/
 */
const useStyles = makeStyles(() =>
  createStyles({
    image: {
      height: '100%',
      width: '100%',
    },
    button: {
      '& > *': {
        color: '#2f2d2e',
        margin: '8px',
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Search = (props: any) => {
  const [t, i18n] = useTranslation();
  const classes = useStyles();

  const [textFieldInput, setTextFieldInput] = useState(''); // The input of the search bar
  const [searchResult, setSearchResult] = useState([]); // The results of the search
  const [inputPlaceholder, setInputPlaceholder] = useState(''); // The placeholder of the search bar

  const [isLoading, setIsLoading] = useState(false);
  const [suggestInput, setSuggestInput] = useState(false); // Opens an alert to suggest a search topic
  const [frenchWarning, setFrenchWarning] = useState(true); // Opens an alert to warn about french searching
  const [resultIsEmpty, setResultIsEmpty] = useState(false); // Renders a "no search found" display
  const [sorryAlert, setSorryAlert] = useState(false); // For times that I want to say I apologize

  const [persistedData, setPersistedData] = usePersistedState('data', {}); // Persist previous results to use for search history
  const [lastSearch, setLastSearch] = usePersistedState('lastSearch', ''); // Persist last search to use for visualization
  const [imageClicks] = getPersistedState('clicks');

  /**
   * @useEffect Determines whether to:
   * - Render search results based on previous history (if the user has requested to do so)
   * - Render search results based on the user's last search (if the user has exited the Search tab)
   * - Set random tags as the input placeholder for search inspiration
   */
  useEffect(() => {
    const redirectIndex: string = props.location?.state?.fromRedirect;
    if (redirectIndex) {
      if (persistedData[redirectIndex]) {
        setTextFieldInput(persistedData[redirectIndex].input || redirectIndex);
        setSearchResult(persistedData[redirectIndex].data);
        setLastSearch(redirectIndex);
      } else {
        setTextFieldInput(redirectIndex);
        query(redirectIndex);
      }
    } else if (lastSearch !== '') {
      setTextFieldInput(persistedData[lastSearch].input || lastSearch);
      setSearchResult(persistedData[lastSearch].data);
    } else {
      fetch('/api/info/randomtags')
        .then(result => (result.status === 200 ? result.json() : undefined))
        .then(response => {
          setInputPlaceholder(response ? response.tags : 'cloud sky plant');
        });
    }
  }, []);

  // Handles the change of any MUI component that isn't the Checkbox (so currently just the search bar)
  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTextFieldInput(event.target.value);
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
    setResultIsEmpty(false);

    const input: string = (forceInput || textFieldInput).trim();
    const index: string = input.split(' ').sort().join(' ').toLowerCase(); // For indexing the client-cache
    if (input === '') {
      suggestUser();
    } else if (persistedData[index]) {
      setSearchResult(persistedData[index].data);
      setLastSearch(index);
    } else {
      const isURL = isURLImageInput(input);
      const uri = isURL ? `/api/search/url?url=${input}` : `/api/search/keyword?keyword=${input}`;
      const response = await fetch(uri);
      if (response.status === 200) {
        const result = await response.json();
        setSearchResult(result.data);
        updateCache(input, isURL ? result.tags : index, result.data);
      } else if (response.status === 204) {
        setResultIsEmpty(true);
      } else {
        setSorryAlert(true);
      }
    }
    setIsLoading(false);
  };

  /**
   * Handles behaviour when user clicks on the @button SURPRISE ME
   * - Hits the /surpriseme endpoint
   * - Update cache with new search results
   */
  const surpriseMe = async () => {
    setIsLoading(true);
    setResultIsEmpty(false);

    const response = await fetch(`/api/search/surpriseme`);
    if (response.status === 200) {
      const result = await response.json();
      setTextFieldInput(result.tags);
      setSearchResult(result.data);
      setResultIsEmpty(result.data.length === 0);
      updateCache(result.tags, result.tags.split(' ').sort().join(' ').toLowerCase(), result.data);
    } else {
      setSorryAlert(true);
    }

    setIsLoading(false);
  };

  /**
   * Handles behaviour when user clicks on the @button DISCOVER
   * - Hits the /discover endpoint
   * - Attempts to display relevant results based on the user's recent activityy
   * - Currently relies on:
   *    - User click history
   *    - User search history
   */
  const discover = async () => {
    setIsLoading(true);
    setResultIsEmpty(false);

    if (imageClicks !== undefined) {
      const IDs = imageClicks.map(elem => Object.keys(elem)[0]);
      const response = await fetch(`/api/search/discover?IDs=${IDs}`);

      if (response.status === 200) {
        const result = await response.json();
        setSearchResult(result.data);
        setTextFieldInput(t('searchPage.discoverInput'));
      } else if (response.status === 204) {
        setResultIsEmpty(true);
      } else {
        setSorryAlert(true);
      }
    }

    setIsLoading(false);
  };

  // Fetches random tags to user for search inspiration
  const suggestUser = async () => {
    setIsLoading(true);

    const response = await fetch('/api/info/randomtags');
    if (response.status === 200) {
      const result = await response.json();
      setSuggestInput(true);
      setInputPlaceholder(result.tags);
    }

    setIsLoading(false);
  };

  /**
   * Updates the cache with new search results
   * This way, users don't need make another API call to re-render previous search results
   *
   * @param index The index of the cache
   * @param data  The data to store
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateCache = async (input: string, index: string, data: any[]) => {
    if (data.length !== 0) {
      setPersistedData({
        ...persistedData,
        [index]: {
          input,
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
        <Box mt={2}>
          <TextField
            id="search-input"
            autoComplete="off"
            spellCheck
            value={textFieldInput}
            label={t('searchPage.inputLabel')}
            placeholder={inputPlaceholder}
            onChange={handleTextChange}
            fullWidth
            variant="standard"
          />
        </Box>
        <Box mt={2}>
          {!isLoading && (
            <div>
              <Tooltip title={`${t('searchPage.queryTip')}`} placement="left">
                <span className={classes.button}>
                  <Button id="search-submit" onClick={() => query()}>
                    {t('searchPage.query')}
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title={`${t('searchPage.surpriseTip')}`} placement="bottom">
                <span className={classes.button}>
                  <Button id="search-surprise" onClick={surpriseMe}>
                    {t('searchPage.surprise')}
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title={`${t('searchPage.discoverTip')}`} placement="bottom">
                <span className={classes.button}>
                  <Button id="search-surprise" onClick={discover} disabled={imageClicks === undefined}>
                    {t('searchPage.discover')}
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title={`${t('searchPage.visualizeTip')}`} placement="right">
                <span className={classes.button}>
                  <Button id="search-surprise" to="/visualize" component={Link} disabled={lastSearch === ''}>
                    {t('searchPage.visualize')}
                  </Button>
                </span>
              </Tooltip>
            </div>
          )}
        </Box>
      </Container>
      {isLoading && <CircularProgress color="inherit" />}
      {searchResult.length !== 0 && !resultIsEmpty && (
        <Gallery data={searchResult} imageClass={classes.image} fromSearch={textFieldInput} />
      )}
      {resultIsEmpty && (
        <Box mt={3}>
          <h5>{t('searchPage.noResults')}</h5>
        </Box>
      )}
      <div role="alert">
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
        <Alert
          open={sorryAlert}
          message={`${t('searchPage.sorryAlert')}`}
          severity="error"
          onSnackbarClose={(e, r) => {
            return r === 'clickaway' ? undefined : setSorryAlert(false);
          }}
          onAlertClose={() => setSorryAlert(false)}
        ></Alert>
      </div>
    </Container>
  );
};
export default Search;
