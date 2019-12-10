import * as React from "react";
import PlotlyChart from 'react-plotlyjs-ts';
import * as Plotly from 'plotly.js'
var zerorpc = require('zerorpc');

type IntensityPlotDisplayProps = {
    zerorcpPort: Number,
    updateRate: Number
}

/**
 * State of the display
 */
type IntensityPlotState = {
    numBeams: Number;                             // Number of beams
    numBins: Number;                              // Number of bins
    minBinDepth: Number;                          // Minimum depth of first bin (m)
    maxBinDepth: Number;                          // Maximum depth of the last bin (m)
    binData: number[];                            // Bin numbers
    stopThread: Boolean;                          // Flag to stop the timer
    beam0Data: number[];                          // Beam 0 Data
    beam1Data: number[];                          // Beam 1 Data
    beam2Data: number[];                          // Beam 2 Data
    beam3Data: number[];                          // Beam 3 Data
    vertData: number[];                           // Vertical Beam Data
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
interface IIntensityPlotData {
    numBeams: Number;                       // Number of beams
    numBins: Number;                        // Number of bins
    binData: number[];                            // Bin numbers
    beam0Data: number[];                          // Beam 0 Data
    beam1Data: number[];                          // Beam 1 Data
    beam2Data: number[];                          // Beam 2 Data
    beam3Data: number[];                          // Beam 3 Data
    vertData: number[];                           // Vertical Beam Data
    isUpward: boolean;                      // Flag if upward or downward looking data
    minBinDepth: number;                    // Min bin depth in meter for plot axis
    maxBinDepth: number;                    // Max bin depth in meters for plot axis
  }

export class IntensityPlotDisplay extends React.Component<IntensityPlotDisplayProps, IntensityPlotState> {
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
        binData: [],
        beam0Data: [],
        beam1Data: [],
        stopThread: false,
        layout: {},
      }
    );

    // Create the zerorpc connection to the python server
    // Use the port given to create the port
    var client = new zerorpc.Client();
    var zerorpcIP = "tcp://127.0.0.1:" + this.props.zerorcpPort.toString();
    client.connect(zerorpcIP);
    
    // Created so the callback function can use parent to set state
    var parent = this;

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
            client.invoke("zerorpc_amp_plot", 0, function(error: string, amp_data: IIntensityPlotData, more: string) {
              
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
                else if(amp_data) 
                {          
                    // Accumulate the plot data based on
                    // the number of beams
                    var plotData = []
                    if(amp_data.numBeams > 0) {
                        var beam0 = {
                            y: amp_data.binData,
                            x: amp_data.beam0Data,
                            type: "scatter" as const,
                            yaxis: 'y2',
                            name: "Beam 0",
                        };
                        plotData.push(beam0);
                    }
                    if(amp_data.numBeams > 1) {
                        var beam1 = {
                            y: amp_data.binData,
                            x: amp_data.beam1Data,
                            type: "scatter" as const,
                            name: "Beam 1",
                        };
                        plotData.push(beam1);
                    }
                    if(amp_data.numBeams > 2) {
                        var beam2 = {
                            y: amp_data.binData,
                            x: amp_data.beam2Data,
                            type: "scatter" as const,
                            name: "Beam 2",
                        };
                        plotData.push(beam2);
                    }
                    if(amp_data.numBeams > 3) {
                        var beam3 = {
                            y: amp_data.binData,
                            x: amp_data.beam3Data,
                            type: "scatter" as const,
                            name: "Beam 3",
                        };
                        plotData.push(beam3);
                    }
                    
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
                        parent.state.minBinDepth.toFixed(1) != amp_data.minBinDepth.toFixed(1) ||
                        parent.state.maxBinDepth.toFixed(1) != amp_data.maxBinDepth.toFixed(1) ||
                        parent.state.numBins != amp_data.numBins ||
                        parent.state.numBeams != amp_data.numBeams)
                    {
                        console.log("Create Instensity Plot Layout");
                        // Set the layout of the plot
                        // This sets the axis and 
                        var layout = {
                            title: 'Amplitude Data',
                            yaxis: {
                                title: 'bin',
                                side: 'left' as const,
                                range: [amp_data.numBins, 0]                        // Default to downward looking, start 0 at top
                            },
                            yaxis2: {
                                title: 'meter',
                                side: 'right' as const,                             // Set as opposite of side of other y axis
                                overlaying: 'y' as const,                           // Know which axis to work with
                                showgrid: false,
                                range: [amp_data.maxBinDepth, amp_data.minBinDepth] // Upward looking, start 0 at the top
                            },
                            xaxis: {
                                range: [0, 120],
                                title: 'dB',
                            },
                            uirevision: 'true',
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
                                    range: [0, amp_data.numBins]                                // Upward looking, start 0 at the bottom
                                },
                                yaxis2: {
                                    title: 'meter',
                                    side: 'right' as const,
                                    overlaying: 'y' as const,
                                    showgrid: false,
                                    range: [amp_data.minBinDepth, amp_data.maxBinDepth]        // Upward looking, start 0 at the bottom
                                },
                                xaxis: {
                                    range: [120, 0],                
                                    title: 'dB',
                                },
                                uirevision: 'true',
                            };
                        }
                        
                        // Set the state with the new layout
                        // and all the paramters
                        parent.setState({
                            layout: layout,
                            minBinDepth: amp_data.minBinDepth,
                            maxBinDepth: amp_data.maxBinDepth,
                            numBins: amp_data.numBins,
                            numBeams: amp_data.numBeams,
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

export default IntensityPlotDisplay;