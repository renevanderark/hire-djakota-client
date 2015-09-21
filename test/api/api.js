import Api from "../../src/api/api";
import expect from "expect";
import sinon from "sinon";

describe("Api", () => {
	let api = null;
	before(() => {
		api = new Api(":service_url:", {
			identifier: ":identifier:",
			levels: 5,
			width: 5000,
			height: 10000
		});
/*
		this.service = service;
		this.config = config;
		this.params = {
			"rft_id": this.config.identifier,
			"url_ver": "Z39.88-2004",
			"svc_val_fmt": "info:ofi/fmt:kev:mtx:jpeg2000",
			"svc.format": "image/jpeg"
		};
		this.levels = parseInt(this.config.levels);
		this.fullWidth = parseInt(this.config.width);
		this.fullHeight = parseInt(this.config.height);
		this.resolutions = [];
		this.initializeResolutions(this.levels - 1, this.fullWidth, this.fullHeight);
		this.tileMap = {};
*/
	});
	it("should construct properly");
	it("should recursively initialize resolution levels from config with initializeResolutions");
	it("should find the correct resolution level based on a given width or height with findLevel");
	it("should generate a valid djatoka image URL based on a valid tile spec with makeTileUrl");
	it("should divide a given value val by 2 a given amount of times with downScale");
	it("should multiply a given value val by 2 a given amount of times with upScale");
	it("should wait for the property complete on the image object and call onTile on complete with onTileLoad");
	it("should handle an image error properly with onTileLoad");
	it("should cache an image tile in the tileMap and call onTileLoad with fetchTile");
	it("should always call onTile with fetchTile, whether its image is complete or not");
	it("should return the left/top position of the start tile based on a negative value for x/y respectively with getStart");
	it("should determine which image tiles to fetch based on a given top/left position, viewport dimensions scale and level and call fetchTile with makeTiles");
	it("should find the correct resolution level based on a given scale, dividing reference scale by 2 per level with findLevelForScale");
	it("should determine scale, resolution level and dimensions for the full image based on a desired zoom at full resolution with zoomTo");
	it("should determine scale, resolution level and dimensions for the full image based on the current full scale + a given factor with zoomBy");
	it("should return the full image scale based on current scale and resolution level with getRealScale");
	it("should return the real image position based on the current scaled position, scale and resolution level with getRealImagePos");
	it("should build up the image at full viewport width using makeTiles with widthFill, optionally calling onScale");
	it("should build up the image at 100% scale using makeTiles with fullZoom, optionally calling onScale");
	it("should build up the image at full viewport height using makeTiles with heightFill, optionally calling onScale");
	it("should call either widthFill or heightFill based on the viewport dimensions with autoFill");

	it("should should call the method in scaleMode if given, else build up the image based on opts using makeTiles with loadImage", () => {
		let scaleMethods = [
			"widthFill",
			"fullZoom",
			"heightFill",
			"autoFill"
		];
		let opts = { confirm: true, level: 2, scale: 0.2};
		let cb = function(opts) { expect(opts.confirm).toBe(true); };
		for(let i in scaleMethods) {
			sinon.stub(api, scaleMethods[i], cb);
		}
		for(let i in scaleMethods) {
			api.loadImage({...opts, scaleMode: scaleMethods[i]});
			sinon.assert.calledOnce(api[scaleMethods[i]]);
			api[scaleMethods[i]].restore();
		}

		sinon.stub(api, "makeTiles", function(opts, level, scale) {
			expect(opts).toEqual({confirm: true, level: 2, scale: 0.2});
			expect(level).toBe(2);
			expect(scale).toBe(0.2);
		});
		api.loadImage(opts);
		sinon.assert.calledOnce(api.makeTiles);
		api.makeTiles.restore();
	});

});