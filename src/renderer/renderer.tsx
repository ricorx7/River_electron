/**
 * React renderer.
 */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import MiniDrawer from './menu'

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


  render() {
    return (
      <div>
        <MiniDrawer />
      </div>

    );
  }
}

ReactDOM.render(<App sidebarOpen={true} />, document.getElementById("app"));
