/* TrickOMatic.js
 *
 * copyright (c) 2010-2017, Christian Mayer and the CometVisu contributers.
 *
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation; either version 3 of the License, or (at your option)
 * any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA
 */


/**
 * @author Christian Mayer
 * @since 2010
 */
qx.Class.define('cv.ui.TrickOMatic', {
  type: "static",

  /*
  ******************************************************
    STATICS
  ******************************************************
  */
  statics: {
    __id: 0,

    run: function () {
      var svg = this.getSVGDocument();
      if (!svg) { return; }

      // Pipe-O-Matic:
      var pipes = qx.bom.Selector.query(".pipe_group", svg);
      pipes.forEach(function (pipe_group) {
        qx.bom.Selector.query('path', pipe_group).forEach(function(path) {
          var halfsize = parseInt(parseFloat(path.style.strokeWidth) / 2);
          var opacity = 0.15;
          for (var width = halfsize - 1; width > 0; width--) {
            opacity -= 0.1 / halfsize;
            var n = path.cloneNode();
            n.className.baseVal += ' pipe-o-matic_clone';
            n.style.strokeWidth = width * 2;
            n.style.stroke = '#ffffff';
            n.style.strokeOpacity = opacity;
            pipe_group.insertBefore(n,
              path.nextElementSibling);
          }
        });
      });

      var model = cv.data.Model.getInstance();

      // Flow-O-Matic: add Paths
      var segmentLength = 40;
      pipes = qx.bom.Selector.query(".show_flow", svg);
      pipes.forEach(function (pipe_group) {
        var length = 0.0;
        qx.bom.Selector.query('path', pipe_group).forEach(function(path) {
          if (path.className.animVal.split(' ').indexOf('pipe-o-matic_clone') > 0) {
            return;
          }
          var stroke = path.style.stroke;
          var r, g, b;
          if (stroke[0] === '#') {
            r = parseInt(path.style.stroke.substring(1, 3), 16);
            g = parseInt(path.style.stroke.substring(3, 5), 16);
            b = parseInt(path.style.stroke.substring(5, 7), 16);
          } else if (stroke.indexOf('rgb(') === 0) {
            var colors = stroke.replace(/[^0-9,.]*/g, '').split(',');
            r = colors[0];
            g = colors[1];
            b = colors[2];
          }
          var rTarget = 0; // this color should be somehow user setable but how?
          var gTarget = 0;
          var bTarget = 0;

          function toHex(v) {
            var ret = parseInt(v).toString(16);
            return (ret.length < 2) ? '0' + ret : ret;
          }

          for (var i = segmentLength / 2; i > 0; i -= 2) {
            var factor = 1 - i / (segmentLength / 2);
            var offset = (length + segmentLength / 2 - i) % segmentLength;
            var low = 2 * i;
            var high = segmentLength - low;
            var n = path.cloneNode();
            n.className.baseVal += ' flow-o-matic_clone';
            n.style.stroke = '#' + toHex(r * factor + rTarget * (1 - factor)) + toHex(g * factor + gTarget * (1 - factor)) + toHex(b * factor + bTarget * (1 - factor));
            if (high > offset) {
              n.style.strokeDasharray = [high - offset, low, offset, 0];
            } else {
              n.style.strokeDasharray = [0, low - (offset - high), high, offset - high];
            }
            n.style.strokeDashoffset = length % (0.5 * segmentLength);
            pipe_group.insertBefore(n, path.nextElementSibling);
          }
          length += path.getTotalLength();
          var activeValues = qx.bom.element.Attribute.get(pipe_group, 'data-cometvisu-active');
          if (activeValues) {
            activeValues.split(' ').forEach(function (address) {
              var id = "flow_"+this.__id++;
              model.addAddress(address, id);
              model.addUpdateListener(address, function (data) {
                if (data === '01' || data === 'ON') {
                  qx.bom.element.Class.toggle(pipe_group, "flow_active", true);
                } else {
                  qx.bom.element.Class.toggle(pipe_group, "flow_active", false);
                }
              });
            });
          }
        });
      });

      // Flow-O-Matic: add CSS
      // helper for multiple bowser support
      function createKeyframe(name, content) {
        return '@keyframes ' + name + " {\n" + content + "}\n" +
          '@-moz-keyframes ' + name + " {\n" + content + "}\n" +
          '@-webkit-keyframes ' + name + " {\n" + content + "}\n";
      }

      var keyframes = createKeyframe('move',
        "from {  stroke-dashoffset: " + segmentLength + ";  }\n" +
        "to   {  stroke-dashoffset: 0;  }\n");

      function createCSSRules(style, value) {
        return style + ': ' + value + ";\n" + '-moz-' + style + ': ' +
          value + ";\n" + '-webkit-' + style + ': ' + value +
          ";\n";
      }

      keyframes += ".flow_active path {\n" +
        createCSSRules('animation-duration', '3s') +
        createCSSRules('animation-name', 'move')+
        createCSSRules('animation-timing-function', 'linear') +
        createCSSRules('animation-iteration-count', 'infinite') +
        "}\n";
      var s = svg.createElementNS('http://www.w3.org/2000/svg',
        'style');
      s.setAttribute('type', 'text/css');
      s.textContent = keyframes;
      qx.dom.Element.insertBegin(s, qx.bom.Selector.query('svg', svg)[0]);
    }
  }
});