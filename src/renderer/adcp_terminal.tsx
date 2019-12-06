import * as React from 'react';
import { useState, memo } from 'react';
var zerorpc = require('zerorpc');

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

const AdcpTerminalView = () => {

    //Comm Port State     
    const [commPort, setCommPort] = useState('COM1')

    // Baudrate State
    const [baud, setBaud] = useState('115200')
    
    // Termimal data to display
    const [termData, setTermData] = useState('')

    // Flag if connection is made to the ADCP through serial
    const [isConnected, setIsConnected] = useState(false)

    //const updateEnsembleInfo = (incomingData: string) => {
    //    setTermData(incomingData)
    //}


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
    var client = new zerorpc.Client();
    var zerorpcIP = "tcp://127.0.0.1:4242";
    client.connect(zerorpcIP);

     const interval = setInterval(() => {
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
          });  
        }, 250);    // Interval Time
    });

    return (
        <div>
            ADCP Terminal
        </div>
    );
}

export default AdcpTerminalView

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
