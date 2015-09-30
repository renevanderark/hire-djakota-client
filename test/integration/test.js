import React from "react/addons";
import djatokaClientApp from "../../src/standalone.jsx";

const config = {
	"identifier": "http://localhost:8080/jp2/13434696301791.jp2",
	"imagefile": "/var/cache/tomcat6/temp/cache15069217286472590195734192754.jp2",
	"width": "4355",
	"height": "3300",
	"dwtLevels": "6",
	"levels": "6",
	"compositingLayerCount": "1"
};
const service = "https://tomcat.tiler01.huygens.knaw.nl/adore-djatoka/resolver";
const Zoom = djatokaClientApp.Zoom;
const DjatokaClient = djatokaClientApp.DjatokaClient;
const store = djatokaClientApp.store;
const TestUtils = React.addons.TestUtils;

const viewContainer = document.createElement("div");
const zoomContainer = document.createElement("div");
document.body.appendChild(zoomContainer);
document.body.appendChild(viewContainer);
viewContainer.style.height = "400px";
viewContainer.style.width = "400px";

djatokaClientApp.Api.prototype.makeTileUrl = function() {
	return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3wkeBwUxu4ykfQAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAxSURBVCjPY2AYgYARq+j///+h0oyMxJoE0QPXSb46Jvx6MHUyEbSNsKeR1ZHg6eEMAGNKHe/rFCIdAAAAAElFTkSuQmCC";
};

describe("Integrated app", () => {

	afterEach(function(done) {
		React.unmountComponentAtNode(zoomContainer);
		React.unmountComponentAtNode(viewContainer);
		done();
	});


	it("should have the correct initial state before and after intial render", function(done) {
		let calls = 0;
		expect(store.getState()).to.deep.equal({realViewPort: {x: 0, y: 0, w: 0, h: 0, zoom: 0, reposition: false}, mousewheel: null, fillMode: null, freeMovement: false});

		this.unsubscribe = store.subscribe(() => {
			calls++;
			if(calls === 2) {
				let {x, y, w, h} = store.getState().realViewPort;
				expect(x).to.equal(0);
				expect(y).to.be.above(-0.158);
				expect(y).to.be.below(-0.156);
				expect(w).to.be.above(0.996);
				expect(w).to.be.below(0.998);
				expect(h).to.be.above(1.314);
				expect(h).to.be.below(1.316);
				this.unsubscribe();
				console.log('1');
				done();
			}
		});

		React.render(<Zoom />, zoomContainer);
		React.render(<DjatokaClient config={config} service={service} />, viewContainer);
	});

	it("should zoom on mouse down and mouse move", function(done) {
		let calls = 0;

		this.unsubscribe = store.subscribe(() => {
			calls++;
			let state = store.getState();
			if(calls === 3) {
				expect(state.realViewPort.applyZoom).to.equal(true);
				expect(state.realViewPort.zoom).to.be.above(0.99);
				expect(state.realViewPort.zoom).to.be.below(1.01);
			}
			if(calls === 4) {
				expect(state.realViewPort.applyZoom).to.equal(false);
			}

			if(calls === 5) {
				expect(state.realViewPort.applyZoom).to.equal(true);
				expect(state.realViewPort.zoom).to.be.below(0.5);
			}

			if(calls === 6) {
				expect(state.realViewPort.applyZoom).to.equal(false);
				this.unsubscribe();
				console.log("2");
				done();
			}
		});

		let renderedZoom = React.render(<Zoom />, zoomContainer);
		React.render(<DjatokaClient config={config} service={service} />, viewContainer, () => {
			renderedZoom.onMouseDown({pageX: 178, pageY: 10});
			setTimeout(() => { renderedZoom.onMouseMove({pageX: 10, pageY: 10, preventDefault: function() { }}); }, 50);
		});
	});

	it("try something else", function(done) {
		React.render(<Zoom />, zoomContainer);
		React.render(<DjatokaClient config={config} service={service} />, viewContainer);
		done();
	});
});