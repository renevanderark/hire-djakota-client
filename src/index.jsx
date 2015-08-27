import React from "react";
import Api from "./api";
import { requestAnimationFrame, cancelAnimationFrame } from './request-animation-frame';

let fs = require("fs");
import insertCss from "insert-css";
let css = fs.readFileSync(__dirname + "/index.css");
insertCss(css, {prepend: true});

const MOUSE_UP = 0;
const MOUSE_DOWN = 1;
class DjakotaClient extends React.Component {

	constructor(props) {
		super(props);
		this.api = new Api(this.props.service, this.props.config);	

		this.state = {
			width: null,
			height: null,
		};

		this.movement = {x: 0, y:0};
		this.mousePos = {x: 0, y: 0};
		this.imagePos = {x: 0, y: 0};
		this.mouseState = MOUSE_UP;
		this.imageCtx = null;
		this.resizeDelay = 0;
		this.scale = 1.0;
		this.level = null;

		this.resizeListener = this.onResize.bind(this);
		this.animationFrameListener = this.onAnimationFrame.bind(this);
		this.mousemoveListener = this.onMouseMove.bind(this);
		this.mouseupListener = this.onMouseUp.bind(this);
		this.frameBuffer = [];
		this.frameClearBuffer = [];
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

	loadImage(opts = {scaleMode: "widthFill"}) {
		this.frameClearBuffer.push([0,0,this.state.width, this.state.height]);
		this.api.loadImage({
			viewport: {w: this.state.width, h: this.state.height},
			position: this.imagePos,
			onTile: this.renderTile.bind(this),
			onScale: this.setScale.bind(this),
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

	renderTile(tileIm, tile) {
		this.frameBuffer.push([
			tileIm, 
			parseInt(Math.floor(tile.pos.x * this.scale)), 
			parseInt(Math.floor(tile.pos.y * this.scale)), 
			parseInt(Math.ceil(tileIm.width * this.scale)), 
			parseInt(Math.ceil(tileIm.height * this.scale))
		]);


	}

	onMouseDown(ev) {
		this.mousePos.x = ev.clientX;
		this.mousePos.y = ev.clientY;
		this.movement = {x: 0, y:0};
		this.mouseState = MOUSE_DOWN;
	}

	onMouseMove(ev) {
		switch(this.mouseState) {
			case MOUSE_DOWN:
				this.movement.x = this.mousePos.x - ev.clientX;
				this.movement.y = this.mousePos.y - ev.clientY;
				this.imagePos.x -= this.movement.x;
				this.imagePos.y -= this.movement.y
				this.mousePos.x = ev.clientX;
				this.mousePos.y = ev.clientY;

				this.frameBuffer = [];
				this.loadImage({scale: this.scale, level: this.level});

				break;
			case MOUSE_UP:
			default:
		}
	}

	onMouseUp(ev) {
		this.mouseState = MOUSE_UP;
		this.loadImage({scale: this.scale, level: this.level});

	}

	zoom(s, l) {
		this.setScale(s, l);
		this.loadImage({scale: this.scale, level: this.level});
	}

	onWheel(ev) {
		this.imagePos.x = 0;
		this.imagePos.y = 0;
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
					onWheel={this.onWheel.bind(this)}
					width={this.state.width}
					/>
			</div>
		)
	}
}

DjakotaClient.propTypes = {
	config: React.PropTypes.object.isRequired,
	service: React.PropTypes.string.isRequired
};

export default DjakotaClient;