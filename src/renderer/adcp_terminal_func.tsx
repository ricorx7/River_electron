import * as React from 'react';
import { useState, memo } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
var zerorpc = require('zerorpc');

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    formControl: {
      margin: theme.spacing(1),
      minWidth: 120,
    },
    selectEmpty: {
      marginTop: theme.spacing(2),
    },
  }),
);

type AdcpTerminalProps = {
    zerorcpPort: Number,
    updateRate: Number
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

/** */
const AdcpTerminalViewFunc = (props: AdcpTerminalProps) => {

    const classes = useStyles();

    console.log("Create AdcpTerminal");

    //Comm Port State     
    const [commPort, setCommPort] = useState('COM1')

    // Baudrate State
    const [baud, setBaud] = useState('115200')

    const [baudList, setBaudList] = useState([])
    
    // Termimal data to display
    const [termData, setTermData] = useState('')

    // Flag if connection is made to the ADCP through serial
    const [isConnected, setIsConnected] = useState(false)


    const handleBaudChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        //setBaud(event.target.value as string);
      };


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
    React.useEffect(() => { 

        // Create the zerorpc connection to the python server
        // Use the port given to create the port
        // Create the zerorpc connection to the python server
        // Use the port given to create the port
        var client = new zerorpc.Client();
        var port = props.zerorcpPort || 4241;
        var zerorpcIP = "tcp://127.0.0.1:" + port.toString();
        client.connect(zerorpcIP);
    
        // Get the serial ports
        client.invoke("zerorpc_baud_rate_list", function(error: string, baud_data: [], more: string) {
            console.log("Bauds")
            if(baud_data)
                console.log(baud_data.toString())
                setBaudList(baud_data);
        });
    

     const interval = setInterval(() => {
        console.log("adcp_terminal_display")
        /** 
        // Callback function for the zerorpc to talk to the python backend
        client.invoke("terminal_data", 0, function(error: string, incomingTermData: string, more: string) {
          
          if(!isConnected) {
              return;
          }

          // Check for any errors
          if(error) {
            console.error(error);
          }
          // Process the good data
          else if(incomingTermData)
          {
            // Set the state of the values
            setTermData(incomingTermData);
          }
          */
         //});  
        }, props.updateRate || 1000);    // Interval Time
    });

    return (
        <div>
            ADCP Terminal
        <FormControl className={classes.formControl}>
            <InputLabel id="demo-simple-select-label">Baud Rate</InputLabel>
            <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={baud}
            //onChange={handleBaudChange}
            >
                {baudList.map((value, index) => 
                    <MenuItem key={index} value={value}>{value}</MenuItem>
                )}
            </Select>
        </FormControl>

        </div>
    );
}

export default AdcpTerminalViewFunc

/**
 * React renderer.
 */
/** 
 import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Grid from '@material-ui/core/Grid';


type AdcpTerminalProps = {
    comm: string,
    baud: string
  }
  
export class AdcpTerminalView extends React.Component<AdcpTerminalProps> {
    static defaultProps = {
        comm: 'COM1',
        baud: '115200'
    }

    public render() {
        return(
            <div className='term'>
                <h4>ADCP Terminal</h4>
                <p>Hello</p>
                <p>{ this.props.comm }</p>
            
            
                <Grid container spacing={3}>
                    <h4>MY ADCP TERMINAL</h4>
                </Grid>
            </div>
        );
    }
}

export default AdcpTerminalView;
*/
