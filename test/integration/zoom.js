import React from "react/addons";
import djatokaClientApp from "../../src/standalone.jsx";
import {viewContainer, zoomContainer, service, store, config} from "./setup";


describe("Zoom", () => {
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


	it("should trigger zoom on mouse down", function(done) {
		let calls = 0;
		let unsubscribe = store.subscribe(() => {
			function finalize(e) {
				zoomComponent.onMouseUp();
				unsubscribe();
				done(e);
			}

			calls++;
			let state = store.getState().realViewPort;
			try {
				expect(state.zoom).to.be.above(0.99);
				expect(state.zoom).to.be.below(1.01);
			} catch(e) { finalize(e); }
			if(calls === 2) { finalize(); }
		});
		zoomComponent.onMouseDown({pageX: 178, pageY: 10});
	});

	it("should trigger zoom on mouse move", function(done) {
		let calls = 0;
		let unsubscribe = store.subscribe(() => {
			function finalize(e) {
				zoomComponent.onMouseUp();
				unsubscribe();
				done(e);
			}
			calls++;
			let state = store.getState().realViewPort;
			if(calls === 2) {
				try { expect(state.zoom).to.be.below(0.3); } catch(e) { finalize(e); }
			}
			if(calls === 4) {
				try {
					expect(state.zoom).to.be.above(0.99);
					expect(state.zoom).to.be.below(1.01);
				} catch(e) { finalize(e); }
				finalize();
			}
		});
		zoomComponent.onMouseDown({pageX: 10, pageY: 10});
		zoomComponent.onMouseMove({pageX: 178, pageY: 10, preventDefault: function() {}});
	});

	it("should trigger zoom on mouse wheel", function(done) {
		let calls = 0;
		let lastZoom;
		let unsubscribe = store.subscribe(() => {
			function finalize(e) {
				zoomComponent.onMouseUp();
				unsubscribe();
				done(e);
			}
			calls++;
			let state = store.getState().realViewPort;
			if(calls === 2) {
				lastZoom = state.zoom;
				try { expect(state.zoom).to.be.below(0.3); } catch(e) { finalize(e); }
			}
			if(calls === 5) {
				try { expect(state.zoom).to.be.above(lastZoom); } catch(e) { finalize(e); }
				lastZoom = state.zoom;
			}

			if(calls === 7) {
				try { expect(state.zoom).to.be.below(lastZoom); } catch(e) { finalize(e); }
				finalize();
			}
		});

		zoomComponent.onMouseDown({pageX: 10, pageY: 10});
		zoomComponent.onWheel({deltaY: -1, preventDefault: function() {}});
		zoomComponent.onWheel({deltaY: 1, preventDefault: function() {}});
	});

});
