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
const wrapper = document.createElement("div");
const store = djatokaClientApp.store;
document.body.appendChild(wrapper);
wrapper.style.height = "400px";
wrapper.style.width = "400px";


describe("Integrated app", () => {

	it("should have the correct initial state before and after intial render", function(done) {
		expect(store.getState()).to.deep.equal({realViewPort: {x: 0, y: 0, w: 0, h: 0, zoom: 0, reposition: false}, mousewheel: null, fillMode: null, freeMovement: false});
		djatokaClientApp.mountNode(config, service, wrapper);
		let {x, y, w, h} = store.getState().realViewPort;
		expect(x).to.equal(0);
		expect(y).to.be.above(-0.0757).and.be.below(-0.0755);
		expect(w).to.be.above(0.996).and.be.below(1.001);
		expect(h).to.be.above(1.15).and.be.below(1.152);
		done();
	});


});