/**
 * React renderer.
 */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Container, Row, Col } from 'reactstrap'

// Import the styles here to process them with webpack
import '@public/style.css';
import '@public/bootstrap/css/bootstrap.min.css';


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
            <div>
                <h4>ADCP Terminal</h4>
                <p>Hello</p>
            
            
                <Container>
                    <h4>MY ADCP TERMINAL</h4>
                </Container>
            </div>
        );
    }
}

export default AdcpTerminalView;
