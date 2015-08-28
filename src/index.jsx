import React from "react";
import Api from "./api";
import { requestAnimationFrame, cancelAnimationFrame } from './request-animation-frame';

let fs = require("fs");
import insertCss from "insert-css";
let css = fs.readFileSync(__dirname + "/index.css");
insertCss(css, {prepend: true});

const MOUSE_UP = 0;
const MOUSE_DOWN = 1;

const TOUCH_END = 0
const TOUCH_START = 1;

const SUPPORTED_SCALE_MODES = [
	"heightFill",
	"widthFill",
	"fullZoom"
];

React.initializeTouchEvents(true)

class DjakotaClient extends React.Component {

	constructor(props) {
		super(props);
		this.api = new Api(this.props.service, this.props.config);	

		this.state = {
			width: null,
			height: null,
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

		this.resizeListener = this.onResize.bind(this);
		this.animationFrameListener = this.onAnimationFrame.bind(this);
		this.mousemoveListener = this.onMouseMove.bind(this);
		this.mouseupListener = this.onMouseUp.bind(this);
		this.frameBuffer = [];
		this.frameClearBuffer = [];
		this.clearTime = 0;
		this.touchmap = {startPos: false, positions: [], tapStart: 0, lastTap: 0, pinchDelta: 0, pinchDistance: 0};		
	}

	componentDidMount() {
		this.onResize();
		this.imageCtx = React.findDOMNode(this).children[0].getContext('2d');
		window.addEventListener("resize", this.resizeListener);
		window.addEventListener("mousemove", this.mousemoveListener);
		window.addEventListener("mouseup", this.mouseupListener);

		requestAnimationFrame(this.animationFrameListener);

	}

	componentWillUnmount() {
		window.removeEventListener("resize", this.resizeListener);
		window.removeEventListener("mousemove", this.mousemoveListener);
		window.removeEventListener("mouseup", this.mouseupListener);

		cancelAnimationFrame(this.animationFrameListener);
	}

	onAnimationFrame() {
		if(this.frameClearBuffer.length > 0 ||  this.frameBuffer.length === 0) {
			// trigger a redraw when window is cleared, but no new tiles in framebuffer
			this.loadImage({scale: this.scale, level: this.level});	
		}
		while(this.frameClearBuffer.length > 0) {
			this.imageCtx.clearRect(...this.frameClearBuffer.pop());
		}


		while(this.frameBuffer.length > 0) {
			this.imageCtx.drawImage(...this.frameBuffer.pop());
		}
		requestAnimationFrame(this.animationFrameListener);
	}

	onResize() {
		if(this.resizeDelay > 0) {
			this.resizeDelay--;
			window.setTimeout(this.onResize.bind(this), 10);
		} else {
			this.imagePos.x = 0;
			this.imagePos.y = 0;

			let node = React.findDOMNode(this);
			this.setState({
				width: node.clientWidth,
				height: node.clientHeight
			}, this.afterResize.bind(this));
			this.resizeDelay = 5;
		}
	}

	loadImage(opts = {scaleMode: this.props.scaleMode}) {
		this.clearTime = new Date().getTime() - 10;
		this.frameClearBuffer.push([0,0,this.state.width, this.state.height]);
		this.api.loadImage({
			viewport: {w: this.state.width, h: this.state.height},
			position: this.imagePos,
			onTile: this.renderTile.bind(this),
			onScale: this.zoom.bind(this),
			timeStamp: new Date().getTime(),
			...opts
		});
	}

	afterResize() {
		this.loadImage();
	}

	setScale(s, l) {
		this.scale = s;
		this.level = l;
	}

	setDimensions(w, h) {
		this.width = w;
		this.height = h;
	}

	renderTile(tileIm, tile) {
		if(tile.timeStamp >= this.clearTime) {
			this.frameBuffer.push([
				tileIm, 
				parseInt(Math.floor(tile.pos.x * this.scale)), 
				parseInt(Math.floor(tile.pos.y * this.scale)), 
				parseInt(Math.ceil(tileIm.width * this.scale)), 
				parseInt(Math.ceil(tileIm.height * this.scale))
			]);
		}

	}

	onMouseDown(ev) {
		this.mousePos.x = ev.clientX;
		this.mousePos.y = ev.clientY;
		this.movement = {x: 0, y:0};
		this.mouseState = MOUSE_DOWN;
	}

	onTouchStart(ev) {
		this.touchPos.x = ev.touches[0].pageX;
		this.touchPos.y = ev.touches[0].pageY;
		this.movement = {x: 0, y:0};
		this.touchState = TOUCH_START;
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

				this.frameBuffer = [];
				this.loadImage({scale: this.scale, level: this.level});

				break;
			case MOUSE_UP:
			default:
		}
	}

	onTouchMove(ev) {
		for (let i = 0; i < ev.touches.length; i++) {
			let cur = {x: ev.touches[i].pageX, y: ev.touches[i].pageY};
			this.touchmap.positions[i] = cur;
		}
		// TODO use TOUCH_STATE PINCH and TOUCH_STATE TOUCH
		if (ev.touches.length === 2) {
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
			if (this.touchmap.pinchDelta < 20 && this.touchmap.pinchDelta > -20) {
				let sHeur = 1.0 - (this.touchmap.pinchDelta * 0.005);
				this.api.zoomBy(sHeur, this.scale, this.level, this.zoom.bind(this));
			}
		} else {
			this.movement.x = this.touchPos.x - ev.touches[0].pageX;
			this.movement.y = this.touchPos.y - ev.touches[0].pageY;
			this.imagePos.x -= this.movement.x / this.scale;
			this.imagePos.y -= this.movement.y / this.scale;
			this.touchPos.x = ev.touches[0].pageX;
			this.touchPos.y = ev.touches[0].pageY;
			this.frameBuffer = [];
			this.loadImage({scale: this.scale, level: this.level});
		}
		ev.preventDefault();
		ev.stopPropagation();
	}

	onTouchEnd(ev) {
		this.touchState = TOUCH_END;
	}

	onMouseUp(ev) {
		this.mouseState = MOUSE_UP;
		this.loadImage({scale: this.scale, level: this.level});
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

	zoom(s, l, w, h) {
		let origX = this.imagePos.x * this.scale;
		let origY = this.imagePos.y * this.scale;
		let origW = this.width;
		let origH = this.height;

		this.setDimensions(w, h)
		this.setScale(s, l);


		if(origW === null || origH === null) { 
			this.center(w, h);
		} else {
			let diffX = Math.floor((origW - this.width) / 2);
			let diffY = Math.floor((origH - this.height) / 2);
			this.imagePos.x  = (origX + diffX) / this.scale;
			this.imagePos.y = (origY + diffY) / this.scale;
		}

		this.loadImage({scale: this.scale, level: this.level});
	}

	onWheel(ev) {
		if(ev.nativeEvent.deltaY < 0) {
			this.api.zoomBy(1.1, this.scale, this.level, this.zoom.bind(this));
		} else if(ev.nativeEvent.deltaY > 0) {
			this.api.zoomBy(0.9, this.scale, this.level, this.zoom.bind(this));
		}
	}

	render() {

		return (
			<div className="hire-djakota-client">
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
		)
	}
}

DjakotaClient.propTypes = {
	config: React.PropTypes.object.isRequired,
	scaleMode: function(props, propName, componentName) {
		if(SUPPORTED_SCALE_MODES.indexOf(props[propName]) < 0) {
			let msg = "Scale mode '" + props[propName] + "' not supported. Modes: " + SUPPORTED_SCALE_MODES.join(", ");
			props[propName] = "heightFill";
			return new Error(msg);
		}
	},
	service: React.PropTypes.string.isRequired
};

DjakotaClient.defaultProps = {
	scaleMode: "heightFill"
};

export default DjakotaClient;