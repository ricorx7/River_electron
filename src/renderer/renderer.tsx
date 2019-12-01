/**
 * React renderer.
 */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Tabular from './tabular'
import * as Measurements from './measurements'
import * as IntensityPlot from './intensity_plot'
import * as ContourPlot from './contour_plot'
import * as ShipTrackPlot from './shiptrack_plot'
import { Container, Row, Col } from 'reactstrap'

// Import the styles here to process them with webpack
import '@public/style.css';
import '@public/bootstrap/css/bootstrap.min.css';



ReactDOM.render(
  <div className='app'>
    <h4>Welcome to React, Electron and Typescript</h4>
    <p>Hello</p>

    <button id='select-directory'>Select File</button>
    <span id='selected-file'></span>

    <Container>
      <Row>
        <Col>
          <Measurements.MeasurementDisplay msg="11/12/2018" />
        </Col>
        <Col>
          <IntensityPlot.IntensityPlotDisplay msg="plot" />
        </Col>
        <Col>
          <ShipTrackPlot.ShipTrackPlotDisplay />
        </Col>
        <Col>
          <Tabular.TabularDisplay zerorcpPort={4242} />
        </Col>
      </Row>
      <Row>
        <Col>
          <ContourPlot.ContourPlotDisplay />
        </Col>
      </Row>
    </Container>


  </div>,
  document.getElementById('app')
);

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