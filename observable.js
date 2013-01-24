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

    function isFunction(fn) {
        return typeof fn === 'function';
    }

    Observable.ajax = function(options){
        var req = new window.XMLHttpRequest();
        req.open(options.method, options.url, true);
        req.onreadystatechange = function (aEvt) {
            var data, contentType;
            if (req.readyState === 4 && req.status == 200) {
                //Success
                if(isFunction(options.success)) {
                    data = req.responseText;
                    contentType = req.getResponseHeader('Content-Type');
                    if(contentType && /json/i.test(contentType)) {
                        data = JSON.parse(data);
                    }
                    options.success.call(req, data);
                }
            }
            else {
                //Failure
                options.error.call(req);
            }
        };
        req.send(null);
    };

    Observable.Model = function(options){
        if(!(this instanceof Observable.Model)) {
            return new Observable.Model(options);
        }
        this._subs = {};
        this.source = options.source;
        this.mapper = options.mapper || function(data){ return data; };
        this._state = {};

        Object.keys(options.model || {}).forEach(function(prop){
            Object.defineProperty(this, prop, {
                enumerable: true,
                set: function(value) {
                    this.trigger('change', prop);
                    this._state[prop] = value;
                },
                get: function(){
                    return this._state[prop];
                }
            });
            this._state[prop] = options.model[prop];
        }.bind(this));
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
        if(!this._subs[event]) {
            return;
        }
        Object.keys(this._subs[event]).forEach(function(id){
            var callback = this._subs[event][id];
            callback.call(this._state, event, arg);
        }.bind(this));
    };

    M.refresh = function() {
        if(!this.source) {
            return;
        }
        Observable.ajax({
            url: this.source,
            success: function(data) {
                var model = this.mapper(data), that = this;
                Object.keys(model).forEach(function(p){
                    //This should trigger a bunch of change events.
                    //Should it only trigger one? How?
                    that[p] = model[p];
                });
            }.bind(this)
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