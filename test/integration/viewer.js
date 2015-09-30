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
		viewComponent = React.render(<DjatokaClient config={config} service={service} />, viewContainer);

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
		let count = 0;
		frameCallbacks.beforeRender = function() { count++; };

		setTimeout(function() {
			console.log("FPS: " + count);
			expect(count).to.be.above(20);
			done();
		}, 1000);
	});
});