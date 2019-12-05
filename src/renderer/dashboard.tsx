/**
 * React renderer.
 */
import * as React from 'react';
import TabularDisplay from './tabular'
import MeasurementDisplay from './measurements'
import IntensityPlotDisplay from './intensity_plot'
import ContourPlotDisplay from './contour_plot'
import ShipTrackPlotDisplay from './shiptrack_plot'
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
    },
    paper: {
      padding: theme.spacing(2),
      textAlign: 'center',
      color: theme.palette.text.secondary,
    },
  }),
);

const Dashboard = () => {

    /**
     * Get the style
     */
    const classes = useStyles();

    const {ipcRenderer} = require('electron');

    /**
     * Initialize at startup
     */
    React.useEffect(() => {
        const selectedFile = document.getElementById('selected-file')
        if(selectedFile !=  null) {
            ipcRenderer.on('selected-directory', (event: Electron.Event, path: string) => {
                selectedFile.innerHTML = `You selected: ${path}`
            })
        }
    });

    /**
     * Button Click to Open the file dialog
     */
    const handleSelectFileClick = () => {
        ipcRenderer.send('open-file-dialog');
    }

    /**
     * Button Click to show terminal.
     */
    const handleShowAdcpTerminal = () => {
        ipcRenderer.send('show-adcp-terminal');
    }

    return (
            <div className={classes.root}>

                <Button id='select-directory' onClick={handleSelectFileClick}>Select File</Button>
                <span id='selected-file'></span>

                <Button id='show-adcp-terminal' onClick={handleShowAdcpTerminal}>Open ADCP Terminal</Button>

                <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                        <MeasurementDisplay msg="11/12/2018" />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <IntensityPlotDisplay msg="plot" />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <ShipTrackPlotDisplay />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <TabularDisplay zerorcpPort={4242} />
                    </Grid>
                    <Grid item xs={12}>
                        <ContourPlotDisplay />
                    </Grid>
                </Grid>
            </div>
        );
    }

export default Dashboard;