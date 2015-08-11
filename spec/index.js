var colorTime = require('../index');

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

chai.use(sinonChai);
var expect = chai.expect;

describe('#setupConfig', function() {
    it('should throw an error if no valid color configurations', function() {
        // Set up
        var wrapper = function () {
            return colorTime.__setupConfig.apply(undefined, arguments);
        }.bind(undefined, {
            '-1': '#f00',
            400: '#f00',
            foobar: '#f00'
        });

        // Verify expectations
        expect(wrapper)
            .to.throw('Need at least one valid day-color pair');
    });

    it('should get a sane set of color day configurations', function() {
        // Run unit
        var value = colorTime.__setupConfig({
            5: '#f00',
            350: '#0f0',
            maxDesaturationYear: 5,
            maxDesaturationLevel: .5
        });

        // Verify expectations
        expect(value)
            .to.eql({
                days: [{
                    day: 5,
                    color: '#f00'
                }, {
                    day: 350,
                    color: '#0f0'
                }],
                maxDesaturationYear: 5,
                maxDesaturationLevel: .5
            });
    });
});

describe('#getDayOfYearFromDate', function() {
    it('should get the day of year from a date string', function() {
        // Run unit
        var value = colorTime.__getDayOfYearFromDate('Aug 9th, 2015', 'MMM Do, YYYY');

        // Verify expectations
        expect(value)
            .to.equal(220);
    });
});

describe('#getBoundingDayConfigsForDay', function() {
    it('should get the two bounding days from the config for a day', function() {
        // Run unit
        var value = colorTime.__getBoundingDayConfigsForDay([{
            day: 100,
            color:  'foo'
        }, {
            day: 200,
            color: 'bar'
        }, {
            day: 300,
            color: 'baz'
        }], 250);

        // Verify expectations
        expect(value)
            .to.eql([{
                day: 200,
                color: 'bar'
            }, {
                day: 300,
                color: 'baz'
            }]);
    });

    it('should get the two circular bounding days from the config for a day', function() {
        // Run unit
        var value = colorTime.__getBoundingDayConfigsForDay([{
            day: 100,
            color:  'foo'
        }, {
            day: 200,
            color: 'bar'
        }, {
            day: 300,
            color: 'baz'
        }], 350);

        // Verify expectations
        expect(value)
            .to.eql([{
                day: 300,
                color: 'baz'
            }, {
                day: 100,
                color: 'foo'
            }]);
    });
});

describe('#getWeightBetweenDaysForDay', function() {
    it('should get the weight between two days for a day', function() {
        // Run unit
        var value = colorTime.__getWeightBetweenDaysForDay(100, 200, 125);

        // Verify expectations
        expect(value)
            .to.equal(.25);
    });

    it('should get 0 for the first day', function () {
        // Run unit
        var value = colorTime.__getWeightBetweenDaysForDay(100, 200, 100);

        // Verify expectations
        expect(value)
            .to.equal(0);
    });

    it('should get 0 for 0-length day range', function () {
        // Run unit
        var value = colorTime.__getWeightBetweenDaysForDay(100, 100, 100);

        // Verify expectations
        expect(value)
            .to.equal(0);
    });

    it('should handle day 0', function() {
        // Run unit
        var value = colorTime.__getWeightBetweenDaysForDay(0, 0, 100);

        // Verify expectations
        expect(value)
            .to.equal(0);
    });
});

describe('#getWeightedColorAverage', function() {
    it('should get the weighted average between two colors', function() {
        // Run unit
        var value = colorTime.__getWeightedColorAverage('#f00', '#0f0', .25);

        // Verify expectations
        expect(value)
            .to.equal('#BF4000');
    });
});

describe('#colorTime', function() {
    it('should calculate a color from a day', function() {
        // Set up
        var ctInstance = colorTime({
            0: '#f00',
            356: '#0f0'
        });

        // Run unit
        var value = ctInstance('Aug 9th, 2015', 'MMM Do, YYYY');

        // Verify expectations
        expect(value)
            .to.equal('#619E00');
    });

    it('should calculate a color from a single day', function() {
        // Set up
        var ctInstance = colorTime({
            0: '#0f0'
        });

        // Run unit
        var value = ctInstance('Aug 9th, 2015', 'MMM Do, YYYY');

        // Verify expectations
        expect(value)
            .to.equal('#00FF00');
    });

    it('should calculate a color from multiple days', function() {
        // Set up
        var rgbColorTime = colorTime({
            0: '#f00',
            182: '#0f0',
            365: '#00f'
        });

        var value = rgbColorTime('Sep 4th, 2015', 'MMM Do, YYYY');

        // Verify expectations
        expect(value)
            .to.equal('#00A659');
    });
});
