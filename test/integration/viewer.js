import React from "react/addons";
import djatokaClientApp from "../../src/standalone.jsx";
import {viewContainer, zoomContainer, wfContainer, hfContainer, fzContainer, afContainer, service, store, config, frameCallbacks} from "./setup";

const TILE_SIZE = 512;
describe("DjatokaClient", () => {
	const FillButton = djatokaClientApp.FillButton;
	const Zoom = djatokaClientApp.Zoom;
	const DjatokaClient = djatokaClientApp.DjatokaClient;
	let zoomComponent, viewComponent, heightFillButton, widthFillButton, fullZoomButton;

	before(function(done) {
		let calls = 0;
		this.unsubscribe = store.subscribe(() => {
			if(++calls === 4) {
				this.unsubscribe();
				done();
			}
		});
		fullZoomButton = React.render(<FillButton scaleMode="fullZoom" />, fzContainer);
		widthFillButton = React.render(<FillButton scaleMode="widthFill" />, wfContainer);
		heightFillButton = React.render(<FillButton scaleMode="heightFill" />, hfContainer);
		zoomComponent = React.render(<Zoom />, zoomContainer);
		viewComponent = React.render(<DjatokaClient config={config} scaleMode="fullZoom" service={service} />, viewContainer);
	});

	after(function(done) {
		React.unmountComponentAtNode(fzContainer);
		React.unmountComponentAtNode(wfContainer);
		React.unmountComponentAtNode(hfContainer);
		React.unmountComponentAtNode(viewContainer);
		React.unmountComponentAtNode(zoomContainer);
		React.unmountComponentAtNode(viewContainer);
		done();
	});

	afterEach(function() {
		React.addons.TestUtils.Simulate.click(React.findDOMNode(fullZoomButton))
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
					done();
				} catch(e) {
					done(e);
				}
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
		let xBefore = viewComponent.imagePos.x;
		let yBefore = viewComponent.imagePos.y;
		let calls = 0;

		frameCallbacks.beforeRender = function() { 
			if(calls === 2) {
				try {
					expect(this.imagePos.x).to.be.below(xBefore);
					expect(this.imagePos.y).to.be.above(yBefore)
					done();
				} catch(e) {
					done(e);
				}
			}
		};

		let unsubscribe = store.subscribe(() => {
			let state = store.getState().realViewPort;
			calls++;
			if(calls === 2) {
				try {
					expect(state.x).to.be.above(x);
					expect(state.y).to.be.below(y);
					unsubscribe();
				} catch(e) {
					unsubscribe();
					done(e);
				}
			}
		});

		viewComponent.onMouseDown({clientX: 100, clientY: 10});
		viewComponent.onMouseMove({clientX: 80, clientY: 20, preventDefault: function() {}});
		viewComponent.onMouseUp();
	});

	it("should reposition the image on touch move", function(done) {
		let {x, y} = store.getState().realViewPort;
		let xBefore = viewComponent.imagePos.x;
		let yBefore = viewComponent.imagePos.y;
		let calls = 0;

		frameCallbacks.beforeRender = function() {
			if(calls === 1) {
				try {
					expect(this.imagePos.x).to.be.below(xBefore);
					expect(this.imagePos.y).to.be.above(yBefore);
					done();
				} catch(e) {
					done(e);
				}
			}
		};

		let unsubscribe = store.subscribe(() => {
			let state = store.getState().realViewPort;
			calls++;
			if(calls === 1) {
				try {
					expect(state.x).to.be.above(x);
					expect(state.y).to.be.below(y);
					unsubscribe();
				} catch(e) {
					unsubscribe();
					done(e);
				}
			}
		});
		viewComponent.onTouchStart({touches: [{pageX: 100, pageY: 10}]});
		viewComponent.onTouchMove({touches: [{pageX: 80, pageY: 20}], preventDefault: function() {}, stopPropagation: function() {}});
		viewComponent.onTouchEnd();
	});

	it("should zoom in on the image on mouse wheel", function(done) {
		let {zoom} = store.getState().realViewPort;
		let scale = viewComponent.scale;
		let storeNotified = false;

		frameCallbacks.beforeRender = function() {
			if(storeNotified) {
				try {
					expect(this.scale).to.be.above(scale);
					done();
				} catch(e) {
					done(e);
				}
			}
		};
		let unsubscribe = store.subscribe(() => {
			let state = store.getState().realViewPort;
			try {
				storeNotified = true;
				expect(state.zoom).to.be.above(zoom);
				unsubscribe();
			} catch(e) {
				unsubscribe();
				done(e);
			}
		});

		viewComponent.onWheel({nativeEvent: {deltaY: -1}, preventDefault: function() {}});
	});

	it("should zoom out of the image on mouse wheel", function(done) {
		let {zoom} = store.getState().realViewPort;
		let scale = viewComponent.scale;
		let storeNotified = false;

		frameCallbacks.beforeRender = function() {
			if(storeNotified) {
				try {
					expect(this.scale).to.be.below(scale);
					done();
				} catch(e) {
					done(e);
				}
			}
		};
		let unsubscribe = store.subscribe(() => {
			let state = store.getState().realViewPort;
			try {
				storeNotified = true;
				expect(state.zoom).to.be.below(zoom);
				unsubscribe();
			} catch(e) {
				unsubscribe();
				done(e);
			}
		});

		viewComponent.onWheel({nativeEvent: {deltaY: 1}, preventDefault: function() {}});
	});

	it("should scale the image to widthFill when that FillButton is clicked", function(done) {
		let storeNotified = false;
		let rerendered = false;
		let calls = 0;

		frameCallbacks.beforeRender = function() {
			if(storeNotified) {
				rerendered = true;
				try {
					expect(this.imagePos.x).to.be.most(0);
					expect(this.imagePos.x).to.be.least(-1);
					expect(this.width).to.be.least(this.state.width);
					expect(this.width).to.be.most(this.state.width + 1);
				} catch(e) {
					done(e);
				}
			}
			if(storeNotified && rerendered) { done(); }
		};

		let unsubscribe = store.subscribe(() => {
			let state = store.getState();
			storeNotified = true;
			calls++;
			if(calls === 1) {
				try {
					expect(state.fillMode).to.equal("widthFill");
				} catch(e) {
					done(e);
				}
			}
			if(calls === 2) {
				try {
					unsubscribe();
					expect(state.fillMode).to.equal(false);
				} catch(e) {
					done(e);
				}
			}
			if(storeNotified && rerendered) { done(); }
		});

		React.addons.TestUtils.Simulate.click(React.findDOMNode(widthFillButton));
	});

	it("should scale the image to heightFill when that FillButton is clicked", function(done) {
		let storeNotified = false;
		let rerendered = false;
		let calls = 0;

		frameCallbacks.beforeRender = function() {
			if(storeNotified) {
				rerendered = true;
				try {
					expect(this.imagePos.y).to.be.most(0);
					expect(this.imagePos.y).to.be.least(-1);
					expect(this.height).to.be.least(this.state.height);
					expect(this.height).to.be.most(this.state.height + 1);
				} catch(e) {
					done(e);
				}
			}
			if(storeNotified && rerendered) { done(); }
		};

		let unsubscribe = store.subscribe(() => {
			let state = store.getState();
			storeNotified = true;
			calls++;
			if(calls === 1) {
				try {
					expect(state.fillMode).to.equal("heightFill");
				} catch(e) {
					done(e);
				}
			}
			if(calls === 2) {
				try {
					unsubscribe();
					expect(state.fillMode).to.equal(false);
				} catch(e) {
					done(e);
				}
			}
			if(storeNotified && rerendered) { done(); }
		});

		React.addons.TestUtils.Simulate.click(React.findDOMNode(heightFillButton));
	});

});