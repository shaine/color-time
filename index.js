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

var getDayOfYearFromDate = function getDayOfYearFromDate() {
    var date = moment.apply(undefined, arguments);

    return parseInt(date.format('DDDD')) - 1;
}

var getBoundingDayConfigsForDay = function getBoundingDayConfigsForDay(days, day) {
    var minDay;
    var minColor;
    var maxDay;
    var maxColor;
    var first;

    for (var key in days) {
        var dayConfig = days[key];
        var configDayInt = parseInt(dayConfig.day);
        var configColor = dayConfig.color;

        if (typeof first === 'undefined') {
            first = dayConfig;
        }

        if (configDayInt <= day) {
            minDay = configDayInt;
            minColor = configColor;
        } else if (typeof maxDay === 'undefined' && configDayInt > day) {
            maxDay = configDayInt;
            maxColor = configColor;
        }
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
    var min = firstBoundingDay < secondBoundingDay? firstBoundingDay : secondBoundingDay;
    var max = firstBoundingDay > secondBoundingDay? firstBoundingDay : secondBoundingDay;

    var weight = (day - min) / (max - min);

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
        // Iterate through arguments to figure out what values were received
        var agedYears = 0;
        var dateArgs = [];
        // Important: You should not slice on arguments because it prevents
        // optimizations in JavaScript engines (V8 for example). Instead, try
        // constructing a new array by iterating through the arguments object.
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments
        for (var i = 0; i < arguments.length; i++) {
            var argument = arguments[i];
            // If last argument is a number
            if (i === arguments.length - 1 && typeof argument === 'number') {
                // Use it as the date year
                agedYears = argument;
            // If not a numeric last arg
            } else {
                // Give it to the date function
                dateArgs.push(argument);
            }
        }

        var dayOfYear = getDayOfYearFromDate.apply(undefined, dateArgs);

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

module.exports = colorTime;
