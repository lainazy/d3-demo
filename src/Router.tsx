import React from 'react';
import { HashRouter, Switch, Route } from 'react-router-dom';
import App from './App';
import ChartList from './charts/ChartList';
import Histogram from './charts/histogram';

const Router = () => {
  return (
    <HashRouter>
      <Switch>
        <Route exact path="/" component={App} />
        <Route path="/charts" component={ChartList} />
        <Route path="/histogram" component={Histogram} />
      </Switch>
    </HashRouter>
  );
};

export default Router;