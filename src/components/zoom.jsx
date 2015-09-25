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
		this.touchMoveListener = this.onTouchMove.bind(this);
	}

	componentDidMount() {
		window.addEventListener("mouseup", this.mouseupListener);
		window.addEventListener("mousemove", this.mousemoveListener);
		window.addEventListener("touchend", this.mouseupListener);
		window.addEventListener("touchmove", this.touchMoveListener);
		this.unsubscribe = store.subscribe(() =>
			this.setState(store.getState())
		);
	}


	componentWillUnmount() {
		window.removeEventListener("mouseup", this.mouseupListener);
		window.removeEventListener("mousemove", this.mousemoveListener);
		window.removeEventListener("touchend", this.mouseupListener);
		window.removeEventListener("touchmove", this.touchMoveListener);
		this.unsubscribe();
	}


	dispatchRealScale(pageX) {
		let rect = React.findDOMNode(this).children[0].getBoundingClientRect();
		if(rect.width > 0 && !this.state.realViewPort.applyZoom) {
			let zoom = ((pageX - rect.left) / rect.width) * 2;
			if(zoom < 0.01) { zoom = 0.01; }
			else if(zoom > 2.0) { zoom = 2.0; }
			store.dispatch(setRealViewPort({
				zoom: zoom,
				applyZoom: true
			}));
		}

	}
	onMouseDown(ev) {
		this.mouseState = MOUSE_DOWN;
		this.dispatchRealScale(ev.pageX);
	}

	onTouchStart(ev) {
		this.mouseState = MOUSE_DOWN;
		this.dispatchRealScale(ev.touches[0].pageX);
		return ev.preventDefault();
	}


	onMouseMove(ev) {
		if(this.mouseState === MOUSE_DOWN) {
			this.dispatchRealScale(ev.pageX);
			return ev.preventDefault();
		}
	}

	onTouchMove(ev) {
		if(this.mouseState === MOUSE_DOWN) {
			this.dispatchRealScale(ev.touches[0].pageX);
			return ev.preventDefault();
		}
	}

	onMouseUp() {
		this.mouseState = MOUSE_UP;
	}

	onWheel(ev) {
		store.dispatch(sendMouseWheel({deltaY: ev.deltaY}));
		return ev.preventDefault();
	}
	render() {
		let zoom = parseInt(this.state.realViewPort.zoom * 100);
		return (
			<span className="hire-zoom-bar" onWheel={this.onWheel.bind(this)}>
				<svg
					onMouseDown={this.onMouseDown.bind(this)}
					onTouchStart={this.onTouchStart.bind(this)}
					viewBox="-12 0 224 24">
						<path d="M0 12 L 200 12 Z" />
						<circle	cx={zoom > 200 ? 200 : zoom} cy="12" r="12" />
				</svg>
				<label>{zoom}%</label>
			</span>
		);
	}
}

Zoom.propTypes = {
	fill: React.PropTypes.string,
	stroke: React.PropTypes.string
};

Zoom.defaultProps = {
	fill: "rgba(0,0,0, 0.7)",
	stroke: "rgba(0,0,0, 1)"
};

export default Zoom;