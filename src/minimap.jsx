import React from "react";
import Api from "./api";
import { requestAnimationFrame, cancelAnimationFrame } from './request-animation-frame';
import { setRealViewPort, sendMouseWheel } from "./actions";
import store from "./store";

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
	}

	componentDidMount() {
		this.onResize();
		this.imageCtx = React.findDOMNode(this).children[0].getContext('2d');
		this.interactionCtx = React.findDOMNode(this).children[1].getContext('2d');
		window.addEventListener("resize", this.resizeListener);
		requestAnimationFrame(this.animationFrameListener);

		this.unsubscribe = store.subscribe(() =>
			this.setState(store.getState())
		);
	}

	shouldComponentUpdate(nextProps, nextState) {
		return this.state.width !== nextState.width || 
			this.state.height !== nextState.height ||
			this.props.config.identifier !== nextProps.config.identifier;
	}


	componentWillUnmount() {
		window.removeEventListener("resize", this.resizeListener);
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

		this.interactionCtx.fillStyle = "rgba(255,128,128,0.1)";
		this.interactionCtx.clearRect(0,0,this.state.width, this.state.height);
		this.interactionCtx.fillRect(
			Math.floor(this.state.realViewPort.x * this.state.width),
			Math.floor(this.state.realViewPort.y * this.state.height),
			Math.ceil(this.state.realViewPort.w * this.state.width),
			Math.ceil(this.state.realViewPort.h * this.state.height)
		);

		requestAnimationFrame(this.animationFrameListener);
	}

	onResize() {
		this.resizeDelay = RESIZE_DELAY;
	}

	commitResize() {
		this.resizing = false;
		this.resizeDelay = RESIZE_DELAY;
		let node = React.findDOMNode(this);
		this.setState({
			width: node.clientWidth,
			height: node.clientHeight
		}, this.afterResize.bind(this));
	}

	afterResize() {
		this.api.loadImage({
			viewport: {w: this.state.width, h: this.state.height},
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

	onMouseDown(ev) {
		this.mouseState = MOUSE_DOWN;
	}

	onMouseMove(ev) {
		if(this.mouseState === MOUSE_DOWN) {
			let me = React.findDOMNode(this);
			store.dispatch(setRealViewPort({
				x: (ev.pageX - me.offsetLeft) / this.state.width - (this.state.realViewPort.w / 2),
				y: (ev.pageY - me.offsetTop) / this.state.height - (this.state.realViewPort.h / 2),
				reposition: true
			}));
		}
	}

	onMouseUp(ev) {
		
		this.mouseState = MOUSE_UP;
		let me = React.findDOMNode(this);
		store.dispatch(setRealViewPort({
			x: (ev.pageX - me.offsetLeft) / this.state.width - (this.state.realViewPort.w / 2),
			y: (ev.pageY - me.offsetTop) / this.state.height - (this.state.realViewPort.h / 2),
			reposition: true
		}));		
	}

	onWheel(ev) {
		store.dispatch(sendMouseWheel({deltaY: ev.deltaY}));
	}

	render() {
		return (
			<div className="hire-djakota-minimap">
				<canvas className="image" height={this.state.height} width={this.state.width} />
				<canvas className="interaction" 
					height={this.state.height} 
					onMouseDown={this.onMouseDown.bind(this)} 
					onMouseMove={this.onMouseMove.bind(this)} 
					onMouseUp={this.onMouseUp.bind(this)} 
					onWheel={this.onWheel.bind(this)}
					width={this.state.width} />
			</div>
		);
	}
}

Minimap.propTypes = {
	config: React.PropTypes.object.isRequired,
	service: React.PropTypes.string.isRequired
};

export default Minimap;