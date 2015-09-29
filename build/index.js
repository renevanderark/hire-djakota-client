(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.DjatokaClient = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
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
'use strict';

exports.__esModule = true;
exports['default'] = createStore;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _utilsIsPlainObject = _dereq_('./utils/isPlainObject');

var _utilsIsPlainObject2 = _interopRequireDefault(_utilsIsPlainObject);

/**
 * These are private action types reserved by Redux.
 * For any unknown actions, you must return the current state.
 * If the current state is undefined, you must return the initial state.
 * Do not reference these action types directly in your code.
 */
var ActionTypes = {
  INIT: '@@redux/INIT'
};

exports.ActionTypes = ActionTypes;
/**
 * Creates a Redux store that holds the state tree.
 * The only way to change the data in the store is to call `dispatch()` on it.
 *
 * There should only be a single store in your app. To specify how different
 * parts of the state tree respond to actions, you may combine several reducers
 * into a single reducer function by using `combineReducers`.
 *
 * @param {Function} reducer A function that returns the next state tree, given
 * the current state tree and the action to handle.
 *
 * @param {any} [initialState] The initial state. You may optionally specify it
 * to hydrate the state from the server in universal apps, or to restore a
 * previously serialized user session.
 * If you use `combineReducers` to produce the root reducer function, this must be
 * an object with the same shape as `combineReducers` keys.
 *
 * @returns {Store} A Redux store that lets you read the state, dispatch actions
 * and subscribe to changes.
 */

function createStore(reducer, initialState) {
  if (typeof reducer !== 'function') {
    throw new Error('Expected the reducer to be a function.');
  }

  var currentReducer = reducer;
  var currentState = initialState;
  var listeners = [];
  var isDispatching = false;

  /**
   * Reads the state tree managed by the store.
   *
   * @returns {any} The current state tree of your application.
   */
  function getState() {
    return currentState;
  }

  /**
   * Adds a change listener. It will be called any time an action is dispatched,
   * and some part of the state tree may potentially have changed. You may then
   * call `getState()` to read the current state tree inside the callback.
   *
   * @param {Function} listener A callback to be invoked on every dispatch.
   * @returns {Function} A function to remove this change listener.
   */
  function subscribe(listener) {
    listeners.push(listener);

    return function unsubscribe() {
      var index = listeners.indexOf(listener);
      listeners.splice(index, 1);
    };
  }

  /**
   * Dispatches an action. It is the only way to trigger a state change.
   *
   * The `reducer` function, used to create the store, will be called with the
   * current state tree and the given `action`. Its return value will
   * be considered the **next** state of the tree, and the change listeners
   * will be notified.
   *
   * The base implementation only supports plain object actions. If you want to
   * dispatch a Promise, an Observable, a thunk, or something else, you need to
   * wrap your store creating function into the corresponding middleware. For
   * example, see the documentation for the `redux-thunk` package. Even the
   * middleware will eventually dispatch plain object actions using this method.
   *
   * @param {Object} action A plain object representing “what changed”. It is
   * a good idea to keep actions serializable so you can record and replay user
   * sessions, or use the time travelling `redux-devtools`.
   *
   * @returns {Object} For convenience, the same action object you dispatched.
   *
   * Note that, if you use a custom middleware, it may wrap `dispatch()` to
   * return something else (for example, a Promise you can await).
   */
  function dispatch(action) {
    if (!_utilsIsPlainObject2['default'](action)) {
      throw new Error('Actions must be plain objects. Use custom middleware for async actions.');
    }

    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.');
    }

    try {
      isDispatching = true;
      currentState = currentReducer(currentState, action);
    } finally {
      isDispatching = false;
    }

    listeners.slice().forEach(function (listener) {
      return listener();
    });
    return action;
  }

  /**
   * Returns the reducer currently used by the store to calculate the state.
   *
   * It is likely that you will only need this function if you implement a hot
   * reloading mechanism for Redux.
   *
   * @returns {Function} The reducer used by the current store.
   */
  function getReducer() {
    return currentReducer;
  }

  /**
   * Replaces the reducer currently used by the store to calculate the state.
   *
   * You might need this if your app implements code splitting and you want to
   * load some of the reducers dynamically. You might also need this if you
   * implement a hot reloading mechanism for Redux.
   *
   * @param {Function} nextReducer The reducer for the store to use instead.
   * @returns {void}
   */
  function replaceReducer(nextReducer) {
    currentReducer = nextReducer;
    dispatch({ type: ActionTypes.INIT });
  }

  // When a store is created, an "INIT" action is dispatched so that every
  // reducer returns their initial state. This effectively populates
  // the initial state tree.
  dispatch({ type: ActionTypes.INIT });

  return {
    dispatch: dispatch,
    subscribe: subscribe,
    getState: getState,
    getReducer: getReducer,
    replaceReducer: replaceReducer
  };
}
},{"./utils/isPlainObject":12}],7:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _createStore = _dereq_('./createStore');

var _createStore2 = _interopRequireDefault(_createStore);

var _utilsCombineReducers = _dereq_('./utils/combineReducers');

var _utilsCombineReducers2 = _interopRequireDefault(_utilsCombineReducers);

var _utilsBindActionCreators = _dereq_('./utils/bindActionCreators');

var _utilsBindActionCreators2 = _interopRequireDefault(_utilsBindActionCreators);

var _utilsApplyMiddleware = _dereq_('./utils/applyMiddleware');

var _utilsApplyMiddleware2 = _interopRequireDefault(_utilsApplyMiddleware);

var _utilsCompose = _dereq_('./utils/compose');

var _utilsCompose2 = _interopRequireDefault(_utilsCompose);

exports.createStore = _createStore2['default'];
exports.combineReducers = _utilsCombineReducers2['default'];
exports.bindActionCreators = _utilsBindActionCreators2['default'];
exports.applyMiddleware = _utilsApplyMiddleware2['default'];
exports.compose = _utilsCompose2['default'];
},{"./createStore":6,"./utils/applyMiddleware":8,"./utils/bindActionCreators":9,"./utils/combineReducers":10,"./utils/compose":11}],8:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports['default'] = applyMiddleware;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _compose = _dereq_('./compose');

var _compose2 = _interopRequireDefault(_compose);

/**
 * Creates a store enhancer that applies middleware to the dispatch method
 * of the Redux store. This is handy for a variety of tasks, such as expressing
 * asynchronous actions in a concise manner, or logging every action payload.
 *
 * See `redux-thunk` package as an example of the Redux middleware.
 *
 * Because middleware is potentially asynchronous, this should be the first
 * store enhancer in the composition chain.
 *
 * Note that each middleware will be given the `dispatch` and `getState` functions
 * as named arguments.
 *
 * @param {...Function} middlewares The middleware chain to be applied.
 * @returns {Function} A store enhancer applying the middleware.
 */

function applyMiddleware() {
  for (var _len = arguments.length, middlewares = Array(_len), _key = 0; _key < _len; _key++) {
    middlewares[_key] = arguments[_key];
  }

  return function (next) {
    return function (reducer, initialState) {
      var store = next(reducer, initialState);
      var _dispatch = store.dispatch;
      var chain = [];

      var middlewareAPI = {
        getState: store.getState,
        dispatch: function dispatch(action) {
          return _dispatch(action);
        }
      };
      chain = middlewares.map(function (middleware) {
        return middleware(middlewareAPI);
      });
      _dispatch = _compose2['default'].apply(undefined, chain.concat([store.dispatch]));

      return _extends({}, store, {
        dispatch: _dispatch
      });
    };
  };
}

module.exports = exports['default'];
},{"./compose":11}],9:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = bindActionCreators;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _utilsMapValues = _dereq_('../utils/mapValues');

var _utilsMapValues2 = _interopRequireDefault(_utilsMapValues);

function bindActionCreator(actionCreator, dispatch) {
  return function () {
    return dispatch(actionCreator.apply(undefined, arguments));
  };
}

/**
 * Turns an object whose values are action creators, into an object with the
 * same keys, but with every function wrapped into a `dispatch` call so they
 * may be invoked directly. This is just a convenience method, as you can call
 * `store.dispatch(MyActionCreators.doSomething())` yourself just fine.
 *
 * For convenience, you can also pass a single function as the first argument,
 * and get a function in return.
 *
 * @param {Function|Object} actionCreators An object whose values are action
 * creator functions. One handy way to obtain it is to use ES6 `import * as`
 * syntax. You may also pass a single function.
 *
 * @param {Function} dispatch The `dispatch` function available on your Redux
 * store.
 *
 * @returns {Function|Object} The object mimicking the original object, but with
 * every action creator wrapped into the `dispatch` call. If you passed a
 * function as `actionCreators`, the return value will also be a single
 * function.
 */

function bindActionCreators(actionCreators, dispatch) {
  if (typeof actionCreators === 'function') {
    return bindActionCreator(actionCreators, dispatch);
  }

  if (typeof actionCreators !== 'object' || actionCreators == null) {
    throw new Error('bindActionCreators expected an object or a function, instead received ' + typeof actionCreators + '. ' + 'Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?');
  }

  return _utilsMapValues2['default'](actionCreators, function (actionCreator) {
    return bindActionCreator(actionCreator, dispatch);
  });
}

module.exports = exports['default'];
},{"../utils/mapValues":13}],10:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = combineReducers;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _createStore = _dereq_('../createStore');

var _utilsIsPlainObject = _dereq_('../utils/isPlainObject');

var _utilsIsPlainObject2 = _interopRequireDefault(_utilsIsPlainObject);

var _utilsMapValues = _dereq_('../utils/mapValues');

var _utilsMapValues2 = _interopRequireDefault(_utilsMapValues);

var _utilsPick = _dereq_('../utils/pick');

var _utilsPick2 = _interopRequireDefault(_utilsPick);

function getErrorMessage(key, action) {
  var actionType = action && action.type;
  var actionName = actionType && '"' + actionType.toString() + '"' || 'an action';

  return 'Reducer "' + key + '" returned undefined handling ' + actionName + '. ' + 'To ignore an action, you must explicitly return the previous state.';
}

function verifyStateShape(initialState, currentState) {
  var reducerKeys = Object.keys(currentState);

  if (reducerKeys.length === 0) {
    console.error('Store does not have a valid reducer. Make sure the argument passed ' + 'to combineReducers is an object whose values are reducers.');
    return;
  }

  if (!_utilsIsPlainObject2['default'](initialState)) {
    console.error('initialState has unexpected type of "' + ({}).toString.call(initialState).match(/\s([a-z|A-Z]+)/)[1] + '". Expected initialState to be an object with the following ' + ('keys: "' + reducerKeys.join('", "') + '"'));
    return;
  }

  var unexpectedKeys = Object.keys(initialState).filter(function (key) {
    return reducerKeys.indexOf(key) < 0;
  });

  if (unexpectedKeys.length > 0) {
    console.error('Unexpected ' + (unexpectedKeys.length > 1 ? 'keys' : 'key') + ' ' + ('"' + unexpectedKeys.join('", "') + '" in initialState will be ignored. ') + ('Expected to find one of the known reducer keys instead: "' + reducerKeys.join('", "') + '"'));
  }
}

/**
 * Turns an object whose values are different reducer functions, into a single
 * reducer function. It will call every child reducer, and gather their results
 * into a single state object, whose keys correspond to the keys of the passed
 * reducer functions.
 *
 * @param {Object} reducers An object whose values correspond to different
 * reducer functions that need to be combined into one. One handy way to obtain
 * it is to use ES6 `import * as reducers` syntax. The reducers may never return
 * undefined for any action. Instead, they should return their initial state
 * if the state passed to them was undefined, and the current state for any
 * unrecognized action.
 *
 * @returns {Function} A reducer function that invokes every reducer inside the
 * passed object, and builds a state object with the same shape.
 */

function combineReducers(reducers) {
  var finalReducers = _utilsPick2['default'](reducers, function (val) {
    return typeof val === 'function';
  });

  Object.keys(finalReducers).forEach(function (key) {
    var reducer = finalReducers[key];
    if (typeof reducer(undefined, { type: _createStore.ActionTypes.INIT }) === 'undefined') {
      throw new Error('Reducer "' + key + '" returned undefined during initialization. ' + 'If the state passed to the reducer is undefined, you must ' + 'explicitly return the initial state. The initial state may ' + 'not be undefined.');
    }

    var type = Math.random().toString(36).substring(7).split('').join('.');
    if (typeof reducer(undefined, { type: type }) === 'undefined') {
      throw new Error('Reducer "' + key + '" returned undefined when probed with a random type. ' + ('Don\'t try to handle ' + _createStore.ActionTypes.INIT + ' or other actions in "redux/*" ') + 'namespace. They are considered private. Instead, you must return the ' + 'current state for any unknown actions, unless it is undefined, ' + 'in which case you must return the initial state, regardless of the ' + 'action type. The initial state may not be undefined.');
    }
  });

  var defaultState = _utilsMapValues2['default'](finalReducers, function () {
    return undefined;
  });
  var stateShapeVerified;

  return function combination(state, action) {
    if (state === undefined) state = defaultState;

    var finalState = _utilsMapValues2['default'](finalReducers, function (reducer, key) {
      var newState = reducer(state[key], action);
      if (typeof newState === 'undefined') {
        throw new Error(getErrorMessage(key, action));
      }
      return newState;
    });

    if (
    // Node-like CommonJS environments (Browserify, Webpack)
    typeof process !== 'undefined' && typeof process.env !== 'undefined' && process.env.NODE_ENV !== 'production' ||
    // React Native
    typeof __DEV__ !== 'undefined' && __DEV__ //eslint-disable-line no-undef
    ) {
      if (!stateShapeVerified) {
        verifyStateShape(state, finalState);
        stateShapeVerified = true;
      }
    }

    return finalState;
  };
}

module.exports = exports['default'];
},{"../createStore":6,"../utils/isPlainObject":12,"../utils/mapValues":13,"../utils/pick":14}],11:[function(_dereq_,module,exports){
/**
 * Composes functions from left to right.
 *
 * @param {...Function} funcs - The functions to compose. Each is expected to
 * accept a function as an argument and to return a function.
 * @returns {Function} A function obtained by composing functions from left to
 * right.
 */
"use strict";

exports.__esModule = true;
exports["default"] = compose;

function compose() {
  for (var _len = arguments.length, funcs = Array(_len), _key = 0; _key < _len; _key++) {
    funcs[_key] = arguments[_key];
  }

  return funcs.reduceRight(function (composed, f) {
    return f(composed);
  });
}

module.exports = exports["default"];
},{}],12:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = isPlainObject;
var fnToString = function fnToString(fn) {
  return Function.prototype.toString.call(fn);
};

/**
 * @param {any} obj The object to inspect.
 * @returns {boolean} True if the argument appears to be a plain object.
 */

function isPlainObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  var proto = typeof obj.constructor === 'function' ? Object.getPrototypeOf(obj) : Object.prototype;

  if (proto === null) {
    return true;
  }

  var constructor = proto.constructor;

  return typeof constructor === 'function' && constructor instanceof constructor && fnToString(constructor) === fnToString(Object);
}

module.exports = exports['default'];
},{}],13:[function(_dereq_,module,exports){
/**
 * Applies a function to every key-value pair inside an object.
 *
 * @param {Object} obj The source object.
 * @param {Function} fn The mapper function taht receives the value and the key.
 * @returns {Object} A new object that contains the mapped values for the keys.
 */
"use strict";

exports.__esModule = true;
exports["default"] = mapValues;

function mapValues(obj, fn) {
  return Object.keys(obj).reduce(function (result, key) {
    result[key] = fn(obj[key], key);
    return result;
  }, {});
}

module.exports = exports["default"];
},{}],14:[function(_dereq_,module,exports){
/**
 * Picks key-value pairs from an object where values satisfy a predicate.
 *
 * @param {Object} obj The object to pick from.
 * @param {Function} fn The predicate the values must satisfy to be copied.
 * @returns {Object} The object with the values that satisfied the predicate.
 */
"use strict";

exports.__esModule = true;
exports["default"] = pick;

function pick(obj, fn) {
  return Object.keys(obj).reduce(function (result, key) {
    if (fn(obj[key])) {
      result[key] = obj[key];
    }
    return result;
  }, {});
}

module.exports = exports["default"];
},{}],15:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.setRealViewPort = setRealViewPort;
exports.sendMouseWheel = sendMouseWheel;
exports.setFill = setFill;
exports.setFreeMovement = setFreeMovement;

function setRealViewPort(realViewPort) {
	return {
		type: "SET_REAL_VIEWPORT",
		realViewPort: realViewPort
	};
}

function sendMouseWheel(wheelState) {
	return {
		type: "SEND_MOUSEWHEEL",
		mousewheel: wheelState
	};
}

function setFill(mode) {
	return {
		type: "SET_FILL",
		mode: mode
	};
}

function setFreeMovement(mode) {
	return {
		type: "SET_FREE_MOVEMENT",
		mode: mode
	};
}

},{}],16:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _qs = _dereq_("qs");

var _qs2 = _interopRequireDefault(_qs);

var IDX_WIDTH = 1;
var IDX_HEIGHT = 0;
var TILE_SIZE = 512;

var downScale = function downScale(_x6, _x7) {
	var _again = true;

	_function: while (_again) {
		var val = _x6,
		    times = _x7;
		_again = false;
		if (times > 0) {
			_x6 = val / 2;
			_x7 = --times;
			_again = true;
			continue _function;
		} else {
			return val;
		}
	}
};
var upScale = function upScale(_x8, _x9) {
	var _again2 = true;

	_function2: while (_again2) {
		var val = _x8,
		    times = _x9;
		_again2 = false;
		if (times > 0) {
			_x8 = val * 2;
			_x9 = --times;
			_again2 = true;
			continue _function2;
		} else {
			return val;
		}
	}
};

var Api = (function () {
	function Api(service, config) {
		_classCallCheck(this, Api);

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

	_createClass(Api, [{
		key: "initializeResolutions",
		value: function initializeResolutions() {
			var level = arguments.length <= 0 || arguments[0] === undefined ? this.levels - 1 : arguments[0];
			var w = arguments.length <= 1 || arguments[1] === undefined ? this.fullWidth : arguments[1];
			var h = arguments.length <= 2 || arguments[2] === undefined ? this.fullHeight : arguments[2];

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
			return this.service + "?" + _qs2["default"].stringify(_extends({}, this.params, {
				"svc.region": dims.join(","),
				"svc.level": level,
				"svc_id": "info:lanl-repo/svc/getRegion"
			}));
		}
	}, {
		key: "fetchTile",
		value: function fetchTile(tile) {
			var key = tile.realX + "-" + tile.realY + "-" + tile.level + "-" + tile.url;
			if (!this.tileMap[key]) {
				this.tileMap[key] = new Image();
				this.tileMap[key].src = tile.url;
			}
			return [this.tileMap[key], tile];
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
		value: function makeTiles(opts, level, scale) {
			var upscaleFactor = this.resolutions.length - level;
			var yStart = this.getStart(opts.position.y);
			var xStart = this.getStart(opts.position.x);
			var tiles = [];
			for (var y = yStart; (y - yStart) * scale - TILE_SIZE * 2 + opts.position.y < opts.viewport.h && upScale(y, upscaleFactor) < this.fullHeight; y += TILE_SIZE) {

				for (var x = xStart; (x - xStart) * scale - TILE_SIZE * 2 + opts.position.x < opts.viewport.w && upScale(x, upscaleFactor) < this.fullWidth; x += TILE_SIZE) {

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
	}, {
		key: "findLevelForScale",
		value: function findLevelForScale(s) {
			var level = arguments.length <= 1 || arguments[1] === undefined ? this.levels : arguments[1];
			var current = arguments.length <= 2 || arguments[2] === undefined ? 1 : arguments[2];

			if (s > current / 2 || level === 1) {
				return level;
			}
			return this.findLevelForScale(s, --level, current / 2);
		}
	}, {
		key: "zoomTo",
		value: function zoomTo(zoom, onScale) {
			var newLevel = this.findLevelForScale(zoom);
			var newScale = upScale(zoom, this.resolutions.length - newLevel);
			onScale(newScale, newLevel, Math.ceil(this.fullWidth * zoom), Math.ceil(this.fullHeight * zoom));
		}
	}, {
		key: "zoomBy",
		value: function zoomBy(factor, scale, level, onScale) {
			var viewportScale = this.getRealScale(scale, level) + factor;
			if (viewportScale < 0.01) {
				viewportScale = 0.01;
			}
			var newLevel = this.findLevelForScale(viewportScale);
			var newScale = upScale(viewportScale, this.resolutions.length - newLevel);
			onScale(newScale, newLevel, Math.ceil(this.fullWidth * viewportScale), Math.ceil(this.fullHeight * viewportScale));
		}
	}, {
		key: "getRealScale",
		value: function getRealScale(scale, level) {
			return downScale(scale, this.resolutions.length - level);
		}
	}, {
		key: "getRealImagePos",
		value: function getRealImagePos(position, scale, level) {
			return {
				x: Math.floor(position.x * scale),
				y: Math.floor(position.y * scale),
				w: Math.ceil(this.fullWidth * this.getRealScale(scale, level)),
				h: Math.ceil(this.fullHeight * this.getRealScale(scale, level))
			};
		}
	}, {
		key: "widthFill",
		value: function widthFill(opts) {
			var level = this.findLevel(opts.viewport.w, IDX_WIDTH);
			var scale = opts.viewport.w / this.resolutions[level - 1][IDX_WIDTH];
			var upscaleFactor = this.resolutions.length - level;
			var viewportScale = downScale(scale, upscaleFactor);

			if (opts.onScale) {
				opts.onScale(scale, level, Math.ceil(this.fullWidth * viewportScale), Math.ceil(this.fullHeight * viewportScale));
			}
			return this.makeTiles(opts, level, scale);
		}
	}, {
		key: "fullZoom",
		value: function fullZoom(opts) {
			var level = this.levels;
			var scale = 1;

			if (opts.onScale) {
				opts.onScale(scale, level, this.fullWidth, this.fullHeight);
			}
			return this.makeTiles(opts, level, scale);
		}
	}, {
		key: "heightFill",
		value: function heightFill(opts) {
			var level = this.findLevel(opts.viewport.h, IDX_HEIGHT);
			var scale = opts.viewport.h / this.resolutions[level - 1][IDX_HEIGHT];
			var upscaleFactor = this.resolutions.length - level;
			var viewportScale = downScale(scale, upscaleFactor);

			if (opts.onScale) {
				opts.onScale(scale, level, Math.ceil(this.fullWidth * viewportScale), Math.ceil(this.fullHeight * viewportScale));
			}

			return this.makeTiles(opts, level, scale);
		}
	}, {
		key: "autoFill",
		value: function autoFill(opts) {
			if (this.fullHeight > this.fullWidth) {
				return this.heightFill(opts);
			} else {
				return this.widthFill(opts);
			}
		}
	}, {
		key: "loadImage",
		value: function loadImage(opts) {
			if (opts.scaleMode) {
				return this[opts.scaleMode](opts);
			} else {
				return this.makeTiles(opts, opts.level, opts.scale);
			}
		}
	}]);

	return Api;
})();

exports["default"] = Api;
module.exports = exports["default"];

},{"qs":2}],17:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var initialState = {
	realViewPort: { x: 0, y: 0, w: 0, h: 0, zoom: 0, reposition: false },
	mousewheel: null,
	fillMode: null,
	freeMovement: false
};

exports["default"] = function (state, action) {
	if (state === undefined) state = initialState;

	switch (action.type) {
		case "SET_REAL_VIEWPORT":
			return _extends({}, state, { realViewPort: _extends({}, state.realViewPort, action.realViewPort) });
		case "SEND_MOUSEWHEEL":
			return _extends({}, state, { mousewheel: action.mousewheel });
		case "SET_FILL":
			return _extends({}, state, { fillMode: action.mode });
		case "SET_FREE_MOVEMENT":
			return _extends({}, state, { freeMovement: action.mode });
		default:
			return state;
	}
};

module.exports = exports["default"];

},{}],18:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _redux = _dereq_("redux");

var _reducers = _dereq_("./reducers");

var _reducers2 = _interopRequireDefault(_reducers);

var store = (0, _redux.createStore)(_reducers2["default"]);

exports["default"] = store;
module.exports = exports["default"];

},{"./reducers":17,"redux":7}],19:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _react = _dereq_("react");

var _react2 = _interopRequireDefault(_react);

var _apiApi = _dereq_("../api/api");

var _apiApi2 = _interopRequireDefault(_apiApi);

var _apiActions = _dereq_("../api/actions");

var _apiStore = _dereq_("../api/store");

var _apiStore2 = _interopRequireDefault(_apiStore);

var _utilRequestAnimationFrame = _dereq_("../util/request-animation-frame");

var MOUSE_UP = 0;
var MOUSE_DOWN = 1;

var TOUCH_END = 0;
var TOUCH_START = 1;
var TOUCH_PINCH = 2;

var RESIZE_DELAY = 5;

var SUPPORTED_SCALE_MODES = ["heightFill", "widthFill", "autoFill", "fullZoom"];

var DjatokaClient = (function (_React$Component) {
	_inherits(DjatokaClient, _React$Component);

	function DjatokaClient(props) {
		_classCallCheck(this, DjatokaClient);

		_get(Object.getPrototypeOf(DjatokaClient.prototype), "constructor", this).call(this, props);
		this.api = new _apiApi2["default"](this.props.service, this.props.config);

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
		this.width = null;
		this.height = null;
		this.focalPoint = null;
		this.resizeListener = this.onResize.bind(this);
		this.animationFrameListener = this.onAnimationFrame.bind(this);
		this.mousemoveListener = this.onMouseMove.bind(this);
		this.mouseupListener = this.onMouseUp.bind(this);
		this.frameBuffer = [];
		this.repaintDelay = -1;
		this.touchmap = { startPos: false, positions: [], tapStart: 0, lastTap: 0, pinchDelta: 0, pinchDistance: 0 };
	}

	_createClass(DjatokaClient, [{
		key: "componentDidMount",
		value: function componentDidMount() {
			var _this = this;

			this.commitResize();
			this.imageCtx = _react2["default"].findDOMNode(this).children[0].getContext("2d");
			window.addEventListener("resize", this.resizeListener);
			window.addEventListener("mousemove", this.mousemoveListener);
			window.addEventListener("mouseup", this.mouseupListener);

			this.unsubscribe = _apiStore2["default"].subscribe(function () {
				return _this.setState(_apiStore2["default"].getState(), _this.receiveNewState.bind(_this));
			});
			(0, _utilRequestAnimationFrame.requestAnimationFrame)(this.animationFrameListener);
		}
	}, {
		key: "componentWillReceiveProps",
		value: function componentWillReceiveProps(nextProps) {
			if (nextProps.config.identifier !== this.props.config.identifier) {
				this.api = new _apiApi2["default"](this.props.service, nextProps.config);
				this.commitResize();
			}
		}
	}, {
		key: "shouldComponentUpdate",
		value: function shouldComponentUpdate(nextProps, nextState) {
			return this.state.width !== nextState.width || this.state.height !== nextState.height || this.props.config.identifier !== nextProps.config.identifier;
		}
	}, {
		key: "componentWillUnmount",
		value: function componentWillUnmount() {
			window.removeEventListener("resize", this.resizeListener);
			window.removeEventListener("mousemove", this.mousemoveListener);
			window.removeEventListener("mouseup", this.mouseupListener);
			this.unsubscribe();
			(0, _utilRequestAnimationFrame.cancelAnimationFrame)(this.animationFrameListener);
		}
	}, {
		key: "notifyRealImagePos",
		value: function notifyRealImagePos() {
			var zoom = this.api.getRealScale(this.scale, this.level);
			var dims = this.api.getRealImagePos(this.imagePos, this.scale, this.level);
			_apiStore2["default"].dispatch((0, _apiActions.setRealViewPort)({
				x: -dims.x / dims.w,
				y: -dims.y / dims.h,
				w: this.state.width / dims.w,
				h: this.state.height / dims.h,
				zoom: zoom,
				reposition: false,
				applyZoom: false
			}));
		}
	}, {
		key: "receiveNewState",
		value: function receiveNewState() {
			if (this.state.realViewPort.reposition) {
				var _api$getRealImagePos = this.api.getRealImagePos(this.imagePos, this.scale, this.level);

				var w = _api$getRealImagePos.w;
				var h = _api$getRealImagePos.h;

				this.imagePos.x = -(w * this.state.realViewPort.x / this.scale);
				this.imagePos.y = -(h * this.state.realViewPort.y / this.scale);
				this.correctBounds();
				this.loadImage({ scale: this.scale, level: this.level });
			}

			if (this.state.realViewPort.applyZoom) {
				this.focalPoint = null;
				this.api.zoomTo(this.state.realViewPort.zoom, this.zoom.bind(this));
			}

			if (this.state.mousewheel) {
				this.focalPoint = null;
				_apiStore2["default"].dispatch((0, _apiActions.sendMouseWheel)(false));
				this.api.zoomBy(this.determineZoomFactor(this.state.mousewheel.deltaY), this.scale, this.level, this.zoom.bind(this));
			}

			if (this.state.fillMode) {
				_apiStore2["default"].dispatch((0, _apiActions.setFill)(false));
				this.imagePos.x = 0;
				this.imagePos.y = 0;
				this.loadImage({ scaleMode: this.state.fillMode });
			}
		}
	}, {
		key: "onAnimationFrame",
		value: function onAnimationFrame() {
			if (this.frameBuffer.length) {
				this.imageCtx.clearRect(0, 0, this.state.width, this.state.height);
				for (var i = 0; i < this.frameBuffer.length; i++) {
					var tileIm = this.frameBuffer[i][0];
					var tile = this.frameBuffer[i][1];
					this.imageCtx.drawImage(tileIm, parseInt(Math.floor((tile.pos.x + this.imagePos.x) * this.scale)), parseInt(Math.floor((tile.pos.y + this.imagePos.y) * this.scale)), parseInt(Math.ceil(tileIm.width * this.scale)), parseInt(Math.ceil(tileIm.height * this.scale)));
				}
				if (this.frameBuffer.filter(function (x) {
					return x[0].complete && x[0].height > 0 && x[0].width > 0;
				}).length === this.frameBuffer.length) {
					this.frameBuffer = [];
				}
			}

			if (this.resizeDelay === 0) {
				this.commitResize();
				this.resizeDelay = -1;
			} else if (this.resizeDelay > 0) {
				this.resizeDelay -= 1;
			}
			(0, _utilRequestAnimationFrame.requestAnimationFrame)(this.animationFrameListener);
		}
	}, {
		key: "onResize",
		value: function onResize() {
			this.resizeDelay = RESIZE_DELAY;
		}
	}, {
		key: "commitResize",
		value: function commitResize() {
			this.resizeDelay = RESIZE_DELAY;
			this.imagePos.x = 0;
			this.imagePos.y = 0;
			this.width = null;
			this.height = null;
			var node = _react2["default"].findDOMNode(this);
			this.setState({
				width: node.clientWidth,
				height: node.clientHeight
			}, this.loadImage.bind(this));
		}
	}, {
		key: "loadImage",
		value: function loadImage() {
			var opts = arguments.length <= 0 || arguments[0] === undefined ? { scaleMode: this.props.scaleMode } : arguments[0];

			this.notifyRealImagePos();
			this.frameBuffer = this.api.loadImage(_extends({
				viewport: { w: this.state.width, h: this.state.height },
				position: this.imagePos,
				onScale: this.onDimensions.bind(this)
			}, opts));
		}
	}, {
		key: "setScale",
		value: function setScale(s, l) {
			this.scale = s;
			this.level = l;
		}
	}, {
		key: "setDimensions",
		value: function setDimensions(w, h) {
			this.width = w;
			this.height = h;
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
			if (ev.touches.length > 1) {
				this.touchState = TOUCH_PINCH;
			} else {
				this.touchPos.x = ev.touches[0].pageX;
				this.touchPos.y = ev.touches[0].pageY;
				this.movement = { x: 0, y: 0 };
				this.touchState = TOUCH_START;
			}
		}
	}, {
		key: "onMouseMove",
		value: function onMouseMove(ev) {
			switch (this.mouseState) {
				case MOUSE_DOWN:
					this.movement.x = this.mousePos.x - ev.clientX;
					this.movement.y = this.mousePos.y - ev.clientY;
					this.imagePos.x -= this.movement.x / this.scale;
					this.imagePos.y -= this.movement.y / this.scale;
					this.mousePos.x = ev.clientX;
					this.mousePos.y = ev.clientY;
					this.correctBounds();
					this.loadImage({ scale: this.scale, level: this.level });
					return ev.preventDefault();
				case MOUSE_UP:
					var rect = _react2["default"].findDOMNode(this).getBoundingClientRect();
					this.focalPoint = {
						x: ev.clientX - rect.left,
						y: ev.clientY - rect.top
					};
					break;
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
			if (ev.touches.length === 2 && this.touchState === TOUCH_PINCH) {
				var oldD = this.touchmap.pinchDistance;
				this.touchmap.pinchDistance = parseInt(Math.sqrt((this.touchmap.positions[0].x - this.touchmap.positions[1].x) * (this.touchmap.positions[0].x - this.touchmap.positions[1].x) + (this.touchmap.positions[0].y - this.touchmap.positions[1].y) * (this.touchmap.positions[0].y - this.touchmap.positions[1].y)), 10);
				this.touchmap.pinchDelta = oldD - this.touchmap.pinchDistance;
				if (this.touchmap.pinchDelta < 60 && this.touchmap.pinchDelta > -60) {
					this.api.zoomBy(this.determineZoomFactor(this.touchmap.pinchDelta), this.scale, this.level, this.zoom.bind(this));
				}
			} else if (this.touchState === TOUCH_START) {
				this.movement.x = this.touchPos.x - ev.touches[0].pageX;
				this.movement.y = this.touchPos.y - ev.touches[0].pageY;
				this.imagePos.x -= this.movement.x / this.scale;
				this.imagePos.y -= this.movement.y / this.scale;
				this.touchPos.x = ev.touches[0].pageX;
				this.touchPos.y = ev.touches[0].pageY;
				this.correctBounds();
				this.loadImage({ scale: this.scale, level: this.level });
			}
			ev.preventDefault();
			ev.stopPropagation();
		}
	}, {
		key: "onTouchEnd",
		value: function onTouchEnd() {
			this.touchState = TOUCH_END;
		}
	}, {
		key: "onMouseUp",
		value: function onMouseUp() {
			if (this.mouseState === MOUSE_DOWN) {
				this.loadImage({ scale: this.scale, level: this.level });
			}
			this.mouseState = MOUSE_UP;
		}
	}, {
		key: "center",
		value: function center(w, h) {
			if (w > this.state.width) {
				this.imagePos.x = -parseInt((w - this.state.width) / 2) / this.scale;
			} else if (w < this.state.width) {
				this.imagePos.x = parseInt((this.state.width - w) / 2) / this.scale;
			}

			if (h > this.state.height) {
				this.imagePos.y = -parseInt((h - this.state.height) / 2) / this.scale;
			} else if (h < this.state.width) {
				this.imagePos.y = parseInt((this.state.height - h) / 2) / this.scale;
			}
		}
	}, {
		key: "correctBounds",
		value: function correctBounds() {
			if (this.state.freeMovement) {
				return;
			}
			if (this.width <= this.state.width) {
				if (this.imagePos.x < 0) {
					this.imagePos.x = 0;
				}
				if (this.imagePos.x * this.scale + this.width > this.state.width) {
					this.imagePos.x = (this.state.width - this.width) / this.scale;
				}
			} else if (this.width > this.state.width) {
				if (this.imagePos.x > 0) {
					this.imagePos.x = 0;
				}
				if (this.imagePos.x * this.scale + this.width < this.state.width) {
					this.imagePos.x = (this.state.width - this.width) / this.scale;
				}
			}

			if (this.height <= this.state.height) {
				if (this.imagePos.y < 0) {
					this.imagePos.y = 0;
				}
				if (this.imagePos.y * this.scale + this.height > this.state.height) {
					this.imagePos.y = (this.state.height - this.height) / this.scale;
				}
			} else if (this.height > this.state.height) {
				if (this.imagePos.y > 0) {
					this.imagePos.y = 0;
				}
				if (this.imagePos.y * this.scale + this.height < this.state.height) {
					this.imagePos.y = (this.state.height - this.height) / this.scale;
				}
			}
		}
	}, {
		key: "onDimensions",
		value: function onDimensions(s, l, w, h) {
			this.setDimensions(w, h);
			this.setScale(s, l);
			this.center(w, h);
			this.notifyRealImagePos();
		}
	}, {
		key: "zoom",
		value: function zoom(s, l, w, h) {
			var focalPoint = this.focalPoint || {
				x: this.state.width / 2,
				y: this.state.height / 2
			};

			var dX = (focalPoint.x - this.imagePos.x * this.scale) / this.width;
			var dY = (focalPoint.y - this.imagePos.y * this.scale) / this.height;

			this.setDimensions(w, h);
			this.setScale(s, l);

			if (this.width === null || this.height === null) {
				this.center(w, h);
			} else {
				this.imagePos.x = (focalPoint.x - dX * this.width) / this.scale;
				this.imagePos.y = (focalPoint.y - dY * this.height) / this.scale;
				this.correctBounds();
			}
			this.loadImage({ scale: this.scale, level: this.level });
		}
	}, {
		key: "determineZoomFactor",
		value: function determineZoomFactor(delta) {
			var rev = delta > 0 ? -1 : 1;
			var rs = this.api.getRealScale(this.scale, this.level);
			if (rs >= 0.6) {
				return 0.04 * rev;
			} else if (rs >= 0.3) {
				return 0.02 * rev;
			} else if (rs >= 0.1) {
				return 0.01 * rev;
			} else if (rs >= 0.05) {
				return 0.005 * rev;
			} else {
				return 0.0025 * rev;
			}
		}
	}, {
		key: "onWheel",
		value: function onWheel(ev) {
			this.api.zoomBy(this.determineZoomFactor(ev.nativeEvent.deltaY), this.scale, this.level, this.zoom.bind(this));

			return ev.preventDefault();
		}
	}, {
		key: "render",
		value: function render() {
			return _react2["default"].createElement(
				"div",
				{ className: "hire-djatoka-client" },
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

	return DjatokaClient;
})(_react2["default"].Component);

DjatokaClient.propTypes = {
	config: _react2["default"].PropTypes.object.isRequired,
	scaleMode: function scaleMode(props, propName) {
		if (SUPPORTED_SCALE_MODES.indexOf(props[propName]) < 0) {
			var msg = "Scale mode '" + props[propName] + "' not supported. Modes: " + SUPPORTED_SCALE_MODES.join(", ");
			props[propName] = "heightFill";
			return new Error(msg);
		}
	},
	service: _react2["default"].PropTypes.string.isRequired
};

DjatokaClient.defaultProps = {
	scaleMode: "autoFill"
};

exports["default"] = DjatokaClient;
module.exports = exports["default"];

},{"../api/actions":15,"../api/api":16,"../api/store":18,"../util/request-animation-frame":29,"react":"react"}],20:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _react = _dereq_("react");

var _react2 = _interopRequireDefault(_react);

var _iconsHeightFill = _dereq_("./icons/height-fill");

var _iconsHeightFill2 = _interopRequireDefault(_iconsHeightFill);

var _iconsWidthFill = _dereq_("./icons/width-fill");

var _iconsWidthFill2 = _interopRequireDefault(_iconsWidthFill);

var _iconsAutoFill = _dereq_("./icons/auto-fill");

var _iconsAutoFill2 = _interopRequireDefault(_iconsAutoFill);

var _apiActions = _dereq_("../api/actions");

var _apiStore = _dereq_("../api/store");

var _apiStore2 = _interopRequireDefault(_apiStore);

var SUPPORTED_SCALE_MODES = ["heightFill", "widthFill", "autoFill", "fullZoom"];

var FillButton = (function (_React$Component) {
    _inherits(FillButton, _React$Component);

    function FillButton() {
        _classCallCheck(this, FillButton);

        _get(Object.getPrototypeOf(FillButton.prototype), "constructor", this).apply(this, arguments);
    }

    _createClass(FillButton, [{
        key: "renderIcon",
        value: function renderIcon() {
            switch (this.props.scaleMode) {
                case "fullZoom":
                    return "100%";
                case "autoFill":
                    return _react2["default"].createElement(_iconsAutoFill2["default"], null);
                case "heightFill":
                    return _react2["default"].createElement(_iconsHeightFill2["default"], null);
                case "widthFill":
                default:
                    return _react2["default"].createElement(_iconsWidthFill2["default"], null);
            }
        }
    }, {
        key: "onClick",
        value: function onClick() {
            _apiStore2["default"].dispatch((0, _apiActions.setFill)(this.props.scaleMode));
        }
    }, {
        key: "render",
        value: function render() {
            return _react2["default"].createElement(
                "button",
                { className: "hire-fill-button", onClick: this.onClick.bind(this) },
                this.renderIcon()
            );
        }
    }]);

    return FillButton;
})(_react2["default"].Component);

FillButton.propTypes = {
    scaleMode: function scaleMode(props, propName) {
        if (SUPPORTED_SCALE_MODES.indexOf(props[propName]) < 0) {
            var msg = "Scale mode '" + props[propName] + "' not supported. Modes: " + SUPPORTED_SCALE_MODES.join(", ");
            props[propName] = "heightFill";
            return new Error(msg);
        }
    }
};

FillButton.defaultProps = {
    scaleMode: "heightFill"
};

exports["default"] = FillButton;
module.exports = exports["default"];

},{"../api/actions":15,"../api/store":18,"./icons/auto-fill":22,"./icons/height-fill":24,"./icons/width-fill":25,"react":"react"}],21:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _react = _dereq_("react");

var _react2 = _interopRequireDefault(_react);

var _iconsFreeMovement = _dereq_("./icons/free-movement");

var _iconsFreeMovement2 = _interopRequireDefault(_iconsFreeMovement);

var _apiActions = _dereq_("../api/actions");

var _apiStore = _dereq_("../api/store");

var _apiStore2 = _interopRequireDefault(_apiStore);

var FreeMovementButton = (function (_React$Component) {
    _inherits(FreeMovementButton, _React$Component);

    function FreeMovementButton(props) {
        _classCallCheck(this, FreeMovementButton);

        _get(Object.getPrototypeOf(FreeMovementButton.prototype), "constructor", this).call(this, props);
        this.state = _apiStore2["default"].getState();
    }

    _createClass(FreeMovementButton, [{
        key: "componentDidMount",
        value: function componentDidMount() {
            var _this = this;

            this.unsubscribe = _apiStore2["default"].subscribe(function () {
                return _this.setState(_apiStore2["default"].getState());
            });
        }
    }, {
        key: "componentWillUnmount",
        value: function componentWillUnmount() {
            this.unsubscribe();
        }
    }, {
        key: "onClick",
        value: function onClick() {
            _apiStore2["default"].dispatch((0, _apiActions.setFreeMovement)(!this.state.freeMovement));
        }
    }, {
        key: "render",
        value: function render() {
            var c = "hire-free-movement-button";
            if (!this.state.freeMovement) {
                c += " active";
            }
            return _react2["default"].createElement(
                "button",
                { className: c, onClick: this.onClick.bind(this) },
                _react2["default"].createElement(_iconsFreeMovement2["default"], null)
            );
        }
    }]);

    return FreeMovementButton;
})(_react2["default"].Component);

exports["default"] = FreeMovementButton;
module.exports = exports["default"];

},{"../api/actions":15,"../api/store":18,"./icons/free-movement":23,"react":"react"}],22:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _react = _dereq_("react");

var _react2 = _interopRequireDefault(_react);

var AutoFill = (function (_React$Component) {
  _inherits(AutoFill, _React$Component);

  function AutoFill() {
    _classCallCheck(this, AutoFill);

    _get(Object.getPrototypeOf(AutoFill.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(AutoFill, [{
    key: "render",
    value: function render() {
      return _react2["default"].createElement(
        "svg",
        { viewBox: "0 -2 16 20" },
        _react2["default"].createElement("path", { d: "M 2.2510028,2.3999952 14.134355,13.976932", style: { strokeWidth: 2 } }),
        _react2["default"].createElement("path", { d: "M 0.17726274,4.8389082 0.0558895,0.07290967 4.6198279,0.27222077", style: { strokeWidth: 0 } }),
        _react2["default"].createElement("path", {
          d: "m 15.925831,11.287935 0.121374,4.765999 -4.563938,-0.199312",
          style: { strokeWidth: 0 }
        }),
        _react2["default"].createElement("path", {
          d: "M 13.731112,2.2550713 2.1257829,14.110698",
          style: { strokeWidth: 2 } }),
        _react2["default"].createElement("path", {
          d: "M 11.297166,0.17550349 16.063441,0.06553063 15.853214,4.6289791",
          style: { strokeWidth: 0 }
        }),
        _react2["default"].createElement("path", {
          d: "M 4.8104871,15.908601 0.0442114,16.018574 0.2544395,11.455126",
          style: { strokeWidth: 0 }
        })
      );
    }
  }]);

  return AutoFill;
})(_react2["default"].Component);

exports["default"] = AutoFill;
module.exports = exports["default"];

},{"react":"react"}],23:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _react = _dereq_("react");

var _react2 = _interopRequireDefault(_react);

var FreeMovement = (function (_React$Component) {
  _inherits(FreeMovement, _React$Component);

  function FreeMovement() {
    _classCallCheck(this, FreeMovement);

    _get(Object.getPrototypeOf(FreeMovement.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(FreeMovement, [{
    key: "render",
    value: function render() {
      return _react2["default"].createElement(
        "svg",
        { viewBox: "0 0 480 480" },
        _react2["default"].createElement(
          "g",
          { id: "key" },
          _react2["default"].createElement("path", { d: "M294.399,196.875l10.574,10.579c2.627-3.028,4.703-6.688,6.27-10.579H294.399z" }),
          _react2["default"].createElement("path", { d: "M310.743,163.658c0,0-5.346-10.467-35.785-44.875c-30.422-34.392-50.438-52.094-50.438-52.094   c-11.734-10.376-30.857-10.299-42.514,0.173c0,0-41.014,36.967-61.703,55.609c-20.688,18.626-51.484,55.873-51.484,55.873   c-9.984,12.08-10.346,32.143-0.799,44.564c0,0,13.281,17.327,50.109,48.594c36.828,31.28,47.08,37.157,47.08,37.157   c13.297,7.559,32.859,5.091,44.094-5.363l-23.5-23.842c-14.592-14.842-14.516-38.891,0.232-53.625l41.781-41.781   c7.158-7.171,16.705-11.123,26.861-11.123c10.158,0,19.719,3.952,26.875,11.123l23.42,23.405   C314.801,196.081,317.506,176.955,310.743,163.658z M160.27,196.5c-20.982,0-37.998-17.012-37.998-38.015   c0-20.981,17.016-37.998,37.998-37.998c20.984,0,38.002,17.017,38.002,37.998C198.272,179.488,181.254,196.5,160.27,196.5z" }),
          _react2["default"].createElement("path", { d: "M416.598,359.407L261.397,204.206c-3.689-3.689-9.734-3.689-13.422,0l-6.283,6.247l160.033,158.609v20.223h-17.002   L223.805,228.346l-17.629,17.642c-3.703,3.685-3.703,9.764-0.061,13.482l144.625,146.767c3.654,3.749,10.938,6.796,16.172,6.796   h32.656c5.221,0,10.752-4.107,12.266-9.108l8.721-28.734C422.069,370.206,420.303,363.078,416.598,359.407z" })
        )
      );
    }
  }]);

  return FreeMovement;
})(_react2["default"].Component);

exports["default"] = FreeMovement;
module.exports = exports["default"];

},{"react":"react"}],24:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _react = _dereq_("react");

var _react2 = _interopRequireDefault(_react);

var HeightFill = (function (_React$Component) {
    _inherits(HeightFill, _React$Component);

    function HeightFill() {
        _classCallCheck(this, HeightFill);

        _get(Object.getPrototypeOf(HeightFill.prototype), "constructor", this).apply(this, arguments);
    }

    _createClass(HeightFill, [{
        key: "render",
        value: function render() {
            return _react2["default"].createElement(
                "svg",
                { viewBox: "0 0 18 17" },
                _react2["default"].createElement(
                    "g",
                    null,
                    _react2["default"].createElement("path", { d: "m 7.8735657,3.2305929 0.088125,9.1793421", style: { strokeWidth: 2 } }),
                    _react2["default"].createElement("path", { d: "M 4.6336281,3.641452 7.9449077,0.21145225 11.004625,3.6037073", style: { strokeWidth: 0 } }),
                    _react2["default"].createElement("path", { d: "m 11.229771,12.149816 -3.3112819,3.43 -3.0597154,-3.392255", style: { strokeWidth: 0 } })
                )
            );
        }
    }]);

    return HeightFill;
})(_react2["default"].Component);

exports["default"] = HeightFill;
module.exports = exports["default"];

},{"react":"react"}],25:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _react = _dereq_("react");

var _react2 = _interopRequireDefault(_react);

var WidthFill = (function (_React$Component) {
    _inherits(WidthFill, _React$Component);

    function WidthFill() {
        _classCallCheck(this, WidthFill);

        _get(Object.getPrototypeOf(WidthFill.prototype), "constructor", this).apply(this, arguments);
    }

    _createClass(WidthFill, [{
        key: "render",
        value: function render() {
            return _react2["default"].createElement(
                "svg",
                { viewBox: "0 0 24 17" },
                _react2["default"].createElement(
                    "g",
                    null,
                    _react2["default"].createElement("path", { d: "m 3.2525423,8.5338983 16.5903457,0", style: { strokeWidth: 2 } }),
                    _react2["default"].createElement("path", { d: "M 3.4690633,11.727926 0.0563563,8.3988265 3.4645013,5.3568195", style: { strokeWidth: 0 } }),
                    _react2["default"].createElement("path", { d: "m 19.249675,5.3577067 3.412707,3.3291 -3.408145,3.0420063", style: { strokeWidth: 0 } })
                )
            );
        }
    }]);

    return WidthFill;
})(_react2["default"].Component);

exports["default"] = WidthFill;
module.exports = exports["default"];

},{"react":"react"}],26:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _react = _dereq_("react");

var _react2 = _interopRequireDefault(_react);

var _apiApi = _dereq_("../api/api");

var _apiApi2 = _interopRequireDefault(_apiApi);

var _apiActions = _dereq_("../api/actions");

var _apiStore = _dereq_("../api/store");

var _apiStore2 = _interopRequireDefault(_apiStore);

var _utilRequestAnimationFrame = _dereq_("../util/request-animation-frame");

var RESIZE_DELAY = 5;

var MOUSE_UP = 0;
var MOUSE_DOWN = 1;

var Minimap = (function (_React$Component) {
	_inherits(Minimap, _React$Component);

	function Minimap(props) {
		_classCallCheck(this, Minimap);

		_get(Object.getPrototypeOf(Minimap.prototype), "constructor", this).call(this, props);
		this.api = new _apiApi2["default"](this.props.service, this.props.config);

		this.state = {
			width: null,
			height: null
		};
		this.resizeListener = this.onResize.bind(this);
		this.animationFrameListener = this.onAnimationFrame.bind(this);

		this.imageCtx = null;
		this.interactionCtx = null;
		this.resizeDelay = -1;
		this.mouseState = MOUSE_UP;
		this.mousemoveListener = this.onMouseMove.bind(this);
		this.mouseupListener = this.onMouseUp.bind(this);
		this.touchMoveListener = this.onTouchMove.bind(this);
		this.frameBuffer = [];
	}

	_createClass(Minimap, [{
		key: "componentDidMount",
		value: function componentDidMount() {
			var _this = this;

			this.onResize();
			this.imageCtx = _react2["default"].findDOMNode(this).children[0].getContext("2d");
			this.interactionCtx = _react2["default"].findDOMNode(this).children[1].getContext("2d");
			window.addEventListener("resize", this.resizeListener);
			window.addEventListener("mousemove", this.mousemoveListener);
			window.addEventListener("mouseup", this.mouseupListener);
			window.addEventListener("touchend", this.mouseupListener);
			window.addEventListener("touchmove", this.touchMoveListener);
			(0, _utilRequestAnimationFrame.requestAnimationFrame)(this.animationFrameListener);

			this.unsubscribe = _apiStore2["default"].subscribe(function () {
				return _this.setState(_apiStore2["default"].getState());
			});
		}
	}, {
		key: "componentWillReceiveProps",
		value: function componentWillReceiveProps(nextProps) {
			if (nextProps.config.identifier !== this.props.config.identifier) {
				this.api = new _apiApi2["default"](this.props.service, nextProps.config);
				this.commitResize();
			}
		}
	}, {
		key: "shouldComponentUpdate",
		value: function shouldComponentUpdate(nextProps, nextState) {
			return this.state.width !== nextState.width || this.state.height !== nextState.height || this.props.config.identifier !== nextProps.config.identifier;
		}
	}, {
		key: "componentWillUnmount",
		value: function componentWillUnmount() {
			window.removeEventListener("resize", this.resizeListener);
			window.removeEventListener("mousemove", this.mousemoveListener);
			window.removeEventListener("mouseup", this.mouseupListener);
			window.addEventListener("touchend", this.mouseupListener);
			window.removeEventListener("touchmove", this.touchMoveListener);
			(0, _utilRequestAnimationFrame.cancelAnimationFrame)(this.animationFrameListener);
			this.unsubscribe();
		}
	}, {
		key: "onAnimationFrame",
		value: function onAnimationFrame() {
			if (this.frameBuffer.length) {
				this.imageCtx.clearRect(0, 0, this.state.width, this.state.height);
				for (var i = 0; i < this.frameBuffer.length; i++) {
					var tileIm = this.frameBuffer[i][0];
					var tile = this.frameBuffer[i][1];
					this.imageCtx.drawImage(tileIm, parseInt(Math.floor(tile.pos.x * this.scale)), parseInt(Math.floor(tile.pos.y * this.scale)), parseInt(Math.ceil(tileIm.width * this.scale)), parseInt(Math.ceil(tileIm.height * this.scale)));
				}
				if (this.frameBuffer.filter(function (x) {
					return x[0].complete && x[0].height > 0 && x[0].width > 0;
				}).length === this.frameBuffer.length) {
					this.frameBuffer = [];
				}
			}

			if (this.resizeDelay === 0) {
				this.commitResize();
				this.resizeDelay = -1;
			} else if (this.resizeDelay > 0) {
				this.resizeDelay -= 1;
			}

			this.interactionCtx.strokeStyle = this.props.rectStroke;
			this.interactionCtx.fillStyle = this.props.rectFill;
			this.interactionCtx.clearRect(0, 0, this.state.width, this.state.height);
			this.interactionCtx.fillRect(Math.floor(this.state.realViewPort.x * this.state.width), Math.floor(this.state.realViewPort.y * this.state.height), Math.ceil(this.state.realViewPort.w * this.state.width), Math.ceil(this.state.realViewPort.h * this.state.height));

			this.interactionCtx.beginPath();
			this.interactionCtx.rect(Math.floor(this.state.realViewPort.x * this.state.width), Math.floor(this.state.realViewPort.y * this.state.height), Math.ceil(this.state.realViewPort.w * this.state.width), Math.ceil(this.state.realViewPort.h * this.state.height));
			this.interactionCtx.stroke();

			(0, _utilRequestAnimationFrame.requestAnimationFrame)(this.animationFrameListener);
		}
	}, {
		key: "onResize",
		value: function onResize() {
			this.resizeDelay = RESIZE_DELAY;
		}
	}, {
		key: "commitResize",
		value: function commitResize() {
			this.resizeDelay = RESIZE_DELAY;
			var node = _react2["default"].findDOMNode(this);
			this.frameBuffer = this.api.loadImage({
				viewport: { w: node.clientWidth, h: node.clientHeight },
				onScale: this.setScale.bind(this),
				scaleMode: "autoFill",
				position: { x: 0, y: 0 }
			});
		}
	}, {
		key: "setScale",
		value: function setScale(s, l) {
			this.scale = s;
			this.level = l;
			var dims = this.api.getRealImagePos({ x: 0, y: 0 }, this.scale, this.level);
			this.setState({ width: dims.w, height: dims.h });
			if (this.props.onDimensions) {
				this.props.onDimensions(dims.w, dims.h);
			}
		}
	}, {
		key: "dispatchReposition",
		value: function dispatchReposition(ev) {
			var doc = document.documentElement;
			var scrollTop = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
			var rect = _react2["default"].findDOMNode(this).getBoundingClientRect();
			_apiStore2["default"].dispatch((0, _apiActions.setRealViewPort)({
				x: (ev.pageX - rect.left) / this.state.width - this.state.realViewPort.w / 2,
				y: (ev.pageY - rect.top - scrollTop) / this.state.height - this.state.realViewPort.h / 2,
				reposition: true,
				applyZoom: false
			}));
		}
	}, {
		key: "onTouchStart",
		value: function onTouchStart(ev) {
			this.mouseState = MOUSE_DOWN;
			this.dispatchReposition({ pageX: ev.touches[0].pageX, pageY: ev.touches[0].pageY });
			return ev.preventDefault();
		}
	}, {
		key: "onMouseDown",
		value: function onMouseDown(ev) {
			this.mouseState = MOUSE_DOWN;
			this.dispatchReposition(ev);
		}
	}, {
		key: "onMouseMove",
		value: function onMouseMove(ev) {
			if (this.mouseState === MOUSE_DOWN) {
				this.dispatchReposition(ev);
				return ev.preventDefault();
			}
		}
	}, {
		key: "onTouchMove",
		value: function onTouchMove(ev) {
			if (this.mouseState === MOUSE_DOWN) {
				this.dispatchReposition({ pageX: ev.touches[0].pageX, pageY: ev.touches[0].pageY });
				return ev.preventDefault();
			}
		}
	}, {
		key: "onMouseUp",
		value: function onMouseUp() {
			this.mouseState = MOUSE_UP;
		}
	}, {
		key: "onWheel",
		value: function onWheel(ev) {
			_apiStore2["default"].dispatch((0, _apiActions.sendMouseWheel)({ deltaY: ev.deltaY }));
			return ev.preventDefault();
		}
	}, {
		key: "onTouchEnd",
		value: function onTouchEnd() {
			this.mouseState = MOUSE_UP;
		}
	}, {
		key: "render",
		value: function render() {
			return _react2["default"].createElement(
				"div",
				{ className: "hire-djatoka-minimap" },
				_react2["default"].createElement("canvas", { className: "image", height: this.state.height, width: this.state.width }),
				_react2["default"].createElement("canvas", { className: "interaction",
					height: this.state.height,
					onMouseDown: this.onMouseDown.bind(this),
					onTouchStart: this.onTouchStart.bind(this),
					onWheel: this.onWheel.bind(this),
					width: this.state.width })
			);
		}
	}]);

	return Minimap;
})(_react2["default"].Component);

Minimap.propTypes = {
	config: _react2["default"].PropTypes.object.isRequired,
	onDimensions: _react2["default"].PropTypes.func,
	rectFill: _react2["default"].PropTypes.string,
	rectStroke: _react2["default"].PropTypes.string,
	service: _react2["default"].PropTypes.string.isRequired
};

Minimap.defaultProps = {
	rectFill: "rgba(128,128,255,0.1)",
	rectStroke: "rgba(255,255,255,0.8)"
};

exports["default"] = Minimap;
module.exports = exports["default"];

},{"../api/actions":15,"../api/api":16,"../api/store":18,"../util/request-animation-frame":29,"react":"react"}],27:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _react = _dereq_("react");

var _react2 = _interopRequireDefault(_react);

var _apiActions = _dereq_("../api/actions");

var _apiStore = _dereq_("../api/store");

var _apiStore2 = _interopRequireDefault(_apiStore);

var MOUSE_UP = 0;
var MOUSE_DOWN = 1;

var Zoom = (function (_React$Component) {
	_inherits(Zoom, _React$Component);

	function Zoom(props) {
		_classCallCheck(this, Zoom);

		_get(Object.getPrototypeOf(Zoom.prototype), "constructor", this).call(this, props);
		this.state = _apiStore2["default"].getState();
		this.mouseupListener = this.onMouseUp.bind(this);
		this.mousemoveListener = this.onMouseMove.bind(this);
		this.touchMoveListener = this.onTouchMove.bind(this);
	}

	_createClass(Zoom, [{
		key: "componentDidMount",
		value: function componentDidMount() {
			var _this = this;

			window.addEventListener("mouseup", this.mouseupListener);
			window.addEventListener("mousemove", this.mousemoveListener);
			window.addEventListener("touchend", this.mouseupListener);
			window.addEventListener("touchmove", this.touchMoveListener);
			this.unsubscribe = _apiStore2["default"].subscribe(function () {
				return _this.setState(_apiStore2["default"].getState());
			});
		}
	}, {
		key: "componentWillUnmount",
		value: function componentWillUnmount() {
			window.removeEventListener("mouseup", this.mouseupListener);
			window.removeEventListener("mousemove", this.mousemoveListener);
			window.removeEventListener("touchend", this.mouseupListener);
			window.removeEventListener("touchmove", this.touchMoveListener);
			this.unsubscribe();
		}
	}, {
		key: "dispatchRealScale",
		value: function dispatchRealScale(pageX) {
			var rect = _react2["default"].findDOMNode(this).children[0].getBoundingClientRect();
			if (rect.width > 0 && !this.state.realViewPort.applyZoom) {
				var zoom = (pageX - rect.left) / rect.width * 2;
				if (zoom < 0.01) {
					zoom = 0.01;
				} else if (zoom > 2.0) {
					zoom = 2.0;
				}
				_apiStore2["default"].dispatch((0, _apiActions.setRealViewPort)({
					zoom: zoom,
					applyZoom: true
				}));
			}
		}
	}, {
		key: "onMouseDown",
		value: function onMouseDown(ev) {
			this.mouseState = MOUSE_DOWN;
			this.dispatchRealScale(ev.pageX);
		}
	}, {
		key: "onTouchStart",
		value: function onTouchStart(ev) {
			this.mouseState = MOUSE_DOWN;
			this.dispatchRealScale(ev.touches[0].pageX);
			return ev.preventDefault();
		}
	}, {
		key: "onMouseMove",
		value: function onMouseMove(ev) {
			if (this.mouseState === MOUSE_DOWN) {
				this.dispatchRealScale(ev.pageX);
				return ev.preventDefault();
			}
		}
	}, {
		key: "onTouchMove",
		value: function onTouchMove(ev) {
			if (this.mouseState === MOUSE_DOWN) {
				this.dispatchRealScale(ev.touches[0].pageX);
				return ev.preventDefault();
			}
		}
	}, {
		key: "onMouseUp",
		value: function onMouseUp() {
			this.mouseState = MOUSE_UP;
		}
	}, {
		key: "onWheel",
		value: function onWheel(ev) {
			_apiStore2["default"].dispatch((0, _apiActions.sendMouseWheel)({ deltaY: ev.deltaY }));
			return ev.preventDefault();
		}
	}, {
		key: "render",
		value: function render() {
			var zoom = parseInt(this.state.realViewPort.zoom * 100);
			return _react2["default"].createElement(
				"span",
				{ className: "hire-zoom-bar", onWheel: this.onWheel.bind(this) },
				_react2["default"].createElement(
					"svg",
					{
						onMouseDown: this.onMouseDown.bind(this),
						onTouchStart: this.onTouchStart.bind(this),
						viewBox: "-12 0 224 24" },
					_react2["default"].createElement("path", { d: "M0 12 L 200 12 Z" }),
					_react2["default"].createElement("circle", { cx: zoom > 200 ? 200 : zoom, cy: "12", r: "12" })
				),
				_react2["default"].createElement(
					"label",
					null,
					zoom,
					"%"
				)
			);
		}
	}]);

	return Zoom;
})(_react2["default"].Component);

Zoom.propTypes = {
	fill: _react2["default"].PropTypes.string,
	stroke: _react2["default"].PropTypes.string
};

Zoom.defaultProps = {
	fill: "rgba(0,0,0, 0.7)",
	stroke: "rgba(0,0,0, 1)"
};

exports["default"] = Zoom;
module.exports = exports["default"];

},{"../api/actions":15,"../api/store":18,"react":"react"}],28:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _insertCss = _dereq_("insert-css");

var _insertCss2 = _interopRequireDefault(_insertCss);

var _react = _dereq_("react");

var _react2 = _interopRequireDefault(_react);

var _componentsDjatokaClient = _dereq_("./components/djatoka-client");

var _componentsDjatokaClient2 = _interopRequireDefault(_componentsDjatokaClient);

var _componentsMinimap = _dereq_("./components/minimap");

var _componentsMinimap2 = _interopRequireDefault(_componentsMinimap);

var _componentsZoom = _dereq_("./components/zoom");

var _componentsZoom2 = _interopRequireDefault(_componentsZoom);

var _componentsFillButton = _dereq_("./components/fill-button");

var _componentsFillButton2 = _interopRequireDefault(_componentsFillButton);

var _componentsFreeMovementButton = _dereq_("./components/free-movement-button");

var _componentsFreeMovementButton2 = _interopRequireDefault(_componentsFreeMovementButton);



var css = Buffer("LmhpcmUtZGphdG9rYS1jbGllbnQsCi5oaXJlLWRqYXRva2EtbWluaW1hcCB7Cgl3aWR0aDogMTAwJTsKCWhlaWdodDogMTAwJTsKfQoKLmhpcmUtZGphdG9rYS1jbGllbnQgPiAuaW50ZXJhY3Rpb24sCi5oaXJlLWRqYXRva2EtY2xpZW50ID4gLmltYWdlLAouaGlyZS1kamF0b2thLW1pbmltYXAgPiAuaW50ZXJhY3Rpb24sCi5oaXJlLWRqYXRva2EtbWluaW1hcCA+IC5pbWFnZSB7Cglwb3NpdGlvbjogYWJzb2x1dGU7Cn0KCi5oaXJlLWRqYXRva2EtY2xpZW50ID4gLmludGVyYWN0aW9uLAouaGlyZS1kamF0b2thLW1pbmltYXAgPiAuaW50ZXJhY3Rpb24gewoJei1pbmRleDogMTsKfQoKLmhpcmUtem9vbS1iYXIgKiB7CiAgICAtbW96LXVzZXItc2VsZWN0OiBub25lOwogICAgLXdlYmtpdC11c2VyLXNlbGVjdDogbm9uZTsKICAgIC1tcy11c2VyLXNlbGVjdDogbm9uZTsgCiAgICB1c2VyLXNlbGVjdDogbm9uZTsgCiAgICAtd2Via2l0LXVzZXItZHJhZzogbm9uZTsKICAgIHVzZXItZHJhZzogbm9uZTsKfQouaGlyZS16b29tLWJhciB7CglkaXNwbGF5OiBpbmxpbmUtYmxvY2s7CgltaW4td2lkdGg6IDQwMHB4OwoJbWluLWhlaWdodDogNDRweDsKfQoKLmhpcmUtem9vbS1iYXIgbGFiZWwgewoJZGlzcGxheTogaW5saW5lLWJsb2NrOwoJd2lkdGg6IDE1JTsKCWhlaWdodDogMTAwJTsKCXZlcnRpY2FsLWFsaWduOiB0b3A7Cn0KLmhpcmUtem9vbS1iYXIgbGFiZWwgPiAqIHsKCWRpc3BsYXk6IGlubGluZS1ibG9jazsKCWhlaWdodDogMTAwJTsKCWxpbmUtaGVpZ2h0OiAzNHB4Cn0KLmhpcmUtem9vbS1iYXIgc3ZnIHsKCWN1cnNvcjogcG9pbnRlcjsKCWZpbGw6ICNCREE0N0U7CglzdHJva2U6ICNGMUVCRTY7Cgl3aWR0aDogODUlOwp9CgouaGlyZS16b29tLWJhciBzdmcgcGF0aCB7CglzdHJva2Utd2lkdGg6IDZweDsKfQoKLmhpcmUtem9vbS1iYXIgc3ZnIGNpcmNsZSB7CglzdHJva2Utd2lkdGg6IDA7Cn0KCi5oaXJlLWZpbGwtYnV0dG9uLAouaGlyZS1mcmVlLW1vdmVtZW50LWJ1dHRvbiB7CgltYXJnaW46IDA7CglwYWRkaW5nOiAwOwoJYm9yZGVyOiAwOwoJYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7Cglmb250LWZhbWlseTogaW5oZXJpdDsKCWN1cnNvcjogcG9pbnRlcjsKCW91dGxpbmU6IDA7Cgl3aWR0aDogNTBweDsKCWhlaWdodDogMjRweDsKCXBhZGRpbmc6IDAgNnB4OwoJYmFja2dyb3VuZC1jb2xvcjogI0JEQTQ3RTsKCW1hcmdpbi1yaWdodDogNnB4OwoJYm9yZGVyLXJhZGl1czogM3B4OwoJY29sb3I6ICNGMUVCRTY7Cgl2ZXJ0aWNhbC1hbGlnbjogdG9wOwoKfQoKCi5oaXJlLWZpbGwtYnV0dG9uOjotbW96LWZvY3VzLWlubmVyLAouaGlyZS1mcmVlLW1vdmVtZW50LWJ1dHRvbjo6LW1vei1mb2N1cy1pbm5lciB7CglwYWRkaW5nOiAwOwoJYm9yZGVyOiAwOwp9CgouaGlyZS1maWxsLWJ1dHRvbiBzdmcsCi5oaXJlLWZyZWUtbW92ZW1lbnQtYnV0dG9uIHN2ZyB7CglzdHJva2U6ICNGMUVCRTY7CglzdHJva2Utd2lkdGg6IDFweDsKCWZpbGw6ICNGMUVCRTY7CgoJc3Ryb2tlLW9wYWNpdHk6IDE7CgloZWlnaHQ6IDEwMCUKfQoKLmhpcmUtZnJlZS1tb3ZlbWVudC1idXR0b24uYWN0aXZlIHN2ZyB7CglmaWxsOiAjYWZhOwp9","base64");
(0, _insertCss2["default"])(css, { prepend: true });

_react2["default"].initializeTouchEvents(true);
exports.DjatokaClient = _componentsDjatokaClient2["default"];
exports.Minimap = _componentsMinimap2["default"];
exports.Zoom = _componentsZoom2["default"];
exports.FillButton = _componentsFillButton2["default"];
exports.FreeMovementButton = _componentsFreeMovementButton2["default"];
exports["default"] = _componentsDjatokaClient2["default"];

},{"./components/djatoka-client":19,"./components/fill-button":20,"./components/free-movement-button":21,"./components/minimap":26,"./components/zoom":27,"insert-css":1,"react":"react"}],29:[function(_dereq_,module,exports){
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

},{}]},{},[28])(28)
});