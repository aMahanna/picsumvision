import React, { useEffect } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // Allows for website bilingualism

// Import React Components
import NavBar from '../components/NavBar';
import Landing from './Landing';
import Search from './Search';
import Info from './Info';
import History from './History';

/**
 * The Main React Component
 * @returns The render of what the React DOM should look like
 */
const App = () => {
  const [t] = useTranslation();

  //Set website title on startup
  useEffect(() => {
    document.title = t('general.title');
  }, [t]);

  return (
    <div className="App">
      <NavBar />
      <Switch>
        <Route exact path="/" component={Landing} />
        <Route exact path="/search" render={props => <Search {...props} />} />
        <Route exact path="/history" component={History} />
        <Route exact path="/info/:id" component={Info} />
        <Route render={() => <Redirect to={{ pathname: '/' }} />} />
      </Switch>
    </div>
  );
};

export default App;
