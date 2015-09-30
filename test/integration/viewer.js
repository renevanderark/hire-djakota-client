import React from "react/addons";
import djatokaClientApp from "../../src/standalone.jsx";
import {viewContainer, zoomContainer, service, store, config, frameCallbacks} from "./setup";


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
	});

	it("should flush the frameBuffer of complete images after render if all images were complete", function(done) {
		let prepared = false;
		let lastLength = 0;
		frameCallbacks.beforeRender = function() {
			prepared = this.frameBuffer.length === this.frameBuffer.filter((x) => x[0].complete && x[0].height > 0 && x[0].width > 0).length;
			lastLength = this.frameBuffer.length;
		};
		frameCallbacks.afterRender = function() {
			if(prepared && lastLength > 0) {
				try {
					expect(this.frameBuffer.length).to.equal(0);
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