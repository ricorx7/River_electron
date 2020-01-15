import * as React from "react";
import PlotlyChart from 'react-plotlyjs-ts';
import * as Plotly from 'plotly.js'
import { any } from "prop-types";
//import { mergeClasses } from "@material-ui/styles";
var zerorpc = require('zerorpc');


type IntensityPlotDisplayProps = {
    zerorcpPort: Number,
    updateRate: Number
}

/**
 * State of the display
 */
type IntensityPlotState = {
    stopThread: Boolean;                          // Flag to stop the timer
    data: Plotly.Data[]                           // Data to display
    layout: Partial<Plotly.Layout>;               // Layout of the plot
    config: {};                                   // Configuration of plot (Plotly.Config)
    classes: any;
  }

/**
 * Interface of the zerorpc connection. 
 * These are the values passed from the python server
 * to this display.  This interface must match the python
 * server dictionary.
 */
interface IShipTrackPlotData {
    quiver_x: [];                       // Quiver X points
    quiver_y: [];                       // Quiver Y points
    quiver_text: [];                    // Quiver Hover Text
    lat: [];                            // Lat
    lon: [];                            // Lon
    lat_lon_text: [];                   // Lat Lon Hover Text
    last_lat: 0.0;                      // Last Latitude
    last_lon: 0.0;                      // Last Longitude
  }

export class IntensityPlotDisplay extends React.Component<IntensityPlotDisplayProps, IntensityPlotState> {
    static defaultProps = {
        zerorcpPort: 4241,
        updateRate: 500
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
        stopThread: false,
        layout: {},
      }
    );

      console.log("Create Shiptrack Plot Layout");
      // Set the layout of the plot
      // This sets the axis and 
      var layout = {
          title: 'Ship Track',
          yaxis: {
              title: 'latitude',
              //range: [-180, 180]
          },
          xaxis: {
              //range: [-90, 90],
              title: 'longitude',
          },
          uirevision: 'true',
          legend: {
            "orientation": "h" as const,
            //x: 0.1, 
            //y: 1.1,
          },
          
      };
      
      // Set the state with the new layout
      // and all the paramters
      this.setState({
          layout: layout,
      });

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
            client.invoke("zerorpc_shiptrack_plot", 0, function(error: string, st_data: IShipTrackPlotData, more: string) {
              
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
                else if(st_data) 
                {          
                    // Accumulate the plot data based on
                    // the number of beams
                    var plotData = []

                    var quiver = {
                      x: st_data.quiver_x,
                      y: st_data.quiver_y,
                      type: "scatter" as const,
                      name: "Average",
                      text: st_data.quiver_text,          // Hover Text
                    };
                    plotData.push(quiver);

                    var shiptrack = {
                      x: st_data.lon,
                      y: st_data.lat,
                      type: "scatter" as const,
                      connectgaps: true,                  // NONE plots nothing, so connect
                      name: "Ship Track",
                      //text: st_data.lat_lon_text,         // Hover Text
                    };
                    plotData.push(shiptrack);

                    var last_spot = {
                      x: [st_data.last_lon],
                      y: [st_data.last_lat],
                      mode: 'markers' as const,     
                      //name: 'North America' as const,
                      showlegend: false,
                      //text: [st_data.last_lon.toString() + "," + st_data.last_lat.toString()],
                      marker: {
                        color: 'rgb(164, 194, 244)',
                        size: 12,
                        line: {
                          color: 'white',
                          width: 0.5
                        }
                      },
                      type: 'scatter' as const,
                    }
                    plotData.push(last_spot);


                    // Set the state for the plot data
                    parent.setState({
                        data: plotData
                    });
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