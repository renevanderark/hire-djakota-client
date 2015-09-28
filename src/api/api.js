import qs from "qs";

const IDX_WIDTH = 1;
const IDX_HEIGHT = 0;
const TILE_SIZE = 512;

const downScale = function(val, times) { return times > 0 ? downScale(val / 2, --times) : val; };
const upScale = function(val, times) { return times > 0 ? upScale(val * 2, --times) : val; };


class Api {
	constructor(service, config) {
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

	}

	initializeResolutions(level = this.levels - 1, w = this.fullWidth, h = this.fullHeight) {
		this.resolutions.unshift([h, w]);
		if(level > 0) {
			this.initializeResolutions(--level, parseInt(Math.floor(w / 2)), parseInt(Math.floor(h / 2)));
		}
	}


	findLevel(dim, idx)	{
		let i;
		for(i = 0; i < this.resolutions.length; i++) {
			if(this.resolutions[i][idx] > dim) {
				return i + 1;
			}
		}
		return i;
	}

	makeTileUrl(level, dims) {
		return this.service + "?" +
			qs.stringify({...this.params, ...{
				"svc.region": dims.join(","),
				"svc.level": level,
				"svc_id": "info:lanl-repo/svc/getRegion"
			}});
	}


	fetchTile(tile) {
		let key = tile.realX + "-" + tile.realY + "-" + tile.level + "-" + tile.url;
		if(!this.tileMap[key]) {
			this.tileMap[key] = new Image();
			this.tileMap[key].src = tile.url;
		}
		return [this.tileMap[key], tile];
	}

	getStart(dim) {
		let n = 0;
		while(dim + n < -TILE_SIZE) {
			n += TILE_SIZE;
		}
		return n;
	}

	makeTiles(opts, level, scale) {
		let upscaleFactor = this.resolutions.length - level;
		let yStart = this.getStart(opts.position.y);
		let xStart = this.getStart(opts.position.x);
		let tiles = [];
		for(let y = yStart;
				((y - yStart) * scale) - TILE_SIZE * 2 + opts.position.y < opts.viewport.h &&
				upScale(y, upscaleFactor) < this.fullHeight;
				y += TILE_SIZE) {

			for(let x = xStart;
				((x - xStart) * scale) - TILE_SIZE * 2 + opts.position.x < opts.viewport.w &&
				upScale(x, upscaleFactor) < this.fullWidth;
				x += TILE_SIZE) {

				tiles.push(this.fetchTile({
					realX: x,
					realY: y,
					pos: {
						x: x,
						y: y
					},
					level: level,
					url: this.makeTileUrl(level, [upScale(y, upscaleFactor), upScale(x, upscaleFactor), TILE_SIZE, TILE_SIZE])
				}));
			}
		}
		return tiles;
	}

	findLevelForScale(s, level = this.levels, current = 1) {
		if(s > current / 2 || level === 1) {
			return level;
		}
		return this.findLevelForScale(s, --level, current / 2);
	}

	zoomTo(zoom, onScale) {
		let newLevel = this.findLevelForScale(zoom);
		let newScale = upScale(zoom, this.resolutions.length - newLevel);
		onScale(newScale, newLevel, Math.ceil(this.fullWidth * zoom), Math.ceil(this.fullHeight * zoom));
	}


	zoomBy(factor, scale, level, onScale) {
		let viewportScale = this.getRealScale(scale, level) + factor;
		if(viewportScale < 0.01) { viewportScale = 0.01; }
		let newLevel = this.findLevelForScale(viewportScale);
		let newScale = upScale(viewportScale, this.resolutions.length - newLevel);
		onScale(newScale, newLevel, Math.ceil(this.fullWidth * viewportScale), Math.ceil(this.fullHeight * viewportScale));
	}


	getRealScale(scale, level) {
		return downScale(scale, this.resolutions.length - level);
	}

	getRealImagePos(position, scale, level) {
		return {
			x: Math.floor(position.x * scale),
			y: Math.floor(position.y * scale),
			w: Math.ceil(this.fullWidth * this.getRealScale(scale, level)),
			h: Math.ceil(this.fullHeight * this.getRealScale(scale, level))
		};
	}

	widthFill(opts) {
		let level = this.findLevel(opts.viewport.w, IDX_WIDTH);
		let scale = opts.viewport.w / this.resolutions[level - 1][IDX_WIDTH];
		let upscaleFactor = this.resolutions.length - level;
		let viewportScale = downScale(scale, upscaleFactor);

		if(opts.onScale) { opts.onScale(scale, level, Math.ceil(this.fullWidth * viewportScale), Math.ceil(this.fullHeight * viewportScale)); }
		return this.makeTiles(opts, level, scale);
	}

	fullZoom(opts) {
		let level = this.levels;
		let scale = 1;

		if(opts.onScale) { opts.onScale(scale, level, this.fullWidth, this.fullHeight); }
		return this.makeTiles(opts, level, scale);
	}

	heightFill(opts) {
		let level = this.findLevel(opts.viewport.h, IDX_HEIGHT);
		let scale = opts.viewport.h / this.resolutions[level - 1][IDX_HEIGHT];
		let upscaleFactor = this.resolutions.length - level;
		let viewportScale = downScale(scale, upscaleFactor);

		if(opts.onScale) { opts.onScale(scale, level, Math.ceil(this.fullWidth * viewportScale), Math.ceil(this.fullHeight * viewportScale)); }

		return this.makeTiles(opts, level, scale);
	}

	autoFill(opts) {
		if(this.fullHeight > this.fullWidth) {
			return this.heightFill(opts);
		} else {
			return this.widthFill(opts);
		}
	}

	loadImage(opts) {
		if(opts.scaleMode) {
			return this[opts.scaleMode](opts);
		} else {
			return this.makeTiles(opts, opts.level, opts.scale);
		}

	}
}

export default Api;