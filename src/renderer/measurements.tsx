import * as React from "react";

type MeasurementDisplayProps = {
  msg: string
}

export class MeasurementDisplay extends React.Component<MeasurementDisplayProps> {
  static defaultProps = {
    msg: 'Hello everyone!'
  }

  render() {
    return <div>
                <h1>Measurements</h1> 
                <p>{ this.props.msg }</p>
            </div>
    }
}