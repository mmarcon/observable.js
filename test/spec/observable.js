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


describe('Observable', function(){

    beforeEach(function(){

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

    it('Observes models waiting for change events', function(){
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
});