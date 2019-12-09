//import React, { Component } from 'react';
import * as React from "react";
var zerorpc = require('zerorpc');

/**
 * Parameters of the display.
 */
type TabularDisplayProps = {
  zerorcpPort: Number;                  // zerorpc Port
}

/**
 * State of the display
 */
type TabularDisplayState = {
  ensNum: string;                       // Ensemble Number
  ensDateTimeStr: string;               // Ensemble DateTime string
  ensDateTime: Date;                    // Ensemble DateTime object
  stopThread: Boolean;                  // Flag to stop the timer
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
}

export class TabularDisplay extends React.Component<TabularDisplayProps, TabularDisplayState> {
  static defaultProps = {
    zerorcpPort: 4242                     // Default zerorpc Port
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
            client.invoke("ensemble_info", 0, function(error: string, ens_info: IEnsembleData, more: string) {
              
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
                  ensDateTime: new Date(ens_info.ensembleDateTimeStr)
              });
            }
          });  
    }, 
    250);    // Interval Time
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
                <p>Ensemble Number: { this.state.ensDateTimeStr }</p>
                <p>Ensemble Year: { this.state.ensDateTime.getFullYear().toString() }</p>
                <p>Ensemble Seconds: { this.state.ensDateTime.getSeconds().toString() }</p>
                <p>Ensemble Milliseconds: { this.state.ensDateTime.getMilliseconds().toString() }</p>
                <p>{ this.props.zerorcpPort }</p>
            </div>
    }
}

export default TabularDisplay;