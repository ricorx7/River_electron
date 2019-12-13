import * as React from 'react';
import clsx from 'clsx';
import { createStyles, makeStyles, useTheme, Theme } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import CssBaseline from '@material-ui/core/CssBaseline';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ListItem, { ListItemProps } from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import InboxIcon from '@material-ui/icons/MoveToInbox';
import MailIcon from '@material-ui/icons/Mail';
import AppsIcon from '@material-ui/icons/Apps';
import StorageIcon from '@material-ui/icons/Storage';
import SettingsInputHdmiIcon from '@material-ui/icons/SettingsInputHdmi';
import PanoramaIcon from '@material-ui/icons/Panorama';
import TimelineIcon from '@material-ui/icons/Timeline';
import DirectionsBoatIcon from '@material-ui/icons/DirectionsBoat';
import SettingsIcon from '@material-ui/icons/Settings';
import SubscriptionsIcon from '@material-ui/icons/Subscriptions';
import Dashboard from './dashboard';
import AdcpTerminalView from './adcp_terminal';
import TabularDisplay from './tabular'
import MeasurementDisplay from './measurements'
import IntensityPlotDisplay from './intensity_plot'
import ContourPlotDisplay from './contour_plot'
import ShipTrackPlotDisplay from './shiptrack_plot'
import ConfigureDisplay from './configure'
import { HashRouter, Route, Link } from "react-router-dom";

const drawerWidth = 240;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
    },
    appBar: {
      zIndex: theme.zIndex.drawer + 1,
      transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
    },
    appBarShift: {
      marginLeft: drawerWidth,
      width: `calc(100% - ${drawerWidth}px)`,
      transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
    },
    menuButton: {
      marginRight: 36,
    },
    hide: {
      display: 'none',
    },
    drawer: {
      width: drawerWidth,
      flexShrink: 0,
      whiteSpace: 'nowrap',
    },
    drawerOpen: {
      width: drawerWidth,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
    },
    drawerClose: {
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      overflowX: 'hidden',
      width: theme.spacing(7) + 1,
      [theme.breakpoints.up('sm')]: {
        width: theme.spacing(9) + 1,
      },
    },
    toolbar: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: theme.spacing(0, 1),
      ...theme.mixins.toolbar,
    },
    content: {
      flexGrow: 1,
      padding: theme.spacing(3),
    },
  }),
);

export default function MiniDrawer() {
  const classes = useStyles();
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);

  const {ipcRenderer} = require('electron');

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  function ListItemLink(props: ListItemProps<'a', { button?: true }>) {
    return <ListItem button component="a" {...props} />;
  }

    /**
     * Button Click to Open the file dialog
     */
    const handleSelectFileClick = () => {
      ipcRenderer.send('open-file-dialog');
  }

  return (
    <div className={classes.root}>
      <CssBaseline />
      <AppBar
        position="fixed"
        className={clsx(classes.appBar, {
          [classes.appBarShift]: open,
        })}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            className={clsx(classes.menuButton, {
              [classes.hide]: open,
            })}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap>
            River - Rowe Technologies, Inc.
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        className={clsx(classes.drawer, {
          [classes.drawerOpen]: open,
          [classes.drawerClose]: !open,
        })}
        classes={{
          paper: clsx({
            [classes.drawerOpen]: open,
            [classes.drawerClose]: !open,
          }),
        }}
        open={open}
      >
        <div className={classes.toolbar}>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        
        </div>
        <Divider />

        <List>

          <ListItemLink href="#configure">
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Configure" />
          </ListItemLink>

          </List>

        <Divider />

        <List>
          <ListItemLink href="#adcp-terminal">
            <ListItemIcon>
              <SettingsInputHdmiIcon />
            </ListItemIcon>
            <ListItemText primary="ADCP Terminal" />
          </ListItemLink>

          <ListItemLink onClick={handleSelectFileClick}>
            <ListItemIcon>
              <SubscriptionsIcon />
            </ListItemIcon>
            <ListItemText primary="Playback" />
          </ListItemLink>

        </List>
        
        <Divider />

        <ListItemLink href="#">
            <ListItemIcon>
              <AppsIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemLink>

        <List>
          <ListItemLink href="#tabular">
            <ListItemIcon>
              <StorageIcon />
            </ListItemIcon>
            <ListItemText primary="Tabular" />
          </ListItemLink>

          <ListItemLink href="#contour">
            <ListItemIcon>
              <PanoramaIcon />
            </ListItemIcon>
            <ListItemText primary="Contour Plot" />
          </ListItemLink>

          <ListItemLink href="#profile">
            <ListItemIcon>
              <TimelineIcon />
            </ListItemIcon>
            <ListItemText primary="Amplitude Plot" />
          </ListItemLink>

          <ListItemLink href="#shiptrack">
            <ListItemIcon>
              <DirectionsBoatIcon />
            </ListItemIcon>
            <ListItemText primary="ShipTrack Plot" />
          </ListItemLink>


        </List>
      </Drawer>
      <main className={classes.content}>
        <div className={classes.toolbar} />
        <HashRouter>
          <div>
            <Route path="/" exact component={ Dashboard } />
            <Route path="/adcp-terminal"  component={ AdcpTerminalView } />
            <Route path="/tabular"  component={ TabularDisplay } />
            <Route path="/contour"  component={ ContourPlotDisplay } />
            <Route path="/shiptrack"  component={ ShipTrackPlotDisplay } />
            <Route path="/profile"  component={ IntensityPlotDisplay } />
            <Route path="/configure"  component={ ConfigureDisplay } />
          </div>
        </HashRouter>
      </main>
    </div>
  );
}
