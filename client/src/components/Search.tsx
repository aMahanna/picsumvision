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
      height: '50%',
      width: '50%',
    },
  });

const LandingPage = (props: Props) => {
  const [t] = useTranslation();
  const { classes } = props;
  const [value, setValue] = useState('');
  const [results, setResults] = useState([]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  const submit = async () => {
    const result = await fetch('/api/search/author', {
      method: 'POST',
      body: JSON.stringify({ author: `%${value}%` }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
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
          <TextField id="standard-textarea" label="Search by author" placeholder="Mario Calvo" onChange={handleChange} fullWidth />
        </Box>
        <div></div>
        <Box mt={2}>
          <Button id="search" onClick={submit} variant="outlined">
            Search
          </Button>
        </Box>
      </Container>
      {results.length !== 0 &&
        results.map((data: { author: string; url: string }) => (
          <Box key={data.url} mt={2}>
            <h5>{data.author}</h5>
            <Box mt={1}>
              <img alt={data.author} className={classes.image} src={data.url} />
            </Box>
          </Box>
        ))}
    </Container>
  );
};
export default withStyles(styles)(LandingPage);
