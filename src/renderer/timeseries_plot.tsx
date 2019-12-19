import * as React from "react";
import PlotlyChart from 'react-plotlyjs-ts';
import * as Plotly from 'plotly.js'
import Fab from '@material-ui/core/Fab';
import SettingsIcon from '@material-ui/icons/Settings';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import { TextField } from "@material-ui/core";
var zerorpc = require('zerorpc');
import TimeSeriesOptions from './timeseries_plot_settings';

type TimeseriesPlotProps = {
    zerorcpIP: string,
    zerorcpPort: Number,
    updateRate: Number
}

/**
 * State of the display
 */
type TimeseriesPlotState = {
    isBoatSpeed: boolean;                   // Boat Speed Plot selected
    isBoatDir: boolean;                   // Boat Direction Plot selected
    isHeading: boolean;                     // Heading Plot selected
    isPitch: boolean;                       // Pitch Plot selected
    isRoll: boolean;                        // Roll Plot selected
    isTemperature: boolean;                 // Temperature Plot selected
    isGnssQual: boolean;                    // GNSS Quality Indicator Plot selected
    isGnssHdop: boolean;                    // GNSS HDOP Plot selected
    isNumSat: boolean;                      // Number of GNSS satellites Plot selected
    isWaterSpeed: boolean;                  // Water Speed Plot selected
    isWaterDir: boolean;                    // Water Direction Plot selected
    stopThread: Boolean;                    // Flag to stop the timer
    maxEns: Number;                         // Maximum number of ensembles to plot
    data: Plotly.Data[]                     // Data to display
    layout: Partial<Plotly.Layout>;         // Layout of the plot
    setSettingsModalOpen: boolean;          // Open or close the modal settings
    modalStyle: any;                        // Modal style
    config: {};                             // Configuration of plot (Plotly.Config)
  }

/**
 * Interface of the zerorpc connection. 
 * These are the values passed from the python server
 * to this display.  This interface must match the python
 * server dictionary.
 */
interface ITimeseriesPlotData {
    isBoatSpeed: boolean;                   // Boat Speed Plot selected
    isBoatDir: boolean;                   // Boat Direction Plot selected
    isHeading: boolean;                     // Heading Plot selected
    isPitch: boolean;                       // Pitch Plot selected
    isRoll: boolean;                        // Roll Plot selected
    isTemperature: boolean;                 // Temperature Plot selected
    isGnssQual: boolean;                    // GNSS Quality Indicator Plot selected
    isGnssHdop: boolean;                    // GNSS HDOP Plot selected
    isNumSat: boolean;                      // Number of GNSS satellites Plot selected
    isWaterSpeed: boolean;                  // Water Speed Plot selected
    isWaterDir: boolean;                    // Water Direction Plot selected
    boatSpeedData: number[];                // Boat Speed data
    boatDirData: number[];                  // Boat Direction data
    headingData: number[];                  // Heading data
    pitchData: number[];                    // Pitch data
    rollData: number[];                     // Roll data
    temperatureData: number[];              // Temperature data
    gnssQualData: number[];                 // GNSS Quality Inidicator data
    gnssHdopData: number[];                 // GNSS HDOP data
    numSatData: number[];                   // Number of GNSS satellites data
    waterSpeedData: number[];               // Water Speed data
    waterDirData: number[];                 // Water Direction data
    X_dt: number[];                         // X Axis - Date Time
    maxEns: Number;                         // Maximum Number of ensembles to plot
  }

export class TimeseriesPlotDisplay extends React.Component<TimeseriesPlotProps, TimeseriesPlotState> {
    static defaultProps = {
        zerorcpIP: "127.0.0.1",
        zerorcpPort: 4241,
        updateRate: 500
    }

    public handleClick = (evt: any) => alert('click')
    public handleHover = (evt: any) => alert('hover')

    private timeSeriesSettingsRef = React.createRef<HTMLDivElement>();

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
        maxEns: 20,
        isHeading: true,
        //isPitch: true,
        //isRoll: true,
        isTemperature: true,
        //isBoatSpeed: true,
        //isBoatDir: true,
        //isGnssQual: true,
        //isGnssHdop: true,
        //isNumSat: true,
        //isWaterSpeed: true,
        //isWaterDir: true,
        data: [],
        stopThread: false,
        setSettingsModalOpen: false,
        layout: {},
      }
    );



    console.log("Create Time Series Plot Layout");
    // Set the layout of the plot
    // This sets the axis and 
    var layout = {
        title: 'Time Series',
        yaxis: {
            title: 'Date/Time',
        },
        uirevision: 'true',
        legend: {
          "orientation": "h" as const,
          //x: 0.1, 
          //y: 1.1,
        },
        
    };

    // Create the zerorpc connection to the python server
    // Use the port given to create the port
    var client = new zerorpc.Client();
    var zerorpcIP = "tcp://" + this.props.zerorcpIP + ":" + this.props.zerorcpPort.toString();
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
            client.invoke("zerorpc_timeseries_plot", function(error: string, ts_data: ITimeseriesPlotData, more: string) {
              
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
                else if(ts_data) 
                {          
                    var plotData = []

                    // Boat Speed Plot
                    if(parent.state.isBoatSpeed) {
                        var boatSpeedData = {
                            x: ts_data.X_dt,               // Date Time
                            y: ts_data.boatSpeedData,
                            type: "scatter" as const,
                            name: "Boat Speed",
                        };
                        plotData.push(boatSpeedData);
                    }

                    // Boat Direction Plot
                    if(parent.state.isBoatDir) {
                        var boatdirData = {
                            x: ts_data.X_dt,               // Date Time
                            y: ts_data.boatDirData,
                            type: "scatter" as const,
                            name: "Boat Direction",
                        };
                        plotData.push(boatdirData);
                    }

                    // Heading Plot
                    if(parent.state.isHeading) {
                        var data = {
                            x: ts_data.X_dt,               // Date Time
                            y: ts_data.headingData,
                            type: "scatter" as const,
                            name: "Heading",
                        };
                        plotData.push(data);
                    }

                    // Pitch Plot
                    if(parent.state.isPitch) {
                        var data = {
                            x: ts_data.X_dt,               // Date Time
                            y: ts_data.pitchData,
                            type: "scatter" as const,
                            name: "Pitch",
                        };
                        plotData.push(data);
                    }

                    // Roll Plot
                    if(parent.state.isRoll) {
                        var data = {
                            x: ts_data.X_dt,               // Date Time
                            y: ts_data.rollData,
                            type: "scatter" as const,
                            name: "Roll",
                        };
                        plotData.push(data);
                    }

                    // Temperature Plot
                    if(parent.state.isTemperature) {
                        var data = {
                            x: ts_data.X_dt,               // Date Time
                            y: ts_data.temperatureData,
                            type: "scatter" as const,
                            name: "Temperature",
                        };
                        plotData.push(data);
                    }

                    // GNSS Quality Indicator Plot
                    if(parent.state.isGnssQual) {
                        var data = {
                            x: ts_data.X_dt,               // Date Time
                            y: ts_data.gnssQualData,
                            type: "scatter" as const,
                            name: "GNSS Quality",
                        };
                        plotData.push(data);
                    }

                    // GNSS HDOP Plot
                    if(parent.state.isGnssHdop) {
                        var data = {
                            x: ts_data.X_dt,               // Date Time
                            y: ts_data.gnssHdopData,
                            type: "scatter" as const,
                            name: "GNSS HDOP",
                        };
                        plotData.push(data);
                    }                    

                    // GNSS Num of Satellites Plot
                    if(parent.state.isNumSat) {
                        var data = {
                            x: ts_data.X_dt,               // Date Time
                            y: ts_data.numSatData,
                            type: "scatter" as const,
                            name: "GNSS Number of Satellites",
                        };
                        plotData.push(data);
                    }      

                    // Water Speed Plot
                    if(parent.state.isWaterSpeed) {
                        var data = {
                            x: ts_data.X_dt,               // Date Time
                            y: ts_data.waterSpeedData,
                            type: "scatter" as const,
                            name: "Water Speed",
                        };
                        plotData.push(data);
                    }      

                    // Water Direction Plot
                    if(parent.state.isWaterDir) {
                        var data = {
                            x: ts_data.X_dt,               // Date Time
                            y: ts_data.waterDirData,
                            type: "scatter" as const,
                            name: "Water Direction",
                        };
                        plotData.push(data);
                    }      

                    // Set the plot data
                    parent.setState({
                        data: plotData,
                    });

                }

          });  
    }, 
    this.props.updateRate);    // Interval Time
  }

  handleSettingsModelOpen = () => {
      this.setState({
        setSettingsModalOpen: true,
      });
  };

  handleSettingsModelClose = () => {
    this.setState({
        setSettingsModalOpen: false,
      });
  };

  handleSettingsModelSave = () => {
    this.setState({
        setSettingsModalOpen: false,
      });
  };

  componentWillUnmount() {
    
    // Stop the interval timer thread
    this.setState({
      stopThread: true
    })
  }

    public render() {
        

        return (
            <div>
                <Fab color="primary" aria-label="add" onClick={this.handleSettingsModelOpen}>
                    <SettingsIcon />
                </Fab>

            <PlotlyChart data={this.state.data}
                            layout={this.state.layout}
                            config={this.state.config}
                            //onClick={this.handleClick}
                            //onHover={this.handleHover}
            />

                <Dialog
                aria-labelledby="simple-modal-title"
                aria-describedby="simple-modal-description"
                open={this.state.setSettingsModalOpen}
                onClose={this.handleSettingsModelClose}
                >
                    <DialogTitle style={{ cursor: 'move' }} id="draggable-dialog-title">
                    Time Series Settings
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Select the Time Series options:
                        </DialogContentText>
                        <TimeSeriesOptions />
                    </DialogContent>
                    <DialogActions>
                    <Button autoFocus onClick={this.handleSettingsModelClose} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={this.handleSettingsModelSave} color="primary">
                        Save
                    </Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }
}

export default TimeseriesPlotDisplay;