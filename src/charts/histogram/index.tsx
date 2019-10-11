import React from 'react';
import BarChart from '../../components/bar-chart';
import ArcChart from '../../components/arc-chart';

export default class Histogram extends React.Component<any, any>{

  state = {
    dataset: [
      { name: '张三', value: 0.3 },
      { name: '李四', value: 1.1 },
      { name: '王五', value: 1.7 },
      { name: '孙六', value: 2.2 },
      { name: '钱七', value: 2.5 },
      { name: '刘八', value: 1.9 },
      { name: '钟九', value: 1.3 }
    ]
  };

  componentDidMount() {
    const id = setInterval(() => {
      const { dataset } = this.state;
      const newDataset = dataset.map((data) => {
        data.value = +(data.value + Math.random()).toFixed(1);
        return data;
      });
      this.setState({ dataset: newDataset });
    }, 1000);

    setTimeout(() => {
      clearInterval(id);
    }, 5000);
  }

  public render() {
    const { dataset } = this.state;

    return (
      <div className="histogram">
        <BarChart dataset={dataset} width="375px" height="250px" />
        <ArcChart dataset={dataset} width="375px" height="250px" startAngle={0} endAngle={2 * Math.PI} />
      </div>
    );
  }
}