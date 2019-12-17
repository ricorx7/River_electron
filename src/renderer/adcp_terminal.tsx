/**
 * React renderer.
 */

 import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Grid from '@material-ui/core/Grid';
import { createStyles, makeStyles, Theme, withStyles } from '@material-ui/core/styles';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import TextareaAutosize from '@material-ui/core/TextareaAutosize';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';
import { sizing } from '@material-ui/system';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import { string } from 'prop-types';
var zerorpc = require('zerorpc');


const useStyles = makeStyles((theme: Theme) =>
createStyles({
    root: {
        padding: theme.spacing(3, 2),
      },
    buttonPadding: {    
      padding: '30px',   
    },
  })
);

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
    sendCmd: string;                                // Command to send to the serial port
    bulkCmds: string;                               // List of bulk commands
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
        updateRate: 1000
    }

    // Set the baud rate.
    handleBaudChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        this.setState( 
        {
            baud: event.target.value as number
        });
      };

      // Set the comm port.
      handleCommPortChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        this.setState( 
        {
            commPort: event.target.value as string
        });
      };

      // Connect serial port.
      handleConnectClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        this.state.zerorpcClient.invoke("zerorpc_connect_adcp_serial_port", this.state.commPort, this.state.baud, function(error: string, comm_data: string[], more: string) {
            console.log("Connect Serial Port");
        });
      };

      // Disconnect serial port.
      handleDisconnectClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        this.state.zerorpcClient.invoke("zerorpc_disconnect_adcp_serial_port", function(error: string, comm_data: string[], more: string) {
            console.log("Disconnect Serial port");
        });
       };

      // Send a BREAK to the serial port
      handleBreakClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        this.state.zerorpcClient.invoke("zerorpc_cmd_break_adcp_serial_port", function(error: string, comm_data: string[], more: string) {
            console.log("SEND BREAK");
            });
        };

        // Send START Command
        handleStartPingingClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            this.sendAdcpSerialCommand("START");
        };

        // Send STOP Command
        handleStopPingingClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            this.sendAdcpSerialCommand("STOP");
        };

        // Send CSHOW Command
        handleCshowClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            this.sendAdcpSerialCommand("CSHOW");
        };

        // Clear Console
        handleClearClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            this.state.zerorpcClient.invoke("zerorpc_clear_adcp_serial", function(error: string, comm_data: string[], more: string) {
                console.log("Clear Console");
                });
        };

        // Handle the command input
        onCmdChange = (event: React.ChangeEvent<{value: unknown;}>) => {
            this.setState( 
            {
                sendCmd: event.target.value as string
            });
        };

        // Handle the command input
        onBulkCmdChange = (event: React.ChangeEvent<{value: unknown;}>) => {
            this.setState( 
            {
                bulkCmds: event.target.value as string
            });
        };

        // Send the command to the serial port.
        handleSendCmdClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            if(this.state.sendCmd.length > 0)
            {
                this.sendAdcpSerialCommand(this.state.sendCmd);

                // Reset the command button
                this.setState({
                    sendCmd: ""
                });
            }
        };

        // Send Bulk commands
        handleSendBulkCmdClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
            if(this.state.bulkCmds.length > 0)
            {
                this.state.zerorpcClient.invoke("zerorpc_bulk_cmd_adcp_serial_port", this.state.bulkCmds, function(error: string, comm_data: string[], more: string) {
                    console.log("Send Bulk Cmds");
                });
            }
          };

        /**
         * Send a ADCP Serial Command.
         */
        sendAdcpSerialCommand = (cmd: string) => {
            this.state.zerorpcClient.invoke("zerorpc_cmd_adcp_serial_port", cmd, function(error: string, comm_data: string[], more: string) {
                console.log("Send Cmd: " + cmd);
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
        sendCmd: '',                                // Command to send
        bulkCmds: '',                               // Bulk commands to send
        isConnected: false,                         // Flag if connected to serial port
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

                // Add the comm port to the list if it does not exist
                if(parent.state.commPortList.includes(term_data.commPort) == false)
                {
                    var joined = parent.state.commPortList.concat(term_data.commPort);
                    parent.setState({
                        commPortList: joined,
                    });
                }
            }
      });  
        }, 
        this.props.updateRate);    // Interval Time
    }

    // Unmount the component
    componentWillUnmount() {
        // Stop the interval timer thread
        this.setState({
        stopThread: true
        })
    }

    // Display
    public render() {

        return(
            <div>

                    <Grid container spacing={3} >
                        <Grid item xs={2}>
                            <FormControl>
                            <InputLabel id="comm-port-list-select-label">Port</InputLabel>
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
                        </Grid>

                        <Grid item xs={2}>
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
                        </Grid>

                        <Grid item xs={10}></Grid>

                        <Grid item xs={12}>
                            <ButtonGroup color="secondary" size="small" aria-label="contained primary button group">
                                <Button onClick={this.handleConnectClick} disabled={this.state.isConnected} >CONNECT</Button>
                                <Button onClick={this.handleDisconnectClick}>DISCONNECT</Button>
                            </ButtonGroup>
                        </Grid>

                        <Grid item xs={3}>
                        Comm Port: {this.state.commPort}
                        </Grid>
                        <Grid item xs={3}>
                        Baud: {this.state.baud}
                        </Grid>
                        <Grid item xs={6}></Grid>

                        <Grid item xs={8}>
                            <TextField
                            variant="outlined"
                            multiline
                            fullWidth
                            rowsMax={30} 
                            rows={30}
                            placeholder="No ADCP Data" 
                            value={this.state.termData} />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField multiline rows={30} variant="outlined" label="Command List" fullWidth onChange={this.onBulkCmdChange}  value={this.state.bulkCmds} />
                        </Grid>
                        
                        <Grid item xs={8}>
                            <ButtonGroup>
                                <Button onClick={this.handleBreakClick} disabled={!this.state.isConnected}>BREAK</Button>
                                <Button onClick={this.handleStartPingingClick} disabled={!this.state.isConnected}>Start Pinging</Button>
                                <Button onClick={this.handleStopPingingClick} disabled={!this.state.isConnected}>Stop Pinging</Button>
                                <Button onClick={this.handleCshowClick} disabled={!this.state.isConnected}>CSHOW</Button>
                                <Button onClick={this.handleClearClick} disabled={!this.state.isConnected}>CLEAR</Button>
                            </ButtonGroup>
                        </Grid>
                        <Grid item xs={4}>
                            <ButtonGroup>
                                <Button onClick={this.handleSendBulkCmdClick} disabled={!this.state.isConnected}>SEND COMMAND LIST</Button>
                            </ButtonGroup>
                        </Grid>

                        <Grid item xs={3}>
                            <TextField id="standard-basic" label="Send ADCP Command" onChange={this.onCmdChange} value={this.state.sendCmd} />
                        </Grid>
                        <Grid item xs={3}>
                            <Button variant="contained" onClick={this.handleSendCmdClick} disabled={!this.state.isConnected}>SEND</Button>
                        </Grid>
                        <Grid item xs={6}></Grid>

                    </Grid>
                
            </div>
        );
    }
}

//export default withStyles(styles)(AdcpTerminalView);
export default AdcpTerminalView;