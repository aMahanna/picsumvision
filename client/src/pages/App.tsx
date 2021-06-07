import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

// Import React Components
import NavBar from '../components/NavBar';
import Landing from './Landing';
import Search from './Search';
import Visualize from './Visualize';
import History from './History';
import Info from './Info';
import About from './About';

/**
 * The Main React Component
 * @returns The render of what the React DOM should look like
 */
const App = () => {
  return (
    <div className="App">
      <NavBar />
      <Switch>
        <Route exact path="/" component={Landing} />
        <Route exact path="/search" render={props => <Search {...props} />} />
        <Route exact path={['/visualize', '/visualize/:id']} component={Visualize} />
        <Route exact path="/history" component={History} />
        <Route exact path="/about" component={About} />
        <Route exact path="/info/:id" component={Info} />
        <Route render={() => <Redirect to={{ pathname: '/' }} />} />
      </Switch>
    </div>
  );
};

export default App;
