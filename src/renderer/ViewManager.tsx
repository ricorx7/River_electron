import React, { Component } from 'react'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import Dashboard from './dashboard'
import AdcpTerminalView from './adcp_terminal'


class ViewManager extends Component {

    //static Views() {
    //    return {
    //        viewA: <Dashboard /> ,
    //        viewB: <AdcpTerminalView.AdcpTerminalView />
    //    }
    //}

    /**
     * List of all the views available.
     */
    static ViewMap: { [key: string]: any } = {
        viewDash: <Dashboard />,
        viewAdcpTerm: <AdcpTerminalView />,
    };

    static View(props: Window) {

        let name = props.location.search.substr(1);
        let view = ViewManager.ViewMap[name];

        if (view == null)
        {
            throw new Error("View " + name + "is undefined");
            return view;
        }
    }

    render() {
        return ( 
        <Router >
            <div >
                <Route path = '/' component={ViewManager.View} /> 
            </div> 
        </Router>
        );
    }
}
    export default ViewManager