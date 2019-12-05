/**
 * React renderer.
 */
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
