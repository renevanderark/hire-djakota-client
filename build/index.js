(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.DjakotaClient = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var inserted = {};

module.exports = function (css, options) {
    if (inserted[css]) return;
    inserted[css] = true;
    
    var elem = document.createElement('style');
    elem.setAttribute('type', 'text/css');

    if ('textContent' in elem) {
      elem.textContent = css;
    } else {
      elem.styleSheet.cssText = css;
    }
    
    var head = document.getElementsByTagName('head')[0];
    if (options && options.prepend) {
        head.insertBefore(elem, head.childNodes[0]);
    } else {
        head.appendChild(elem);
    }
};

},{}],2:[function(_dereq_,module,exports){
// Load modules

var Stringify = _dereq_('./stringify');
var Parse = _dereq_('./parse');


// Declare internals

var internals = {};


module.exports = {
    stringify: Stringify,
    parse: Parse
};

},{"./parse":3,"./stringify":4}],3:[function(_dereq_,module,exports){
// Load modules

var Utils = _dereq_('./utils');


// Declare internals

var internals = {
    delimiter: '&',
    depth: 5,
    arrayLimit: 20,
    parameterLimit: 1000,
    strictNullHandling: false,
    plainObjects: false,
    allowPrototypes: false
};


internals.parseValues = function (str, options) {

    var obj = {};
    var parts = str.split(options.delimiter, options.parameterLimit === Infinity ? undefined : options.parameterLimit);

    for (var i = 0, il = parts.length; i < il; ++i) {
        var part = parts[i];
        var pos = part.indexOf(']=') === -1 ? part.indexOf('=') : part.indexOf(']=') + 1;

        if (pos === -1) {
            obj[Utils.decode(part)] = '';

            if (options.strictNullHandling) {
                obj[Utils.decode(part)] = null;
            }
        }
        else {
            var key = Utils.decode(part.slice(0, pos));
            var val = Utils.decode(part.slice(pos + 1));

            if (!Object.prototype.hasOwnProperty.call(obj, key)) {
                obj[key] = val;
            }
            else {
                obj[key] = [].concat(obj[key]).concat(val);
            }
        }
    }

    return obj;
};


internals.parseObject = function (chain, val, options) {

    if (!chain.length) {
        return val;
    }

    var root = chain.shift();

    var obj;
    if (root === '[]') {
        obj = [];
        obj = obj.concat(internals.parseObject(chain, val, options));
    }
    else {
        obj = options.plainObjects ? Object.create(null) : {};
        var cleanRoot = root[0] === '[' && root[root.length - 1] === ']' ? root.slice(1, root.length - 1) : root;
        var index = parseInt(cleanRoot, 10);
        var indexString = '' + index;
        if (!isNaN(index) &&
            root !== cleanRoot &&
            indexString === cleanRoot &&
            index >= 0 &&
            (options.parseArrays &&
             index <= options.arrayLimit)) {

            obj = [];
            obj[index] = internals.parseObject(chain, val, options);
        }
        else {
            obj[cleanRoot] = internals.parseObject(chain, val, options);
        }
    }

    return obj;
};


internals.parseKeys = function (key, val, options) {

    if (!key) {
        return;
    }

    // Transform dot notation to bracket notation

    if (options.allowDots) {
        key = key.replace(/\.([^\.\[]+)/g, '[$1]');
    }

    // The regex chunks

    var parent = /^([^\[\]]*)/;
    var child = /(\[[^\[\]]*\])/g;

    // Get the parent

    var segment = parent.exec(key);

    // Stash the parent if it exists

    var keys = [];
    if (segment[1]) {
        // If we aren't using plain objects, optionally prefix keys
        // that would overwrite object prototype properties
        if (!options.plainObjects &&
            Object.prototype.hasOwnProperty(segment[1])) {

            if (!options.allowPrototypes) {
                return;
            }
        }

        keys.push(segment[1]);
    }

    // Loop through children appending to the array until we hit depth

    var i = 0;
    while ((segment = child.exec(key)) !== null && i < options.depth) {

        ++i;
        if (!options.plainObjects &&
            Object.prototype.hasOwnProperty(segment[1].replace(/\[|\]/g, ''))) {

            if (!options.allowPrototypes) {
                continue;
            }
        }
        keys.push(segment[1]);
    }

    // If there's a remainder, just add whatever is left

    if (segment) {
        keys.push('[' + key.slice(segment.index) + ']');
    }

    return internals.parseObject(keys, val, options);
};


module.exports = function (str, options) {

    options = options || {};
    options.delimiter = typeof options.delimiter === 'string' || Utils.isRegExp(options.delimiter) ? options.delimiter : internals.delimiter;
    options.depth = typeof options.depth === 'number' ? options.depth : internals.depth;
    options.arrayLimit = typeof options.arrayLimit === 'number' ? options.arrayLimit : internals.arrayLimit;
    options.parseArrays = options.parseArrays !== false;
    options.allowDots = options.allowDots !== false;
    options.plainObjects = typeof options.plainObjects === 'boolean' ? options.plainObjects : internals.plainObjects;
    options.allowPrototypes = typeof options.allowPrototypes === 'boolean' ? options.allowPrototypes : internals.allowPrototypes;
    options.parameterLimit = typeof options.parameterLimit === 'number' ? options.parameterLimit : internals.parameterLimit;
    options.strictNullHandling = typeof options.strictNullHandling === 'boolean' ? options.strictNullHandling : internals.strictNullHandling;

    if (str === '' ||
        str === null ||
        typeof str === 'undefined') {

        return options.plainObjects ? Object.create(null) : {};
    }

    var tempObj = typeof str === 'string' ? internals.parseValues(str, options) : str;
    var obj = options.plainObjects ? Object.create(null) : {};

    // Iterate over the keys and setup the new object

    var keys = Object.keys(tempObj);
    for (var i = 0, il = keys.length; i < il; ++i) {
        var key = keys[i];
        var newObj = internals.parseKeys(key, tempObj[key], options);
        obj = Utils.merge(obj, newObj, options);
    }

    return Utils.compact(obj);
};

},{"./utils":5}],4:[function(_dereq_,module,exports){
// Load modules

var Utils = _dereq_('./utils');


// Declare internals

var internals = {
    delimiter: '&',
    arrayPrefixGenerators: {
        brackets: function (prefix, key) {

            return prefix + '[]';
        },
        indices: function (prefix, key) {

            return prefix + '[' + key + ']';
        },
        repeat: function (prefix, key) {

            return prefix;
        }
    },
    strictNullHandling: false
};


internals.stringify = function (obj, prefix, generateArrayPrefix, strictNullHandling, filter) {

    if (typeof filter === 'function') {
        obj = filter(prefix, obj);
    }
    else if (Utils.isBuffer(obj)) {
        obj = obj.toString();
    }
    else if (obj instanceof Date) {
        obj = obj.toISOString();
    }
    else if (obj === null) {
        if (strictNullHandling) {
            return Utils.encode(prefix);
        }

        obj = '';
    }

    if (typeof obj === 'string' ||
        typeof obj === 'number' ||
        typeof obj === 'boolean') {

        return [Utils.encode(prefix) + '=' + Utils.encode(obj)];
    }

    var values = [];

    if (typeof obj === 'undefined') {
        return values;
    }

    var objKeys = Array.isArray(filter) ? filter : Object.keys(obj);
    for (var i = 0, il = objKeys.length; i < il; ++i) {
        var key = objKeys[i];

        if (Array.isArray(obj)) {
            values = values.concat(internals.stringify(obj[key], generateArrayPrefix(prefix, key), generateArrayPrefix, strictNullHandling, filter));
        }
        else {
            values = values.concat(internals.stringify(obj[key], prefix + '[' + key + ']', generateArrayPrefix, strictNullHandling, filter));
        }
    }

    return values;
};


module.exports = function (obj, options) {

    options = options || {};
    var delimiter = typeof options.delimiter === 'undefined' ? internals.delimiter : options.delimiter;
    var strictNullHandling = typeof options.strictNullHandling === 'boolean' ? options.strictNullHandling : internals.strictNullHandling;
    var objKeys;
    var filter;
    if (typeof options.filter === 'function') {
        filter = options.filter;
        obj = filter('', obj);
    }
    else if (Array.isArray(options.filter)) {
        objKeys = filter = options.filter;
    }

    var keys = [];

    if (typeof obj !== 'object' ||
        obj === null) {

        return '';
    }

    var arrayFormat;
    if (options.arrayFormat in internals.arrayPrefixGenerators) {
        arrayFormat = options.arrayFormat;
    }
    else if ('indices' in options) {
        arrayFormat = options.indices ? 'indices' : 'repeat';
    }
    else {
        arrayFormat = 'indices';
    }

    var generateArrayPrefix = internals.arrayPrefixGenerators[arrayFormat];

    if (!objKeys) {
        objKeys = Object.keys(obj);
    }
    for (var i = 0, il = objKeys.length; i < il; ++i) {
        var key = objKeys[i];
        keys = keys.concat(internals.stringify(obj[key], key, generateArrayPrefix, strictNullHandling, filter));
    }

    return keys.join(delimiter);
};

},{"./utils":5}],5:[function(_dereq_,module,exports){
// Load modules


// Declare internals

var internals = {};
internals.hexTable = new Array(256);
for (var h = 0; h < 256; ++h) {
    internals.hexTable[h] = '%' + ((h < 16 ? '0' : '') + h.toString(16)).toUpperCase();
}


exports.arrayToObject = function (source, options) {

    var obj = options.plainObjects ? Object.create(null) : {};
    for (var i = 0, il = source.length; i < il; ++i) {
        if (typeof source[i] !== 'undefined') {

            obj[i] = source[i];
        }
    }

    return obj;
};


exports.merge = function (target, source, options) {

    if (!source) {
        return target;
    }

    if (typeof source !== 'object') {
        if (Array.isArray(target)) {
            target.push(source);
        }
        else if (typeof target === 'object') {
            target[source] = true;
        }
        else {
            target = [target, source];
        }

        return target;
    }

    if (typeof target !== 'object') {
        target = [target].concat(source);
        return target;
    }

    if (Array.isArray(target) &&
        !Array.isArray(source)) {

        target = exports.arrayToObject(target, options);
    }

    var keys = Object.keys(source);
    for (var k = 0, kl = keys.length; k < kl; ++k) {
        var key = keys[k];
        var value = source[key];

        if (!Object.prototype.hasOwnProperty.call(target, key)) {
            target[key] = value;
        }
        else {
            target[key] = exports.merge(target[key], value, options);
        }
    }

    return target;
};


exports.decode = function (str) {

    try {
        return decodeURIComponent(str.replace(/\+/g, ' '));
    } catch (e) {
        return str;
    }
};

exports.encode = function (str) {

    // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
    // It has been adapted here for stricter adherence to RFC 3986
    if (str.length === 0) {
        return str;
    }

    if (typeof str !== 'string') {
        str = '' + str;
    }

    var out = '';
    for (var i = 0, il = str.length; i < il; ++i) {
        var c = str.charCodeAt(i);

        if (c === 0x2D || // -
            c === 0x2E || // .
            c === 0x5F || // _
            c === 0x7E || // ~
            (c >= 0x30 && c <= 0x39) || // 0-9
            (c >= 0x41 && c <= 0x5A) || // a-z
            (c >= 0x61 && c <= 0x7A)) { // A-Z

            out += str[i];
            continue;
        }

        if (c < 0x80) {
            out += internals.hexTable[c];
            continue;
        }

        if (c < 0x800) {
            out += internals.hexTable[0xC0 | (c >> 6)] + internals.hexTable[0x80 | (c & 0x3F)];
            continue;
        }

        if (c < 0xD800 || c >= 0xE000) {
            out += internals.hexTable[0xE0 | (c >> 12)] + internals.hexTable[0x80 | ((c >> 6) & 0x3F)] + internals.hexTable[0x80 | (c & 0x3F)];
            continue;
        }

        ++i;
        c = 0x10000 + (((c & 0x3FF) << 10) | (str.charCodeAt(i) & 0x3FF));
        out += internals.hexTable[0xF0 | (c >> 18)] + internals.hexTable[0x80 | ((c >> 12) & 0x3F)] + internals.hexTable[0x80 | ((c >> 6) & 0x3F)] + internals.hexTable[0x80 | (c & 0x3F)];
    }

    return out;
};

exports.compact = function (obj, refs) {

    if (typeof obj !== 'object' ||
        obj === null) {

        return obj;
    }

    refs = refs || [];
    var lookup = refs.indexOf(obj);
    if (lookup !== -1) {
        return refs[lookup];
    }

    refs.push(obj);

    if (Array.isArray(obj)) {
        var compacted = [];

        for (var i = 0, il = obj.length; i < il; ++i) {
            if (typeof obj[i] !== 'undefined') {
                compacted.push(obj[i]);
            }
        }

        return compacted;
    }

    var keys = Object.keys(obj);
    for (i = 0, il = keys.length; i < il; ++i) {
        var key = keys[i];
        obj[key] = exports.compact(obj[key], refs);
    }

    return obj;
};


exports.isRegExp = function (obj) {

    return Object.prototype.toString.call(obj) === '[object RegExp]';
};


exports.isBuffer = function (obj) {

    if (obj === null ||
        typeof obj === 'undefined') {

        return false;
    }

    return !!(obj.constructor &&
              obj.constructor.isBuffer &&
              obj.constructor.isBuffer(obj));
};

},{}],6:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _qs = _dereq_("qs");

var _qs2 = _interopRequireDefault(_qs);

var BASE_PARAMS = {};

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

var IDX_WIDTH = 1;
var IDX_HEIGHT = 0;
var TILE_SIZE = 256;

var Api = (function () {
	function Api(service, config) {
		_classCallCheck(this, Api);

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

	_createClass(Api, [{
		key: "initializeResolutions",
		value: function initializeResolutions(level, w, h) {
			this.resolutions.unshift([h, w]);
			if (level > 0) {
				this.initializeResolutions(--level, parseInt(Math.floor(w / 2)), parseInt(Math.floor(h / 2)));
			}
		}
	}, {
		key: "findLevel",
		value: function findLevel(dim, idx) {
			var i = undefined;
			for (i = 0; i < this.resolutions.length; i++) {
				if (this.resolutions[i][idx] > dim) {
					return i + 1;
				}
			}
			return i;
		}
	}, {
		key: "makeTileUrl",
		value: function makeTileUrl(level, dims) {

			return this.service + "?" + _qs2["default"].stringify(Object.assign(this.params, {
				"svc.region": dims.join(","),
				"svc.level": level,
				"svc_id": "info:lanl-repo/svc/getRegion"
			}));
		}
	}, {
		key: "downScale",
		value: function downScale(val, times) {
			return times > 0 ? this.downScale(val / 2, --times) : val;
		}
	}, {
		key: "upScale",
		value: function upScale(val, times) {
			return times > 0 ? this.upScale(val * 2, --times) : val;
		}
	}, {
		key: "onTileLoad",
		value: function onTileLoad(tileIm, tile, onTile) {
			if (!tileIm.complete) {
				setTimeout(this.onTileLoad.bind(this, tileIm, tile, onTile), 15);
			} else {
				onTile(tileIm, tile);
			}
		}
	}, {
		key: "fetchTile",
		value: function fetchTile(tile, onTile) {
			var key = tile.realX + "-" + tile.realY + "-" + tile.level + "-" + tile.url;
			if (this.tileMap[key]) {
				onTile(this.tileMap[key], tile);
			} else {
				this.tileMap[key] = new Image();
				this.tileMap[key].onload = this.onTileLoad.bind(this, this.tileMap[key], tile, onTile);
				this.tileMap[key].src = tile.url;
			}
		}
	}, {
		key: "getStart",
		value: function getStart(dim) {
			var n = 0;
			while (dim + n < -TILE_SIZE) {
				n += TILE_SIZE;
			}
			return n;
		}
	}, {
		key: "makeTiles",
		value: function makeTiles(opts, level, scale, onTile) {
			var upscaleFactor = this.resolutions.length - level;
			var yStart = this.getStart(opts.position.y);
			var xStart = this.getStart(opts.position.x);

			for (var y = yStart; (y - yStart) * scale - TILE_SIZE * 2 + opts.position.y < opts.viewport.h && this.upScale(y, upscaleFactor) < this.fullHeight; y += TILE_SIZE) {

				for (var x = xStart; (x - xStart) * scale - TILE_SIZE * 2 + opts.position.x < opts.viewport.w && this.upScale(x, upscaleFactor) < this.fullWidth; x += TILE_SIZE) {

					var realTileW = this.upScale(x, upscaleFactor) + this.upScale(TILE_SIZE, upscaleFactor) > this.fullWidth ? parseInt(this.downScale(this.fullWidth - this.upScale(x, upscaleFactor), upscaleFactor)) : TILE_SIZE;

					var realTileH = this.upScale(y, upscaleFactor) + this.upScale(TILE_SIZE, upscaleFactor) > this.fullHeight ? parseInt(this.downScale(this.fullHeight - this.upScale(y, upscaleFactor), upscaleFactor)) : TILE_SIZE;

					this.fetchTile({
						realX: x,
						realY: y,
						timeStamp: opts.timeStamp,
						pos: {
							x: x + opts.position.x,
							y: y + opts.position.y
						},
						level: level,
						url: this.makeTileUrl(level, [this.upScale(y, upscaleFactor), this.upScale(x, upscaleFactor), TILE_SIZE, TILE_SIZE])
					}, opts.onTile);
				}
			}
		}
	}, {
		key: "findLevelForScale",
		value: function findLevelForScale(s, level) {
			var current = arguments.length <= 2 || arguments[2] === undefined ? 1 : arguments[2];

			if (s > current / 2 || level === 1) {
				return level;
			}
			return this.findLevelForScale(s, --level, current / 2);
		}
	}, {
		key: "zoomBy",
		value: function zoomBy(factor, scale, level, onScale, onImageBounds) {
			var upscaleFactor = this.resolutions.length - level;
			var viewportScale = this.downScale(scale, upscaleFactor) * factor;
			var newLevel = this.findLevelForScale(viewportScale, this.levels);
			var newScale = this.upScale(viewportScale, this.resolutions.length - newLevel);

			onImageBounds(parseInt(Math.ceil(this.fullWidth * viewportScale)), parseInt(Math.ceil(this.fullHeight * viewportScale)));
			onScale(newScale, newLevel);
		}
	}, {
		key: "widthFill",
		value: function widthFill(opts) {
			var level = this.findLevel(opts.viewport.w, IDX_WIDTH);
			var scale = opts.viewport.w / this.resolutions[level - 1][IDX_WIDTH];
			if (opts.onScale) {
				opts.onScale(scale, level);
			}
			this.makeTiles(opts, level, scale);
		}
	}, {
		key: "heightFill",
		value: function heightFill(opts) {
			var level = this.findLevel(opts.viewport.h, IDX_HEIGHT);
			var scale = opts.viewport.h / this.resolutions[level - 1][IDX_HEIGHT];
			if (opts.onScale) {
				opts.onScale(scale, level);
			}

			this.makeTiles(opts, level, scale);
		}
	}, {
		key: "loadImage",
		value: function loadImage(opts, onScale) {
			if (opts.scaleMode) {
				this[opts.scaleMode](opts);
			} else {
				this.makeTiles(opts, opts.level, opts.scale);
			}
		}
	}]);

	return Api;
})();

exports["default"] = Api;
module.exports = exports["default"];

},{"qs":2}],7:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _react = _dereq_("react");

var _react2 = _interopRequireDefault(_react);

var _api = _dereq_("./api");

var _api2 = _interopRequireDefault(_api);

var _requestAnimationFrame = _dereq_('./request-animation-frame');

var _insertCss = _dereq_("insert-css");

var _insertCss2 = _interopRequireDefault(_insertCss);



var css = Buffer("LmhpcmUtZGpha290YS1jbGllbnQgewoJd2lkdGg6IDEwMCU7CgloZWlnaHQ6IDEwMCU7Cn0KCi5oaXJlLWRqYWtvdGEtY2xpZW50ID4gLmludGVyYWN0aW9uLAouaGlyZS1kamFrb3RhLWNsaWVudCA+IC5pbWFnZSB7Cglwb3NpdGlvbjogYWJzb2x1dGU7Cn0KCi5oaXJlLWRqYWtvdGEtY2xpZW50ID4gLmludGVyYWN0aW9uIHsKCXotaW5kZXg6IDE7Cn0=","base64");
(0, _insertCss2["default"])(css, { prepend: true });

var MOUSE_UP = 0;
var MOUSE_DOWN = 1;

var TOUCH_END = 0;
var TOUCH_START = 1;

_react2["default"].initializeTouchEvents(true);

var DjakotaClient = (function (_React$Component) {
	_inherits(DjakotaClient, _React$Component);

	function DjakotaClient(props) {
		_classCallCheck(this, DjakotaClient);

		_get(Object.getPrototypeOf(DjakotaClient.prototype), "constructor", this).call(this, props);
		this.api = new _api2["default"](this.props.service, this.props.config);

		this.state = {
			width: null,
			height: null
		};

		this.movement = { x: 0, y: 0 };
		this.touchPos = { x: 0, y: 0 };
		this.mousePos = { x: 0, y: 0 };
		this.imagePos = { x: 0, y: 0 };
		this.mouseState = MOUSE_UP;
		this.imageCtx = null;
		this.resizeDelay = 0;
		this.scale = 1.0;
		this.level = null;

		this.resizeListener = this.onResize.bind(this);
		this.animationFrameListener = this.onAnimationFrame.bind(this);
		this.mousemoveListener = this.onMouseMove.bind(this);
		this.mouseupListener = this.onMouseUp.bind(this);
		this.frameBuffer = [];
		this.frameClearBuffer = [];
		this.clearTime = 0;
		this.touchmap = { startPos: false, positions: [], tapStart: 0, lastTap: 0, pinchDelta: 0, pinchDistance: 0 };
	}

	_createClass(DjakotaClient, [{
		key: "componentDidMount",
		value: function componentDidMount() {
			this.onResize();
			this.imageCtx = _react2["default"].findDOMNode(this).children[0].getContext('2d');
			window.addEventListener("resize", this.resizeListener);
			window.addEventListener("mousemove", this.mousemoveListener);
			window.addEventListener("mouseup", this.mouseupListener);

			(0, _requestAnimationFrame.requestAnimationFrame)(this.animationFrameListener);
		}
	}, {
		key: "componentWillUnmount",
		value: function componentWillUnmount() {
			window.removeEventListener("resize", this.resizeListener);
			window.removeEventListener("mousemove", this.mousemoveListener);
			window.removeEventListener("mouseup", this.mouseupListener);

			(0, _requestAnimationFrame.cancelAnimationFrame)(this.animationFrameListener);
		}
	}, {
		key: "onAnimationFrame",
		value: function onAnimationFrame() {
			if (this.frameClearBuffer.length > 0 || this.frameBuffer.length === 0) {
				// trigger a redraw when window is cleared, but no new tiles in framebuffer
				this.loadImage({ scale: this.scale, level: this.level });
			}
			while (this.frameClearBuffer.length > 0) {
				var _imageCtx;

				(_imageCtx = this.imageCtx).clearRect.apply(_imageCtx, _toConsumableArray(this.frameClearBuffer.pop()));
			}

			while (this.frameBuffer.length > 0) {
				var _imageCtx2;

				(_imageCtx2 = this.imageCtx).drawImage.apply(_imageCtx2, _toConsumableArray(this.frameBuffer.pop()));
			}
			(0, _requestAnimationFrame.requestAnimationFrame)(this.animationFrameListener);
		}
	}, {
		key: "onResize",
		value: function onResize() {
			if (this.resizeDelay > 0) {
				this.resizeDelay--;
				window.setTimeout(this.onResize.bind(this), 10);
			} else {
				this.imagePos.x = 0;
				this.imagePos.y = 0;

				var node = _react2["default"].findDOMNode(this);
				this.setState({
					width: node.clientWidth,
					height: node.clientHeight
				}, this.afterResize.bind(this));
				this.resizeDelay = 5;
			}
		}
	}, {
		key: "loadImage",
		value: function loadImage() {
			var opts = arguments.length <= 0 || arguments[0] === undefined ? { scaleMode: "widthFill" } : arguments[0];

			this.clearTime = new Date().getTime() - 10;
			this.frameClearBuffer.push([0, 0, this.state.width, this.state.height]);
			this.api.loadImage(_extends({
				viewport: { w: this.state.width, h: this.state.height },
				position: this.imagePos,
				onTile: this.renderTile.bind(this),
				onScale: this.setScale.bind(this),
				timeStamp: new Date().getTime()
			}, opts));
		}
	}, {
		key: "afterResize",
		value: function afterResize() {
			this.loadImage();
		}
	}, {
		key: "setScale",
		value: function setScale(s, l) {
			this.scale = s;
			this.level = l;
		}
	}, {
		key: "renderTile",
		value: function renderTile(tileIm, tile) {
			if (tile.timeStamp >= this.clearTime) {
				this.frameBuffer.push([tileIm, parseInt(Math.floor(tile.pos.x * this.scale)), parseInt(Math.floor(tile.pos.y * this.scale)), parseInt(Math.ceil(tileIm.width * this.scale)), parseInt(Math.ceil(tileIm.height * this.scale))]);
			}
		}
	}, {
		key: "onMouseDown",
		value: function onMouseDown(ev) {
			this.mousePos.x = ev.clientX;
			this.mousePos.y = ev.clientY;
			this.movement = { x: 0, y: 0 };
			this.mouseState = MOUSE_DOWN;
		}
	}, {
		key: "onTouchStart",
		value: function onTouchStart(ev) {
			this.touchPos.x = ev.touches[0].pageX;
			this.touchPos.y = ev.touches[0].pageY;
			this.movement = { x: 0, y: 0 };
			this.touchState = TOUCH_START;
		}
	}, {
		key: "onMouseMove",
		value: function onMouseMove(ev) {
			switch (this.mouseState) {
				case MOUSE_DOWN:
					this.movement.x = this.mousePos.x - ev.clientX;
					this.movement.y = this.mousePos.y - ev.clientY;
					this.imagePos.x -= this.movement.x;
					this.imagePos.y -= this.movement.y;
					this.mousePos.x = ev.clientX;
					this.mousePos.y = ev.clientY;

					this.frameBuffer = [];
					this.loadImage({ scale: this.scale, level: this.level });

					break;
				case MOUSE_UP:
				default:
			}
		}
	}, {
		key: "onTouchMove",
		value: function onTouchMove(ev) {
			for (var i = 0; i < ev.touches.length; i++) {
				var cur = { x: ev.touches[i].pageX, y: ev.touches[i].pageY };
				this.touchmap.positions[i] = cur;
			}

			if (ev.touches.length === 2) {
				var oldD = this.touchmap.pinchDistance;
				this.touchmap.pinchDistance = parseInt(Math.sqrt((this.touchmap.positions[0].x - this.touchmap.positions[1].x) * (this.touchmap.positions[0].x - this.touchmap.positions[1].x) + (this.touchmap.positions[0].y - this.touchmap.positions[1].y) * (this.touchmap.positions[0].y - this.touchmap.positions[1].y)), 10);
				this.touchmap.pinchDelta = oldD - this.touchmap.pinchDistance;
				if (this.touchmap.pinchDelta < 20 && this.touchmap.pinchDelta > -20) {
					var sHeur = 1.0 - this.touchmap.pinchDelta * 0.01;
					this.api.zoomBy(sHeur, this.scale, this.level, this.zoom.bind(this), this.onImageBoundsBeforeZoom.bind(this));
				}
			} else {
				this.movement.x = this.touchPos.x - ev.touches[0].pageX;
				this.movement.y = this.touchPos.y - ev.touches[0].pageY;
				this.imagePos.x -= this.movement.x;
				this.imagePos.y -= this.movement.y;
				this.touchPos.x = ev.touches[0].pageX;
				this.touchPos.y = ev.touches[0].pageY;
				this.frameBuffer = [];
				this.loadImage({ scale: this.scale, level: this.level });
			}
			ev.preventDefault();
			ev.stopPropagation();
		}
	}, {
		key: "onTouchEnd",
		value: function onTouchEnd(ev) {
			this.touchState = TOUCH_END;
		}
	}, {
		key: "onMouseUp",
		value: function onMouseUp(ev) {
			this.mouseState = MOUSE_UP;
			this.loadImage({ scale: this.scale, level: this.level });
		}
	}, {
		key: "zoom",
		value: function zoom(s, l) {
			this.setScale(s, l);
			this.loadImage({ scale: this.scale, level: this.level });
		}
	}, {
		key: "onImageBoundsBeforeZoom",
		value: function onImageBoundsBeforeZoom(w, h) {
			if (w > this.state.width) {
				this.imagePos.x = -parseInt((w - this.state.width) / 2);
			} else if (w < this.state.width) {
				this.imagePos.x = parseInt((this.state.width - w) / 2);
			}

			if (h > this.state.height) {
				this.imagePos.y = -parseInt((h - this.state.height) / 2);
			} else if (h < this.state.width) {
				this.imagePos.y = parseInt((this.state.height - h) / 2);
			}
		}
	}, {
		key: "onWheel",
		value: function onWheel(ev) {

			if (ev.nativeEvent.deltaY < 0) {
				this.api.zoomBy(1.1, this.scale, this.level, this.zoom.bind(this), this.onImageBoundsBeforeZoom.bind(this));
			} else if (ev.nativeEvent.deltaY > 0) {
				this.api.zoomBy(0.9, this.scale, this.level, this.zoom.bind(this), this.onImageBoundsBeforeZoom.bind(this));
			}
		}
	}, {
		key: "render",
		value: function render() {

			return _react2["default"].createElement(
				"div",
				{ className: "hire-djakota-client" },
				_react2["default"].createElement("canvas", {
					className: "image",
					height: this.state.height,
					width: this.state.width
				}),
				_react2["default"].createElement("canvas", {
					className: "interaction",
					height: this.state.height,
					onMouseDown: this.onMouseDown.bind(this),
					onTouchEnd: this.onTouchEnd.bind(this),
					onTouchMove: this.onTouchMove.bind(this),
					onTouchStart: this.onTouchStart.bind(this),
					onWheel: this.onWheel.bind(this),
					width: this.state.width
				})
			);
		}
	}]);

	return DjakotaClient;
})(_react2["default"].Component);

DjakotaClient.propTypes = {
	config: _react2["default"].PropTypes.object.isRequired,
	service: _react2["default"].PropTypes.string.isRequired
};

exports["default"] = DjakotaClient;
module.exports = exports["default"];

},{"./api":6,"./request-animation-frame":8,"insert-css":1,"react":"react"}],8:[function(_dereq_,module,exports){
/*
The MIT License (MIT)

Copyright (c) 2015 Eryk Napierała

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
https://github.com/erykpiast/request-animation-frame-shim/
*/

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var requestAnimationFrame = 'function' === typeof global.requestAnimationFrame ? function (cb) {
    return global.requestAnimationFrame(cb);
} : 'function' === typeof global.webkitRequestAnimationFrame ? function (cb) {
    return global.webkitRequestAnimationFrame(cb);
} : 'function' === typeof global.mozRequestAnimationFrame ? function (cb) {
    return global.mozRequestAnimationFrame(cb);
} : undefined;

exports.requestAnimationFrame = requestAnimationFrame;
var cancelAnimationFrame = 'function' === typeof global.cancelAnimationFrame ? function (cb) {
    return global.cancelAnimationFrame(cb);
} : 'function' === typeof global.webkitCancelAnimationFrame ? function (cb) {
    return global.webkitCancelAnimationFrame(cb);
} : 'function' === typeof global.webkitCancelRequestAnimationFrame ? function (cb) {
    return global.webkitCancelRequestAnimationFrame(cb);
} : 'function' === typeof global.mozCancelAnimationFrame ? function (cb) {
    return global.mozCancelAnimationFrame(cb);
} : undefined;
exports.cancelAnimationFrame = cancelAnimationFrame;

},{}]},{},[7])(7)
});