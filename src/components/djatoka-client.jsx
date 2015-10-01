import React from "react";
import Api from "../api/api";
import { setRealViewPort, sendMouseWheel, setFill } from "../api/actions";
import store from "../api/store";
import { requestAnimationFrame, cancelAnimationFrame } from "../util/request-animation-frame";

const MOUSE_UP = 0;
const MOUSE_DOWN = 1;

const TOUCH_END = 0;
const TOUCH_START = 1;
const TOUCH_PINCH = 2;

const RESIZE_DELAY = 5;

const SUPPORTED_SCALE_MODES = [
	"heightFill",
	"widthFill",
	"autoFill",
	"fullZoom"
];


class DjatokaClient extends React.Component {

	constructor(props) {
		super(props);
		this.api = new Api(this.props.service, this.props.config);

		this.state = {
			width: null,
			height: null
		};

		this.movement = {x: 0, y: 0};
		this.touchPos = {x: 0, y: 0};
		this.mousePos = {x: 0, y: 0};
		this.imagePos = {x: 0, y: 0};
		this.mouseState = MOUSE_UP;
		this.imageCtx = null;
		this.resizeDelay = 0;
		this.scale = 1.0;
		this.level = null;
		this.width = null;
		this.height = null;
		this.focalPoint = null;
		this.abortAnimationFrame = false;
		this.resizeListener = this.onResize.bind(this);
		this.animationFrameListener = this.onAnimationFrame.bind(this);
		this.mousemoveListener = this.onMouseMove.bind(this);
		this.mouseupListener = this.onMouseUp.bind(this);
		this.frameBuffer = [];
		this.repaintDelay = -1;
		this.touchmap = {startPos: false, positions: [], tapStart: 0, lastTap: 0, pinchDelta: 0, pinchDistance: 0};
	}

	componentDidMount() {
		this.abortAnimationFrame = false;
		this.commitResize();
		this.imageCtx = React.findDOMNode(this).children[0].getContext("2d");
		window.addEventListener("resize", this.resizeListener);
		window.addEventListener("mousemove", this.mousemoveListener);
		window.addEventListener("mouseup", this.mouseupListener);

		this.unsubscribe = store.subscribe(() =>
			this.setState(store.getState(), this.receiveNewState.bind(this))
		);
		requestAnimationFrame(this.animationFrameListener);
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
		this.unsubscribe();
		this.abortAnimationFrame = true;
		cancelAnimationFrame(this.animationFrameListener);
	}


	notifyRealImagePos() {
		let zoom = this.api.getRealScale(this.scale, this.level);
		let dims = this.api.getRealImagePos(this.imagePos, this.scale, this.level);
		store.dispatch(setRealViewPort({
			x: -dims.x / dims.w,
			y: -dims.y / dims.h,
			w: this.state.width / dims.w,
			h: this.state.height / dims.h,
			zoom: zoom,
			reposition: false,
			applyZoom: false
		}));
	}

	receiveNewState() {
		if(this.state.realViewPort.reposition) {
			let {w, h} = this.api.getRealImagePos(this.imagePos, this.scale, this.level);
			this.imagePos.x = -(w * this.state.realViewPort.x / this.scale);
			this.imagePos.y = -(h * this.state.realViewPort.y / this.scale);
			this.correctBounds();
			this.loadImage({scale: this.scale, level: this.level});
		}

		if(this.state.realViewPort.applyZoom) {
			this.focalPoint = null;
			this.api.zoomTo(this.state.realViewPort.zoom, this.zoom.bind(this));
		}


		if(this.state.mousewheel) {
			this.focalPoint = null;
			store.dispatch(sendMouseWheel(false));
			this.api.zoomBy(this.determineZoomFactor(this.state.mousewheel.deltaY), this.scale, this.level, this.zoom.bind(this));
		}

		if(this.state.fillMode) {
			store.dispatch(setFill(false));
			this.imagePos.x = 0;
			this.imagePos.y = 0;
			this.loadImage({scaleMode: this.state.fillMode});
		}
	}

	onAnimationFrame() {
		if(this.frameBuffer.length) {
			this.imageCtx.clearRect(0, 0, this.state.width, this.state.height);
			for(let i = 0; i < this.frameBuffer.length; i++) {
				let tileIm = this.frameBuffer[i][0];
				let tile = this.frameBuffer[i][1];
				this.imageCtx.drawImage(
					tileIm,
					parseInt(Math.floor((tile.pos.x + this.imagePos.x) * this.scale)),
					parseInt(Math.floor((tile.pos.y + this.imagePos.y) * this.scale)),
					parseInt(Math.ceil(tileIm.width * this.scale)),
					parseInt(Math.ceil(tileIm.height * this.scale))
				);
			}
			if(this.frameBuffer.filter((x) => x[0].complete && x[0].height > 0 && x[0].width > 0).length === this.frameBuffer.length) {
				this.frameBuffer = [];
			}
		}

		if(this.resizeDelay === 0) {
			this.commitResize();
			this.resizeDelay = -1;
		} else if(this.resizeDelay > 0) {
			this.resizeDelay -= 1;
		}
		if(!this.abortAnimationFrame) {	requestAnimationFrame(this.animationFrameListener); }
	}

	onResize() {
		this.resizeDelay = RESIZE_DELAY;
	}

	commitResize() {
		this.resizeDelay = RESIZE_DELAY;
		this.imagePos.x = 0;
		this.imagePos.y = 0;
		this.width = null;
		this.height = null;
		let node = React.findDOMNode(this);
		this.setState({
			width: node.clientWidth,
			height: node.clientHeight
		}, this.loadImage.bind(this));
	}

	loadImage(opts = {scaleMode: this.props.scaleMode}) {
		this.notifyRealImagePos();
		this.frameBuffer = this.api.loadImage({
			viewport: {w: this.state.width, h: this.state.height},
			position: this.imagePos,
			onScale: this.onDimensions.bind(this),
			...opts
		});
	}

	setScale(s, l) {
		this.scale = s;
		this.level = l;
	}

	setDimensions(w, h) {
		this.width = w;
		this.height = h;
	}


	onMouseDown(ev) {
		this.mousePos.x = ev.clientX;
		this.mousePos.y = ev.clientY;
		this.movement = {x: 0, y: 0};
		this.mouseState = MOUSE_DOWN;
	}

	onTouchStart(ev) {
		if(ev.touches.length > 1) {
			this.touchState = TOUCH_PINCH;
		} else {
			this.touchPos.x = ev.touches[0].pageX;
			this.touchPos.y = ev.touches[0].pageY;
			this.movement = {x: 0, y: 0};
			this.touchState = TOUCH_START;
		}
	}

	onMouseMove(ev) {
		switch(this.mouseState) {
			case MOUSE_DOWN:
				this.movement.x = this.mousePos.x - ev.clientX;
				this.movement.y = this.mousePos.y - ev.clientY;
				this.imagePos.x -= this.movement.x / this.scale;
				this.imagePos.y -= this.movement.y / this.scale;
				this.mousePos.x = ev.clientX;
				this.mousePos.y = ev.clientY;
				this.correctBounds();
				this.loadImage({scale: this.scale, level: this.level});
				return ev.preventDefault();
			case MOUSE_UP:
				let rect = React.findDOMNode(this).getBoundingClientRect();
				this.focalPoint = {
					x: ev.clientX - rect.left,
					y: ev.clientY - rect.top
				};
				break;
			default:
		}
	}

	onTouchMove(ev) {
		for (let i = 0; i < ev.touches.length; i++) {
			let cur = {x: ev.touches[i].pageX, y: ev.touches[i].pageY};
			this.touchmap.positions[i] = cur;
		}
		if (ev.touches.length === 2 && this.touchState === TOUCH_PINCH) {
			let oldD = this.touchmap.pinchDistance;
			this.touchmap.pinchDistance = parseInt(Math.sqrt(
				(
					(this.touchmap.positions[0].x - this.touchmap.positions[1].x) *
					(this.touchmap.positions[0].x - this.touchmap.positions[1].x)
				) + (
					(this.touchmap.positions[0].y - this.touchmap.positions[1].y) *
					(this.touchmap.positions[0].y - this.touchmap.positions[1].y)
				)
			), 10);
			this.touchmap.pinchDelta = oldD - this.touchmap.pinchDistance;
			if (this.touchmap.pinchDelta < 60 && this.touchmap.pinchDelta > -60) {
				this.api.zoomBy(this.determineZoomFactor(this.touchmap.pinchDelta), this.scale, this.level, this.zoom.bind(this));
			}
		} else if(this.touchState === TOUCH_START) {
			this.movement.x = this.touchPos.x - ev.touches[0].pageX;
			this.movement.y = this.touchPos.y - ev.touches[0].pageY;
			this.imagePos.x -= this.movement.x / this.scale;
			this.imagePos.y -= this.movement.y / this.scale;
			this.touchPos.x = ev.touches[0].pageX;
			this.touchPos.y = ev.touches[0].pageY;
			this.correctBounds();
			this.loadImage({scale: this.scale, level: this.level});
		}
		ev.preventDefault();
		ev.stopPropagation();
	}

	onTouchEnd() {
		this.touchState = TOUCH_END;
	}

	onMouseUp() {
		if(this.mouseState === MOUSE_DOWN) {
			this.loadImage({scale: this.scale, level: this.level});
		}
		this.mouseState = MOUSE_UP;
	}

	center(w, h) {
		if(w > this.state.width) {
			this.imagePos.x = -parseInt((w - this.state.width) / 2) / this.scale;
		} else if(w < this.state.width) {
			this.imagePos.x = parseInt((this.state.width - w) / 2) / this.scale;
		}

		if(h > this.state.height) {
			this.imagePos.y = -parseInt((h - this.state.height) / 2) / this.scale;
		} else if(h < this.state.width) {
			this.imagePos.y = parseInt((this.state.height - h) / 2) / this.scale;
		}
	}

	correctBounds() {
		if(this.state.freeMovement) { return; }
		if(this.width <= this.state.width) {
			if(this.imagePos.x < 0) { this.imagePos.x = 0; }
			if(this.imagePos.x * this.scale + this.width > this.state.width) { this.imagePos.x = (this.state.width - this.width) / this.scale; }
		} else if(this.width > this.state.width) {
			if(this.imagePos.x > 0) { this.imagePos.x = 0; }
			if(this.imagePos.x * this.scale + this.width < this.state.width) { this.imagePos.x = (this.state.width - this.width) / this.scale; }
		}

		if(this.height <= this.state.height) {
			if(this.imagePos.y < 0) { this.imagePos.y = 0; }
			if(this.imagePos.y * this.scale + this.height > this.state.height) { this.imagePos.y = (this.state.height - this.height) / this.scale; }
		} else if(this.height > this.state.height) {
			if(this.imagePos.y > 0) { this.imagePos.y = 0; }
			if(this.imagePos.y * this.scale + this.height < this.state.height) { this.imagePos.y = (this.state.height - this.height) / this.scale; }
		}

	}

	onDimensions(s, l, w, h) {
		this.setDimensions(w, h);
		this.setScale(s, l);
		this.center(w, h);
		this.notifyRealImagePos();
	}

	zoom(s, l, w, h) {
		let focalPoint = this.focalPoint || {
			x: this.state.width / 2,
			y: this.state.height / 2
		};

		let dX = (focalPoint.x - (this.imagePos.x * this.scale)) / this.width;
		let dY = (focalPoint.y - (this.imagePos.y * this.scale)) / this.height;

		this.setDimensions(w, h);
		this.setScale(s, l);

		if(this.width === null || this.height === null) {
			this.center(w, h);
		} else {
			this.imagePos.x = (focalPoint.x - (dX * this.width)) / this.scale;
			this.imagePos.y = (focalPoint.y - (dY * this.height)) / this.scale;
			this.correctBounds();
		}
		this.loadImage({scale: this.scale, level: this.level});
	}

	determineZoomFactor(delta) {
		let rev = delta > 0 ? -1 : 1;
		let rs = this.api.getRealScale(this.scale, this.level);
		if(rs >= 0.6) { return 0.04 * rev; }
		else if(rs >= 0.3) { return 0.02 * rev; }
		else if(rs >= 0.1) { return 0.01 * rev; }
		else if(rs >= 0.05) { return 0.005 * rev; }
		else { return 0.0025 * rev; }
	}

	onWheel(ev) {
		this.api.zoomBy(this.determineZoomFactor(ev.nativeEvent.deltaY), this.scale, this.level, this.zoom.bind(this));

		return ev.preventDefault();
	}

	render() {
		return (
			<div className="hire-djatoka-client">
				<canvas
					className="image"
					height={this.state.height}
					width={this.state.width}
					/>
				<canvas
					className="interaction"
					height={this.state.height}
					onMouseDown={this.onMouseDown.bind(this)}
					onTouchEnd={this.onTouchEnd.bind(this)}
					onTouchMove={this.onTouchMove.bind(this)}
					onTouchStart={this.onTouchStart.bind(this)}
					onWheel={this.onWheel.bind(this)}
					width={this.state.width}
					/>
			</div>
		);
	}
}

DjatokaClient.propTypes = {
	config: React.PropTypes.object.isRequired,
	scaleMode: function(props, propName) {
		if(SUPPORTED_SCALE_MODES.indexOf(props[propName]) < 0) {
			let msg = "Scale mode '" + props[propName] + "' not supported. Modes: " + SUPPORTED_SCALE_MODES.join(", ");
			props[propName] = "heightFill";
			return new Error(msg);
		}
	},
	service: React.PropTypes.string.isRequired
};

DjatokaClient.defaultProps = {
	scaleMode: "autoFill"
};

export default DjatokaClient;