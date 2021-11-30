[![NPM Version](https://img.shields.io/npm/v/image-area-selector.svg?style=flat-square)](https://www.npmjs.com/package/image-area-selector) ![Zero deps](https://img.shields.io/badge/dependencies-0-brightgreen)

# Image Area Selector
A Javascript plugin that selects an area of an image together with an optional target point.

## Installation
`npm install image-area-selector`

## Screenshots
You can view a live demo [here](https://www.iamrobert.co.uk/projects/image-area-selector).

<img src="https://github.com/robholden/ImageAreaSelector/raw/master/example.PNG" width="400">

## Usage
There are four methods: setup, show, hide, capture.

### HTML
```html
<div>
  <img id="img" src="large.jpg"></div>
</div>
<button id="done">Done</button>
```

### Javascript
```javascript
// Create instance of the Selector class
var selector = new Selector({
  imgId:        'img',                // The id of the image to be used for selecting
  className:    'container',          // The image will be surrounded by a div, you can give that div a class name
  onStart:      (e) => {},            // Function called when an action has started. Returns custom event { detail: { type ('Resize' or 'Move'), values } }
  onChange:     (e) => {},            // Function called when an action has changed. Returns custom event { detail: { type ('Resize' or 'Move'), values } }
  onEnd:        (e) => {},            // Function called when an action has ended. Returns custom event { detail: { type ('Resize' or 'Move'), values } }
  keepAspect:   true,                 // Allow any ratio, or keep the image ratio during resizing
  customRatio:  true,                 // Use image ratio, or maxWidth/maxHeight ratio
  minWidth:     100,                  // Minimum allowed width
  maxWidth:     400,                  // Maximum allowed width
  minHeight:    75,                   // Minimum allowed height
  maxHeight:    300,                  // Maximum allowed height
  relative:     true,                 // Uses dimensions as native or relative
  initialRectangle: {                 // Initial Rectangle (optional)
    x: 0,                             // initial x coord
    y: 0,                             // initial y coord
    width: 50,
    height: 50
  }, 
  showCrossPoint: true,
  initialCrossPoint: {
    x: 150 * 4,
    y: 220 * 4
  },
  crossPointSvg: "<svg></svg>"      // custom svg image
})

// You can run this either before/after an image has loaded
// Pass in a boolean to show the selector upon load
selector.setup(true);

// Methods to show/hide the selector
select.show();
select.hide();

// Returns coordinates of the image
/* 
{
  width:  number, // Native width in pixels
  height: number, // Native height in pixels
  x:      number, // Native start position x
  y:      number, // Native start position y
  img:    string,  // If you pass in true this will contain the cropped image.
  crossPoint: {
   x: number
   y: number
  }
}
*/
var result = select.capture(true);

// Returns an image in base64 format
var src = select.crop();
```

### Stylesheet
Minimal styles are defined in `image-area-selector.css`.
