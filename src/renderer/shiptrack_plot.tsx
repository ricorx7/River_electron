import * as React from "react";
import PlotlyChart from 'react-plotlyjs-ts';

type ShipTrackPlotDisplayProps = {
  msg: string
}

export class ShipTrackPlotDisplay extends React.Component<ShipTrackPlotDisplayProps> {
  static defaultProps = {
    msg: 'Hello everyone!'
  }

  public handleClick = (evt: any) => alert('click')
  public handleHover = (evt: any) => alert('hover')

  public render() {
    var trace1 = {
        x: [1, 2, 3, 4, 5, 6, 7, 8],
        y: [10, 15, null, 17, 14, 12, 10, null, 15],
        mode: 'lines+markers',
        connectgaps: true
      };
      
      var trace2 = {
        x: [1, 2, 3, 4, 5, 6, 7, 8],
        y: [16, null, 13, 10, 8, null, 11, 12],
        mode: 'lines',
        connectgaps: true
      };
      
      var data = [trace1, trace2];
      
      var layout = {
        title: 'Connect the Gaps Between Data',
        showlegend: false,
        autosize: false,
        margin: {l:0, t:0, r:0, b:0},
        yaxis: {
          automargin: true
        },
        xaxis: {
          automargin: true
        }
      };

      const config = {
        responsive: true
      }


    return (
        <PlotlyChart data={data}
                     //layout={layout}
                     //config={config}
                     //onClick={this.handleClick}
                     //onHover={this.handleHover}
        />
    );
  }
}

export default ShipTrackPlotDisplay;