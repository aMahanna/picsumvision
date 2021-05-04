import React, { useState } from 'react';
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
  Snackbar,
} from '@material-ui/core';
import MuiAlert from '@material-ui/lab/Alert';

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
  const [labels, setLabels] = useState('');
  const [results, setResults] = useState([]);
  const [isStrict, setIsStrict] = useState(false);

  const handleChange = (setState: any) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setState(event.target.value || event.target.checked);
  };

  const handleCheckboxChange = (setCheckedState: any) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setCheckedState(event.target.checked);
  };

  const query = async () => {
    const result = await fetch(`/api/search/mixed?labels=${labels.trim().toUpperCase()}${isStrict ? '&isStrict=true' : ''}`);
    if (result.status === 200) {
      const response = await result.json();
      setResults(response.result);
    }
  };

  const surpriseme = async () => {
    const result = await fetch(`/api/search/surpriseme${isStrict ? '?isStrict=true' : ''}`);
    if (result.status === 200) {
      const response = await result.json();
      setLabels(response.Labels.join(' ').toLowerCase());
      setResults(response.result);
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
            value={labels}
            label={t('searchPage.inputLabel')}
            placeholder={t('searchPage.inputPlaceholder')}
            onChange={handleChange(setLabels)}
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
          <Button id="search-surprise" onClick={surpriseme} variant="outlined">
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
      <Snackbar open={i18n.language === 'fr'} autoHideDuration={3000}>
        <MuiAlert elevation={6} variant="filled" severity="warning">
          {t('searchPage.attention')}
        </MuiAlert>
      </Snackbar>
    </Container>
  );
};
export default Search;
