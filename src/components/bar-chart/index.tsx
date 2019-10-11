import React from 'react';
import * as d3 from 'd3';
import './style.scss';

interface BarChartProps {
  dataset: any[]
  width: string
  height: string
  gap: number
}

export default class BarChart extends React.Component<BarChartProps, any>{

  static scaleColor: d3.ScaleOrdinal<string, string>;
  static chartOptions: { x: number, y: number, width: number, height: number };
  static xScale: d3.ScaleBand<string>;
  static yScale: d3.ScaleLinear<number, number>;
  static thickness: number;

  wrapperRef: React.RefObject<HTMLDivElement> = React.createRef();

  static defaultProps = {
    gap: 4
  };

  state = {
    showTooltip: false,
    tooltipData: {} as any,
    tooltipOffset: {} as { x: number, y: number }
  };

  componentDidMount() {
    this.initStaticProperties();
    this.drawChart();
  }

  componentDidUpdate(prevProps: BarChartProps, prevState: object) {
    if (this.props.dataset !== prevProps.dataset) {
      this.drawChart();
    }
  }

  initStaticProperties = () => {
    const { dataset, gap } = this.props;

    BarChart.scaleColor = d3.scaleOrdinal(d3.schemeOranges[9])
      .domain(d3.range(0, 5, 0.5).map(data => data + ''));
    BarChart.chartOptions = this.getChartOptions();
    BarChart.xScale = d3.scaleBand<string>()
      .domain(dataset.map((data) => data.name))
      .range([0, BarChart.chartOptions.width]);
    BarChart.yScale = d3.scaleLinear<number, number>()
      .domain([0, 7])
      .range([BarChart.chartOptions.height, 0]);
    BarChart.thickness = BarChart.chartOptions.width / dataset.length - gap; // 柱状图的粗度
  };

  getChartOptions = () => {
    const { width, height } = this.props;
    const svgWidth = parseInt(width, 10);
    const svgHeight = parseInt(height, 10);
    const svgPadding = {
      top: 10,
      left: 30,
      right: 10,
      bottom: 25
    };
    const chartWidth = svgWidth - svgPadding.left - svgPadding.right;
    const chartHeight = svgHeight - svgPadding.top - svgPadding.bottom;
    return {
      x: svgPadding.left,
      y: svgPadding.top,
      width: chartWidth,
      height: chartHeight
    };
  };

  drawChart = () => {
    const svgContainerSelection = d3.select<HTMLDivElement, unknown>('.bar-chart');
    const svgSelection = svgContainerSelection.select<SVGSVGElement>('.svg');
    if (svgSelection.node() === null) {
      this.createChart(svgContainerSelection);
    } else {
      this.updateChart(svgSelection);
    }
  };

  createChart = (svgContainerSelection: d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>) => {
    // 添加svg元素
    const svgSelection = svgContainerSelection
      .append('svg')
      .attr('class', 'svg');

    this.addAxis(svgSelection);
    this.addRect(svgSelection);
  };

  addAxis = (svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>) => {
    const { chartOptions, xScale, yScale } = BarChart;

    // 坐标轴
    const xAxis = d3.axisBottom<string>(xScale).tickSizeOuter(0);
    const yAxis = d3.axisLeft<number>(yScale).tickSizeOuter(0);

    svg.append('g')
      .attr('class', 'axis-x')
      .attr('transform', `translate(${chartOptions.x}, ${chartOptions.y + chartOptions.height})`)
      .call(xAxis)
      .call((selection) => {
        this.addGridline(selection, [{ key: 'y2', value: -chartOptions.height }]);
      });

    svg.append('g')
      .attr('class', 'axis-y')
      .attr('transform', `translate(${chartOptions.x}, ${chartOptions.y})`)
      .call(yAxis)
      .call((selection) => {
        this.addGridline(selection, [{ key: 'x2', value: chartOptions.width }]);
      });
  };

  addGridline = (
    g: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>,
    attrs: { key: string, value: string | number }[]
  ) => {
    const gridline = g.selectAll('.tick')
      .select('line')
      .clone()
      .attr('class', 'gridline');

    attrs.forEach((attr) => {
      gridline.attr(attr.key, attr.value);
    });
  };

  addRect = (svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>) => {
    const { dataset, gap } = this.props;
    const { chartOptions, scaleColor, yScale, thickness } = BarChart;

    const self = this;

    const g = svg.selectAll('g.bar')
      .data(dataset)
      .enter()
      .append('g')
      .attr('class', 'bar');

    g.append('rect')
      .attr('class', 'rect')
      .attr('x', (d, i) => chartOptions.x + i * (thickness + gap) + gap / 2)
      .attr('y', (d, i) => chartOptions.y + chartOptions.height)
      .attr('width', (d, i) => thickness)
      .attr('height', (d, i) => 0)
      .on('mouseenter', function (d, i) {
        d3.select(this).style('opacity', 0.7);
        self.setState({
          showTooltip: true,
          tooltipData: d
        });
      })
      .on('mouseleave', function (d, i) {
        d3.select(this).style('opacity', 1);
        self.setState({
          showTooltip: false
        });
      })
      .transition()
      .duration(300)
      .ease(d3.easeSinOut) // API: https://github.com/xswei/d3-ease
      .attr('y', (d, i) => chartOptions.y + yScale(d.value))
      .attr('height', (d, i) => chartOptions.height - yScale(d.value))
      .style('fill', (d, i) => {
        const format = d3.format('.1f');
        return scaleColor(format(d.value - d.value % 0.5));
      })
      .on('end', function (d, i) {
        d3.select(this.parentElement)
          .append('text')
          .attr('class', 'rect-text')
          .attr('x', chartOptions.x + i * (thickness + gap) + gap / 2)
          .attr('y', chartOptions.y + yScale(d.value))
          .attr('dx', thickness / 2)
          .attr('dy', 15)
          .text(d.value);
      });
  };

  updateChart = (svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>) => {
    const { dataset } = this.props;
    const { chartOptions, scaleColor, yScale } = BarChart;

    svg.selectAll('.bar')
      .data(dataset)
      .each(function (d) {
        const g = d3.select(this)
          .transition()
          .duration(500)
          .ease(d3.easeSinOut);
        const format = d3.format('.1f');

        g.select('.rect')
          .attr('y', chartOptions.y + yScale(d.value))
          .attr('height', chartOptions.height - yScale(d.value))
          .style('fill', scaleColor(format(d.value - d.value % 0.5)));

        g.select('.rect-text')
          .attr('y', chartOptions.y + yScale(d.value))
          .text(d.value);
      });
  };

  renderTooltip = () => {
    const { showTooltip, tooltipData, tooltipOffset } = this.state;

    return (
      <div className="tooltip" style={{
        visibility: showTooltip ? 'visible' : 'hidden',
        transform: `translate(${tooltipOffset.x + 10}px, ${tooltipOffset.y + 5}px)`
      }}>
        <div className="title">{tooltipData.name}</div>
        <div className="content">{tooltipData.value}</div>
      </div>
    );
  };

  updateTooltipOffset = (event: React.MouseEvent) => {
    const rect = (this.wrapperRef.current as HTMLDivElement).getBoundingClientRect();
    const offset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    this.setState({ tooltipOffset: offset });
  };

  public render() {
    const { width, height } = this.props;

    return (
      <div className="bar-chart" style={{ width, height }} ref={this.wrapperRef}
        onMouseMove={this.updateTooltipOffset}>
        {this.renderTooltip()}
      </div>
    );
  }
}