/*
 * Copyright (C) 2013 Massimiliano Marcon

 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software
 * and associated documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:

 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
 * PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
 * FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
 * OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

;(function(window, document, undefined){
    'use strict';

    var Observable = window.OO = {},
        M, O;

    function uid(){
        var s4 = function(){
            return Math.floor(Math.random() * 0x10000).toString(16);
        };
        return [s4(), s4(), s4()].join('-');
    }

    Observable.Model = function(options){
        var instance = this;
        if(!(this instanceof Observable.Model)) {
            return new Observable.Model(options);
        }
        this._subs = {};
        this.source = options.source;
        this._state = {};

        Object.keys(options.model || {}).forEach(function(prop){
            Object.defineProperty(instance, prop, {
                enumerable: true,
                set: function(value) {
                    instance.trigger('change', prop);
                    instance._state[prop] = value;
                },
                get: function(){
                    return instance._state[prop];
                }
            });
            instance._state[prop] = options.model[prop];
        });
    };

    M = Observable.Model.prototype;

    M.on = function(event, callback, observer){
        var callbackID = (observer && observer.id) || uid();
        if(!this._subs[event]) {
            this._subs[event] = {};
        }

        this._subs[event][callbackID] = callback;
        return callbackID;
    };

    M.off = function(event, callbackID){
        callbackID = callbackID.id ? callbackID.id : callbackID;
        if(this._subs[event] && this._subs[event][callbackID]) {
            delete this._subs[event][callbackID];
        }
    };

    M.trigger = function(event, arg) {
        var instance = this;
        if(!this._subs[event]) {
            return;
        }
        Object.keys(this._subs[event]).forEach(function(id){
            var callback = instance._subs[event][id];
            callback.call(instance._state, event, arg);
        });
    };

    Observable.Observer = function(options){
        if(!(this instanceof Observable.Observer)) {
            return new Observable.Observer(options);
        }
        this.id = uid();
    };

    O = Observable.Observer.prototype;

    O.observe = function(model, callback) {
        model.on('change', callback, this);
    };

    O.unobserve = function(model) {
        model.off('change', this);
    };

})(window, document);