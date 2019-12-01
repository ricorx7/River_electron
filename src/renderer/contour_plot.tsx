import * as React from "react";
import PlotlyChart from 'react-plotlyjs-ts';

type ContourPlotDisplayProps = {
  msg: string
}

export class ContourPlotDisplay extends React.Component<ContourPlotDisplayProps> {
  static defaultProps = {
    msg: 'Hello everyone!'
  }

  public handleClick = (evt: any) => alert('click')
  public handleHover = (evt: any) => alert('hover')

  public render() {
    var data = [
        {
          z: [[1, 20, 30, 50, 1], [20, 1, 60, 80, 30], [30, 60, 1, -10, 20]],
          x: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          y: ['Morning', 'Afternoon', 'Evening'],
          type: 'heatmap'
        }
      ];
    return (
        <PlotlyChart data={data}
                     //layout={layout}
                     //onClick={this.handleClick}
                     //onHover={this.handleHover}
        />
    );
}
}