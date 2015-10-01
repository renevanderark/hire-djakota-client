import React from "react/addons";
import djatokaClientApp from "../../src/standalone.jsx";
import {viewContainer, zoomContainer, service, store, config, frameCallbacks} from "./setup";

const TILE_SIZE = 512;
describe("DjatokaClient", () => {
	const Zoom = djatokaClientApp.Zoom;
	const DjatokaClient = djatokaClientApp.DjatokaClient;
	let zoomComponent, viewComponent;
	before(function(done) {
		let calls = 0;
		this.unsubscribe = store.subscribe(() => {
			if(++calls === 4) {
				this.unsubscribe();
				done();
			}
		});

		zoomComponent = React.render(<Zoom />, zoomContainer);
		viewComponent = React.render(<DjatokaClient scaleMode="fullZoom" config={config} service={service} />, viewContainer);

	});

	after(function(done) {
		React.unmountComponentAtNode(zoomContainer);
		React.unmountComponentAtNode(viewContainer);
		done();
	});

	afterEach(function() {
		frameCallbacks.beforeRender = function() { };
		frameCallbacks.afterRender = function() { };
		frameCallbacks.onDrawImage = function() { };
		frameCallbacks.onClearRect = function() { };
	});

	it("should draw the tiles to the canvas after loadImage", function(done) {
		let prepared = false;
		let lastLength = 0;
		let canvasCleared = false;
		let tilesDrawn = 0;
		frameCallbacks.beforeRender = function() {
			prepared = this.frameBuffer.length === this.frameBuffer.filter((x) => x[0].complete && x[0].height > 0 && x[0].width > 0).length;
			lastLength = this.frameBuffer.length;
		};

		frameCallbacks.onClearRect = function(x, y, w, h) {
			canvasCleared = true;
			try {
				expect(x).to.equal(0);
				expect(y).to.equal(0);
				expect(w).to.equal(1000);
				expect(h).to.equal(1000);
				expect(this.frameBuffer.length).to.equal(30);
				tilesDrawn = 0;
			} catch(e) {
				done(e);
			}
		};

		frameCallbacks.onDrawImage = function(im, x, y, w, h) {
			try {
				expect(canvasCleared).to.equal(true);
				expect(Math.floor((x - this.imagePos.x) / this.scale) % TILE_SIZE).to.equal(0);
				expect(Math.floor((y - this.imagePos.y) / this.scale) % TILE_SIZE).to.equal(0);
				expect(w).to.equal(Math.ceil(im.width * this.scale));
				expect(h).to.equal(Math.ceil(im.height * this.scale));
				tilesDrawn++;
			} catch(e) {
				done(e);
			}
		};

		frameCallbacks.afterRender = function() {
			canvasCleared = false;
			if(prepared && lastLength > 0) {
				try {
					expect(this.frameBuffer.length).to.equal(0);
					expect(tilesDrawn).to.equal(lastLength);
				} catch(e) {
					done(e);
				}
				done();
			}
		};
		viewComponent.loadImage();
	});

	it("should call onAnimationFrame as often as possible", function(done) {
		this.timeout(1000);
		let count = 0;
		frameCallbacks.beforeRender = function() { count++; };

		setTimeout(function() {
			console.log("FPS: " + count * 2);
			expect(count).to.be.above(10);
			done();
		}, 500);
	});


	it("should reposition the image on mouse drag", function(done) {
		let {x, y} = store.getState().realViewPort;
		let xBefore, yBefore;
		let calls = 0;
		let callExec = false;
		let error;

		function exec() {
			viewComponent.onMouseDown({clientX: 100, clientY: 10});
			viewComponent.onMouseMove({clientX: 80, clientY: 20, preventDefault: function() {}});
			viewComponent.onMouseUp();
		}

		frameCallbacks.beforeRender = function() { 
			if(!callExec) {
				exec();
				callExec = true;
				xBefore = this.imagePos.x;
				yBefore = this.imagePos.y;
			} else if(calls === 2) {
				try {
					expect(this.imagePos.x).to.be.below(xBefore);
					expect(this.imagePos.y).to.be.below(yBefore)
				} catch(e) {
					done(e);
				}
				done();
			}
		};

		let unsubscribe = store.subscribe(() => {
			let state = store.getState().realViewPort;
			calls++;
			if(calls === 2) {
				try {
					expect(state.x).to.be.above(x);
					expect(state.y).to.be.below(y);
				} catch(e) {
					unsubscribe();
					done(e);
				}
				unsubscribe();
			}
		});

	});
});