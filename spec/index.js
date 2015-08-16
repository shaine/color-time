var colorTime = require('../index');

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var noop = require('node-noop').noop;
var moment = require('moment');

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
            350: '#0f0'
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
                agingFn: noop,
                maxAgeFilterPercentage: undefined,
                maxAgeYears: undefined
            });
    });

    it('should set the aging function to greyscale', function() {
        // Run unit
        var value = colorTime.__setupConfig({
            0: '#f00',
            agingFn: 'greyscale',
            maxAgeYears: 10,
            maxAgeFilterPercentage: .5
        });

        // Verify expectations
        expect(value.agingFn)
            .to.equal(colorTime.__getColorAgedByGreyscale);
        expect(value.maxAgeYears)
            .to.equal(10);
        expect(value.maxAgeFilterPercentage)
            .to.equal(.5);
    });

    it('should use a user-defined aging function', function() {
        // Set up
        var agingFn = function() {};

        // Run unit
        var value = colorTime.__setupConfig({
            0: '#f00',
            agingFn: agingFn
        });

        // Verify expectations
        expect(value.agingFn)
            .to.equal(agingFn);
    });
});

describe('#getDayOfYearFromDate', function() {
    it('should get the day of year from a date string', function() {
        // Set up
        var date = moment('Aug 9th, 2015', 'MMM Do, YYYY')

        // Run unit
        var value = colorTime.__getDayOfYearFromDate(date);

        // Verify expectations
        expect(value)
            .to.equal(220);
    });
});

describe('#getYearsSinceDate', function() {
    it('should get the years since a date', function() {
        // Set up
        var date = moment('Aug 9th, 1915', 'MMM Do, YYYY')
        sinon.stub(moment.fn, 'diff')
            .withArgs(date)
            .returns(1234);
        sinon.stub(moment, 'duration')
            .withArgs(1234)
            .returns({
                asYears: sinon.stub().returns(100)
            });

        // Run unit
        var value = colorTime.__getYearsSinceDate(date);

        // Tear down
        moment.fn.diff.restore();
        moment.duration.restore();

        // Verify expectations
        expect(value)
            .to.equal(100);
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

    it('should get the two bounding days from the config for day 0', function() {
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
        }], 0);

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

    it('should handle boundary wrap', function() {
        // Run unit
        var value = colorTime.__getWeightBetweenDaysForDay(344, 20, 0);

        // Verify expectations
        expect(value)
            .to.equal(.5);
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

describe('#getColorAgedByGreyscale', function() {
    it('should not modify the color if no options', function() {
        // Run unit
        var value = colorTime.__getColorAgedByGreyscale('#f00', 0, undefined, undefined);

        // Verify expectations
        expect(value)
            .to.equal('#FF0000');
    });

    it('should get a color partially aged by greyscale', function() {
        // Run unit
        var value = colorTime.__getColorAgedByGreyscale('#f00', 5, 10, .5);

        // Verify expectations
        expect(value)
            .to.equal('#D31313');
    });

    it('should get a color fully aged by greyscale', function() {
        // Run unit
        var value = colorTime.__getColorAgedByGreyscale('#f00', 10, 10, .5);

        // Verify expectations
        expect(value)
            .to.equal('#A62727');
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

    it('should calculate an aged color', function() {
        // Set up
        sinon.stub(moment.duration.fn, 'asYears')
            .returns(5);
        var rgbColorTime = colorTime({
            0: '#f00',
            182: '#0f0',
            365: '#00f',
            maxAgeYears: 10,
            maxAgeFilterPercentage: .5,
            agingFn: 'greyscale'
        });

        // Run unit
        var value = rgbColorTime('Sep 4th, 2010', 'MMM Do, YYYY');

        // Tear down
        moment.duration.fn.asYears.restore();

        // Verify expectations
        expect(value)
            .to.equal('#1B985E');
    });
});
