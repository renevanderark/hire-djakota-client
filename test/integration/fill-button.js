import React from "react/addons";
import djatokaClientApp from "../../src/standalone.jsx";
import {viewContainer, wfContainer, hfContainer, fzContainer, afContainer, service, store, config} from "./setup";

describe("FillButton", () => {
	const FillButton = djatokaClientApp.FillButton;
	const DjatokaClient = djatokaClientApp.DjatokaClient;
	let viewComponent, heightFillButton, widthFillButton, fullZoomButton, autoFillButton;
	before(function(done) {
		let calls = 0;
		this.unsubscribe = store.subscribe(() => {
			if(++calls === 4) {
				this.unsubscribe();
				done();
			}
		});

		autoFillButton = React.render(<FillButton scaleMode="autoFill" />, afContainer);
		fullZoomButton = React.render(<FillButton scaleMode="fullZoom" />, fzContainer);
		widthFillButton = React.render(<FillButton scaleMode="widthFill" />, wfContainer);
		heightFillButton = React.render(<FillButton scaleMode="heightFill" />, hfContainer);
		viewComponent = React.render(<DjatokaClient config={config} service={service} />, viewContainer);
	});

	after(function(done) {
		React.unmountComponentAtNode(afContainer);
		React.unmountComponentAtNode(fzContainer);
		React.unmountComponentAtNode(wfContainer);
		React.unmountComponentAtNode(hfContainer);
		React.unmountComponentAtNode(viewContainer);
		done();
	});


	it("should apply heightFill with scaleMode heightFill on click", function(done) {
		let calls = 0;
		let unsubscribe = store.subscribe(() => {
			function finalize(e) {
				unsubscribe();
				done(e);
			}
			calls++;
			let state = store.getState();
			if(calls === 1) {
				try {
					expect(state.fillMode).to.equal('heightFill');
				} catch(e) { finalize(e) }
			}
			if(calls === 4) {
				try {
					expect(state.realViewPort.h).to.be.above(0.99);
					expect(state.realViewPort.h).to.be.below(1.01);
				} catch(e) { finalize(e); }
				finalize();
			}
		});

		React.addons.TestUtils.Simulate.click(React.findDOMNode(heightFillButton))
	});

	it("should apply widthFill with scaleMode widthFill on click", function(done) {
		let calls = 0;
		let unsubscribe = store.subscribe(() => {
			function finalize(e) {
				unsubscribe();
				done(e);
			}			
			calls++;
			let state = store.getState();
			if(calls === 1) {
				try {
					expect(state.fillMode).to.equal('widthFill');
				} catch(e) { finalize(e) }
			}
			if(calls === 4) {
				try {
					expect(state.realViewPort.w).to.be.above(0.99);
					expect(state.realViewPort.w).to.be.below(1.01);
				} catch(e) { finalize(e) }
				finalize();
			}
		});

		React.addons.TestUtils.Simulate.click(React.findDOMNode(widthFillButton))
	});

	it("should apply fullZoom with scaleMode fullZoom on click", function(done) {
		let calls = 0;
		let unsubscribe = store.subscribe(() => {
			function finalize(e) {
				unsubscribe();
				done(e);
			}			
			calls++;
			let state = store.getState();
			if(calls === 1) {
				try {
					expect(state.fillMode).to.equal('fullZoom');
				} catch(e) { finalize(e) }
			}
			if(calls === 4) {
				try {
					expect(state.realViewPort.zoom).to.be.above(0.99);
					expect(state.realViewPort.zoom).to.be.below(1.01);
				} catch(e) { finalize(e) }
				finalize();
			}
		});

		React.addons.TestUtils.Simulate.click(React.findDOMNode(fullZoomButton))
	});

	it("should apply autoFill with scaleMode autoFill on click", function(done) {
		let calls = 0;
		let unsubscribe = store.subscribe(() => {
			function finalize(e) {
				unsubscribe();
				done(e);
			}			
			calls++;
			let state = store.getState();
			if(calls === 1) {
				try {
					expect(state.fillMode).to.equal('autoFill');
				} catch(e) { finalize(e) }
			}
			if(calls === 4) {
				try {
					expect(state.realViewPort.w).to.be.above(0.99);
					expect(state.realViewPort.w).to.be.below(1.01);
				} catch(e) { finalize(e) }
				finalize();
			}
		});

		React.addons.TestUtils.Simulate.click(React.findDOMNode(autoFillButton))
	});

});