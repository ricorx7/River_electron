//import React, { Component } from 'react';
import * as React from "react";
var zerorpc = require('zerorpc');

/**
 * Parameters of the display.
 */
type TabularDisplayProps = {
  zerorcpPort: Number;                  // zerorpc Port
  updateRate: Number
}

/**
 * State of the display
 */
type TabularDisplayState = {
  ensNum: string;                       // Ensemble Number
  ensDateTimeStr: string;               // Ensemble DateTime string
  ensDateTime: Date;                    // Ensemble DateTime object
  stopThread: Boolean;                  // Flag to stop the timer
  numEnsembles: Number;
  lostEnsembles: Number;
  badEnsembles: Number;
  percentBadBins: Number;
  deltaTime: Number;
  pitch: Number;
  roll: Number;
  heading: Number;
  temperature: Number;
  pressure: Number;
  goodBins: Number;
  topQ: Number;
  measuredQ: Number;
  bottomQ: Number;
  leftQ: Number;
  rightQ: Number;
  totalQ: Number;
  boatSpeed: Number;
  boatCourse: Number;
  waterSpeed: Number;
  waterDir: Number;
  calcDepth: Number;
  riverLength: Number;
  distanceMadeGood: Number;
  courseMadeGood: Number;
  duration: Number;
}

/**
 * Interface of the zerorpc connection. 
 * These are the values passed from the python server
 * to this display.  This interface must match the python
 * server dictionary.
 */
interface IEnsembleData {
  ensembleNum: Number;
  ensembleDateTimeStr: string;
  numEnsembles: Number;
  lostEnsembles: Number;
  badEnsembles: Number;
  percentBadBins: Number;
  deltaTime: Number;
  pitch: Number;
  roll: Number;
  heading: Number;
  temperature: Number;
  pressure: Number;
  goodBins: Number;
  topQ: Number;
  measuredQ: Number;
  bottomQ: Number;
  leftQ: Number;
  rightQ: Number;
  totalQ: Number;
  boatSpeed: Number;
  boatCourse: Number;
  waterSpeed: Number;
  waterDir: Number;
  calcDepth: Number;
  riverLength: Number;
  distanceMadeGood: Number;
  courseMadeGood: Number;
  duration: Number;
}

export class TabularDisplay extends React.Component<TabularDisplayProps, TabularDisplayState> {
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
        ensNum: "",
        ensDateTimeStr: "",
        ensDateTime: new Date(),
        stopThread: false,
      }
    );

    // Create the zerorpc connection to the python server
    // Use the port given to create the port
    var client = new zerorpc.Client();
    var zerorpcIP = "tcp://127.0.0.1:" + this.props.zerorcpPort.toString();
    client.connect(zerorpcIP);
    
    // Created so the callback function can use parent to set state
    var parent = this;

    console.log("Create Tabular");

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
            client.invoke("zerorpc_tabular_data", 0, function(error: string, ens_info: IEnsembleData, more: string) {
              
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
              else if(ens_info)
              {
                // Set the state of the values
                parent.setState({
                  ensNum: ens_info.ensembleNum.toString(),
                  ensDateTimeStr: ens_info.ensembleDateTimeStr,
                  ensDateTime: new Date(ens_info.ensembleDateTimeStr),
                  heading: ens_info.heading,
                  pitch: ens_info.pitch,
                  roll: ens_info.roll,
                  temperature: ens_info.temperature,
                  pressure: ens_info.pressure,
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

  render() {
    return <div>
                <h1>Tabular Data</h1> 
                <p>Ensemble Number: { this.state.ensNum }</p>
                <p>{ this.state.ensDateTimeStr }</p>
                <p>Ensemble Year: { this.state.ensDateTime.getFullYear().toString() }</p>
                <p>Ensemble Seconds: { this.state.ensDateTime.getSeconds().toString() }</p>
                <p>Ensemble Milliseconds: { this.state.ensDateTime.getMilliseconds().toString() }</p>
                <p>Heading: { this.state.heading }</p>
                <p>Pitch: { this.state.pitch }</p>
                <p>Roll: { this.state.roll }</p>
                <p>Temperature: { this.state.temperature }</p>
                <p>{ this.props.zerorcpPort }</p>
            </div>
    }
}

export default TabularDisplay;