import React from "react";
import { setRealViewPort, sendMouseWheel } from "../api/actions";

import store from "../api/store";

const MOUSE_UP = 0;
const MOUSE_DOWN = 1;

class Zoom extends React.Component {

	constructor(props) {
		super(props);
		this.state = store.getState();
		this.mouseupListener = this.onMouseUp.bind(this);
		this.mousemoveListener = this.onMouseMove.bind(this);

	}

	componentDidMount() {
		window.addEventListener("mouseup", this.mouseupListener);
		window.addEventListener("mousemove", this.mousemoveListener);

		this.unsubscribe = store.subscribe(() =>
			this.setState(store.getState())
		);
	}


	componentWillUnmount() {
		window.addEventListener("mouseup", this.mouseupListener);
		window.removeEventListener("mousemove", this.mousemoveListener);

		this.unsubscribe();
	}

	onMouseDown(ev) {
		this.mouseState = MOUSE_DOWN;
	}

	dispatchRealScale(ev) {
		let rect = React.findDOMNode(this).children[2].getBoundingClientRect();
		if(rect.width > 0 && !this.state.realViewPort.applyZoom) {
			let zoom = ((ev.pageX - rect.left) / rect.width) * 2;
			if(zoom >= 0.01 && zoom <= 2.0) {
				store.dispatch(setRealViewPort({
					zoom: zoom,
					applyZoom: true
				}));
			}
		}

	}

	onWheel(ev) {
		store.dispatch(sendMouseWheel({deltaY: ev.deltaY}));
		return ev.preventDefault();
	}

	onMouseMove(ev) {
		if(this.mouseState === MOUSE_DOWN) {
			this.dispatchRealScale(ev);
			return ev.preventDefault();
		}
	}

	onMouseUp(ev) {
		this.mouseState = MOUSE_UP;
	}

	renderInteractionBar() {
		this.renderedInteractionBar = this.renderedInteractionBar ||
			(<svg
				fill={this.props.fill}
				height="12"
				onMouseDown={this.onMouseDown.bind(this)}
				stroke={this.props.stroke}
				style={{cursor: "pointer", position: "absolute"}}
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
			<span onWheel={this.onWheel.bind(this)}>
				<label style={{display: "inline-block", width: "80px", textAlign: "right"}}>{zoom}%</label>
				<svg
					fill={this.props.fill}
					height="12"
					style={{position: "absolute"}}
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