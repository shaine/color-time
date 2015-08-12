# color-time

[![Build Status](https://travis-ci.org/shaine/color-time.svg?branch=master)](https://travis-ci.org/shaine/color-time)

Converts a day of the year into a color hex value based on a supplied color mapping. For example, if Jan 01 is #FFF and Dec 31 is #000, then Jul 02 will work out to be a mid-grey (#808080).

## Example

```javascript
var colorTime = require('color-time')({
    0: '#fff',
    365: '#000'
});

var feb1Color = colorTime('2015-02-01'); // #E9E9E9

var rgbColorTime = require('color-time')({
    0: '#f00',
    182: '#0f0',
    365: '#00f'
});

var fallColor = rgbColorTime('Sep 4th, 2015', 'MMM Do, YYYY'); // #00A659
```

## Usage

### Yearly Color Cycle

The module is a function used to create a function for retrieving the color for the specified date. Call the module function with the desired configuration of yearly colors to receive the curried value calculation function. The following example creates a calculation function using only a year-long red color:

```javascript
var redColorTime = require('color-time')({
    0: '#f00'
});
```

To retrieve the value of a color for a given day, call that function with arguments that are parseable by [moment.js](http://momentjs.com/).

```javascript
var julyColor = redColorTime('Jul 1st, 2015', 'MMM Do, YYYY'); // #FF0000
var decemberColor = redColorTime('2015-12-25'); // #FF0000
```

Each numeric entry in the configuration hash corresponds to a 0-index day within the year, and can accept as many entries as needed. Note that the colors provided as the value of the hash must be in a format which [color](https://github.com/harthur/color)'s constructor can use.

```javascript
var randomColorTime = require('color-time')({
    0: '#f00',
    10: '#f9563f',
    20: '#dddaaa',
    30: '#009132',
    132: '#132132',
    256: '#aaa'
});
```

### Color Aging

A color can be aged over time. To retrieve an aged color, first retrieve a calculation function with the desired aging properties. Required are `maxAgeYears` to describe over how many years a color may age to its maximum aged color, and `maxAgeFilterPercentage` to describe what percentage of the filter to apply at the maximum age.

An aging function must also be supplied. Currently built in filters, which get passed to the config as a string to `agingFn`, are:

- `'greyscale'` - Gradually shift the color to its greyscale value ([converting color to greyscale](https://en.wikipedia.org/wiki/Grayscale#Converting_color_to_grayscale))
- `fn(currentColorHexString, numberOfYearsToAge, maxAgeYears, maxAgeFilterPercentage)` - Custom function to manually calculate an aged color

Example of a greyscale aging:

```javascript
var agedColorTime = require('color-time')({
    0: '#f00',
    265: '#ff0',
    maxAgeYears: 10, // Age color to greyscale over 10 years
    maxAgeFilterPercentage: .75, // At the end of the aging, the color has converted to 75% greyscale,
    agingFn: 'greyscale'
});
```

A custom aging function may be provided to perform any desired modification to the color. It will be called with arguments from the config and from the calculation function: `fn(currentColorHexString, numberOfYearsToAge, maxAgeYears, maxAgeFilterPercentage)`

```javascript
var agedColorTime = require('color-time')({
    0: '#f00',
    265: '#ff0',
    maxAgeYears: 10,
    maxAgeFilterPercentage: .75
    agingFn: function(currentColorHexString, numberOfYearsToAge, maxAgeYears, maxAgeFilterPercentage) {
        // Do whatever
        return '#00f'; // Return a hex color string at the end
    }
});
```

To calculate a given color with an age, request the color as usual with a full date.

```javascript
var agedColor = agedColorTime('Jul 1st, 1915', 'MMM Do, YYYY'); // Get the July 1st color, aged ~100 years
```

## Config

- **<0-365> _string|object_** Day of year as key, valid CSS color string or descriptive object (see [color setters](https://www.npmjs.com/package/color#setters)).
- **maxAgeYears _number_** _(optional, default: undefined)_ Maximum number of years a color can age for, after which no further aging modification will be added.
- **maxAgeFilterPercentage _number_** _(optional, default: undefined)_ A number between 0 and 1 indicating the maximum amount of the filter should be applied at the maximum age. 0 is no applied filter, 1 is filter added at 100% effect.
- **agingFn _string|function_** (optional, default: noop) An optional function by which to calculate an aged color. May select from a built-in list of aging filters (see [Color Aging](#color-aging)) or provide a custom function (see above).
