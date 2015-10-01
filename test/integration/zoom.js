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
				if(calls === 2) { finalize(); }				
			} catch(e) { finalize(e); }
			
		});
		zoomComponent.onMouseDown({pageX: 178, pageY: 10});
	});

	it("should trigger zoom on touch start", function(done) {
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
				expect(state.zoom).to.be.above(1.0);
				expect(state.zoom).to.be.below(1.3);
				if(calls === 2) { finalize(); }
			} catch(e) { finalize(e); }
		});

		zoomComponent.onTouchStart({touches: [{pageX: 200, pageY: 10}], preventDefault: function() {}})
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
					finalize();
				} catch(e) { finalize(e); }
			}
		});
		zoomComponent.onMouseDown({pageX: 10, pageY: 10});
		zoomComponent.onMouseMove({pageX: 178, pageY: 10, preventDefault: function() {}});
	});


	it("should trigger zoom on touch move", function(done) {
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
					finalize();
				} catch(e) { finalize(e); }
			}
		});
		zoomComponent.onTouchStart({touches: [{pageX: 10, pageY: 10}], preventDefault: function() {}})
		zoomComponent.onTouchMove({touches: [{pageX: 178, pageY: 10}], preventDefault: function() {}});
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
				try { 
					expect(state.zoom).to.be.below(lastZoom);
					finalize();
				} catch(e) { finalize(e); }
				
			}
		});

		zoomComponent.onMouseDown({pageX: 10, pageY: 10});
		zoomComponent.onWheel({deltaY: -1, preventDefault: function() {}});
		zoomComponent.onWheel({deltaY: 1, preventDefault: function() {}});
	});


	it("should update zoom level info when viewport has zoomed", function(done) {
		let initalZoom = store.getState().realViewPort.zoom;
		let initialZoomLabelText = React.findDOMNode(zoomComponent).querySelector("label span").innerHTML;
		let initialCirclePosition = React.findDOMNode(zoomComponent).querySelector("circle").getAttribute("cx");
		let calls = 0;
		let unsubscribe = store.subscribe(() => {
			function finalize(e) {
				unsubscribe();
				done(e);
			}
			if(++calls === 50) {
				try { 
					let newZoomLabelText = React.findDOMNode(zoomComponent).querySelector("label span").innerHTML;
					let newCirclePosition = React.findDOMNode(zoomComponent).querySelector("circle").getAttribute("cx");
					expect(parseInt(newCirclePosition)).to.be.above(parseInt(initialCirclePosition));
					expect(parseInt(newZoomLabelText)).to.be.above(parseInt(initialZoomLabelText));
					expect(store.getState().realViewPort.zoom).to.be.above(initalZoom);
					finalize();
				} catch(e) {
					finalize(e);
				}
			}
		});

		for(let i = 0; i < 50; i++) {
			viewComponent.onWheel({nativeEvent: {deltaY: -1}, preventDefault: function() {}});
		}
	});

});
