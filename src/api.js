import qs from "qs";

const BASE_PARAMS = {
};

/*
var params = {
	url: url,
	rft_id: "http://localhost:8080/jp2/14284083156311.jp2",
	svc_id: "info:lanl-repo/svc/getMetadata"
}

url_ver=Z39.88-2004&
rft_id=http://localhost:8080/jp2/14284083156311.jp2&
svc_id=info:lanl-repo/svc/getRegion&
svc_val_fmt=info:ofi/fmt:kev:mtx:jpeg2000&
svc.format=image/jpeg&
svc.scale=42,278

*/

/*
https://tomcat.tiler01.huygens.knaw.nl/adore-djatoka/resolver?
url_ver=Z39.88-2004&
rft_id=http://localhost:8080/jp2/14284083156311.jp2&
svc_id=info:lanl-repo/svc/getRegion&
svc_val_fmt=info:ofi/fmt:kev:mtx:jpeg2000&
svc.format=image/jpeg&
svc.level=1&
svc.rotate=0&
svc.region=0,0,256,256
*/

/*
https://tomcat.tiler01.huygens.knaw.nl/adore-djatoka/resolver?
rft_id=http%3A%2F%2Flocalhost%3A8080%2Fjp2%2F14284083156311.jp2
&url_ver=Z39.88-2004&
svc_val_fmt=info%3Aofi%2Ffmt%3Akev%3Amtx%3Ajpeg2000&
svc.format=image%2Fjpeg&
svc_id=info%3Alanl-repo%2Fsvc%2FgetRegion&
level=1
*/

/*
https://tomcat.tiler01.huygens.knaw.nl/adore-djatoka/resolver?
url_ver=Z39.88-2004&
rft_id=http://localhost:8080/jp2/14284083156311.jp2&
svc_id=info:lanl-repo/svc/getRegion&
svc_val_fmt=info:ofi/fmt:kev:mtx:jpeg2000&
svc.format=image/jpeg&svc.level=4&
svc.region=2048,0,256,256
*/

const IDX_WIDTH = 1;
const IDX_HEIGHT = 0;
const TILE_SIZE = 256;

class Api {
	constructor(service, config) {
		this.service = service;
		this.config = config;
		this.params = {
			rft_id: this.config.identifier,
			url_ver: "Z39.88-2004",
			svc_val_fmt: "info:ofi/fmt:kev:mtx:jpeg2000",
			"svc.format": "image/jpeg"
		};
		this.levels = parseInt(this.config.dwtLevels);
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
		if(this.tileMap[key]) {
			onTile(this.tileMap[key], tile);
		} else {
			this.tileMap[key] = new Image();
			this.tileMap[key].onload = this.onTileLoad.bind(this, this.tileMap[key], tile, onTile);
			this.tileMap[key].src = tile.url;
		}
	}

	getStart(dim) {
		let n = 0;
		while(dim + n < -TILE_SIZE) {
			n += TILE_SIZE;
		}
		return n;
	}

	makeTiles(opts, level, scale, onTile) {
		let upscaleFactor = this.resolutions.length - level;
		let yStart = this.getStart(opts.position.y);
		let xStart = this.getStart(opts.position.x);

		for(let y = yStart; 
				((y - yStart) * scale) - TILE_SIZE * 2 + opts.position.y < opts.viewport.h  && 
				this.upScale(y, upscaleFactor) < this.fullHeight ;
				y += TILE_SIZE) {

			for(let x = xStart; 
				((x - xStart) * scale) - TILE_SIZE * 2 + opts.position.x < opts.viewport.w && 
				this.upScale(x, upscaleFactor) < this.fullWidth ; 
				x += TILE_SIZE) {


				let realTileW =  this.upScale(x, upscaleFactor) + this.upScale(TILE_SIZE, upscaleFactor) > this.fullWidth ?
					parseInt(this.downScale(this.fullWidth - this.upScale(x, upscaleFactor), upscaleFactor)) :
					TILE_SIZE;

				let realTileH = this.upScale(y, upscaleFactor) + this.upScale(TILE_SIZE, upscaleFactor) > this.fullHeight ?
					parseInt(this.downScale(this.fullHeight - this.upScale(y, upscaleFactor), upscaleFactor)) :
					TILE_SIZE;

				this.fetchTile({
					realX: x,
					realY: y,
					timeStamp: opts.timeStamp,
					pos: {
						x: x + opts.position.x,
						y: y + opts.position.y
					},
					level: level,
					url: this.makeTileUrl(level, [this.upScale(y, upscaleFactor), this.upScale(x, upscaleFactor), TILE_SIZE,TILE_SIZE])
				}, opts.onTile);
			}
		}
	}

	findLevelForScale(s, level, current = 1) {
		if(s > current / 2 || level === 1) {
			return level;
		}
		return this.findLevelForScale(s, --level, current / 2);
	}

	zoomBy(factor, scale, level, onScale) {
		let upscaleFactor = this.resolutions.length - level;
		let viewportScale = this.downScale(scale, upscaleFactor) * factor;
		let newLevel = this.findLevelForScale(viewportScale, this.levels);
		let newScale = this.upScale(viewportScale, this.resolutions.length - newLevel);

		onScale(newScale, newLevel, parseInt(Math.ceil(this.fullWidth * viewportScale)), parseInt(Math.ceil(this.fullHeight * viewportScale)));
	}


	widthFill(opts) {
		let level = this.findLevel(opts.viewport.w, IDX_WIDTH);
		let scale = opts.viewport.w / this.resolutions[level - 1][IDX_WIDTH];
		if(opts.onScale) { opts.onScale(scale, level); }
		this.makeTiles(opts, level, scale);
	}

	heightFill(opts) {
		let level = this.findLevel(opts.viewport.h, IDX_HEIGHT);
		let scale = opts.viewport.h / this.resolutions[level - 1][IDX_HEIGHT];
		if(opts.onScale) { opts.onScale(scale, level); }

		this.makeTiles(opts, level, scale);
	}

	loadImage(opts, onScale) {
		if(opts.scaleMode) {
			this[opts.scaleMode](opts);
		} else {
			this.makeTiles(opts, opts.level, opts.scale);
		}

	}
}

export default Api;