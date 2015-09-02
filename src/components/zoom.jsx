import React from "react";
import store from "../api/store";

class Zoom extends React.Component {

	constructor(props) {
		super(props);
		this.state = store.getState();
	}

	componentDidMount() {
		this.unsubscribe = store.subscribe(() =>
			this.setState(store.getState())
		);
	}

	componentWillUnmount() {
		this.unsubscribe();
	}

	render() {

		return (
			<label>{parseInt(this.state.realViewPort.zoom * 100)}%</label>
		)
	}
}

export default Zoom;