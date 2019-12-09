import * as React from "react";
import PlotlyChart from 'react-plotlyjs-ts';

type ShipTrackPlotDisplayProps = {
  msg: string
}

export class ShipTrackPlotDisplay extends React.Component<ShipTrackPlotDisplayProps> {
  static defaultProps = {
    msg: 'Hello everyone!'
  }


  public render() {
    var trace1 = {
      x: [1, 2, 3, 4],
      y: [10, 15, 13, 17],
      type: 'scatter'
    };
    
    var trace2 = {
      x: [1, 2, 3, 4],
      y: [16, 5, 11, 9],
      type: 'scatter'
    };
    
  var data = [trace1, trace2];
  
  const layout = {
      title: 'Amplitude Data',
      xaxis: {
          title: 'dB'
      },
  };


    return (
      <PlotlyChart data={data}
      layout={layout}
      //onClick={this.handleClick}
      //onHover={this.handleHover}
/>
    );
  }
}

export default ShipTrackPlotDisplay;