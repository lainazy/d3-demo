import React from 'react';
import { Link } from 'react-router-dom';
import charts from './charts';
import './chart.list.scss';

export default class ChartList extends React.Component<any, any>{

  public render() {
    return (
      <div className="chart-list">
        {
          charts.map((chart, index) => <Link className="chart-link" to={`/${chart}`} key={`chart-${index + 1}`}>{chart}</Link>)
        }
      </div>
    );
  }
}