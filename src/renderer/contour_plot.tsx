import * as React from "react";
import PlotlyChart from 'react-plotlyjs-ts';
import * as Plotly from 'plotly.js'
var zerorpc = require('zerorpc');

type ContourPlotDisplayProps = {
    zerorcpPort: Number,
    updateRate: Number
}

/**
 * State of the display
 */
type ContourPlotState = {
    numBeams: Number;                             // Number of beams
    numBins: Number;                              // Number of bins
    minBinDepth: Number;                          // Minimum depth of first bin (m)
    maxBinDepth: Number;                          // Maximum depth of the last bin (m)
    stopThread: Boolean;                          // Flag to stop the timer
    contourData: number[];                        // Contour Data
    X_dt: number[];                               // X Axis DateTime Data
    Y_bin: number[];                              // Y Axis Bins Data
    btRange: number[];                            // Bottom Track Avg Range
    isUpward: boolean;                            // Flag if the data is upward or downward
    data: Plotly.Data[]                           // Data to display
    layout: Partial<Plotly.Layout>;               // Layout of the plot
    config: {};                                   // Configuration of plot (Plotly.Config)
  }

/**
 * Interface of the zerorpc connection. 
 * These are the values passed from the python server
 * to this display.  This interface must match the python
 * server dictionary.
 */
interface IContourPlotData {
    numBeams: Number;                       // Number of beams
    numBins: Number;                        // Number of bins
    contourData: number[];                  // Contour Data
    X_dt: number[];                         // X Axis DateTime
    Y_bin: number[];                        // Y Axis Bin Numbers
    btRange: number[];                      // Bottom Track Avg Range
    btRangeToBin: number[];                 // Bottom Track Avg Range to Bin
    lastBinRange: number[];                 // Last Bin Range to know the bottom of the plot for shaded area
    isUpward: boolean;                      // Flag if upward or downward looking data
    minBinDepth: number;                    // Min bin depth in meter for plot axis
    maxBinDepth: number;                    // Max bin depth in meters for plot axis
  }

export class ContourPlotDisplay extends React.Component<ContourPlotDisplayProps, ContourPlotState> {
    static defaultProps = {
        zerorcpPort: 4241,
        updateRate: 250
    }

    public handleClick = (evt: any) => alert('click')
    public handleHover = (evt: any) => alert('hover')

     /**
   * Called when the component is first created.  
   * The state will be initialized.
   * 
   * The zerorpc connection will be made.
   * 
   * A timer is created to call the python server through zerorpc for the
   * latest data.
   */
  componentWillMount() {

    // Initialize the state
    this.setState(
      {
        numBeams: 4,
        numBins: 0,
        minBinDepth: 0,
        maxBinDepth: 0,
        X_dt: [],
        Y_bin: [],
        contourData: [],
        stopThread: false,
        layout: {},
      }
    );

    // Create the zerorpc connection to the python server
    // Use the port given to create the port
    var client = new zerorpc.Client();
    var zerorpcIP = "tcp://127.0.0.1:" + this.props.zerorcpPort.toString();
    client.connect(zerorpcIP);
    
    //  Modebar Buttons names at https://github.com/plotly/plotly.js/blob/master/src/components/modebar/buttons.js
     //  - sendDataToCloud 
     //  - (2D): zoom2d, pan2d, select2d, lasso2d, zoomIn2d, zoomOut2d, autoScale2d, resetScale2d
     //  - (Cartesian): hoverClosestCartesian, hoverCompareCartesian 
     //  - (3D): zoom3d, pan3d, orbitRotation, tableRotation, handleDrag3d, resetCameraDefault3d, resetCameraLastSave3d, hoverClosest3d
     //  - (Geo): zoomInGeo, zoomOutGeo, resetGeo, hoverClosestGeo
     //  - hoverClosestGl2d, hoverClosestPie, toggleHover, resetViews 
    var defaultPlotlyConfiguration = {
      //modeBarButtonsToRemove: ['sendDataToCloud', 'autoScale2d', 'hoverClosestCartesian', 'hoverCompareCartesian', 'lasso2d', 'select2d'], 
      displaylogo: false,         // Remove the "Produce by Plotly button"
      doubleClick: "autosize" 
      //showTips: true as const, 
    };

    this.setState({
      config: defaultPlotlyConfiguration,
    });

    // Created so the callback function can use parent to set state
    var parent = this;

    /** 
     * Update the display with the latest information.
     * This will call to the zerorpc for the latest data.
     * It will check the data based on the interval time.
     * 
     * When the data is obtained from the zerorpc python server,
     * it will set the state.  The display will then be udpated.
     * 
     * Interval Time: 250ms
     * 
     */
    setInterval(function() {
            // Callback function for the zerorpc to talk to the python backend
            client.invoke("zerorpc_contour_plot", "mag", function(error: string, contour_data: IContourPlotData, more: string) {
              
                // Check if we need to stop the thread
                if(parent.state.stopThread) {
                    client.disconnect();
                    return;
                }

                // Check for any errors
                if(error) {
                    console.error(error);
                }
                // Process the good data
                else if(contour_data) 
                {          
                    // Accumulate the plot data based on
                    // the number of beams
                    var plotData = [
                      {
                        // Contour Plot data
                        z: contour_data.contourData,        // Contour data
                        x: contour_data.X_dt,               // Date Time
                        y: contour_data.Y_bin,              // Bin
                        name: "Magnitude",
                        type: 'heatmap' as const
                      },
                      {
                        // Bottom Track Line
                        x: contour_data.X_dt,               // Date Time
                        y: contour_data.btRange,            // Bottom Track Range
                        type: "scatter" as const,           // Scatter Line plot
                        name: "Bottom Track Range",
                        yaxis: 'y2',
                        connectgaps: true,                  // NONE plots nothing, so connect
                        fill: 'none' as const,              // Use none so it does not go to 0
                        showlegend: false,                  // Do not show the legend, tooltip will show
                        //mode: 'lines' as const,
                        line: {
                            color: 'red',
                          }
                      },
                      {
                        // This line is not seen, just used to invert the shaded area
                        x: contour_data.X_dt,
                        y: contour_data.lastBinRange,
                        type: "scatter" as const,
                        name: "Bottom of Plot",
                        yaxis: 'y2',
                        fill: 'tonexty' as const,           // Use tonexty to fill from one line to other line
                        //mode: 'lines' as const,
                        hoverinfo: 'none' as const,         // Remove Tooltips for this line
                        showlegend: false,                  // Remove the lengend for this line
                        fillcolor: '#8C8C8CFB'
                      },
                    ];

                    
                    // Set the state for the plot data
                    parent.setState({
                        data: plotData
                    });

                    // Check if the layout needs to be created
                    // Check if the title exist, if it does not, then the layout
                    // has not be created yet.
                    // If anything changes in the bin setup, then
                    // redo the layout.
                    // Used toFixed() to round the number, because it can vary by a decimal place
                    if(!parent.state.layout.hasOwnProperty('title') ||
                        parent.state.minBinDepth.toFixed(1) != contour_data.minBinDepth.toFixed(1) ||
                        parent.state.maxBinDepth.toFixed(1) != contour_data.maxBinDepth.toFixed(1) ||
                        parent.state.numBins != contour_data.numBins ||
                        parent.state.numBeams != contour_data.numBeams)
                    {
                        console.log("Create Contour Layout");
                        // Set the layout of the plot
                        // This sets the axis and 
                        var layout = {
                            title: 'Amplitude Data',
                            yaxis: {
                                title: 'bin',
                                side: 'left' as const,
                                range: [contour_data.numBins, 0]                        // Default to downward looking, start 0 at top
                            },
                            yaxis2: {
                                title: 'meter',
                                side: 'right' as const,                             // Set as opposite of side of other y axis
                                overlaying: 'y' as const,                           // Know which axis to work with
                                showgrid: false,
                                range: [contour_data.maxBinDepth, contour_data.minBinDepth] // Upward looking, start 0 at the top
                            },
                            xaxis: {
                              title: 'Ensemble Date and Time',
                            },
                            uirevision: 'true',
                            legend: {
                              orientation: "h" as const
                            }
                        };

                        // If upward, then the ADCP is on the seafloor looking upward
                        // Change the orientation of the plot
                        if(parent.state.isUpward) 
                        {
                            layout = {
                                title: 'Amplitude Data',
                                yaxis: {
                                    title: 'bin',
                                    side: 'left' as const,
                                    range: [0, contour_data.numBins]                                // Upward looking, start 0 at the bottom
                                },
                                yaxis2: {
                                    title: 'meter',
                                    side: 'right' as const,
                                    overlaying: 'y' as const,
                                    showgrid: false,
                                    range: [contour_data.minBinDepth, contour_data.maxBinDepth]        // Upward looking, start 0 at the bottom
                                },
                                xaxis: {            
                                    title: 'Ensemble Date and Time',
                                },
                                uirevision: 'true',
                                legend: {
                                  orientation: "h" as const
                                }
                            };
                        }
                        
                        // Set the state with the new layout
                        // and all the paramters
                        parent.setState({
                            layout: layout,
                            minBinDepth: contour_data.minBinDepth,
                            maxBinDepth: contour_data.maxBinDepth,
                            numBins: contour_data.numBins,
                            numBeams: contour_data.numBeams,
                        });
                  }
                }

          });  
    }, 
    this.props.updateRate);    // Interval Time
  }

  componentWillUnmount() {
    
    // Stop the interval timer thread
    this.setState({
      stopThread: true
    })
  }

    public render() {
        

        return (
            <PlotlyChart data={this.state.data}
                            layout={this.state.layout}
                            config={this.state.config}
                            //onClick={this.handleClick}
                            //onHover={this.handleHover}
                            
            />
        );
    }
}

export default ContourPlotDisplay;

/** 
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

export default ContourPlotDisplay;
*/