(function (name, context, definition) {
  'use strict'
  if (typeof window.define === 'function' && window.define.amd) {
    window.define(definition)
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = definition()
  } else if (context.exports) {
    context.exports = definition()
  } else {
    context[name] = definition()
  }
})('Selector', this, function () {
  'use strict'
  var Selector = function (options) {
    if (!(this instanceof Selector)) {
      return new Selector(options)
    }

    const defaultOptions = {
      imgId: 'img',
      className: 'container',
      onStart: null,
      onChange: null,
      onEnd: null,
      minWidth: 50,
      maxWidth: 300,
      minHeight: 50,
      maxHeight: 300,
      relative: false,
      keepAspect: true,
      customRatio: true,
      showCrossPoint: false,
      isCrossPointAttachedToBorder: false,
      crossPointSvg: String.raw`<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <circle cx="12" cy="12" r="10" />
  <circle cx="12" cy="12" r="6" />
  <circle cx="12" cy="12" r="2" />
</svg>`
    };
    this.options = this.extend(options, defaultOptions);

    this._setProps();
    this._customEventIE();
  }
  Selector.prototype = {
    extend: function (source, target) {
      if (source == null) {
        return target
      }

      for (var k in source) {
        if (source[k] != null && target[k] !== source[k]) {
          target[k] = source[k]
        }
      }

      return target;
    },
    _inProgress: false,
    _img: null,
    _props: {},
    _setProps: function () {
      this._props = {
        aspectRatio: 1,
        ratio: 1,
        x: 0,
        y: 0,
        width: 300,
        height: 300,
        mousedown: false,
        offsetX: 0,
        offsetY: 0,
        originX: 0,
        originY: 0,
        resizing: '',
        crossPoint: {
          x: 0,
          y: 0,
          mousedown: false,
          offsetX: 0,
          offsetY: 0,
          width: 1,
          height: 1
        }
      };
    },
    _customEventIE: function () {
      if (typeof window.CustomEvent === "function") return false; //If not IE

      function CustomEvent(event, params) {
        params = params || {
          bubbles: false,
          cancelable: false,
          detail: undefined
        };
        var evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
      }

      CustomEvent.prototype = window.Event.prototype;
      window.CustomEvent = CustomEvent;
    },
    _clone: function deepCopy(obj) {
      // See https://stackoverflow.com/a/53771927/564642
      // Thanks HectorGuo!
      if(typeof obj !== 'object' || obj === null) {
        return obj;
      }
    
      if(obj instanceof Date) {
        return new Date(obj.getTime());
      }
    
      if(obj instanceof Array) {
        return obj.reduce((arr, item, i) => {
          arr[i] = deepCopy(item);
          return arr;
        }, []);
      }
    
      if(obj instanceof Object) {
        return Object.keys(obj).reduce((newObj, key) => {
          newObj[key] = deepCopy(obj[key]);
          return newObj;
        }, {})
      }
    },
    _triggerEvent: function (eventName, type) {
      if (!this._img) return;
      var event = new CustomEvent(eventName, {
        detail: {
          type: type,
          values: this.coords()
        }
      });
      this._img.dispatchEvent(event);
    },
    _resizeObserver: null,

    setup: function (show) {

      // Check img exists
      var that = this;
      setTimeout(function () {
        var img = document.getElementById(that.options.imgId);
        if (!img) {
          throw new Error('Element not found: ' + that.options.img);
        }

        that._img = img;

        var notLoaded = function () {
          img.onload = function () {
            that.logic(this);
            if (show === true) that.show(that.options.showCrossPoint);
          }
        }

        if (img.width === 0 || img.height === 0 || img.naturalWidth === 0 || img.naturalHeight === 0) {
          notLoaded();
        } else {
          try {
            that.logic(img);
            if (show === true) that.show(that.options.showCrossPoint);
          } catch (ex) {
            notLoaded();
          }
        }
        
        that._resizeObserver = new ResizeObserver((function(){
          let isFirstEvent = true;
          return entries => {
            for (let entry of entries) {
              if (entry.target === that._img) {
                if (isFirstEvent) {
                  isFirstEvent = false;
                }
                else {
                  that.logic(that._img);
                }
              }
            }
          };
        }()));
        
        that._resizeObserver.observe(img);
      }, 0);

      return this;
    },

    destroy: function () {
      let that = this;
      if (that.options.onStart) that._img.removeEventListener('onStart', that.options.onStart);
      if (that.options.onChange) that._img.removeEventListener('onChange', that.options.onChange);
      if (that.options.onEnd) that._img.removeEventListener('onEnd', that.options.onEnd);

      var selector = document.getElementById('selector-move');
      if (selector) selector.remove();
      
      that._resizeObserver.unobserve(that._img);

      this._setProps();
    },

    coords: function () {
      return {
        width: this._props.width / this._props.ratio,
        height: this._props.height / this._props.ratio,
        x: this._props.x / this._props.ratio,
        y: this._props.y / this._props.ratio,
        crossPoint: {
          x: this._props.crossPoint.x / this._props.ratio,
          y: this._props.crossPoint.y / this._props.ratio
        }
      };
    },

    logic: function (img) {
      var that = this;

      if (that.options.onStart) img.addEventListener('onStart', that.options.onStart);
      if (that.options.onChange) img.addEventListener('onChange', that.options.onChange);
      if (that.options.onEnd) img.addEventListener('onEnd', that.options.onEnd);
      
      that._props.ratio = img.width / img.naturalWidth;

      if (that.options.initialRectangle && Object.keys(that.options.initialRectangle)) {
        that._props.width = that.options.initialRectangle.width * that._props.ratio;
        that._props.height = that.options.initialRectangle.height * that._props.ratio;
        that._props.x = that.options.initialRectangle.x * that._props.ratio;
        that._props.y = that.options.initialRectangle.y * that._props.ratio;
        that._props.aspectRatio = that.options.initialRectangle.width / that.options.initialRectangle.height;
      }
      else {
        if (that.options.customRatio) {
          that._props.aspectRatio = that.options.maxWidth / that.options.maxHeight;
          let mw = that.options.relative ? that.options.maxWidth : (that.options.maxWidth / that._props.aspectRatio);
          that._props.width = (img.width / 2) < mw ? (img.width / 2) : mw;
          that._props.height = that._props.width / that._props.aspectRatio;
        }
        else {
          that._props.aspectRatio = img.naturalWidth / img.naturalHeight;
    
          let mw = that.options.relative ? that.options.maxWidth : (that.options.maxWidth / that._props.aspectRatio);
          that._props.width = (img.width / 2) < mw ? (img.width / 2) : mw;
          that._props.height = that._props.width / (img.width / img.height);
        }
        
        that._props.x = (img.width / 2) - (that._props.width / 2);
        that._props.y = (img.height / 2) - (that._props.height / 2);
      }
      
      if (that.options.initialCrossPoint && Object.keys(that.options.initialCrossPoint)) {
        that._props.crossPoint.x = that.options.initialCrossPoint.x * that._props.ratio;
        that._props.crossPoint.y = that.options.initialCrossPoint.y * that._props.ratio;
      }
      else {
        that._props.crossPoint.x = 0;
        that._props.crossPoint.y = 0;
      }

      var oldProps = that._clone(that._props);
      
      // Contain img with container
      // `element` is the element you want to wrap
      const container = document.getElementById('selector-container');
      let selector = container ? container.querySelector('#selector-move') : null;
      let crossPointElement = container ? container.querySelector('.cross-point'): null;
      
      if (container) {
        if (selector) {
          selector.remove();
        }
        if (crossPointElement) {
          crossPointElement.remove();
        }
      }
      
      const
         isShown = selector ? (selector.style.display !== 'none') : false,
        isCrossPointShown = crossPointElement ? (crossPointElement.style.display !== 'none'): false;

      selector = document.createElement('div');
      selector.id = 'selector-move';
      selector.style.width = that._props.width + 'px';
      selector.style.height = that._props.height + 'px';
      selector.style.top = that._props.y + 'px';
      selector.style.left = that._props.x + 'px';
      selector.style.display = isShown ? 'block' : 'none';

      var resizor = document.createElement('div');
      var nw = document.createElement('div');
      var ne = document.createElement('div');
      var se = document.createElement('div');
      var sw = document.createElement('div');

      resizor.id = "selector-resize";
      nw.className = "nw";
      ne.className = "ne";
      se.className = "se";
      sw.className = "sw";
      
      const parent = document.createElement('div');
      parent.insertAdjacentHTML('afterbegin', that.options.crossPointSvg);
      
      crossPointElement = parent.querySelector("svg");
      crossPointElement.classList.add("cross-point");
      crossPointElement.style.top = that._props.crossPoint.y + 'px';
      crossPointElement.style.left = that._props.crossPoint.x + 'px';
      crossPointElement.style.display = isCrossPointShown ? 'block': 'none';
      
      const closestBorder = (x, y, w, h) => {
        const distances = [
           { d: x, border: "left"},
          {d: w - x, border: "right"},
          {d: y, border: "top"},
          {d: h - y, border: "bottom"}
        ],
           minDistance = distances.reduce(
              (prev, next) => next.d < prev.d ? next : prev
           );
        return minDistance.border;
      };
      
      const updateXY = (x, y, props, target) => {
        /* Stops the selector being auto-centred */
        let absX = x - that._props.offsetX;
        let absY = y - that._props.offsetY;

        /* Only move selector within bounds of the image */
        if (absX > (img.width - props.width)) {
          absX = img.width - props.width;
        }
        else if (absX < 0) {
          absX = 0;
        }

        if (absY > (img.height - props.height)) {
          absY = img.height - props.height;
        }
        else if (absY < 0) {
          absY = 0;
        }
        
        if ((target === crossPointElement) && that.options.isCrossPointAttachedToBorder) {
          const stickyBorder = closestBorder(absX, absY, img.width, img.height);
          switch (stickyBorder) {
            case "bottom":
              absY = img.height;
              break;
            case "top":
              absY = 0;
              break;
            case "left":
              absX = 0;
              break;
            case "right":
              absX = img.width;
              break;
          }
        }

        // Update selectors location
        props.x = absX;
        props.y = absY;

        target.style.top = absY + img.offsetTop + 'px';
        target.style.left = absX + img.offsetLeft + 'px';
      };

      const onMove = function (event) {
        /* Get the image position and re-calculate mouses x,y */
        const
           bounds = img.getBoundingClientRect();
        let
          absX = event.clientX - bounds.left,
          absY = event.clientY - bounds.top;
        
        if (that._props.mousedown) {
          updateXY(absX, absY, that._props, selector);
          
          // If props have changed call on change fn
          if (oldProps.x !== that._props.x || oldProps.y !== that._props.y) {
            that._triggerEvent('onChange', 'Move');
          }
        }
        else if (that._props.crossPoint.mousedown) {
          updateXY(absX, absY, that._props.crossPoint, crossPointElement);
          // If props have changed call on change fn
          if (oldProps.crossPoint.x !== that._props.crossPoint.x || oldProps.crossPoint.y !== that._props.crossPoint.y) {
            that._triggerEvent('onChange', 'Move');
          }
        }
        else {
          throw new Error("Move cannot happen if mouse not down");
        }
      };

      var onResize = function (event) {

        /* Get new pin size */
        var newWidth = that._props.width + (event.clientX - that._props.originX);
        var newHeight = that._props.height + (event.clientY - that._props.originY);

        var xVal = event.clientX - that._props.originX;
        var yVal = event.clientY - that._props.originY;

        var newX = that._props.x;
        var newY = that._props.y;

        /* Determine pos/neg positioning */
        if (that._props.resizing === 'nw' || (that._props.resizing === 'sw' && that.options.keepAspect)) {
          newWidth = that._props.width + (that._props.width - newWidth);
          newHeight = that._props.height + (that._props.height - newHeight);
        }

        if (!that.options.keepAspect) {
          switch (that._props.resizing) {
            case 'nw':
              newX += xVal;
              newY += yVal;

              break;
            case 'sw':
              newWidth += (that._props.width - newWidth) * 2;
              newX += xVal;

              break;
            case 'ne':
              newHeight += (that._props.height - newHeight) * 2;
              newY += yVal;

              break;
          }

          // Don't go out of the boundries
          if (newX < 0) {
            newWidth = that._props.width + (newX - xVal);
            newX = 0;
          } else if ((that._props.x + newWidth + xVal) > img.width) {
            newWidth = img.width - that._props.x;
          }

          if (newY < 0) {
            newHeight = that._props.height;
            newY = 0;
          } else if ((that._props.y + that._props.height) > img.height) {
            newHeight = img.height - that._props.y;
          }
        }

        // Re-calculate based on relative/native
        var relWidth = that.options.relative ? newWidth : (newWidth * that._props.aspectRatio);
        var relHeight = that.options.relative ? newHeight : (newHeight * that._props.aspectRatio);

        var minWidth = that.options.relative ? that.options.minWidth : (that.options.minWidth / that._props.aspectRatio);
        var maxWidth = that.options.relative ? that.options.maxWidth : (that.options.maxWidth / that._props.aspectRatio);

        var minHeight = that.options.relative ? that.options.minHeight : (that.options.minHeight / that._props.aspectRatio);
        var maxHeight = that.options.relative ? that.options.maxHeight : (that.options.maxHeight / that._props.aspectRatio);

        // Min/max width/height
        var xLimitReached = false;
        if (relWidth > that.options.maxWidth) {
          xLimitReached = true;
          newWidth = maxWidth;
        } else if (relWidth < that.options.minWidth) {
          xLimitReached = true;
          newX = that._props.x;
          newWidth = minWidth;
        }

        var yLimitReached = false;
        if (relHeight > that.options.maxHeight) {
          yLimitReached = true;
          newHeight = maxHeight;
        } else if (relHeight < that.options.minHeight) {
          yLimitReached = true;
          newY = that._props.y;
          newHeight = minHeight;
        }

        // Maintain aspect ratio?
        if (that.options.keepAspect) {

          // Set height based on width
          if (that.options.customRatio) newHeight = newWidth / that._props.aspectRatio;
          else newHeight = newWidth * (img.height / img.width);

          // Centre view
          newX -= (newWidth - that._props.width) / 2;
          newY -= (newHeight - that._props.height) / 2;

          // Are we out of view?
          if (newWidth > (img.width - newX)) {
            var backInPx = newWidth - (img.width - newX)
            newX -= backInPx;
          }
          if (newHeight > (img.height - newY)) {
            var backInPx = newHeight - (img.height - newY)
            newY -= backInPx;
          }

          // Ensure in view
          newX = that._props.x < 0 ? 0 : newX;
          newY = newY < 0 ? 0 : newY;

        }

        /* Update width positions */
        if ((that.options.keepAspect || !xLimitReached) && newWidth < that.options.maxWidth) {
          that._props.x = newX;
          selector.style.width = newWidth + 'px';
          selector.style.left = newX + img.offsetLeft + 'px';

          that._props.width = newWidth;
        }

        /* Update height positions */
        if ((that.options.keepAspect || !yLimitReached) && newHeight < that.options.maxHeight) {
          that._props.y = newY;
          selector.style.height = newHeight + 'px';
          selector.style.top = newY + img.offsetTop + 'px';

          that._props.height = newHeight;
        }

        that._props.originX = event.clientX;
        that._props.originY = event.clientY;

        // If props have changed call on change fn
        if (oldProps.height != that._props.height || oldProps.width != that._props.width) that._triggerEvent('onChange', 'Resize');

      }

      var docDown = function (event) {
        that._props.originX = event.clientX;
        that._props.originY = event.clientY;
      };

      const docUp = function () {
        that._triggerEvent(
           'onEnd',
           that._props.crossPoint.mousedown
              ? 'MoveCrossPoint'
              : that._props.resizing
                 ? 'Resize'
                 : 'Move'
        );

        that._inProgress = false;
        that._props.mousedown = false;
        that._props.offsetX = 0;
        that._props.offsetY = 0;
        that._props.resizing = '';
        that._props.crossPoint.mousedown = false;
        that._props.crossPoint.offsetX = 0;
        that._props.crossPoint.offsetY = 0;
      };

      const docMove = function (event) {
        if (that._props.mousedown) {
  
          if (that._props.resizing) {
            onResize(event);
          }
          else {
            onMove(event);
          }
  
          if (!that._inProgress) {
            that._triggerEvent('onStart', that._props.resizing ? 'Resize' : 'Move');
          }
  
          that._inProgress = true;
        }
        else if (that._props.crossPoint.mousedown) {
          onMove(event);
          if (!that._inProgress) {
            that._triggerEvent('onStart', 'MoveCrossPoint');
          }
          
          that._inProgress = true;
        }
      };

      var selDown = function (event) {
        that._props.mousedown = true;
        that._props.offsetX = event.offsetX || that._props.width / 2;
        that._props.offsetY = event.offsetY || that._props.height / 2;
      }

      document.onmousedown =  docDown;
      document.ontouchstart = function (event) {
        if (event.touches.length > 0) docDown(event.touches[0]);
      }

      document.onmouseup = docUp;
      document.ontouchend = docUp;

      document.onmousemove = docMove;
      document.ontouchmove = function (event) {
        if (event.touches.length > 0) docMove(event.touches[0]);
      }

      selector.onmousedown = selDown;
      selector.ontouchstart = function (event) {
        if (event.touches.length > 0) selDown(event.touches[0]);
      };

      nw.onmousedown = function (event) {
        that._props.resizing = 'nw';
      }
      ne.onmousedown = function (event) {
        that._props.resizing = 'ne';
      }
      sw.onmousedown = function (event) {
        that._props.resizing = 'sw';
      }
      se.onmousedown = function (event) {
        that._props.resizing = 'se';
      }

      if (!that.options.keepAspect) {
        nw.ontouchstart = function (event) {
          if (event.touches.length > 0) that._props.resizing = 'nw';
        }
        ne.ontouchstart = function (event) {
          if (event.touches.length > 0) that._props.resizing = 'ne';
        }
        sw.ontouchstart = function (event) {
          if (event.touches.length > 0) that._props.resizing = 'sw';
        }
        se.ontouchstart = function (event) {
          if (event.touches.length > 0) that._props.resizing = 'se';
        }
      }
      
      const onCrossPointMouseDown = evt => {
        that._props.crossPoint.mousedown = true;
        that._props.crossPoint.offsetX = evt.offsetX || that._props.width / 2;
        that._props.crossPoint.offsetY = evt.offsetY || that._props.height / 2;
      }
      
      crossPointElement.onmousedown = onCrossPointMouseDown;
      crossPointElement.ontouchstart = function (event) {
        if (event.touches.length > 0) onCrossPointMouseDown(event.touches[0]);
      };

      resizor.appendChild(nw);
      resizor.appendChild(ne);
      resizor.appendChild(sw);
      resizor.appendChild(se);
      selector.appendChild(resizor);
      
      if (!container) {
        const parent = img.parentNode;
        const containerElement = document.createElement('div');
        containerElement.className = this.options.className;
        containerElement.id = 'selector-container';
        parent.replaceChild(containerElement, img);
        containerElement.appendChild(img);
      }
      
      img.parentElement.appendChild(selector);

      if (that.options.showCrossPoint) {
        img.parentElement.appendChild(crossPointElement);
      }
    },

    capture: function (crop) {
      var data = this.coords();
      if (crop === true) data['img'] = this.crop();

      return data;
    },

    crop: function () {
      // Source: https://yellowpencil.com/blog/cropping-images-with-javascript/
      // Set up canvas for thumbnail
      var coords = this.coords();
      var tnCanvas = document.createElement('canvas');
      var tnCanvasContext = tnCanvas.getContext('2d');
      tnCanvas.width = coords.width;
      tnCanvas.height = coords.height;

      /* Use the sourceCanvas to duplicate the entire image.
         This step was crucial for iOS4 and under devices.
         Follow the link at the end of this post to see what happens when you don’t do this
      */
      var bufferCanvas = document.createElement('canvas');
      var bufferContext = bufferCanvas.getContext('2d');
      bufferCanvas.width = this._img.naturalWidth;
      bufferCanvas.height = this._img.naturalHeight;
      bufferContext.drawImage(this._img, 0, 0);

      /* Now we use the drawImage method to take the pixels from our bufferCanvas and draw them into our thumbnail canvas */
      tnCanvasContext.drawImage(bufferCanvas, coords.x, coords.y, coords.width, coords.height, 0, 0, coords.width, coords.height);
      return tnCanvas.toDataURL();
    },

    show: function (isShowingCrossPoint) {
      setTimeout(function () {
        var selector = document.getElementById('selector-move');
        if (!selector) {
          return console.error('Element not loaded');
        }
        selector.style.display = 'block';
        
        if (isShowingCrossPoint) {
          const element = document.querySelector('.cross-point');
          if (element) {
            element.style.display = 'block';
          }
        }
      }, 0);

      return this;
    },

    hide: function () {
      setTimeout(function () {
        var selector = document.getElementById('selector-move');
        if (!selector) {
          return;
        }
        selector.style.display = 'none';
        
        const element = document.querySelector('.cross-point');
          if (element) {
            element.style.display = 'none';
          }
      }, 0);
    }
  }

  return Selector
})

// Element.prototype.remove = function () {
//   this.parentElement.removeChild(this);
// }
// NodeList.prototype.remove = HTMLCollection.prototype.remove = function () {
//   for (var i = this.length - 1; i >= 0; i--) {
//     if (this[i] && this[i].parentElement) {
//       this[i].parentElement.removeChild(this[i]);
//     }
//   }
// }
