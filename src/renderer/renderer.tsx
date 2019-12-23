/**
 * React renderer.
 */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import MiniDrawer from './menu'
import { MuiThemeProvider, createMuiTheme } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import pink from "@material-ui/core/colors/pink";
import blue from "@material-ui/core/colors/blue";

/**
 * Parameters for the display.
 */
type AppProps = {
  sidebarOpen: boolean
}

/**
 * State of the display
 */
type AppState = {
  sidebarOpen: boolean
}

class App extends React.Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);

    this.state = {
      sidebarOpen: true
    };

  }

  theme = createMuiTheme({
    palette: {
      primary: blue,
      secondary: {
        light: "#ff79b0",
        main: pink.A200,
        dark: "#c60055",
        contrastText: "#fff"
      }
    }
  });

  render() {
    return (
      
      <MuiThemeProvider theme={this.theme}>
        <CssBaseline />
        <MiniDrawer />
      </MuiThemeProvider>


    );
  }
}

ReactDOM.render(<App sidebarOpen={true} />, document.getElementById("app"));
