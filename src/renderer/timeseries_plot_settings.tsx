import * as React from "react";
import FormLabel from '@material-ui/core/FormLabel';
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import Switch from '@material-ui/core/Switch';
import TextField from '@material-ui/core/TextField';
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
    isVtgSpeed: boolean;
    maxEns: number;
    maxEnsErrorText: String;
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
    isVtgSpeed: boolean;
    maxEns: number;
}

export class TimeSeriesOptions extends React.Component<TimeSeriesOptionProps, TimeSeriesOptionState> {

    // Initialize the props
    static defaultProps = 
    {
        zerorcpPort: 4241,                     // Default zerorpc Port
        updateRate: 500
    }

    // Initialize the state
    state =   
    {
        stopThread: false,
        isBoatSpeed: true,
        isBoatDir: false,
        isHeading: false,
        isPitch: false,
        isRoll: false,
        isTemperature: false,
        isGnssQual: false,
        isGnssHdop: false,
        isNumSat: false,
        isWaterSpeed: false,
        isWaterDir: false,
        isVtgSpeed: false,
        maxEns: 4096,
        maxEnsErrorText: '',
        updateServerOption: false,
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
  componentDidMount() {

    // Create the zerorpc connection to the python server
    // Use the port given to create the port
    var client = new zerorpc.Client();
    var zerorpcIP = "tcp://127.0.0.1:" + this.props.zerorcpPort.toString();
    client.connect(zerorpcIP);
    
    // Created so the callback function can use parent to set state
    var parent = this;

    console.log("Create Time Series Options");

    // Callback function for the zerorpc to talk to the python backend
    client.invoke("zerorpc_get_timeseries_options", function(error: string, ts_options: ITimesSeriesOptions, more: string) {
    
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
                isVtgSpeed: ts_options.isVtgSpeed,
                maxEns: ts_options.maxEns,
            });
        }
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
            client.invoke("zerorpc_get_timeseries_options", function(error: string, ts_options: ITimesSeriesOptions, more: string) {
              
              // Check if we need to stop the thread
              if(parent.state.stopThread) {
                client.disconnect();
                return;
              }

              // Check if we need to update the server with the latest options
              if(parent.state.updateServerOption) {
                  parent.updateOptionsOnServer(client);

                  console.log("Update the server with new options");
                  console.log(parent.state);
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
        this.state.isVtgSpeed,
        this.state.maxEns,
        function(error: string, ts_options: ITimesSeriesOptions, more: string) {
    });
    
    // Reset the update flag
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

  /**
   * Update the Pitch.
   */
  handlePitchChange = () => (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ 
        isPitch: event.target.checked,
        updateServerOption: true,                   // Set this option to true to udpate the server on next pass
     });
  };

  /**
   * Update the Roll.
   */
  handleRollChange = () => (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ 
        isRoll: event.target.checked,
        updateServerOption: true,                   // Set this option to true to udpate the server on next pass
     });
  };

  /**
   * Update the Temperature.
   */
  handleTemperatureChange = () => (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ 
        isTemperature: event.target.checked,
        updateServerOption: true,                   // Set this option to true to udpate the server on next pass
     });
  };

  /**
   * Update the GNSS Quality.
   */
  handleGnssQualChange = () => (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ 
        isGnssQual: event.target.checked,
        updateServerOption: true,                   // Set this option to true to udpate the server on next pass
     });
  };

    /**
   * Update the GNSS HDOP.
   */
  handleGnssHdopChange = () => (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ 
        isGnssHdop: event.target.checked,
        updateServerOption: true,                   // Set this option to true to udpate the server on next pass
     });
  };

  /**
   * Update the Number of Satellites.
   */
  handleNumSatChange = () => (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ 
        isNumSat: event.target.checked,
        updateServerOption: true,                   // Set this option to true to udpate the server on next pass
     });
  };

  /**
   * Update the Water Speed.
   */
  handleWaterSpeedChange = () => (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ 
        isWaterSpeed: event.target.checked,
        updateServerOption: true,                   // Set this option to true to udpate the server on next pass
     });
  };

  /**
   * Update the Water Direction.
   */
  handleWaterDirChange = () => (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ 
        isWaterDir: event.target.checked,
        updateServerOption: true,                   // Set this option to true to udpate the server on next pass
     });
  };

  /**
   * Update the GPS VTG Speed.
   */
  handleVtgSpeedChange = () => (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ 
        isVtgSpeed: event.target.checked,
        updateServerOption: true,                   // Set this option to true to udpate the server on next pass
     });
  };

  handleMaxEnsChange = () => (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ 
        maxEns: parseInt(event.target.value),
        updateServerOption: true,                   // Set this option to true to udpate the server on next pass
     });
     console.log("Ensemble Max: " + this.state.maxEns.toString());
    }

  render() {
    return <div>
                <FormControl component="fieldset">
                <FormGroup>
                    <FormControlLabel control={
                            <Switch checked={this.state.isBoatSpeed} value="isBoatSpeed" onChange={this.handleBoatSpeedChange()} color="primary" /> 
                        }
                        label="Boat Speed"
                    />

                    <FormControlLabel control={
                            <Switch checked={this.state.isBoatDir} value="isBoatDir" onChange={this.handleBoatDirChange()}  />
                        } label="Boat Direction"
                    />
                    
                    <FormControlLabel control={
                            <Switch checked={this.state.isHeading} value="isHeading" onChange={this.handleHeadingChange()} />
                        } label="Heading"
                    />

                    <FormControlLabel control={
                            <Switch checked={this.state.isPitch} value="isPitch" onChange={this.handlePitchChange()} />
                        } label="Pitch"
                    />

                    <FormControlLabel control={
                            <Switch checked={this.state.isRoll} value="isRoll" onChange={this.handleRollChange()} />
                        } label="Roll"
                    />

                    <FormControlLabel control={
                            <Switch checked={this.state.isTemperature} value="isTemperature" onChange={this.handleTemperatureChange()} />
                        } label="Temperature"
                    />

                    <FormControlLabel control={
                            <Switch checked={this.state.isGnssQual} value="isGnssQual" onChange={this.handleGnssQualChange()} />
                        } label="GNSS Quality"
                    />

                    <FormControlLabel control={
                            <Switch checked={this.state.isGnssHdop} value="isGnssHdop" onChange={this.handleGnssHdopChange()} />
                        } label="GNS HDOP"
                    />

                    <FormControlLabel control={
                            <Switch checked={this.state.isNumSat} value="isNumSat" onChange={this.handleNumSatChange()} />
                        } label="Number of Satellites"
                    />

                    <FormControlLabel control={
                            <Switch checked={this.state.isWaterSpeed} value="isWaterSpeed" onChange={this.handleWaterSpeedChange()} />
                        } label="Water Speed"
                    />

                    <FormControlLabel control={
                            <Switch checked={this.state.isWaterDir} value="isWaterDir" onChange={this.handleWaterDirChange()} />
                        } label="Water Direction"
                    />

                    <FormControlLabel control={
                            <Switch checked={this.state.isVtgSpeed} value="isVtgSpeed" onChange={this.handleVtgSpeedChange()} />
                        } label="VTG Speed"
                    />

                    <TextField
                        id="filled-number"
                        label="Max Ensembles"
                        type="number"
                        value={this.state.maxEns}
                        onChange={this.handleMaxEnsChange()}
                        InputLabelProps={{
                            shrink: true,
                        }}
                        inputProps={{ min: "0", max: "999999", step: "1" }}
                        />

                    </FormGroup>
                </FormControl>
            </div>
    }
}

export default TimeSeriesOptions;
