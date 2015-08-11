/*
Example usage:
```
var colorTime = require('color-time')({
    0: '#0000ff',
    128: '#ff0000',
    250: '#777777',
    maxDesaturationYear: 10,
    maxDesaturationLevel: 0.3
});

var todayColor = colorTime('now');
```
*/

var color = require('color');
var moment = require('moment');

var setupConfig = function setupConfig(options) {
    var days = [];
    var maxDesaturationLevel = 0;
    var maxDesaturationYear = 0;

    for (var key in options) {
        if (options.hasOwnProperty(key)) {
            var value = options[key];
            var keyInt = parseInt(key);

            if (key === 'maxDesaturationYear') {
                maxDesaturationYear = value;
            } else if (key === 'maxDesaturationLevel') {
                maxDesaturationLevel = value;
            } else if (keyInt.toString() === key && keyInt >= 0 && keyInt < 366) {
                // Maximum number of days in a year is 366
                days.push({
                    day: keyInt,
                    color: value
                });
            }

            if (days.length < 1) {
                throw new Error('Need at least one valid day-color pair');
            }
        }
    }

    return {
        days: days,
        maxDesaturationLevel: maxDesaturationLevel,
        maxDesaturationYear: maxDesaturationYear
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
    return color(secondColor).mix(color(firstColor), weight).hexString();
};

var colorTime = function colorTime(options) {
    var config = setupConfig(options);

    return function colorTimeInstance() {
        var dayOfYear = getDayOfYearFromDate.apply(undefined, arguments);

        var boundingDayConfigs = getBoundingDayConfigsForDay(config.days, dayOfYear);
        var minDate = boundingDayConfigs[0];
        var maxDate = boundingDayConfigs[1];

        var weight = getWeightBetweenDaysForDay(minDate.day, maxDate.day, dayOfYear);

        var color = getWeightedColorAverage(minDate.color, maxDate.color, weight);

        return color;
    };
};

colorTime.__setupConfig = setupConfig;
colorTime.__getDayOfYearFromDate = getDayOfYearFromDate;
colorTime.__getBoundingDayConfigsForDay = getBoundingDayConfigsForDay;
colorTime.__getWeightBetweenDaysForDay = getWeightBetweenDaysForDay;
colorTime.__getWeightedColorAverage = getWeightedColorAverage;

module.exports = colorTime;
