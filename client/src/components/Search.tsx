import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
// Import MUI Components
import WhereToVoteOutlinedIcon from '@material-ui/icons/WhereToVoteOutlined';
import { Container, CssBaseline, withStyles, Avatar, createStyles, TextField, Button, Box } from '@material-ui/core';
// Import Props interface to define what this component can receive as props
import { Props } from './Props';

/**
 * CreateStyles allows us to style MUI components
 * This @var is passed as a paramater in the export of the component
 * @see https://material-ui.com/styles/basics/
 */
const styles = () =>
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
  });

const LandingPage = (props: Props) => {
  const [t] = useTranslation();
  const { classes } = props;
  const [labels, setLabels] = useState('');
  const [results, setResults] = useState([]);

  const handleChange = (setState: any) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setState(event.target.value);
  };

  const submit = async () => {
    const result = await fetch(`/api/search/mixed?labels=${labels.toUpperCase()}`);
    if (result.status === 200) {
      const response = await result.json();
      setResults(response);
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
            label="Search for labels"
            placeholder="mountain sky"
            onChange={handleChange(setLabels)}
            fullWidth
          />
        </Box>
        <div></div>
        <Box mt={2}>
          <Button id="search-submit" onClick={submit} variant="outlined">
            Search
          </Button>
        </Box>
      </Container>
      {results.length !== 0 &&
        results.map((data: { author: string; url: string }) => (
          <Box key={data.url} mt={3}>
            <img alt={data.author} className={classes.image} src={data.url} />
          </Box>
        ))}
    </Container>
  );
};
export default withStyles(styles)(LandingPage);
