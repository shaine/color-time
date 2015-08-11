# color-time
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

The module is a method used to create a method for retrieving the color for the specified date. Call the module method with the desired configuration of yearly colors to receive the curried value calculation method. The following example creates a calculation method using only a year-long red color:

```javascript
var redColorTime = require('color-time')({
    0: '#f00'
});
```

To retrieve the value of a color for a given day, call that method with arguments that are parseable by [moment.js](http://momentjs.com/).

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
