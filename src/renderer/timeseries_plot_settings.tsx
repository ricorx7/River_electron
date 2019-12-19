import * as React from "react";
import FormLabel from '@material-ui/core/FormLabel';
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import Switch from '@material-ui/core/Switch';
var zerorpc = require('zerorpc');

/**
 * Parameters of the display.
 */
type TimeSeriesOptionProps = {
  zerorcpPort: Number;                  // zerorpc Port
  updateRate: Number
}

/**
 * State of the display
 */
type TimeSeriesOptionState = {
    stopThread: Boolean;                  // Flag to stop the timer
    isBoatSpeed: boolean;
    isBoatDir: boolean;
    isHeading: boolean;
    isPitch: boolean;
    isRoll: boolean;
    isTemperature: boolean;
    isGnssQual: boolean;
    isGnssHdop: boolean;
    isNumSat: boolean; 
    isWaterSpeed: boolean;
    isWaterDir: boolean;
    maxEns: boolean;
    updateServerOption: boolean;        // Flag to update the options to the server
}

/**
 * Interface of the zerorpc connection. 
 * These are the values passed from the python server
 * to this display.  This interface must match the python
 * server dictionary.
 */
interface ITimesSeriesOptions {
    isBoatSpeed: boolean;
    isBoatDir: boolean;
    isHeading: boolean;
    isPitch: boolean;
    isRoll: boolean;
    isTemperature: boolean;
    isGnssQual: boolean;
    isGnssHdop: boolean;
    isNumSat: boolean; 
    isWaterSpeed: boolean;
    isWaterDir: boolean;
    maxEns: boolean;
}

export class TimeSeriesOptions extends React.Component<TimeSeriesOptionProps, TimeSeriesOptionState> {
  static defaultProps = {
    zerorcpPort: 4241,                     // Default zerorpc Port
    updateRate: 500
  }

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
        updateServerOption: false,
      }
    );

    // Create the zerorpc connection to the python server
    // Use the port given to create the port
    var client = new zerorpc.Client();
    var zerorpcIP = "tcp://127.0.0.1:" + this.props.zerorcpPort.toString();
    client.connect(zerorpcIP);
    
    // Created so the callback function can use parent to set state
    var parent = this;

    console.log("Create Time Series Options");

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
            client.invoke("zerorpc_get_timeseries_options", function(error: string, ts_options: ITimesSeriesOptions, more: string) {
              
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
              else if(ts_options)
              {
                // Set the state of the values
                parent.setState({
                    isBoatSpeed: ts_options.isBoatSpeed,
                    isBoatDir: ts_options.isBoatDir,
                    isHeading: ts_options.isHeading,
                    isPitch: ts_options.isPitch,
                    isRoll: ts_options.isRoll,
                    isTemperature: ts_options.isTemperature,
                    isGnssQual: ts_options.isGnssQual,
                    isGnssHdop: ts_options.isGnssHdop,
                    isNumSat: ts_options.isNumSat,
                    isWaterSpeed: ts_options.isWaterSpeed,
                    isWaterDir: ts_options.isWaterDir,
                    maxEns: ts_options.maxEns,
              });

              // Check if we need to update the server with the latest options
              if(parent.state.updateServerOption) {
                  parent.updateOptionsOnServer(client);

                  console.log("Update the server with new options");
                  console.log(parent.state);
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

  /**
   * Update the server with the latest options.
   */
  updateOptionsOnServer(client: any) {
    client.invoke("zerorpc_set_timeseries_options",
        this.state.isBoatSpeed,
        this.state.isBoatDir,
        this.state.isHeading,
        this.state.isPitch,
        this.state.isRoll,
        this.state.isTemperature,
        this.state.isGnssQual,
        this.state.isGnssHdop,
        this.state.isNumSat,
        this.state.isWaterSpeed,
        this.state.isWaterDir,
        this.state.maxEns, 
        function(error: string, ts_options: ITimesSeriesOptions, more: string) {
    });
    
    this.setState({
        updateServerOption: false,
    })

  }

  /**
   * Update the Boat Speed.
   */
  handleBoatSpeedChange = () => (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ 
        isBoatSpeed: event.target.checked,
        updateServerOption: true,                   // Set this option to true to udpate the server on next pass
     });
  };

  /**
   * Update the Boat Direction.
   */
  handleBoatDirChange = () => (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log(event.target.checked)
    this.setState({ 
        isBoatDir: event.target.checked,
        updateServerOption: true,                   // Set this option to true to udpate the server on next pass
     });
  };

  /**
   * Update the Heading.
   */
  handleHeadingChange = () => (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ 
        isHeading: event.target.checked,
        updateServerOption: true,                   // Set this option to true to udpate the server on next pass
     });
  };


  render() {
    return <div>
                <FormControl component="fieldset">
                <FormLabel component="legend">Assign responsibility</FormLabel>
                <FormGroup>
                    <FormControlLabel
                    control={
                        <Switch checked={this.state.isBoatSpeed} value="isBoatSpeed" onChange={this.handleBoatSpeedChange()} />}
                    label="Boat Speed"
                    />
                    <FormControlLabel
                    control={
                        <Switch checked={this.state.isBoatDir} value="isBoatDir" onChange={this.handleBoatDirChange()}  />}
                    label="Boat Direction"
                    />
                    <FormControlLabel
                    control={
                        <Switch checked={this.state.isHeading} value="isHeading" onChange={this.handleHeadingChange()} />
                    }
                    label="Heading"
                    />
                </FormGroup>
                <FormHelperText>Be careful</FormHelperText>
                </FormControl>
            </div>
    }
}

export default TimeSeriesOptions;
