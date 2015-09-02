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

export let requestAnimationFrame = 'function' === typeof global.requestAnimationFrame ?
        (cb) => global.requestAnimationFrame(cb) :
    'function' === typeof global.webkitRequestAnimationFrame ?
        (cb) => global.webkitRequestAnimationFrame(cb) :
    'function' === typeof global.mozRequestAnimationFrame ?
        (cb) => global.mozRequestAnimationFrame(cb) :
    undefined;

export let cancelAnimationFrame = 'function' === typeof global.cancelAnimationFrame ?
        (cb) => global.cancelAnimationFrame(cb) :
    'function' === typeof global.webkitCancelAnimationFrame ?
        (cb) => global.webkitCancelAnimationFrame(cb) :
    'function' === typeof global.webkitCancelRequestAnimationFrame ?
        (cb) => global.webkitCancelRequestAnimationFrame(cb) :
    'function' === typeof global.mozCancelAnimationFrame ?
        (cb) => global.mozCancelAnimationFrame(cb) :
    undefined;