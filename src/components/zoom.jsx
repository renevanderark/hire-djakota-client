import React from "react";
import { setRealViewPort } from "../api/actions";

import store from "../api/store";

const MOUSE_UP = 0;
const MOUSE_DOWN = 1;

class Zoom extends React.Component {

	constructor(props) {
		super(props);
		this.state = store.getState();
		this.mouseupListener = this.onMouseUp.bind(this);

	}

	componentDidMount() {
		window.addEventListener("mouseup", this.mouseupListener);

		this.unsubscribe = store.subscribe(() =>
			this.setState(store.getState())
		);
	}


	componentWillUnmount() {
		window.addEventListener("mouseup", this.mouseupListener);

		this.unsubscribe();
	}

	onMouseDown(ev) {
		this.mouseState = MOUSE_DOWN;
	}

	dispatchRealScale(ev) {
		let rect = React.findDOMNode(ev.target).getBoundingClientRect();
		if(rect.width > 0 && !this.state.realViewPort.applyZoom) {
			store.dispatch(setRealViewPort({
				zoom: ((ev.pageX - rect.left) / rect.width) * 2,
				applyZoom: true
			}));
		}

	}


	onMouseMove(ev) {
		if(this.mouseState === MOUSE_DOWN) {
			this.dispatchRealScale(ev);
			return ev.preventDefault();
		}
	}

	onMouseUp(ev) {
		if(this.mouseState === MOUSE_DOWN) {
			this.dispatchRealScale(ev);
		}
		this.mouseState = MOUSE_UP;
	}

	renderInteractionBar() {
		this.renderedInteractionBar = this.renderedInteractionBar ||
			(<svg
				fill={this.props.fill}
				height="12"
				onMouseDown={this.onMouseDown.bind(this)} 
				onMouseMove={this.onMouseMove.bind(this)} 
				stroke={this.props.stroke}
				style={{cursor: "pointer", position: "relative", top: "-19px"}}
				viewBox="0 0 210 12"
				width="210">
				<path d="M1 0 L 1 12 Z" fill="transparent"   />
				<path d="M209 0 L 209 12 Z" fill="transparent"  />
				<path d="M0 6 L 210 6 Z" fill="transparent"  />
			</svg>);
		return this.renderedInteractionBar;
	}

	render() {
		let zoom = parseInt(this.state.realViewPort.zoom * 100)
		return (
			<span>
				<label>{zoom}%</label>
				<svg
					fill={this.props.fill}
					height="12"
					viewBox="0 0 210 12"
					width="210">
						<circle	cx={zoom > 200 ? 204 : zoom + 4} cy="6" fillOpacity=".8" r="4"  />
				</svg>
				{this.renderInteractionBar()}
			</span>
		)
	}
}

Zoom.propTypes = {
	fill: React.PropTypes.string,
	stroke: React.PropTypes.string
};

Zoom.defaultProps = {
	fill: "rgba(0,0,0, 0.7)",
	stroke: "rgba(0,0,0, 1)",
};

export default Zoom;