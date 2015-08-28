import React from "react";
import Api from "./api";
import { requestAnimationFrame, cancelAnimationFrame } from './request-animation-frame';
import { setRealViewPort } from "./actions";
import store from "./store";

const RESIZE_DELAY = 5;


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
		this.resizeDelay = 0;
	}

	componentDidMount() {
		this.onResize();
		this.imageCtx = React.findDOMNode(this).children[0].getContext('2d');
		window.addEventListener("resize", this.resizeListener);
		requestAnimationFrame(this.animationFrameListener);

		this.unsubscribe = store.subscribe(() =>
			this.setSharedState(store.getState())
		);

	}


	componentWillUnmount() {
		window.removeEventListener("resize", this.resizeListener);
		cancelAnimationFrame(this.animationFrameListener);
		this.unsubscribe();
	}

	setSharedState(state) {
		console.log(state);
	}

	onAnimationFrame() {
		if(this.resizeDelay === 0 && this.resizing) {
			this.commitResize();
		} else if(this.resizeDelay > 0) {
			this.resizeDelay--;
		}
		requestAnimationFrame(this.animationFrameListener);
	}

	onResize() {
		this.resizeDelay = RESIZE_DELAY;
		this.resizing = true;
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
			position: this.imagePos,
			onTile: this.renderTile.bind(this),
			onScale: this.setScale.bind(this),
			scaleMode: "autoFill",
			position: {x: 0, y: 0}
		});
	}

	setScale(s, l) {
		this.scale = s;
		this.level = l;
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

	onClick(ev) {
		let me = React.findDOMNode(this);
		console.log(me);
		console.log((ev.pageX - me.offsetLeft) / this.state.width, (ev.pageY - me.offsetTop) / this.state.height)
		store.dispatch(setRealViewPort({
			x: (ev.pageX - me.offsetLeft) / this.state.width,
			y: (ev.pageY - me.offsetTop) / this.state.height
		}));
	}

	render() {
		return (
			<div className="hire-djakota-minimap">
				<canvas className="image" height={this.state.height} width={this.state.width} />
				<canvas className="interaction"  height={this.state.height} onClick={this.onClick.bind(this)} width={this.state.width} />
			</div>
		);
	}
}

Minimap.propTypes = {
	config: React.PropTypes.object.isRequired,
	service: React.PropTypes.string.isRequired
};

export default Minimap;