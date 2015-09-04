import React from "react";
import Api from "../api/api";
import { setRealViewPort, sendMouseWheel } from "../api/actions";
import store from "../api/store";
import { requestAnimationFrame, cancelAnimationFrame } from '../util/request-animation-frame';

const RESIZE_DELAY = 5;


const MOUSE_UP = 0;
const MOUSE_DOWN = 1;

class Minimap extends React.Component {
	constructor(props) {
		super(props);
		this.api = new Api(this.props.service, this.props.config);

		this.state = {
			width: null,
			height: null,
		};

		this.resizeListener = this.onResize.bind(this);
		this.animationFrameListener = this.onAnimationFrame.bind(this);

		this.imageCtx = null;
		this.interactionCtx = null;
		this.resizeDelay = -1;
		this.mouseState = MOUSE_UP;
		this.mousemoveListener = this.onMouseMove.bind(this);
		this.mouseupListener = this.onMouseUp.bind(this);

	}

	componentDidMount() {
		this.onResize();
		this.imageCtx = React.findDOMNode(this).children[0].getContext('2d');
		this.interactionCtx = React.findDOMNode(this).children[1].getContext('2d');
		window.addEventListener("resize", this.resizeListener);
		window.addEventListener("mousemove", this.mousemoveListener);
		window.addEventListener("mouseup", this.mouseupListener);
		requestAnimationFrame(this.animationFrameListener);

		this.unsubscribe = store.subscribe(() =>
			this.setState(store.getState())
		);
	}

	componentWillReceiveProps(nextProps) {
		if(nextProps.config.identifier !== this.props.config.identifier) {
			this.api = new Api(this.props.service, nextProps.config);
			this.commitResize();
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		return this.state.width !== nextState.width || 
			this.state.height !== nextState.height ||
			this.props.config.identifier !== nextProps.config.identifier;
	}


	componentWillUnmount() {
		window.removeEventListener("resize", this.resizeListener);
		window.removeEventListener("mousemove", this.mousemoveListener);
		window.removeEventListener("mouseup", this.mouseupListener);
		cancelAnimationFrame(this.animationFrameListener);
		this.unsubscribe();
	}


	onAnimationFrame() {
		if(this.resizeDelay === 0) {
			this.commitResize();
			this.resizeDelay = -1;
		} else if(this.resizeDelay > 0) {
			this.resizeDelay--;
		}

		this.interactionCtx.strokeStyle = this.props.rectStroke;
		this.interactionCtx.fillStyle = this.props.rectFill;
		this.interactionCtx.clearRect(0,0,this.state.width, this.state.height);
		this.interactionCtx.fillRect(
			Math.floor(this.state.realViewPort.x * this.state.width),
			Math.floor(this.state.realViewPort.y * this.state.height),
			Math.ceil(this.state.realViewPort.w * this.state.width),
			Math.ceil(this.state.realViewPort.h * this.state.height)
		);

		this.interactionCtx.beginPath();
		this.interactionCtx.rect(
			Math.floor(this.state.realViewPort.x * this.state.width),
			Math.floor(this.state.realViewPort.y * this.state.height),
			Math.ceil(this.state.realViewPort.w * this.state.width),
			Math.ceil(this.state.realViewPort.h * this.state.height)
		);
		this.interactionCtx.stroke();

		requestAnimationFrame(this.animationFrameListener);
	}

	onResize() {
		this.resizeDelay = RESIZE_DELAY;
	}

	commitResize() {
		this.resizing = false;
		this.resizeDelay = RESIZE_DELAY;
		let node = React.findDOMNode(this);
		this.api.loadImage({
			viewport: {w: node.clientWidth, h: node.clientHeight},
			onTile: this.renderTile.bind(this),
			onScale: this.setScale.bind(this),
			scaleMode: "autoFill",
			position: {x: 0, y: 0}
		});
	}

	setScale(s, l) {
		this.scale = s;
		this.level = l;
		let dims = this.api.getRealImagePos({x:0,y:0}, this.scale, this.level);
		this.setState({width: dims.w, height: dims.h});
	}

	renderTile(tileIm, tile) {
		this.imageCtx.drawImage(...[
			tileIm, 
			parseInt(Math.floor(tile.pos.x * this.scale)), 
			parseInt(Math.floor(tile.pos.y * this.scale)), 
			parseInt(Math.ceil(tileIm.width * this.scale)), 
			parseInt(Math.ceil(tileIm.height * this.scale))
		]);
	}

	dispatchReposition(ev) {
		let rect = React.findDOMNode(this).getBoundingClientRect();
		store.dispatch(setRealViewPort({
			x: (ev.pageX - rect.left) / this.state.width - (this.state.realViewPort.w / 2),
			y: (ev.pageY - rect.top) / this.state.height - (this.state.realViewPort.h / 2),
			reposition: true
		}));
	}

	onMouseDown(ev) {
		this.mouseState = MOUSE_DOWN;
	}

	onMouseMove(ev) {
		if(this.mouseState === MOUSE_DOWN) {
			this.dispatchReposition(ev);
			return ev.preventDefault();
		}
	}

	onMouseUp(ev) {
		if(this.mouseState === MOUSE_DOWN) {
			this.dispatchReposition(ev);
		}
		this.mouseState = MOUSE_UP;
	}

	onWheel(ev) {
		store.dispatch(sendMouseWheel({deltaY: ev.deltaY}));
		return ev.preventDefault();
	}

	onTouchEnd(ev) {
		this.dispatchReposition({pageX: ev.touches[0].pageX, pageY: ev.touches[0].pageY});
	}

	render() {
		return (
			<div className="hire-djakota-minimap">
				<canvas className="image" height={this.state.height} width={this.state.width} />
				<canvas className="interaction" 
					height={this.state.height} 
					onMouseDown={this.onMouseDown.bind(this)} 
					onTouchEnd={this.onTouchEnd.bind(this)}
					onWheel={this.onWheel.bind(this)}
					width={this.state.width} />
			</div>
		);
	}
}

Minimap.propTypes = {
	config: React.PropTypes.object.isRequired,
	rectFill: React.PropTypes.string,
	rectStroke: React.PropTypes.string,
	service: React.PropTypes.string.isRequired
};

Minimap.defaultProps = {
	rectFill: "rgba(128,128,255,0.1)",
	rectStroke: "rgba(189,164,126,0.3)"
}

export default Minimap;