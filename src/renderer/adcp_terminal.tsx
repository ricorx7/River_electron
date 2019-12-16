/**
 * React renderer.
 */

 import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Grid from '@material-ui/core/Grid';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import TextareaAutosize from '@material-ui/core/TextareaAutosize';
import Button from '@material-ui/core/Button';
import { string } from 'prop-types';
var zerorpc = require('zerorpc');


/**
 * ADCP Parameters.
 */
type AdcpTerminalProps = {
    comm: string,
    baud: string,
    zerorcpPort: Number,
    updateRate: Number,
  }

/**
 * State of the display
 */
type AdcpTerminalState = {
    stopThread: Boolean;                            // Flag to stop the timer
    commPort: String;                               // Serial COMM Port selected
    commPortList: string[];                         // Comm Port list
    baud: Number;                                   // Selected baud rate
    baudList: number[];                             // Baud rate list
    termData: string;                               // Terminal data to display
    isConnected: boolean;                           // Flag if connected to serial port
    zerorpcClient: any;
  }

/**
 * Terminal port data output.
 */
interface IAdcpTerminalData {
    isConnected: boolean;                           // isConnected flag
    termData: string;                               // Terminal port data
    baud: number;                                   // Current Baud Rate
    commPort: string;                               // Comm Port
}


export class AdcpTerminalView extends React.Component<AdcpTerminalProps, AdcpTerminalState> {
    static defaultProps = {
        comm: '',
        baud: '115200',
        zerorcpPort: 4241,
        updateRate: 250
    }

    handleBaudChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        this.setState( 
        {
            baud: event.target.value as number
        }
        );
      };

      handleCommPortChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        this.setState( 
        {
            commPort: event.target.value as string
        }
        );
      };

      handleConnectClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            // Get the Comm Port List
            this.state.zerorpcClient.invoke("zerorpc_connect_adcp_serial_port", this.state.commPort, this.state.baud, function(error: string, comm_data: string[], more: string) {
                console.log("Connect Serial Port");
            });
      };

      handleDisconnectClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        // Get the Comm Port List
        this.state.zerorpcClient.invoke("zerorpc_disconnect_adcp_serial_port", function(error: string, comm_data: string[], more: string) {
            console.log("Disconnect Serial port");
            });
        };

      handleBreakClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        // Get the Comm Port List
        this.state.zerorpcClient.invoke("zerorpc_cmd_break_adcp_serial_port", function(error: string, comm_data: string[], more: string) {
            console.log("SEND BREAK");
            });
        };

        handleStartPingingClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            this.sendAdcpSerialCommand("START");
        };

        /**
         * Send a ADCP Serial Command.
         */
        sendAdcpSerialCommand = (cmd: string) => {
                    // Get the Comm Port List
        this.state.zerorpcClient.invoke("zerorpc_cmd_adcp_serial_port", cmd, function(error: string, comm_data: string[], more: string) {
            console.log("Send Cmd: START");
            });
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
        commPort: "",                               // Serial COMM Port selected
        baud: 115200,                               // Selected baud rate
        termData: '',                               // Terminal data to display
        isConnected: false,                           // Flag if connected to serial port
        baudList: [],                               // Initialize the baud list to nothing, get from python
        commPortList: [],                           // Initialize the comm port list to nothing, get from python
      }
    );

    // Create the zerorpc connection to the python server
    // Use the port given to create the port
    var client = new zerorpc.Client();
    var zerorpcIP = "tcp://127.0.0.1:" + this.props.zerorcpPort.toString();
    client.connect(zerorpcIP);

    this.setState({
        zerorpcClient: client,
    });
    
    // Created so the callback function can use parent to set state
    var parent = this;

    // Get the baud rates
    client.invoke("zerorpc_baud_rate_list", function(error: string, baud_data: number[], more: string) {
        console.log("Bauds")
        if(baud_data)
            console.log(baud_data.toString())
            parent.setState( {
                baudList: baud_data,
            });
    });

    // Get the Comm Port List
    client.invoke("zerorpc_comm_port_list", function(error: string, comm_data: string[], more: string) {
        console.log("Comm Ports")
        if(comm_data)
            console.log(comm_data.toString())
            parent.setState( {
                commPortList: comm_data,
            });
    });

    setInterval(function() {
        // Callback function for the zerorpc to talk to the python backend 
        client.invoke("zerorpc_adcp_terminal", function(error: string, term_data: IAdcpTerminalData, more: string) {
          
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
            else if(term_data) 
            {          
                parent.setState({
                    isConnected: term_data.isConnected,
                    termData: term_data.termData,
                    baud: term_data.baud,
                    commPort: term_data.commPort,
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
        return(
            <div>
            ADCP Terminal
        <FormControl>
            <InputLabel id="comm-port-list-select-label">COMM Port</InputLabel>
            <Select labelId="comm-port-list-select-label" 
                    id="comm-port-list-select"
                    value={this.state.commPort}
                    onChange={this.handleCommPortChange}
                    >
                        {this.state.commPortList.map((value, index) => 
                            <MenuItem key={index} value={value}>{value}</MenuItem>
                        )}
            </Select>
        </FormControl>
        <FormControl>
            <InputLabel id="baud-rate-list-select-label">Baud Rate</InputLabel>
            <Select labelId="baud-rate-list-select-label" 
                    id="baud-rate-list-select"
                    value={this.state.baud}
                    onChange={this.handleBaudChange}
                    >
                        {this.state.baudList.map((value, index) => 
                            <MenuItem key={index} value={value}>{value}</MenuItem>
                        )}
            </Select>
        </FormControl>

        <Button variant="contained" color="primary" onClick={this.handleConnectClick}>CONNECT</Button>
        <Button variant="contained" color="secondary" onClick={this.handleDisconnectClick}>DISCONNECT</Button>
        <Button variant="contained" color="primary" onClick={this.handleBreakClick}>BREAK</Button>
        <Button variant="contained" color="default" onClick={this.handleStartPingingClick}>Start Pinging</Button>
        

        <br />
        <span>Comm Port: {this.state.commPort}</span>
        <br />
        <span>Baud: {this.state.baud}</span>
        <br />
        <span>IsConnected: {this.state.isConnected}</span>
        <br />
        <span><TextareaAutosize aria-label="minimum height" rowsMax={30} placeholder="No ADCP Data" value={this.state.termData}/></span>
        <br />
        <span>{this.state.termData}</span>

        </div>
        );
    }
}

export default AdcpTerminalView;