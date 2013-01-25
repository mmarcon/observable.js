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


describe('Observable.js', function(){

    function mockXMLHttpRequestWithResponseText(responseText) {
        window.XMLHttpRequest = function(){
            this.open = jasmine.createSpy('XMLHttpRequest open');
            this.send = function(){
                this.onreadystatechange({});
            }.bind(this);
            this.readyState = 4;
            this.status = 200;
            this.getResponseHeader = jasmine.createSpy('XMLHttpRequest getResponseHeader').andReturn('application/json');
            this.responseText = responseText;
        };
    }

    describe('Model', function(){
        var cachedXMLHttpRequest = window.XMLHttpRequest;

        beforeEach(function(){
            mockXMLHttpRequestWithResponseText('{"response":{"name":"Max","age":31,"language":["italian","english"]},"meta":{"status":200}}');
        });

        afterEach(function(){
            window.XMLHttpRequest = cachedXMLHttpRequest;
        });

        it('Checks everything is defined', function(){
            expect(OO).toBeDefined();
            expect(OO.Model).toBeDefined();
            expect(OO.Observer).toBeDefined();
        });

        it('Creates a Model', function(){
            var person = {
                name: 'Max',
                age: 30,
                language: ['italian', 'english']
            };
            var model = OO.Model({model: person});

            expect(model instanceof OO.Model).toBe(true);
            expect(model._state).toBeDefined();
            expect(model.name).toBe('Max');
            expect(model.age).toBe(30);
            expect(model.language.length).toBe(2);
        });

        it('Triggers events on Models', function(){
            var changeCallback = jasmine.createSpy('Something changed!');

            var person = {
                name: 'Max',
                age: 30,
                language: ['italian', 'english']
            };
            var model = OO.Model({model: person});
            var cbid = model.on('change', changeCallback);
            model.age = 31;

            expect(changeCallback).toHaveBeenCalledWith('change', 'age');
            changeCallback.reset();

            model.language = ['italian', 'english', 'one day german'];

            expect(changeCallback).toHaveBeenCalledWith('change', 'language');
            changeCallback.reset();

            model.off('change', cbid);
            model.age = 30;

            expect(changeCallback).not.toHaveBeenCalled();
        });

        it('Refreshes the model by contacting the provided data source', function(){
            var changeCallback = jasmine.createSpy('Something changed!');

            var person = {
                name: 'Max',
                age: 30,
                language: ['italian', 'english']
            };
            var model = OO.Model({
                model: person,
                source: '/person/1234',
                mapper: function(data){
                    //Response is of type
                    //{resonse: {my person}, meta:{info}}
                    return data.response;
                }});
            var cbid = model.on('change', changeCallback);

            model.refresh();

            expect(changeCallback.callCount).toBe(3);
        });

        it('Refreshes the model by contacting the new data source when the source is updated', function(){
            var changeCallback = jasmine.createSpy('Something changed!');
            mockXMLHttpRequestWithResponseText('{"response":{"name":"John","age":25,"language":["english", "spanish"]},"meta":{"status":200}}');

            var person = {
                name: 'Max',
                age: 30,
                language: ['italian', 'english']
            };
            var model = OO.Model({
                model: person,
                source: '/person/1234',
                mapper: function(data){
                    //Response is of type
                    //{resonse: {my person}, meta:{info}}
                    return data.response;
                }});
            var cbid = model.on('change', changeCallback);

            model.source = '/person/456';

            expect(changeCallback.callCount).toBe(3);
        });
    });

    describe('Nested models', function(){
        it('Works with nested models', function(){
            var pChangeCallback = jasmine.createSpy('Something changed in person!');
            var hChangeCallback = jasmine.createSpy('Something changed in hobbies!');

            var hobbies = {
                monday: ['football', 'reading'],
                wednesday: ['free climbing'],
                friday: ['cooking classes']
            };

            var hModel = OO.Model({model: hobbies});

            var person = {
                name: 'Max',
                age: 30,
                hobby: hModel
            };

            var pModel = OO.Model({
                model: person
            });

            //Getter chain
            expect(pModel.hobby.monday.length).toBe(2);
            expect(pModel.hobby.monday[0]).toBe('football');

            //Events
            pModel.on('change', pChangeCallback);
            hModel.on('change', hChangeCallback);

            hModel.monday = ['swimming'];
            expect(hChangeCallback).toHaveBeenCalledWith('change', 'monday');
            expect(pChangeCallback).not.toHaveBeenCalled();
        });

        it('Works with AJAX and nested models', function(){
            var pChangeCallback = jasmine.createSpy('Something changed in person!');
            var hChangeCallback = jasmine.createSpy('Something changed in hobbies!');

            mockXMLHttpRequestWithResponseText('{"response":{"hobbies": [{"day":"monday", "hobby":"free climbing"}]}, "meta":{"status": 200}}');

            var hobbies = [
                {
                    day: 'monday',
                    hobby: 'swimming'
                },
                {
                    day: 'wednesday',
                    hobby: 'football'
                }
            ];

            var hModel = OO.Model({
                model: {list: hobbies},
                mapper: function(data){
                    return {
                        list: data.response.hobbies
                    };
                },
                source: '/person/1234/hobbies'
            });

            var person = {
                name: 'Max',
                age: 30,
                hobby: hModel
            };

            var pModel = OO.Model({
                model: person
            });

            //Getter chain
            expect(pModel.hobby.list.length).toBe(2);
            expect(pModel.hobby.list[0].hobby).toBe('swimming');

            //Events
            pModel.on('change', pChangeCallback);
            hModel.on('change', hChangeCallback);

            //Refresh from server
            hModel.refresh();

            expect(hChangeCallback).toHaveBeenCalledWith('change', 'list');

            //This is a design choice, although it might seem a bug. I want to be able
            //to update observers of the sub-models without triggering events on super-models
            //so potentially subviews can be redrawn without touching the main view.
            expect(pChangeCallback).not.toHaveBeenCalled();

            expect(pModel.hobby.list.length).toBe(1);
            expect(pModel.hobby.list[0].hobby).toBe('free climbing');
        });
    });

    describe('Observer', function(){

        it('Observes a model waiting for change events', function(){
            var changeCallback = jasmine.createSpy('Something changed!');

            var person = {
                name: 'Max',
                age: 30,
                language: ['italian', 'english']
            };
            var model = OO.Model({model: person});
            var observer = OO.Observer();
            observer.observe(model, changeCallback);
            model.age = 31;

            expect(changeCallback).toHaveBeenCalledWith('change', 'age');
            changeCallback.reset();

            observer.unobserve(model);
            model.age = 31;

            expect(changeCallback).not.toHaveBeenCalled();
        });

        it('Observes multiple models waiting for change events', function(){
            var changeCallback = jasmine.createSpy('Something changed!');

            var person = {
                name: 'Max',
                age: 30,
                language: ['italian', 'english']
            };
            var otherPerson = {
                name: 'John',
                age: 28,
                language: ['english']
            };
            var modelPerson = OO.Model({model: person});
            var modelOtherPerson = OO.Model({model: otherPerson});
            var observer = OO.Observer();
            observer.observe(modelPerson, changeCallback);
            observer.observe(modelOtherPerson, changeCallback);

            modelPerson.age = 31;

            expect(changeCallback).toHaveBeenCalledWith('change', 'age');
            changeCallback.reset();

            modelOtherPerson.language = ['spanish', 'english'];

            expect(changeCallback).toHaveBeenCalledWith('change', 'language');
            changeCallback.reset();

            observer.unobserve(modelPerson);
            modelPerson.age = 31;

            expect(changeCallback).not.toHaveBeenCalled();
            changeCallback.reset();

            modelOtherPerson.age = 29;
            expect(changeCallback).toHaveBeenCalledWith('change', 'age');
        });
    });
});