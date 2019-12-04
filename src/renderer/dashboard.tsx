/**
 * React renderer.
 */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import TabularDisplay from './tabular'
import MeasurementDisplay from './measurements'
import IntensityPlotDisplay from './intensity_plot'
import ContourPlotDisplay from './contour_plot'
import ShipTrackPlotDisplay from './shiptrack_plot'
import { Container, Row, Col } from 'reactstrap'
import { Link } from 'react-router-dom'

// Import the styles here to process them with webpack
import '@public/style.css';
import '@public/bootstrap/css/bootstrap.min.css';

type DashboardProps = {
    msg: string
  }

export class Dashboard extends React.Component<DashboardProps> {
    static defaultProps = {
      msg: 'Hello everyone!'
    }

    componentDidMount() {
        // Select a file or folder
        const {ipcRenderer} = require('electron')

        const selectDirBtn = document.getElementById('select-directory')

        if(selectDirBtn != null) {
            selectDirBtn.addEventListener('click', (event) => {
                ipcRenderer.send('open-file-dialog')
            })
        }

        const selectedFile = document.getElementById('selected-file')
        if(selectedFile !=  null) {
            ipcRenderer.on('selected-directory', (event: Electron.Event, path: string) => {
                selectedFile.innerHTML = `You selected: ${path}`
            })
        }

        // Show ADCP Terminal Button handling
        const showAdcpTerminalBtn = document.getElementById('show-adcp-terminal')

        if(showAdcpTerminalBtn != null) {
            showAdcpTerminalBtn.addEventListener('click', (event) => {
                ipcRenderer.send('show-adcp-terminal')
            })
        }
    }

    public render() {
        return (
            <div>
                <header>
                <p>React Router v4 Browser Example</p>
                    <nav>
                    <ul>
                        <li><Link to='/'>Home</Link></li>
                        <li><Link to='/adcp-terminal'>Terminal</Link></li>
                    </ul>
                    </nav>
                </header>

                <h4>Welcome to React, Electron and Typescript</h4>
                <p>Hello</p>

                <button id='select-directory'>Select File</button>
                <span id='selected-file'></span>

                <button id='show-adcp-terminal'>Open ADCP Terminal</button>

                <Container>
                    <Row>
                        <Col>
                            <MeasurementDisplay msg="11/12/2018" />
                        </Col>
                        <Col>
                            <IntensityPlotDisplay msg="plot" />
                        </Col>
                        <Col>
                            <ShipTrackPlotDisplay />
                        </Col>
                        <Col>
                            <TabularDisplay zerorcpPort={4242} />
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <ContourPlotDisplay />
                        </Col>
                    </Row>
                </Container>
            </div>
        );
    }
}

export default Dashboard;