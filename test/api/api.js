import api from "../../src/api/api";
import expect from "expect";

describe("api", () => {
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
});