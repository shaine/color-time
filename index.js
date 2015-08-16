/*
Example usage:
```
var colorTime = require('color-time')({
    0: '#0000ff',
    128: '#ff0000',
    250: '#777777'
});

var todayColor = colorTime('now');
```
*/

var colorLib = require('color');
var moment = require('moment');
var noop = require('node-noop').noop;

var setupConfig = function setupConfig(options) {
    var days = [];
    var agingFn = noop;
    var maxAgeYears;
    var maxAgeFilterPercentage;

    for (var key in options) {
        if (options.hasOwnProperty(key)) {
            var value = options[key];
            var keyInt = parseInt(key);

            // If the key-int as a string and the key are identical, then an
            // int was passed as the key. If the int is a valid day of year:
            if (keyInt.toString() === key && keyInt >= 0 && keyInt < 366) {
                // Maximum number of days in a year is 366
                days.push({
                    day: keyInt,
                    color: value
                });
            // If the key is the aging function
            } else if (key === 'agingFn') {
                if (value === 'greyscale') {
                    agingFn = getColorAgedByGreyscale;
                } else if (typeof value === 'function') {
                    agingFn = value;
                }
            } else if (key === 'maxAgeYears') {
                maxAgeYears = value;
            } else if (key === 'maxAgeFilterPercentage') {
                maxAgeFilterPercentage = value;
            }

            if (days.length < 1) {
                throw new Error('Need at least one valid day-color pair');
            }
        }
    }

    return {
        days: days,
        agingFn: agingFn,
        maxAgeFilterPercentage: maxAgeFilterPercentage,
        maxAgeYears: maxAgeYears
    };
};

var getDayOfYearFromDate = function getDayOfYearFromDate(date) {
    return parseInt(date.format('DDDD')) - 1;
};

var getYearsSinceDate = function getYearsSinceDate(date) {
    var now = moment();

    return moment.duration(now.diff(date)).asYears();
};

var getBoundingDayConfigsForDay = function getBoundingDayConfigsForDay(days, day) {
    var minDay;
    var minColor;
    var maxDay;
    var maxColor;
    var first;

    var configDayInt;
    var configColor;

    // Go through all day configurations
    for (var key in days) {
        var dayConfig = days[key];
        configDayInt = parseInt(dayConfig.day);
        configColor = dayConfig.color;

        // Take note of the earliest day
        if (typeof first === 'undefined') {
            first = dayConfig;
        }

        if (configDayInt <= day) {
            // If the day is smaller than our day, it's the min
            minDay = configDayInt;
            minColor = configColor;
        } else if (typeof maxDay === 'undefined' && configDayInt > day) {
            // If the day is larger than our day, and we haven't found one
            // yet, this is the next day after ours is so it's the upper bound
            maxDay = configDayInt;
            maxColor = configColor;
        }
    }

    // If there is no min, use the latest day in the year
    // The values are from the last run
    if (typeof minDay === 'undefined') {
        minDay = configDayInt;
        minColor = configColor;
    }

    if (typeof maxDay === 'undefined') {
        maxDay = parseInt(first.day);
        maxColor = first.color;
    }

    return [{
        day: minDay,
        color: minColor
    }, {
        day: maxDay,
        color: maxColor
    }]
};

var getWeightBetweenDaysForDay = function getWeightBetweenDaysForDay(firstBoundingDay, secondBoundingDay, day) {
    // Handle new year boundary wrap
    if (firstBoundingDay > day) {
        firstBoundingDay = firstBoundingDay - 364;
    }

    // Handle end of year boundary wrap
    if (secondBoundingDay < day) {
        secondBoundingDay = secondBoundingDay + 364;
    }

    var weight = (day - firstBoundingDay) / (secondBoundingDay - firstBoundingDay);

    // Handle possible NaN for 0-length day range
    // and ∞ for 0-length day 0
    if (!weight || weight > 1) {
        weight = 0;
    }

    return weight;
};

var getWeightedColorAverage = function getWeightedColorAverage(firstColor, secondColor, weight) {
    return colorLib(secondColor).mix(colorLib(firstColor), weight).hexString();
};

var getColorAgedByGreyscale = function getColorAgedByGreyscale(color, agedYears, maxAgeYears, maxAgeFilterPercentage) {
    var color = colorLib(color);
    var newColor = color;
    var agedYears = agedYears || 0;

    if (typeof maxAgeYears === 'number' || typeof maxAgeFilterPercentage === 'number') {
        var agePercentage = (agedYears / maxAgeYears);
        var weightedGreyscalePercentage = agePercentage * maxAgeFilterPercentage;

        newColor = color.clone().greyscale().mix(color, weightedGreyscalePercentage);
    }

    return newColor.hexString();
};

var colorTime = function colorTime(options) {
    var config = setupConfig(options);

    return function colorTimeInstance() {
        var date = moment.apply(undefined, arguments);
        var agedYears = getYearsSinceDate(date);
        var dayOfYear = getDayOfYearFromDate(date);

        var boundingDayConfigs = getBoundingDayConfigsForDay(config.days, dayOfYear);
        var minDate = boundingDayConfigs[0];
        var maxDate = boundingDayConfigs[1];

        var weight = getWeightBetweenDaysForDay(minDate.day, maxDate.day, dayOfYear);

        var color = getWeightedColorAverage(minDate.color, maxDate.color, weight);

        var agedColor = config.agingFn(
            color,
            agedYears,
            config.maxAgeYears,
            config.maxAgeFilterPercentage
        );

        return agedColor || color;
    };
};

colorTime.__setupConfig = setupConfig;
colorTime.__getDayOfYearFromDate = getDayOfYearFromDate;
colorTime.__getBoundingDayConfigsForDay = getBoundingDayConfigsForDay;
colorTime.__getWeightBetweenDaysForDay = getWeightBetweenDaysForDay;
colorTime.__getWeightedColorAverage = getWeightedColorAverage;
colorTime.__getColorAgedByGreyscale = getColorAgedByGreyscale;
colorTime.__getYearsSinceDate = getYearsSinceDate;

module.exports = colorTime;
