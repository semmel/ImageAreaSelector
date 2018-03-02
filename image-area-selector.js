(function (name, context, definition) {
  'use strict'
  if (typeof window.define === 'function' && window.define.amd) { window.define(definition) } else if (typeof module !== 'undefined' && module.exports) { module.exports = definition() } else if (context.exports) { context.exports = definition() } else { context[name] = definition() }
})('Selector', this, function () {
  'use strict'
  var Selector = function (options) {
    if (!(this instanceof Selector)) {
      return new Selector(options)
    }

    var defaultOptions = {
      imgId: 'img', 
      className: 'container',
      minWidth: 50,
      maxWidth: 300,
      minHeight: 50,
      maxHeight: 300,
      relative: false,
      keepAspect: true,
      customRatio: true
    }
    this.options = this.extend(options, defaultOptions)
  }
  Selector.prototype = {
    extend: function (source, target) {
      if (source == null) { return target }
      for (var k in source) {
        if (source[k] != null && target[k] !== source[k]) {
          target[k] = source[k]
        }
      }
      return target
    },
    _props: {
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
      resizing: ''
    },
  
    capture: function(callback) {
      callback({
        width: this._props.width * this._props.ratio,
        height: this._props.height * this._props.ratio,
        x: this._props.x * this._props.ratio,
        y: this._props.y * this._props.ratio
      });
    },
  
    show: function () {
      var selector = document.getElementById('selector-move');
      if (! selector) return console.error('Element not loaded');
      selector.style.display = 'block';
      return this;
    },
  
    hide: function () {
      var selector = document.getElementById('selector-move');
      if (! selector) return;
  
      selector.style.display = 'none';
    },
  
    setup: function() {    
  
      // Check img exists
      var img = document.getElementById(this.options.imgId);
      if (!img) return console.error('Element not found: ' + this.options.img);
  
      var that = this;
      try {
        that.logic(img);
      } catch (ex) {
        img.onload = function(event) {
          that.logic(this);
        }
      }
  
      return this;
    },
  
    logic: function (img) {
      var that = this;

      if (img.width === 0 || img.height === 0 || img.naturalWidth === 0 || img.naturalHeight === 0) {
        setTimeout(() => that.logic(img), 100);
        return;
      }

      window.onresize = function() {
        that.logic(img);
      }

      if (that.options.customRatio) 
      {
        that._props.aspectRatio = that.options.maxWidth / that.options.maxHeight;
        var mw = that.options.relative ? that.options.maxWidth : (that.options.maxWidth / that._props.aspectRatio);
        that._props.width = (img.width / 2) < mw ? (img.width / 2) : mw;
        that._props.height = that._props.width / that._props.aspectRatio;
      }
      else
      {
        that._props.aspectRatio = img.naturalWidth / img.width;

        var mw = that.options.relative ? that.options.maxWidth : (that.options.maxWidth / that._props.aspectRatio);
        that._props.width = (img.width / 2) < mw ? (img.width / 2) : mw;
        that._props.height = that._props.width / (img.width / img.height);
      }

      that._props.ratio = img.width / img.naturalWidth;
      that._props.x = (img.width / 2) - (that._props.width / 2);
      that._props.y = (img.height / 2) - (that._props.height / 2);

      var selector = document.getElementById('selector-move');
      if (selector) selector.remove();
  
      selector = document.createElement('div');
      selector.id = 'selector-move';    
      selector.style.width = that._props.width + 'px';
      selector.style.height = that._props.height + 'px';
      selector.style.top = that._props.y + 'px';
      selector.style.left = that._props.x + 'px';
      selector.style.display = 'none';
  
      var resizor = document.createElement('div');
      var nw = document.createElement('div');
      var ne = document.createElement('div');
      var se = document.createElement('div');
      var sw = document.createElement('div');
  
      resizor.id = "selector-resize"
      nw.className = "nw";
      ne.className = "ne";
      se.className = "se";
      sw.className = "sw";
  
      var onMove = function (event) {
        
        /* Get the image position and re-calculate mouses x,y */
        var bounds = img.getBoundingClientRect();
        var absX = event.clientX - bounds.left;
        var absY = event.clientY - bounds.top;
        
        /* Stops the selector being auto-centred */
        absX -= that._props.offsetX;
        absY -= that._props.offsetY;

        /* Only move selector within bounds of the image */
        if (absX > (img.width - that._props.width)) {
          absX = img.width - that._props.width;
        } else if (absX < 0) {
          absX = 0;
        }
  
        if (absY > (img.height - that._props.height)) {
          absY = img.height - that._props.height;
        } else if (absY < 0) {
          absY = 0;
        }
        
        // Update selectors location
        that._props.x = absX;
        that._props.y = absY;
  
        selector.style.top = absY + img.offsetTop + 'px';
        selector.style.left = absX + img.offsetLeft + 'px';
  
      }
  
      var onResize = function (event) {
  
        /* Get new pin size */
        var width = that._props.width + event.clientX - that._props.originX;
        var height = that._props.height + event.clientY - that._props.originY;
  
        var xVal = event.clientX - that._props.originX;
        var yVal = event.clientY - that._props.originY;
  
        var newX = that._props.x;
        var newY = that._props.y;
    
        /* Determine pos/neg positioning */
        if (that._props.resizing === 'nw' || (that._props.resizing === 'sw' && that.options.keepAspect)) {
          width = that._props.width + (that._props.width - width);
          height = that._props.height + (that._props.height - height);
        }
  
        if (! that.options.keepAspect) {
          switch (that._props.resizing) {
            case 'nw':
              newX += xVal;
              newY += yVal;
              break;
            case 'sw':
              width += (that._props.width - width) * 2;
              newX += xVal;
              break;
            case 'ne':
              height += (that._props.height - height) * 2;
              newY += yVal;
              break;
            case 'se':
              break;
          }
  
          // Don't go out of the boundries
          if (newX < 0) {
            width = that._props.width + (newX - xVal);
            newX = 0;
          } else if ((that._props.x + width + xVal) > img.width) {
            width = that._props.width;
          }
          
          if (newY < 0) {
            height = that._props.height;
            newY = 0;
          } else if ((that._props.y + height) > img.height) {
            height = that._props.height;
          }
        }

        // Re-calculate based on relative/native
        var relWidth = that.options.relative ? width : (width * that._props.aspectRatio);
        var relHeight = that.options.relative ? height : (height * that._props.aspectRatio);
        
        var minWidth = that.options.relative ? that.options.minWidth : (that.options.minWidth / that._props.aspectRatio);
        var maxWidth = that.options.relative ? that.options.maxWidth : (that.options.maxWidth / that._props.aspectRatio);

        var minHeight = that.options.relative ?  that.options.minHeight : (that.options.minHeight / that._props.aspectRatio);
        var maxHeight = that.options.relative ?  that.options.maxHeight : (that.options.maxHeight / that._props.aspectRatio);
        
        // Min/max width/height
        if (relWidth > that.options.maxWidth) {
          width = maxWidth;
        } else if (relWidth < that.options.minWidth) {
          width = minWidth;
          newX = that._props.x;
        }

        if (relHeight > that.options.maxHeight) {
          height = maxHeight;
        } else if (relHeight < that.options.minHeight) {
          height = minHeight;
          newY = that._props.y;
        }
  
        // Maintain aspect ratio?
        if (that.options.keepAspect) {
  
          // Set height based on width
          if (that.options.customRatio) height = width / that._props.aspectRatio;
          else height = width * (img.height / img.width);
          
          // Centre view
          newX -= (width - that._props.width) / 2;
          newY -= (height - that._props.height) / 2;
    
          // Are we out of view?
          if (width > (img.width - newX)) {
            var backInPx = width - (img.width - newX)
            newX -= backInPx;
          }
          if (height > (img.height - newY)) {
            var backInPx = height - (img.height - newY)
            newY -= backInPx;
          }
          
          // Ensure in view
          newX = that._props.x < 0 ? 0 : newX;
          newY = newY < 0 ? 0 : newY;
  
        }
    
        /* Update positions */
        selector.style.width = width + 'px';
        selector.style.height = height + 'px';
        selector.style.top = newY + img.offsetTop + 'px';
        selector.style.left = newX + img.offsetLeft + 'px';
        
        that._props.width = width;
        that._props.height = height;
        that._props.x = newX;
        that._props.y = newY;
  
        that._props.originX = event.clientX;
        that._props.originY = event.clientY;
  
      }

      var docDown = function (event) {
        that._props.originX = event.clientX;
        that._props.originY = event.clientY;
      }

      var docUp = function () {
        that._props.mousedown = false;
        that._props.offsetX = 0;
        that._props.offsetY = 0;
        that._props.resizing = '';
      }

      var docMove = function (event) {
        if (! that._props.mousedown) return;
  
        if (that._props.resizing) onResize(event);
        else onMove(event);
      }

      var selDown = function (event) {
        that._props.mousedown = true;
        that._props.offsetX = event.offsetX || that._props.width / 2;
        that._props.offsetY = event.offsetY || that._props.height / 2;
      }
      
      document.onmousedown = function (event) { docDown(event); }
      document.ontouchstart = function(event) { if (event.touches.length > 0) docDown(event.touches[0]);}      
      
      document.onmouseup = function (event) { docUp(event); }
      document.ontouchend = function(event) { docUp(); } 

      document.onmousemove = function(event) { docMove(event); }      
      document.ontouchmove = function(event) { if (event.touches.length > 0) docMove(event.touches[0]);}      

      selector.onmousedown = function (event) { selDown(event); }
      selector.ontouchstart = function (event) { if (event.touches.length > 0) selDown(event.touches[0]); }
  
      nw.onmousedown = function (event) { that._props.resizing = 'nw'; }
      ne.onmousedown = function (event) { that._props.resizing = 'ne'; }
      sw.onmousedown = function (event) { that._props.resizing = 'sw'; }
      se.onmousedown = function (event) { that._props.resizing = 'se'; }

      if (! that.options.keepAspect) {
        nw.ontouchstart = function(event) { if (event.touches.length > 0) that._props.resizing = 'nw'; }
        ne.ontouchstart = function(event) { if (event.touches.length > 0) that._props.resizing = 'ne'; }
        sw.ontouchstart = function(event) { if (event.touches.length > 0) that._props.resizing = 'sw'; }
        se.ontouchstart = function(event) { if (event.touches.length > 0) that._props.resizing = 'se'; }
      }
  
      resizor.appendChild(nw);
      resizor.appendChild(ne);
      resizor.appendChild(sw);
      resizor.appendChild(se);
      selector.appendChild(resizor);
      
      // Contain img with container
      // `element` is the element you want to wrap
      var container = document.getElementById('selector-container');
      if (! container) {
        var parent = img.parentNode;
        container = document.createElement('div');
        container.className = this.options.className;
        container.id = 'selector-container';
        parent.replaceChild(container, img);
        container.appendChild(img);
      }
      img.parentElement.appendChild(selector);
    }
  }
  return Selector
})

Element.prototype.remove = function() {
  this.parentElement.removeChild(this);
}
NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
  for(var i = this.length - 1; i >= 0; i--) {
      if(this[i] && this[i].parentElement) {
          this[i].parentElement.removeChild(this[i]);
      }
  }
}