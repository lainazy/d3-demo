import React from 'react';
import * as d3 from 'd3';
import './style.scss';

interface ArcChartProps {
  dataset: any[]
  width: string
  height: string
  startAngle?: number
  endAngle?: number
  animationDuration?: number
}

export default class ArcChart extends React.Component<ArcChartProps, any>{

  static totalAngle: number;
  static animationDuration: number;
  static pieDataGenerator: d3.Pie<any, number | { valueOf(): number }>;
  static arc: d3.Arc<any, d3.DefaultArcObject>;
  static scaleColor: d3.ScaleOrdinal<string, string>;
  static chartOptions: { cx: number, cy: number, innerRadius: number, outerRadius: number };

  wrapperRef: React.RefObject<HTMLDivElement> = React.createRef();

  state = {
    showTooltip: false,
    tooltipData: {} as any,
    tooltipOffset: {} as { x: number, y: number }
  };

  componentDidMount() {
    this.initStaticProperties();
    this.drawChart();
  }

  componentDidUpdate(prevProps: ArcChartProps, prevState: object) {
    if (this.props.dataset !== prevProps.dataset) {
      this.drawChart();
    }
  }

  initStaticProperties = () => {
    const {
      dataset,
      startAngle = 0,
      endAngle = 2 * Math.PI,
      animationDuration = 1000
    } = this.props;

    ArcChart.totalAngle = Math.abs(endAngle - startAngle);
    ArcChart.animationDuration = animationDuration;
    ArcChart.pieDataGenerator = d3.pie()
      .value((d: any) => d.value)
      .sortValues(null)
      .startAngle(startAngle)
      .endAngle(endAngle)
      .padAngle(Math.PI / 360);
    ArcChart.arc = d3.arc().cornerRadius(3);
    ArcChart.scaleColor = d3.scaleOrdinal(d3.schemeCategory10)
      .domain(d3.range(dataset.length).map(data => data + ''));
    ArcChart.chartOptions = this.getChartOptions();
  };

  getChartOptions = () => {
    const { width, height } = this.props;
    const svgWidth = parseInt(width, 10);
    const svgHeight = parseInt(height, 10);
    const svgPadding = {
      top: 50,
      left: 50,
      right: 50,
      bottom: 50
    };
    const chartWidth = svgWidth - svgPadding.left - svgPadding.right;
    const chartHeight = svgHeight - svgPadding.top - svgPadding.bottom;
    const radius = Math.min(chartWidth, chartHeight) / 2;
    return {
      cx: svgPadding.left + chartWidth / 2,
      cy: svgPadding.top + chartHeight / 2,
      innerRadius: radius * 0.6,
      outerRadius: radius
    };
  };

  drawChart = () => {
    const svgContainerSelection = d3.select<HTMLDivElement, unknown>('.arc-chart');
    const svgSelection = svgContainerSelection.select<SVGSVGElement>('.svg');
    if (svgSelection.node() === null) {
      this.createChart(svgContainerSelection);
    } else {
      this.updateChart(svgSelection);
    }
  };

  createChart = (svgContainerSelection: d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>) => {
    const {
      totalAngle,
      animationDuration,
      pieDataGenerator,
      arc,
      scaleColor,
      chartOptions
    } = ArcChart;
    const pieData = pieDataGenerator(this.props.dataset);

    const self = this;

    // 添加svg元素
    const svgSelection = svgContainerSelection
      .append('svg')
      .attr('class', 'svg');

    // 添加g元素
    const g = svgSelection
      .selectAll('g.arc')
      .data(pieData)
      .enter()
      .append('g')
      .attr('class', 'arc')
      .attr('transform', `translate(${chartOptions.cx}, ${chartOptions.cy})`);

    // 在每个g元素中添加path元素
    g.append('path')
      .attr('class', 'arc-path')
      .attr('d', (d, i) => {
        return arc({
          innerRadius: chartOptions.innerRadius,
          outerRadius: chartOptions.outerRadius,
          startAngle: d.startAngle,
          endAngle: d.startAngle,
          padAngle: d.padAngle
        });
      })
      .attr('fill', (d, i) => scaleColor(d.index + ''))
      .on('mouseenter', function (d, i) {
        d3.select(this).style('opacity', 0.7);
        self.setState({
          showTooltip: true,
          tooltipData: d.data
        });
      })
      .on('mouseleave', function (d, i) {
        d3.select(this).style('opacity', 1);
        self.setState({
          showTooltip: false
        });
      })
      .transition()
      .delay((d) => {
        return Math.abs(d.startAngle) / totalAngle * animationDuration;
      })
      .duration((d) => {
        return Math.abs(d.endAngle - d.startAngle) / totalAngle * animationDuration;
      })
      .ease(d3.easeLinear)
      .attrTween('d', (d, i) => {
        const interpolator = d3.interpolateNumber(d.startAngle, d.endAngle);
        return (t: number) => {
          return arc({
            innerRadius: chartOptions.innerRadius,
            outerRadius: chartOptions.outerRadius,
            startAngle: d.startAngle,
            endAngle: interpolator(t),
            padAngle: d.padAngle
          }) as string;
        };
      })
      .on('end', function (d, i) {
        const midpoint = arc.centroid({
          innerRadius: chartOptions.innerRadius,
          outerRadius: chartOptions.outerRadius,
          startAngle: d.startAngle,
          endAngle: d.endAngle,
          padAngle: d.padAngle
        });

        // 在每个path元素的后面添加text元素
        d3.select(this.parentElement)
          .append('text')
          .attr('class', 'arc-text')
          .attr('x', midpoint[0])
          .attr('y', midpoint[1])
          .text((d: any) => d.data.name);
      });
  };

  updateChart = (svgSelection: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>) => {
    const {
      pieDataGenerator,
      arc,
      chartOptions
    } = ArcChart;
    const pieData = pieDataGenerator(this.props.dataset);

    const g = svgSelection
      .selectAll('g.arc')
      .data(pieData);

    g.select<SVGPathElement>('path')
      .transition()
      .duration(500)
      .attr('d', (d) => {
        return arc({
          innerRadius: chartOptions.innerRadius,
          outerRadius: chartOptions.outerRadius,
          startAngle: d.startAngle,
          endAngle: d.endAngle,
          padAngle: d.padAngle
        });
      });

    g.select<SVGTextElement>('text')
      .each(function (d) {
        const midpoint = arc.centroid({
          innerRadius: chartOptions.innerRadius,
          outerRadius: chartOptions.outerRadius,
          startAngle: d.startAngle,
          endAngle: d.endAngle,
          padAngle: d.padAngle
        });

        d3.select(this)
          .transition()
          .duration(500)
          .attr('x', midpoint[0])
          .attr('y', midpoint[1]);
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
      <div className="arc-chart" style={{ width, height }} ref={this.wrapperRef}
        onMouseMove={this.updateTooltipOffset}>
        {this.renderTooltip()}
      </div>
    );
  }
}