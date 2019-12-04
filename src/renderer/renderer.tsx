/**
 * React renderer.
 */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Dashboard from './dashboard';
import AdcpTerminalView from './adcp_terminal';
import { HashRouter, Route, Link } from "react-router-dom";
import MainSidebar from './mainsidebar'

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


        <HashRouter>
          <MainSidebar sidebarOpen={false} />

          <div>
            <Route path="/" exact component={ Dashboard } />
            <Route path="/adcp-terminal"  component={ AdcpTerminalView } />
          </div>
        </HashRouter>
      </div>

    );
  }
}

ReactDOM.render(<App sidebarOpen={true} />, document.getElementById("app"));

//ReactDOM.render(
//  <div className='app'>
//    <HashRouter>
//      <div>
//        <Route path="/" exact component={ Dashboard } />
//        <Route path="/adcp-terminal"  component={ AdcpTerminalView } />
//      </div>
//    </HashRouter>
//  </div>,
//  document.getElementById('app')
//);

