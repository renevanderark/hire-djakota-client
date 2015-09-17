import qs from "qs";

const IDX_WIDTH = 1;
const IDX_HEIGHT = 0;
const TILE_SIZE = 512;

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

	initializeResolutions(level, w, h) {
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
			qs.stringify(Object.assign(this.params, {
				"svc.region": dims.join(","),
				"svc.level": level,
				"svc_id": "info:lanl-repo/svc/getRegion"
			}));
	}

	downScale(val, times) {
		return times > 0 ? this.downScale(val / 2, --times) : val;
	}

	upScale(val, times) {
		return times > 0 ? this.upScale(val * 2, --times) : val;
	}

	onTileLoad(tileIm, tile, onTile) {
		if(!tileIm.complete) {
			setTimeout(this.onTileLoad.bind(this, tileIm, tile, onTile), 15);
		} else {
			onTile(tileIm, tile);
		}
	}

	fetchTile(tile, onTile) {
		let key = tile.realX + "-" + tile.realY + "-" + tile.level + "-" + tile.url;
		if(!this.tileMap[key]) {
			this.tileMap[key] = new Image();
			this.tileMap[key].onload = this.onTileLoad.bind(this, this.tileMap[key], tile, onTile);
			this.tileMap[key].src = tile.url;
		}
		onTile(this.tileMap[key], tile);
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

		for(let y = yStart;
				((y - yStart) * scale) - TILE_SIZE * 2 + opts.position.y < opts.viewport.h &&
				this.upScale(y, upscaleFactor) < this.fullHeight;
				y += TILE_SIZE) {

			for(let x = xStart;
				((x - xStart) * scale) - TILE_SIZE * 2 + opts.position.x < opts.viewport.w &&
				this.upScale(x, upscaleFactor) < this.fullWidth;
				x += TILE_SIZE) {

				this.fetchTile({
					realX: x,
					realY: y,
					timeStamp: opts.timeStamp,
					pos: {
						x: x,
						y: y
					},
					level: level,
					url: this.makeTileUrl(level, [this.upScale(y, upscaleFactor), this.upScale(x, upscaleFactor), TILE_SIZE, TILE_SIZE])
				}, opts.onTile, opts.onTileInit);
			}
		}
	}

	findLevelForScale(s, level, current = 1) {
		if(s > current / 2 || level === 1) {
			return level;
		}
		return this.findLevelForScale(s, --level, current / 2);
	}

	zoomTo(zoom, scale, level, onScale) {
		let newLevel = this.findLevelForScale(zoom, this.levels);
		let newScale = this.upScale(zoom, this.resolutions.length - newLevel);
		onScale(newScale, newLevel, parseInt(Math.ceil(this.fullWidth * zoom)), parseInt(Math.ceil(this.fullHeight * zoom)));
	}


	zoomBy(factor, scale, level, onScale) {
		let viewportScale = this.getRealScale(scale, level) + factor;
		if(viewportScale < 0.01) { viewportScale = 0.01; }
		let newLevel = this.findLevelForScale(viewportScale, this.levels);
		let newScale = this.upScale(viewportScale, this.resolutions.length - newLevel);

		onScale(newScale, newLevel, parseInt(Math.ceil(this.fullWidth * viewportScale)), parseInt(Math.ceil(this.fullHeight * viewportScale)));
	}


	getRealScale(scale, level) {
		return this.downScale(scale, this.resolutions.length - level);
	}

	getRealImagePos(position, scale, level) {
		let upscaleFactor = this.resolutions.length - level;
		return {
			x: Math.floor(this.upScale(position.x, upscaleFactor) * this.getRealScale(scale, level)),
			y: Math.floor(this.upScale(position.y, upscaleFactor) * this.getRealScale(scale, level)),
			w: Math.ceil(this.fullWidth * this.getRealScale(scale, level)),
			h: Math.ceil(this.fullHeight * this.getRealScale(scale, level))
		};
	}

	widthFill(opts) {
		let level = this.findLevel(opts.viewport.w, IDX_WIDTH);
		let scale = opts.viewport.w / this.resolutions[level - 1][IDX_WIDTH];
		let upscaleFactor = this.resolutions.length - level;
		let viewportScale = this.downScale(scale, upscaleFactor);

		if(opts.onScale) { opts.onScale(scale, level, parseInt(Math.ceil(this.fullWidth * viewportScale)), parseInt(Math.ceil(this.fullHeight * viewportScale))); }
		this.makeTiles(opts, level, scale);
	}

	fullZoom(opts) {
		let level = this.levels;
		let scale = 1;

		if(opts.onScale) { opts.onScale(scale, level, parseInt(Math.ceil(this.fullWidth)), parseInt(Math.ceil(this.fullHeight))); }
		this.makeTiles(opts, level, scale);
	}

	heightFill(opts) {
		let level = this.findLevel(opts.viewport.h, IDX_HEIGHT);
		let scale = opts.viewport.h / this.resolutions[level - 1][IDX_HEIGHT];
		let upscaleFactor = this.resolutions.length - level;
		let viewportScale = this.downScale(scale, upscaleFactor);

		if(opts.onScale) { opts.onScale(scale, level, parseInt(Math.ceil(this.fullWidth * viewportScale)), parseInt(Math.ceil(this.fullHeight * viewportScale))); }

		this.makeTiles(opts, level, scale);
	}

	autoFill(opts) {
		if(opts.viewport.h < opts.viewport.w) {
			this.heightFill(opts);
		} else {
			this.widthFill(opts);
		}
	}



	loadImage(opts) {
		if(opts.scaleMode) {
			this[opts.scaleMode](opts);
		} else {
			this.makeTiles(opts, opts.level, opts.scale);
		}

	}
}

export default Api;