import Api from "../../src/api/api";
import expect from "expect";
import sinon from "sinon";

describe("Api", () => {
	let api = null;
	let apiConfig = {
		identifier: ":identifier:",
		levels: 5,
		width: 5000,
		height: 10000
	};
	before(() => {
		api = new Api(":service_url:", apiConfig);
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
	it("should determine scale, resolution level and dimensions for the full image based on a desired zoom at full resolution with zoomTo", () => {
		let onScaleCalled = false;
		let zoom = 0.4;
		let expectedScale = zoom * 2;
		let expectedLevel = apiConfig.levels - 1;
		let onScale = function(s, l, w, h) {
			expect(s).toEqual(expectedScale);
			expect(l).toEqual(expectedLevel);
			expect(w).toEqual(apiConfig.width * zoom);
			expect(h).toEqual(apiConfig.height * zoom);
		};
		api.zoomTo(zoom, onScale);
	});


	it("should determine scale, resolution level and dimensions for the full image based on the current full scale + a given factor with zoomBy", () => {
		let onScaleCalled = false;
		let l = 4;
		let s = 0.4;
		let f = 1.1;
		let sToVpS = s / 2 + f;
		let expectedLevel = 5;
		let onScale = function(s1, l1, w, h) {
			onScaleCalled = true;
			expect(s1).toEqual(sToVpS);
			expect(l1).toEqual(expectedLevel);
			expect(w).toEqual(apiConfig.width * sToVpS);
			expect(h).toEqual(apiConfig.height * sToVpS);
		};
		api.zoomBy(f, s, l, onScale);
		expect(onScaleCalled).toBe(true);
	});


	it("should return the full image scale based on current scale and resolution level with getRealScale", () => {
		let s1 = 2;
		let l1 = 5;
		expect(api.getRealScale(s1, l1)).toEqual(s1);
		let s2 = 0.4;
		let l2 = 4;
		expect(api.getRealScale(s2, l2)).toEqual(s2 / 2);
		let s3 = 0.1;
		let l3 = 1;
		expect(api.getRealScale(s3, l3)).toEqual(s3 / 2 / 2 / 2 / 2);
	});


	it("should return the real image position based on the current scaled position, scale and resolution level with getRealImagePos", () => {
		let s1 = 1;
		let l1 = apiConfig.levels;
		let position1 = { x: apiConfig.width / 2, y: -apiConfig.height / 2};
		let expectedDims1 = {
			x: position1.x, y: position1.y, w: apiConfig.width, h: apiConfig.height
		};
		expect(api.getRealImagePos(position1, s1, l1)).toEqual(expectedDims1);

		let s2 = 0.75;
		let l2 = 3;
		let position2 = {
			x: 25,
			y: 30
		};
		let expectedDims2 = {
			x: Math.floor(position2.x * s2),
			y: Math.floor(position2.y * s2),
			w: Math.ceil(apiConfig.width * (s2 / 2 / 2)),
			h: Math.ceil(apiConfig.height * (s2 / 2 / 2))
		};
		expect(api.getRealImagePos(position2, s2, l2)).toEqual(expectedDims2);

	});


	it("should build up the image at 100% scale using makeTiles with fullZoom, optionally calling onScale", () => {
		let onScaleCalled = false;
		let expectedLevel = 5;
		let expectedScale = 1;
		let opts = {
			viewport: {h: 1000, w: 500},
			onScale: function(scale, level, w, h) {
				onScaleCalled = true;
				expect(scale).toBe(expectedScale);
				expect(level).toBe(expectedLevel);
				expect(w).toBe(apiConfig.width);
				expect(h).toBe(apiConfig.height);
			}
		};

		sinon.stub(api, "makeTiles", function(cOpts, level, scale) {
			expect(cOpts).toEqual(opts);
			expect(level).toBe(expectedLevel);
			expect(scale).toBe(expectedScale);
		});

		api.fullZoom(opts);
		sinon.assert.calledOnce(api.makeTiles);
		api.makeTiles.restore();
		expect(onScaleCalled).toBe(true);
	});

	it("should build up the image at full viewport width using makeTiles with widthFill, optionally calling onScale with level, scale and scaled dimensions", () => {
		let onScaleCalled = false;
		let expectedLevel = 2;
		let expectedScale = 0.8;
		let opts = {
			viewport: {h: 1000, w: 500},
			onScale: function(scale, level, w, h) {
				onScaleCalled = true;
				expect(scale).toBe(expectedScale);
				expect(level).toBe(expectedLevel);
				expect(w).toBe(apiConfig.width / 2 / 2 / 2 * expectedScale);
				expect(h).toBe(apiConfig.height / 2 / 2 / 2 * expectedScale);
			}
		};

		sinon.stub(api, "makeTiles", function(cOpts, level, scale) {
			expect(cOpts).toEqual(opts);
			expect(level).toBe(expectedLevel);
			expect(scale).toBe(expectedScale);
		});

		api.widthFill(opts);
		sinon.assert.calledOnce(api.makeTiles);
		api.makeTiles.restore();
		expect(onScaleCalled).toBe(true);
	});


	it("should build up the image at full viewport height using makeTiles with heightFill, optionally calling onScale with level, scale and scaled dimensions", () => {
		let onScaleCalled = false;
		let expectedLevel = 1;
		let expectedScale = 0.8;
		let opts = {
			viewport: {h: 500, w: 250},
			onScale: function(scale, level, w, h) {
				onScaleCalled = true;
				expect(scale).toBe(expectedScale);
				expect(level).toBe(expectedLevel);
				expect(w).toBe(apiConfig.width / 2 / 2 / 2 / 2 * expectedScale);
				expect(h).toBe(apiConfig.height / 2 / 2 / 2 / 2 * expectedScale);
			}
		};

		sinon.stub(api, "makeTiles", function(cOpts, level, scale) {
			expect(cOpts).toEqual(opts);
			expect(level).toBe(expectedLevel);
			expect(scale).toBe(expectedScale);
		});

		api.heightFill(opts);
		sinon.assert.calledOnce(api.makeTiles);
		api.makeTiles.restore();
		expect(onScaleCalled).toBe(true);
	});


	it("should call either widthFill or heightFill based on the viewport dimensions with autoFill", () => {
		let optsA = {viewport: {h: 100, w: 200}};
		let optsB = {viewport: {h: 200, w: 100}};
		sinon.stub(api, "heightFill", function(opts) { expect(opts.viewport).toEqual({h: 100, w: 200});	});
		sinon.stub(api, "widthFill", function(opts) { expect(opts.viewport).toEqual({h: 200, w: 100}); });
		api.autoFill(optsA);
		api.autoFill(optsB);
		sinon.assert.calledOnce(api.heightFill);
		sinon.assert.calledOnce(api.widthFill);
		api.heightFill.restore();
		api.widthFill.restore();
	});

	it("should should call the method in scaleMode if given, else build up the image based on opts using makeTiles with loadImage", () => {
		let scaleMethods = [
			"widthFill",
			"fullZoom",
			"heightFill",
			"autoFill"
		];
		let opts = { confirm: true, level: 2, scale: 0.2};
		let cb = function(opts1) { expect(opts1.confirm).toBe(true); };
		for(let i in scaleMethods) {
			sinon.stub(api, scaleMethods[i], cb);
		}
		for(let i in scaleMethods) {
			api.loadImage({...opts, scaleMode: scaleMethods[i]});
			sinon.assert.calledOnce(api[scaleMethods[i]]);
			api[scaleMethods[i]].restore();
		}

		sinon.stub(api, "makeTiles", function(opts1, level, scale) {
			expect(opts1).toEqual({confirm: true, level: 2, scale: 0.2});
			expect(level).toBe(2);
			expect(scale).toBe(0.2);
		});
		api.loadImage(opts);
		sinon.assert.calledOnce(api.makeTiles);
		api.makeTiles.restore();
	});

});