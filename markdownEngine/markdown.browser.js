(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (process){
// .dirname, .basename, and .extname methods are extracted from Node.js v8.11.1,
// backported and transplited with Babel, with backwards-compat fixes

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function (path) {
  if (typeof path !== 'string') path = path + '';
  if (path.length === 0) return '.';
  var code = path.charCodeAt(0);
  var hasRoot = code === 47 /*/*/;
  var end = -1;
  var matchedSlash = true;
  for (var i = path.length - 1; i >= 1; --i) {
    code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        if (!matchedSlash) {
          end = i;
          break;
        }
      } else {
      // We saw the first non-path separator
      matchedSlash = false;
    }
  }

  if (end === -1) return hasRoot ? '/' : '.';
  if (hasRoot && end === 1) {
    // return '//';
    // Backwards-compat fix:
    return '/';
  }
  return path.slice(0, end);
};

function basename(path) {
  if (typeof path !== 'string') path = path + '';

  var start = 0;
  var end = -1;
  var matchedSlash = true;
  var i;

  for (i = path.length - 1; i >= 0; --i) {
    if (path.charCodeAt(i) === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          start = i + 1;
          break;
        }
      } else if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // path component
      matchedSlash = false;
      end = i + 1;
    }
  }

  if (end === -1) return '';
  return path.slice(start, end);
}

// Uses a mixed approach for backwards-compatibility, as ext behavior changed
// in new Node.js versions, so only basename() above is backported here
exports.basename = function (path, ext) {
  var f = basename(path);
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};

exports.extname = function (path) {
  if (typeof path !== 'string') path = path + '';
  var startDot = -1;
  var startPart = 0;
  var end = -1;
  var matchedSlash = true;
  // Track the state of characters (if any) we see before our first dot and
  // after any path separator we find
  var preDotState = 0;
  for (var i = path.length - 1; i >= 0; --i) {
    var code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          startPart = i + 1;
          break;
        }
        continue;
      }
    if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // extension
      matchedSlash = false;
      end = i + 1;
    }
    if (code === 46 /*.*/) {
        // If this is our first dot, mark it as the start of our extension
        if (startDot === -1)
          startDot = i;
        else if (preDotState !== 1)
          preDotState = 1;
    } else if (startDot !== -1) {
      // We saw a non-dot and non-path separator before our dot, so we should
      // have a good chance at having a non-empty extension
      preDotState = -1;
    }
  }

  if (startDot === -1 || end === -1 ||
      // We saw a non-dot character immediately before the dot
      preDotState === 0 ||
      // The (right-most) trimmed path component is exactly '..'
      preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    return '';
  }
  return path.slice(startDot, end);
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":2}],2:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
const spaceSeparated = require("space-separated-tokens");

function escapeRegExp(str) {
  return str.replace(/[-[]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

const C_NEWLINE = "\n";
const C_FENCE = "|";

function compilerFactory(nodeType) {
  let text;
  let title;

  return {
    blockHeading(node) {
      console.log("TCL: blockHeading -> blockHeading", blockHeading);
      title = this.all(node).join("");
      return "";
    },
    blockBody(node) {
      console.log("TCL: blockBody -> blockBody", blockBody);
      text = this.all(node)
        .map(s => s.replace(/\n/g, "\n| "))
        .join("\n|\n| ");
      return text;
    },
    block(node) {
      console.log("TCL: block -> block", block);
      text = "";
      title = "";
      this.all(node);
      if (title) {
        return `[[${nodeType} | ${title}]]\n| ${text}`;
      } else {
        return `[[${nodeType}]]\n| ${text}`;
      }
    }
  };
}

module.exports = function blockPlugin(availableBlocks = {}) {
  //   console.log("availableBlocks", availableBlocks);
  //   const pattern = Object.keys(availableBlocks)
  //     .map(escapeRegExp)
  //     .join("|");

  //   if (!pattern) {
  //     throw new Error(
  //       "remark-custom-blocks needs to be passed a configuration object as option"
  //     );
  //   }

  const regex = new RegExp(`---\n`);

  function blockTokenizer(eat, value, silent) {
    const now = eat.now();
    const keep = regex.exec(value);
    if (!keep) return;
    if (keep.index !== 0) return;
    const [eaten] = keep;
    // console.log(
    //   "TCL: blockTokenizer -> eaten, blockType, blockTitle",
    //   eaten,
    //   blockType,
    //   blockTitle
    // );

    /* istanbul ignore if - never used (yet) */
    if (silent) return true;

    const linesToEat = [];
    const content = [];

    let idx = 0;
    var breakThisOne = false;
    while ((idx = value.indexOf(C_NEWLINE)) !== -1) {
      const next = value.indexOf(C_NEWLINE, idx + 1);
      // either slice until next NEWLINE or slice until end of string
      const lineToEat =
        next !== -1 ? value.slice(idx + 1, next) : value.slice(idx + 1);
      // remove leading `FENCE ` or leading `FENCE`
      const line = lineToEat; //.slice(lineToEat.startsWith(`${C_FENCE} `) ? 2 : 1);
      linesToEat.push(lineToEat);
      value = value.slice(idx + 1);

      if (lineToEat.indexOf("---") === 0) {
        break;
      }
      content.push(line);
    }

    console.log("content", content);

    // const contentString = content.join(C_NEWLINE);
    var rows = [];

    const exit = this.enterBlock();
    // const contents = {
    //   type: `jekyllCustomBlockBody`,
    //   data: {
    //     hName: "tr",
    //     hProperties: {
    //       className: "jekyll-metadata-tr"
    //     }
    //   },
    //   children: this.tokenizeBlock(contentString, now)
    // };

    // const blockChildren = [contents];

    content.forEach(line => {
      console.log("line", typeof line, line);
      var metadataParts = line.split(": ");
      console.log("metadataParts", typeof metadataParts, metadataParts);

      rows.push({
        type: `jekyllCustomBlockBody`,
        data: {
          hName: "tr",
          hProperties: {
            className: "jekyll-metadata-tr"
          }
        },
        children: [
          {
            type: `jekyllMetadataColums`,
            data: {
              hName: "th",
              hProperties: {
                className: "jekyll-metadata-th"
              }
            },
            children: this.tokenizeBlock(metadataParts[0], now)
          },
          {
            type: `jekyllMetadataColums`,
            data: {
              hName: "th",
              hProperties: {
                className: "jekyll-metadata-th"
              }
            },
            children: this.tokenizeBlock(metadataParts[1], now)
          }
        ]
      });
    });

    exit();

    console.log("rows", JSON.stringify(rows, null, 2));

    const stringToEat = eaten + linesToEat.join(C_NEWLINE);

    // const potentialBlock = availableBlocks[blockType];
    // const titleAllowed =
    //   potentialBlock.title &&
    //   ["optional", "required"].includes(potentialBlock.title);
    // const titleRequired =
    //   potentialBlock.title && potentialBlock.title === "required";

    // if (titleRequired && !blockTitle) return;
    // if (!titleAllowed && blockTitle) return;

    const add = eat(stringToEat);

    // const exit = this.enterBlock();
    // const contents = {
    //   type: `jekyllCustomBlockBody`,
    //   data: {
    //     hName: "tr",
    //     hProperties: {
    //       className: "jekyll-metadata-tr"
    //     }
    //   },
    //   children: this.tokenizeBlock(contentString, now)
    // };
    // exit();

    // const blockChildren = [contents];

    return add({
      type: `jekyllCustomBlock`,
      data: {
        hName: "table",
        hProperties: {
          className: ["jekyll-metadata-table"]
        }
      },
      children: rows
    });
  }

  const Parser = this.Parser;

  // Inject blockTokenizer
  const blockTokenizers = Parser.prototype.blockTokenizers;
  const blockMethods = Parser.prototype.blockMethods;
  if (blockTokenizers) {
    blockTokenizers.customBlocks = blockTokenizer;

    blockMethods.splice(
      blockMethods.indexOf("fencedCode") + 1,
      0,
      "customBlocks"
    );
  }

  //   console.log('blockMethods', blockMethods)

  const Compiler = this.Compiler;
  if (Compiler) {
    const visitors = Compiler.prototype.visitors;
    if (!visitors) return;

    var originalTable = visitors["table"];
    var attr;
    var value;
    
    visitors["table"] = function block(node) {
      if (node.children[0].children.length == 2) {
        return `---\n${node.children
          .map(each => {
            attr = each.children[0].children[0].children[0].value;
            value = each.children[1].children[0].children[0].value;
            if (attr === "title") {
              value = `"${value}"`;
            }
            return `${attr}: ${value}`;
          })
          .join("\n")} \n---\n`;
      }

      return originalTable.apply(this, arguments);
    };
  }

  if (blockTokenizers) {
    const interruptParagraph = Parser.prototype.interruptParagraph;
    const interruptList = Parser.prototype.interruptList;
    const interruptBlockquote = Parser.prototype.interruptBlockquote;

    interruptParagraph.splice(interruptParagraph.indexOf("fencedCode") + 1, 0, [
      "customBlocks"
    ]);
    interruptList.splice(interruptList.indexOf("fencedCode") + 1, 0, [
      "customBlocks"
    ]);
    interruptBlockquote.splice(
      interruptBlockquote.indexOf("fencedCode") + 1,
      0,
      ["customBlocks"]
    );
  }
  // Inject into interrupt rules
};

},{"space-separated-tokens":275}],4:[function(require,module,exports){
var unified = require("unified");
var parse = require("rehype-parse");
var customPlugin = require("./customPlugin");
var rehype2remark = require("rehype-remark");
var stringify = require("remark-stringify");
var markdown = require("remark-parse");
var remark2html = require("remark-html");

if (document === undefined) {
  var document = {};
}

document.md2html = unified()
  .use(markdown, { commonmark: true })
  .use(customPlugin)
  .use(remark2html);

document.html2md = unified()
  .use(parse)
  .use(rehype2remark)
  .use(stringify)
  .use(customPlugin);

},{"./customPlugin":3,"rehype-parse":178,"rehype-remark":179,"remark-html":180,"remark-parse":181,"remark-stringify":229,"unified":285}],5:[function(require,module,exports){
'use strict'

module.exports = iterate

var own = {}.hasOwnProperty

function iterate(values, callback, context) {
  var index = -1
  var result

  if (!values) {
    throw new Error('Iterate requires that |this| not be ' + values)
  }

  if (!own.call(values, 'length')) {
    throw new Error('Iterate requires that |this| has a `length`')
  }

  if (typeof callback !== 'function') {
    throw new Error('`callback` must be a function')
  }

  /* The length might change, so we do not cache it. */
  while (++index < values.length) {
    /* Skip missing values. */
    if (!(index in values)) {
      continue
    }

    result = callback.call(context, values[index], index, values)

    /* If `callback` returns a `number`, move `index` over to
     * `number`. */
    if (typeof result === 'number') {
      /* Make sure that negative numbers do not break the loop. */
      if (result < 0) {
        index = 0
      }

      index = result - 1
    }
  }
}

},{}],6:[function(require,module,exports){
'use strict'

module.exports = bail

function bail(err) {
  if (err) {
    throw err
  }
}

},{}],7:[function(require,module,exports){
'use strict'

module.exports = ccount

function ccount(value, character) {
  var count = 0
  var index

  value = String(value)

  if (typeof character !== 'string' || character.length !== 1) {
    throw new Error('Expected character')
  }

  index = value.indexOf(character)

  while (index !== -1) {
    count++
    index = value.indexOf(character, index + 1)
  }

  return count
}

},{}],8:[function(require,module,exports){
module.exports={
  "nbsp": " ",
  "iexcl": "¡",
  "cent": "¢",
  "pound": "£",
  "curren": "¤",
  "yen": "¥",
  "brvbar": "¦",
  "sect": "§",
  "uml": "¨",
  "copy": "©",
  "ordf": "ª",
  "laquo": "«",
  "not": "¬",
  "shy": "­",
  "reg": "®",
  "macr": "¯",
  "deg": "°",
  "plusmn": "±",
  "sup2": "²",
  "sup3": "³",
  "acute": "´",
  "micro": "µ",
  "para": "¶",
  "middot": "·",
  "cedil": "¸",
  "sup1": "¹",
  "ordm": "º",
  "raquo": "»",
  "frac14": "¼",
  "frac12": "½",
  "frac34": "¾",
  "iquest": "¿",
  "Agrave": "À",
  "Aacute": "Á",
  "Acirc": "Â",
  "Atilde": "Ã",
  "Auml": "Ä",
  "Aring": "Å",
  "AElig": "Æ",
  "Ccedil": "Ç",
  "Egrave": "È",
  "Eacute": "É",
  "Ecirc": "Ê",
  "Euml": "Ë",
  "Igrave": "Ì",
  "Iacute": "Í",
  "Icirc": "Î",
  "Iuml": "Ï",
  "ETH": "Ð",
  "Ntilde": "Ñ",
  "Ograve": "Ò",
  "Oacute": "Ó",
  "Ocirc": "Ô",
  "Otilde": "Õ",
  "Ouml": "Ö",
  "times": "×",
  "Oslash": "Ø",
  "Ugrave": "Ù",
  "Uacute": "Ú",
  "Ucirc": "Û",
  "Uuml": "Ü",
  "Yacute": "Ý",
  "THORN": "Þ",
  "szlig": "ß",
  "agrave": "à",
  "aacute": "á",
  "acirc": "â",
  "atilde": "ã",
  "auml": "ä",
  "aring": "å",
  "aelig": "æ",
  "ccedil": "ç",
  "egrave": "è",
  "eacute": "é",
  "ecirc": "ê",
  "euml": "ë",
  "igrave": "ì",
  "iacute": "í",
  "icirc": "î",
  "iuml": "ï",
  "eth": "ð",
  "ntilde": "ñ",
  "ograve": "ò",
  "oacute": "ó",
  "ocirc": "ô",
  "otilde": "õ",
  "ouml": "ö",
  "divide": "÷",
  "oslash": "ø",
  "ugrave": "ù",
  "uacute": "ú",
  "ucirc": "û",
  "uuml": "ü",
  "yacute": "ý",
  "thorn": "þ",
  "yuml": "ÿ",
  "fnof": "ƒ",
  "Alpha": "Α",
  "Beta": "Β",
  "Gamma": "Γ",
  "Delta": "Δ",
  "Epsilon": "Ε",
  "Zeta": "Ζ",
  "Eta": "Η",
  "Theta": "Θ",
  "Iota": "Ι",
  "Kappa": "Κ",
  "Lambda": "Λ",
  "Mu": "Μ",
  "Nu": "Ν",
  "Xi": "Ξ",
  "Omicron": "Ο",
  "Pi": "Π",
  "Rho": "Ρ",
  "Sigma": "Σ",
  "Tau": "Τ",
  "Upsilon": "Υ",
  "Phi": "Φ",
  "Chi": "Χ",
  "Psi": "Ψ",
  "Omega": "Ω",
  "alpha": "α",
  "beta": "β",
  "gamma": "γ",
  "delta": "δ",
  "epsilon": "ε",
  "zeta": "ζ",
  "eta": "η",
  "theta": "θ",
  "iota": "ι",
  "kappa": "κ",
  "lambda": "λ",
  "mu": "μ",
  "nu": "ν",
  "xi": "ξ",
  "omicron": "ο",
  "pi": "π",
  "rho": "ρ",
  "sigmaf": "ς",
  "sigma": "σ",
  "tau": "τ",
  "upsilon": "υ",
  "phi": "φ",
  "chi": "χ",
  "psi": "ψ",
  "omega": "ω",
  "thetasym": "ϑ",
  "upsih": "ϒ",
  "piv": "ϖ",
  "bull": "•",
  "hellip": "…",
  "prime": "′",
  "Prime": "″",
  "oline": "‾",
  "frasl": "⁄",
  "weierp": "℘",
  "image": "ℑ",
  "real": "ℜ",
  "trade": "™",
  "alefsym": "ℵ",
  "larr": "←",
  "uarr": "↑",
  "rarr": "→",
  "darr": "↓",
  "harr": "↔",
  "crarr": "↵",
  "lArr": "⇐",
  "uArr": "⇑",
  "rArr": "⇒",
  "dArr": "⇓",
  "hArr": "⇔",
  "forall": "∀",
  "part": "∂",
  "exist": "∃",
  "empty": "∅",
  "nabla": "∇",
  "isin": "∈",
  "notin": "∉",
  "ni": "∋",
  "prod": "∏",
  "sum": "∑",
  "minus": "−",
  "lowast": "∗",
  "radic": "√",
  "prop": "∝",
  "infin": "∞",
  "ang": "∠",
  "and": "∧",
  "or": "∨",
  "cap": "∩",
  "cup": "∪",
  "int": "∫",
  "there4": "∴",
  "sim": "∼",
  "cong": "≅",
  "asymp": "≈",
  "ne": "≠",
  "equiv": "≡",
  "le": "≤",
  "ge": "≥",
  "sub": "⊂",
  "sup": "⊃",
  "nsub": "⊄",
  "sube": "⊆",
  "supe": "⊇",
  "oplus": "⊕",
  "otimes": "⊗",
  "perp": "⊥",
  "sdot": "⋅",
  "lceil": "⌈",
  "rceil": "⌉",
  "lfloor": "⌊",
  "rfloor": "⌋",
  "lang": "〈",
  "rang": "〉",
  "loz": "◊",
  "spades": "♠",
  "clubs": "♣",
  "hearts": "♥",
  "diams": "♦",
  "quot": "\"",
  "amp": "&",
  "lt": "<",
  "gt": ">",
  "OElig": "Œ",
  "oelig": "œ",
  "Scaron": "Š",
  "scaron": "š",
  "Yuml": "Ÿ",
  "circ": "ˆ",
  "tilde": "˜",
  "ensp": " ",
  "emsp": " ",
  "thinsp": " ",
  "zwnj": "‌",
  "zwj": "‍",
  "lrm": "‎",
  "rlm": "‏",
  "ndash": "–",
  "mdash": "—",
  "lsquo": "‘",
  "rsquo": "’",
  "sbquo": "‚",
  "ldquo": "“",
  "rdquo": "”",
  "bdquo": "„",
  "dagger": "†",
  "Dagger": "‡",
  "permil": "‰",
  "lsaquo": "‹",
  "rsaquo": "›",
  "euro": "€"
}

},{}],9:[function(require,module,exports){
module.exports={
  "AElig": "Æ",
  "AMP": "&",
  "Aacute": "Á",
  "Acirc": "Â",
  "Agrave": "À",
  "Aring": "Å",
  "Atilde": "Ã",
  "Auml": "Ä",
  "COPY": "©",
  "Ccedil": "Ç",
  "ETH": "Ð",
  "Eacute": "É",
  "Ecirc": "Ê",
  "Egrave": "È",
  "Euml": "Ë",
  "GT": ">",
  "Iacute": "Í",
  "Icirc": "Î",
  "Igrave": "Ì",
  "Iuml": "Ï",
  "LT": "<",
  "Ntilde": "Ñ",
  "Oacute": "Ó",
  "Ocirc": "Ô",
  "Ograve": "Ò",
  "Oslash": "Ø",
  "Otilde": "Õ",
  "Ouml": "Ö",
  "QUOT": "\"",
  "REG": "®",
  "THORN": "Þ",
  "Uacute": "Ú",
  "Ucirc": "Û",
  "Ugrave": "Ù",
  "Uuml": "Ü",
  "Yacute": "Ý",
  "aacute": "á",
  "acirc": "â",
  "acute": "´",
  "aelig": "æ",
  "agrave": "à",
  "amp": "&",
  "aring": "å",
  "atilde": "ã",
  "auml": "ä",
  "brvbar": "¦",
  "ccedil": "ç",
  "cedil": "¸",
  "cent": "¢",
  "copy": "©",
  "curren": "¤",
  "deg": "°",
  "divide": "÷",
  "eacute": "é",
  "ecirc": "ê",
  "egrave": "è",
  "eth": "ð",
  "euml": "ë",
  "frac12": "½",
  "frac14": "¼",
  "frac34": "¾",
  "gt": ">",
  "iacute": "í",
  "icirc": "î",
  "iexcl": "¡",
  "igrave": "ì",
  "iquest": "¿",
  "iuml": "ï",
  "laquo": "«",
  "lt": "<",
  "macr": "¯",
  "micro": "µ",
  "middot": "·",
  "nbsp": " ",
  "not": "¬",
  "ntilde": "ñ",
  "oacute": "ó",
  "ocirc": "ô",
  "ograve": "ò",
  "ordf": "ª",
  "ordm": "º",
  "oslash": "ø",
  "otilde": "õ",
  "ouml": "ö",
  "para": "¶",
  "plusmn": "±",
  "pound": "£",
  "quot": "\"",
  "raquo": "»",
  "reg": "®",
  "sect": "§",
  "shy": "­",
  "sup1": "¹",
  "sup2": "²",
  "sup3": "³",
  "szlig": "ß",
  "thorn": "þ",
  "times": "×",
  "uacute": "ú",
  "ucirc": "û",
  "ugrave": "ù",
  "uml": "¨",
  "uuml": "ü",
  "yacute": "ý",
  "yen": "¥",
  "yuml": "ÿ"
}

},{}],10:[function(require,module,exports){
module.exports={
  "0": "�",
  "128": "€",
  "130": "‚",
  "131": "ƒ",
  "132": "„",
  "133": "…",
  "134": "†",
  "135": "‡",
  "136": "ˆ",
  "137": "‰",
  "138": "Š",
  "139": "‹",
  "140": "Œ",
  "142": "Ž",
  "145": "‘",
  "146": "’",
  "147": "“",
  "148": "”",
  "149": "•",
  "150": "–",
  "151": "—",
  "152": "˜",
  "153": "™",
  "154": "š",
  "155": "›",
  "156": "œ",
  "158": "ž",
  "159": "Ÿ"
}

},{}],11:[function(require,module,exports){
'use strict'

module.exports = collapse

/* collapse(' \t\nbar \nbaz\t'); // ' bar baz ' */
function collapse(value) {
  return String(value).replace(/\s+/g, ' ')
}

},{}],12:[function(require,module,exports){
'use strict'

exports.parse = parse
exports.stringify = stringify

var trim = require('trim')

var comma = ','
var space = ' '
var empty = ''

/* Parse comma-separated tokens to an array. */
function parse(value) {
  var values = []
  var input = String(value || empty)
  var index = input.indexOf(comma)
  var lastIndex = 0
  var end = false
  var val

  while (!end) {
    if (index === -1) {
      index = input.length
      end = true
    }

    val = trim(input.slice(lastIndex, index))

    if (val || !end) {
      values.push(val)
    }

    lastIndex = index + 1
    index = input.indexOf(comma, lastIndex)
  }

  return values
}

/* Compile an array to comma-separated tokens.
 * `options.padLeft` (default: `true`) pads a space left of each
 * token, and `options.padRight` (default: `false`) pads a space
 * to the right of each token. */
function stringify(values, options) {
  var settings = options || {}
  var left = settings.padLeft === false ? empty : space
  var right = settings.padRight ? space : empty

  /* Ensure the last empty entry is seen. */
  if (values[values.length - 1] === empty) {
    values = values.concat(empty)
  }

  return trim(values.join(right + comma + left))
}

},{"trim":281}],13:[function(require,module,exports){
'use strict';

module.exports = detab;

var repeat = require('repeat-string');

var TAB = 0x09;
var LF = 0x0A;
var CR = 0x0D;

/* Replace tabs with spaces, being smart about which
 * column the tab is at and which size should be used. */
function detab(value, size) {
  var string = typeof value === 'string';
  var length = string && value.length;
  var start = 0;
  var index = -1;
  var column = -1;
  var tabSize = size || 4;
  var results = [];
  var code;
  var add;

  if (!string) {
    throw new Error('detab expected string');
  }

  while (++index < length) {
    code = value.charCodeAt(index);

    if (code === TAB) {
      add = tabSize - ((column + 1) % tabSize);
      column += add;
      results.push(value.slice(start, index) + repeat(' ', add));
      start = index + 1;
    } else if (code === LF || code === CR) {
      column = -1;
    } else {
      column++;
    }
  }

  results.push(value.slice(start));

  return results.join('');
}

},{"repeat-string":273}],14:[function(require,module,exports){
'use strict';

var hasOwn = Object.prototype.hasOwnProperty;
var toStr = Object.prototype.toString;
var defineProperty = Object.defineProperty;
var gOPD = Object.getOwnPropertyDescriptor;

var isArray = function isArray(arr) {
	if (typeof Array.isArray === 'function') {
		return Array.isArray(arr);
	}

	return toStr.call(arr) === '[object Array]';
};

var isPlainObject = function isPlainObject(obj) {
	if (!obj || toStr.call(obj) !== '[object Object]') {
		return false;
	}

	var hasOwnConstructor = hasOwn.call(obj, 'constructor');
	var hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
		return false;
	}

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for (key in obj) { /**/ }

	return typeof key === 'undefined' || hasOwn.call(obj, key);
};

// If name is '__proto__', and Object.defineProperty is available, define __proto__ as an own property on target
var setProperty = function setProperty(target, options) {
	if (defineProperty && options.name === '__proto__') {
		defineProperty(target, options.name, {
			enumerable: true,
			configurable: true,
			value: options.newValue,
			writable: true
		});
	} else {
		target[options.name] = options.newValue;
	}
};

// Return undefined instead of __proto__ if '__proto__' is not an own property
var getProperty = function getProperty(obj, name) {
	if (name === '__proto__') {
		if (!hasOwn.call(obj, name)) {
			return void 0;
		} else if (gOPD) {
			// In early versions of node, obj['__proto__'] is buggy when obj has
			// __proto__ as an own property. Object.getOwnPropertyDescriptor() works.
			return gOPD(obj, name).value;
		}
	}

	return obj[name];
};

module.exports = function extend() {
	var options, name, src, copy, copyIsArray, clone;
	var target = arguments[0];
	var i = 1;
	var length = arguments.length;
	var deep = false;

	// Handle a deep copy situation
	if (typeof target === 'boolean') {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}
	if (target == null || (typeof target !== 'object' && typeof target !== 'function')) {
		target = {};
	}

	for (; i < length; ++i) {
		options = arguments[i];
		// Only deal with non-null/undefined values
		if (options != null) {
			// Extend the base object
			for (name in options) {
				src = getProperty(target, name);
				copy = getProperty(options, name);

				// Prevent never-ending loop
				if (target !== copy) {
					// Recurse if we're merging plain objects or arrays
					if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
						if (copyIsArray) {
							copyIsArray = false;
							clone = src && isArray(src) ? src : [];
						} else {
							clone = src && isPlainObject(src) ? src : {};
						}

						// Never move original objects, clone them
						setProperty(target, { name: name, newValue: extend(deep, clone, copy) });

					// Don't bring in undefined values
					} else if (typeof copy !== 'undefined') {
						setProperty(target, { name: name, newValue: copy });
					}
				}
			}
		}
	}

	// Return the modified object
	return target;
};

},{}],15:[function(require,module,exports){
'use strict'

/* Dependencies. */
var is = require('hast-util-is-element')

/* Expose. */
module.exports = embedded

/* Tag-names. */
var names = [
  'audio',
  'canvas',
  'embed',
  'iframe',
  'img',
  'math',
  'object',
  'picture',
  'svg',
  'video'
]

/* Check if a node is a embedded element. */
function embedded(node) {
  return is(node, names)
}

},{"hast-util-is-element":19}],16:[function(require,module,exports){
'use strict'

var html = require('property-information/html')
var svg = require('property-information/svg')
var find = require('property-information/find')
var ns = require('web-namespaces')
var s = require('hastscript/svg')
var h = require('hastscript')
var xtend = require('xtend')
var count = require('ccount')

module.exports = wrapper

var own = {}.hasOwnProperty

/* Handlers. */
var map = {
  '#document': root,
  '#document-fragment': root,
  '#text': text,
  '#comment': comment,
  '#documentType': doctype
}

/* Wrapper to normalise options. */
function wrapper(ast, options) {
  var settings = options || {}
  var file

  if (settings.messages) {
    file = settings
    settings = {}
  } else {
    file = settings.file
  }

  return transform(ast, {
    schema: settings.space === 'svg' ? svg : html,
    file: file,
    verbose: settings.verbose,
    location: false
  })
}

/* Transform a node. */
function transform(ast, config) {
  var schema = config.schema
  var fn = own.call(map, ast.nodeName) ? map[ast.nodeName] : element
  var children
  var node
  var pos

  if (fn === element) {
    config.schema = ast.namespaceURI === ns.svg ? svg : html
  }

  if (ast.childNodes) {
    children = nodes(ast.childNodes, config)
  }

  node = fn(ast, children, config)

  if (ast.sourceCodeLocation && config.file) {
    pos = location(node, ast.sourceCodeLocation, config)

    if (pos) {
      config.location = true
      node.position = pos
    }
  }

  config.schema = schema

  return node
}

/* Transform children. */
function nodes(children, config) {
  var length = children.length
  var index = -1
  var result = []

  while (++index < length) {
    result[index] = transform(children[index], config)
  }

  return result
}

/* Transform a document.
 * Stores `ast.quirksMode` in `node.data.quirksMode`. */
function root(ast, children, config) {
  var node = {type: 'root', children: children, data: {}}
  var doc

  node.data.quirksMode = ast.mode === 'quirks' || ast.mode === 'limited-quirks'

  if (config.file && config.location) {
    doc = String(config.file)

    node.position = {
      start: {line: 1, column: 1, offset: 0},
      end: {
        line: count(doc, '\n') + 1,
        column: doc.length - doc.lastIndexOf('\n'),
        offset: doc.length
      }
    }
  }

  return node
}

/* Transform a doctype. */
function doctype(ast) {
  return {
    type: 'doctype',
    name: ast.name || '',
    public: ast.publicId || null,
    system: ast.systemId || null
  }
}

/* Transform a text. */
function text(ast) {
  return {type: 'text', value: ast.value}
}

/* Transform a comment. */
function comment(ast) {
  return {type: 'comment', value: ast.data}
}

/* Transform an element. */
function element(ast, children, config) {
  var fn = config.schema.space === 'svg' ? s : h
  var name = ast.tagName
  var attributes = ast.attrs
  var length = attributes.length
  var props = {}
  var index = -1
  var attribute
  var prop
  var node
  var pos
  var start
  var end

  while (++index < length) {
    attribute = attributes[index]
    prop = (attribute.prefix ? attribute.prefix + ':' : '') + attribute.name
    props[prop] = attribute.value
  }

  node = fn(name, props, children)

  if (name === 'template' && 'content' in ast) {
    pos = ast.sourceCodeLocation
    start = pos && pos.startTag && position(pos.startTag).end
    end = pos && pos.endTag && position(pos.endTag).start

    node.content = transform(ast.content, config)

    if ((start || end) && config.file) {
      node.content.position = {start: start, end: end}
    }
  }

  return node
}

/* Create clean positional information. */
function location(node, location, config) {
  var schema = config.schema
  var verbose = config.verbose
  var pos = position(location)
  var reference
  var attributes
  var attribute
  var props
  var prop

  if (node.type === 'element') {
    reference = node.children[node.children.length - 1]

    /* Unclosed with children (upstream: https://github.com/inikulin/parse5/issues/109) */
    if (
      !location.endTag &&
      reference &&
      reference.position &&
      reference.position.end
    ) {
      pos.end = xtend(reference.position.end)
    }

    if (verbose) {
      attributes = location.attrs
      props = {}

      for (attribute in attributes) {
        prop = find(schema, attribute).property
        props[prop] = position(attributes[attribute])
      }

      node.data = {
        position: {
          opening: position(location.startTag),
          closing: location.endTag ? position(location.endTag) : null,
          properties: props
        }
      }
    }
  }

  return pos
}

function position(loc) {
  var start = point({
    line: loc.startLine,
    column: loc.startCol,
    offset: loc.startOffset
  })
  var end = point({
    line: loc.endLine,
    column: loc.endCol,
    offset: loc.endOffset
  })
  return start || end ? {start: start, end: end} : null
}

function point(point) {
  return point.line && point.column ? point : null
}

},{"ccount":7,"hastscript":80,"hastscript/svg":81,"property-information/find":157,"property-information/html":158,"property-information/svg":174,"web-namespaces":299,"xtend":301}],17:[function(require,module,exports){
'use strict'

var own = {}.hasOwnProperty

module.exports = hasProperty

/* Check if `node` has a set `name` property. */
function hasProperty(node, name) {
  var props
  var value

  if (!node || !name || typeof node !== 'object' || node.type !== 'element') {
    return false
  }

  props = node.properties
  value = props && own.call(props, name) && props[name]

  return value !== null && value !== undefined && value !== false
}

},{}],18:[function(require,module,exports){
/**
 * @fileoverview
 *   Check if a `link` element is “Body OK”.
 * @longdescription
 *   ## Usage
 *
 *   ```javascript
 *   var h = require('hastscript');
 *   var ok = require('hast-util-is-body-ok-link');
 *
 *   ok(h('link', {itemProp: 'foo'})); //=> true
 *   ok(h('link', {rel: ['stylesheet'], href: 'index.css'})); //=> true
 *   ok(h('link', {rel: ['author'], href: 'index.css'})); //=> false
 *   ```
 *
 *   ## API
 *
 *   ### `isBodyOkLink(node)`
 *
 *   * Return `true` for `link` elements with an `itemProp`
 *   * Return `true` for `link` elements with a `rel` list
 *     where one or more entries are `pingback`, `prefetch`,
 *     or `stylesheet`.
 */

'use strict';

var is = require('hast-util-is-element');
var has = require('hast-util-has-property');

module.exports = ok;

var list = [
  'pingback',
  'prefetch',
  'stylesheet'
];

function ok(node) {
  var length;
  var index;
  var rel;

  if (!is(node, 'link')) {
    return false;
  }

  if (has(node, 'itemProp')) {
    return true;
  }

  rel = (node.properties || {}).rel || [];
  length = rel.length;
  index = -1;

  if (rel.length === 0) {
    return false;
  }

  while (++index < length) {
    if (list.indexOf(rel[index]) === -1) {
      return false;
    }
  }

  return true;
}

},{"hast-util-has-property":17,"hast-util-is-element":19}],19:[function(require,module,exports){
'use strict'

module.exports = isElement

/* Check if, whether `tagNames` is given, a node is an element
 * or an element matching `tagNames`. */
function isElement(node, tagNames) {
  var name

  if (
    !(
      tagNames === null ||
      tagNames === undefined ||
      typeof tagNames === 'string' ||
      (typeof tagNames === 'object' && tagNames.length !== 0)
    )
  ) {
    throw new Error(
      'Expected `string` or `Array.<string>` for `tagNames`, not `' +
        tagNames +
        '`'
    )
  }

  if (
    !node ||
    typeof node !== 'object' ||
    node.type !== 'element' ||
    typeof node.tagName !== 'string'
  ) {
    return false
  }

  if (tagNames === null || tagNames === undefined) {
    return true
  }

  name = node.tagName

  if (typeof tagNames === 'string') {
    return name === tagNames
  }

  return tagNames.indexOf(name) !== -1
}

},{}],20:[function(require,module,exports){
'use strict'

module.exports = parse

var dot = '.'.charCodeAt(0)
var hash = '#'.charCodeAt(0)

/* Parse a simple CSS selector into a HAST node. */
function parse(selector, defaultTagName) {
  var value = selector || ''
  var name = defaultTagName || 'div'
  var props = {}
  var index = -1
  var length = value.length
  var className
  var type
  var code
  var subvalue
  var lastIndex

  while (++index <= length) {
    code = value.charCodeAt(index)

    if (!code || code === dot || code === hash) {
      subvalue = value.slice(lastIndex, index)

      if (subvalue) {
        if (type === dot) {
          if (className) {
            className.push(subvalue)
          } else {
            className = [subvalue]
            props.className = className
          }
        } else if (type === hash) {
          props.id = subvalue
        } else {
          name = subvalue
        }
      }

      lastIndex = index + 1
      type = code
    }
  }

  return {
    type: 'element',
    tagName: name,
    properties: props,
    children: []
  }
}

},{}],21:[function(require,module,exports){
'use strict'
module.exports = require('./lib')

},{"./lib":23}],22:[function(require,module,exports){
module.exports={
  "strip": [
    "script"
  ],
  "clobberPrefix": "user-content-",
  "clobber": [
    "name",
    "id"
  ],
  "ancestors": {
    "li": [
      "ol",
      "ul"
    ],
    "tbody": [
      "table"
    ],
    "tfoot": [
      "table"
    ],
    "thead": [
      "table"
    ],
    "td": [
      "table"
    ],
    "th": [
      "table"
    ],
    "tr": [
      "table"
    ]
  },
  "protocols": {
    "href": [
      "http",
      "https",
      "mailto"
    ],
    "cite": [
      "http",
      "https"
    ],
    "src": [
      "http",
      "https"
    ],
    "longDesc": [
      "http",
      "https"
    ]
  },
  "tagNames": [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "h7",
    "h8",
    "br",
    "b",
    "i",
    "strong",
    "em",
    "a",
    "pre",
    "code",
    "img",
    "tt",
    "div",
    "ins",
    "del",
    "sup",
    "sub",
    "p",
    "ol",
    "ul",
    "table",
    "thead",
    "tbody",
    "tfoot",
    "blockquote",
    "dl",
    "dt",
    "dd",
    "kbd",
    "q",
    "samp",
    "var",
    "hr",
    "ruby",
    "rt",
    "rp",
    "li",
    "tr",
    "td",
    "th",
    "s",
    "strike",
    "summary",
    "details",
    "input"
  ],
  "attributes": {
    "a": [
      "href"
    ],
    "img": [
      "src",
      "longDesc"
    ],
    "input": [
      ["type", "checkbox"],
      ["disabled", true]
    ],
    "li": [
      ["className", "task-list-item"]
    ],
    "div": [
      "itemScope",
      "itemType"
    ],
    "blockquote": [
      "cite"
    ],
    "del": [
      "cite"
    ],
    "ins": [
      "cite"
    ],
    "q": [
      "cite"
    ],
    "*": [
      "abbr",
      "accept",
      "acceptCharset",
      "accessKey",
      "action",
      "align",
      "alt",
      "axis",
      "border",
      "cellPadding",
      "cellSpacing",
      "char",
      "charoff",
      "charSet",
      "checked",
      "clear",
      "cols",
      "colSpan",
      "color",
      "compact",
      "coords",
      "dateTime",
      "dir",
      "disabled",
      "encType",
      "htmlFor",
      "frame",
      "headers",
      "height",
      "hrefLang",
      "hspace",
      "isMap",
      "id",
      "label",
      "lang",
      "maxLength",
      "media",
      "method",
      "multiple",
      "name",
      "nohref",
      "noshade",
      "nowrap",
      "open",
      "prompt",
      "readOnly",
      "rel",
      "rev",
      "rows",
      "rowSpan",
      "rules",
      "scope",
      "selected",
      "shape",
      "size",
      "span",
      "start",
      "summary",
      "tabIndex",
      "target",
      "title",
      "type",
      "useMap",
      "valign",
      "value",
      "vspace",
      "width",
      "itemProp"
    ]
  },
  "required": {
    "input": {
      "type": "checkbox",
      "disabled": true
    }
  }
}

},{}],23:[function(require,module,exports){
'use strict'

var xtend = require('xtend')
var defaults = require('./github.json')

module.exports = wrapper

var own = {}.hasOwnProperty

var allData = 'data*'

var NODES = {
  root: {children: all},
  doctype: handleDoctype,
  comment: handleComment,
  element: {
    tagName: handleTagName,
    properties: handleProperties,
    children: all
  },
  text: {value: handleValue},
  '*': {
    data: allow,
    position: allow
  }
}

// Sanitize `node`, according to `schema`.
function wrapper(node, schema) {
  var ctx = {type: 'root', children: []}
  var replace

  if (!node || typeof node !== 'object' || !node.type) {
    return ctx
  }

  replace = one(xtend(defaults, schema || {}), node, [])

  if (!replace) {
    return ctx
  }

  if ('length' in replace) {
    if (replace.length === 1) {
      return replace[0]
    }

    ctx.children = replace

    return ctx
  }

  return replace
}

// Sanitize `node`.
function one(schema, node, stack) {
  var type = node && node.type
  var replacement = {type: node.type}
  var replace = true
  var definition
  var allowed
  var result
  var key

  if (!own.call(NODES, type)) {
    replace = false
  } else {
    definition = NODES[type]

    if (typeof definition === 'function') {
      definition = definition(schema, node)
    }

    if (!definition) {
      replace = false
    } else {
      allowed = xtend(definition, NODES['*'])

      for (key in allowed) {
        result = allowed[key](schema, node[key], node, stack)

        if (result === false) {
          replace = false

          // Set the non-safe value.
          replacement[key] = node[key]
        } else if (result !== null && result !== undefined) {
          replacement[key] = result
        }
      }
    }
  }

  if (!replace) {
    if (
      !replacement.children ||
      replacement.children.length === 0 ||
      schema.strip.indexOf(replacement.tagName) !== -1
    ) {
      return null
    }

    return replacement.children
  }

  return replacement
}

// Sanitize `children`.
function all(schema, children, node, stack) {
  var nodes = children || []
  var length = nodes.length || 0
  var results = []
  var index = -1
  var result

  stack = stack.concat(node.tagName)

  while (++index < length) {
    result = one(schema, nodes[index], stack)

    if (result) {
      if ('length' in result) {
        results = results.concat(result)
      } else {
        results.push(result)
      }
    }
  }

  return results
}

// Sanitize `properties`.
function handleProperties(schema, properties, node, stack) {
  var name = handleTagName(schema, node.tagName, node, stack)
  var attrs = schema.attributes
  var reqs = schema.required || /* istanbul ignore next */ {}
  var props = properties || {}
  var result = {}
  var allowed
  var required
  var definition
  var prop
  var value

  allowed = xtend(
    toPropertyValueMap(attrs['*']),
    toPropertyValueMap(own.call(attrs, name) ? attrs[name] : [])
  )

  for (prop in props) {
    value = props[prop]

    if (own.call(allowed, prop)) {
      definition = allowed[prop]
    } else if (data(prop) && own.call(allowed, allData)) {
      definition = allowed[allData]
    } else {
      continue
    }

    if (value && typeof value === 'object' && 'length' in value) {
      value = handlePropertyValues(schema, value, prop, definition)
    } else {
      value = handlePropertyValue(schema, value, prop, definition)
    }

    if (value !== null && value !== undefined) {
      result[prop] = value
    }
  }

  required = own.call(reqs, name) ? reqs[name] : {}

  for (prop in required) {
    if (!own.call(result, prop)) {
      result[prop] = required[prop]
    }
  }

  return result
}

// Sanitize a property value which is a list.
function handlePropertyValues(schema, values, prop, definition) {
  var length = values.length
  var result = []
  var index = -1
  var value

  while (++index < length) {
    value = handlePropertyValue(schema, values[index], prop, definition)

    if (value !== null && value !== undefined) {
      result.push(value)
    }
  }

  return result
}

// Sanitize a property value.
function handlePropertyValue(schema, value, prop, definition) {
  if (
    typeof value !== 'boolean' &&
    typeof value !== 'number' &&
    typeof value !== 'string'
  ) {
    return null
  }

  if (!handleProtocol(schema, value, prop)) {
    return null
  }

  if (definition.length !== 0 && definition.indexOf(value) === -1) {
    return null
  }

  if (schema.clobber.indexOf(prop) !== -1) {
    value = schema.clobberPrefix + value
  }

  return value
}

// Check whether `value` is a safe URL.
function handleProtocol(schema, value, prop) {
  var protocols = schema.protocols
  var protocol
  var first
  var colon
  var length
  var index

  protocols = own.call(protocols, prop) ? protocols[prop].concat() : []

  if (protocols.length === 0) {
    return true
  }

  value = String(value)
  first = value.charAt(0)

  if (first === '#' || first === '/') {
    return true
  }

  colon = value.indexOf(':')

  if (colon === -1) {
    return true
  }

  length = protocols.length
  index = -1

  while (++index < length) {
    protocol = protocols[index]

    if (
      colon === protocol.length &&
      value.slice(0, protocol.length) === protocol
    ) {
      return true
    }
  }

  index = value.indexOf('?')

  if (index !== -1 && colon > index) {
    return true
  }

  index = value.indexOf('#')

  if (index !== -1 && colon > index) {
    return true
  }

  return false
}

// Always return a valid HTML5 doctype.
function handleDoctypeName() {
  return 'html'
}

// Sanitize `tagName`.
function handleTagName(schema, tagName, node, stack) {
  var name = typeof tagName === 'string' ? tagName : null
  var ancestors = schema.ancestors
  var length
  var index

  if (!name || name === '*' || schema.tagNames.indexOf(name) === -1) {
    return false
  }

  ancestors = own.call(ancestors, name) ? ancestors[name] : []

  // Some nodes can break out of their context if they don’t have a certain
  // ancestor.
  if (ancestors.length !== 0) {
    length = ancestors.length + 1
    index = -1

    while (++index < length) {
      if (!ancestors[index]) {
        return false
      }

      if (stack.indexOf(ancestors[index]) !== -1) {
        break
      }
    }
  }

  return name
}

function handleDoctype(schema) {
  return schema.allowDoctypes ? {name: handleDoctypeName} : null
}

function handleComment(schema) {
  return schema.allowComments ? {value: handleValue} : null
}

// Sanitize `value`.
function handleValue(schema, value) {
  return typeof value === 'string' ? value : ''
}

// Create a map from a list of props or a list of properties and values.
function toPropertyValueMap(values) {
  var result = {}
  var length = values.length
  var index = -1
  var value

  while (++index < length) {
    value = values[index]

    if (value && typeof value === 'object' && 'length' in value) {
      result[value[0]] = value.slice(1)
    } else {
      result[value] = []
    }
  }

  return result
}

// Allow `value`.
function allow(schema, value) {
  return value
}

// Check if `prop` is a data property.
function data(prop) {
  return prop.length > 4 && prop.slice(0, 4).toLowerCase() === 'data'
}

},{"./github.json":22,"xtend":301}],24:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"./lib":30,"dup":21}],25:[function(require,module,exports){
'use strict'

var one = require('./one')

module.exports = all

/* Stringify all children of `parent`. */
function all(ctx, parent) {
  var children = parent && parent.children
  var length = children && children.length
  var index = -1
  var results = []

  while (++index < length) {
    results[index] = one(ctx, children[index], index, parent)
  }

  return results.join('')
}

},{"./one":39}],26:[function(require,module,exports){
'use strict'

module.exports = comment

/* Stringify a comment `node`. */
function comment(ctx, node) {
  return '<!--' + node.value + '-->'
}

},{}],27:[function(require,module,exports){
'use strict'

// Characters.
var NULL = '\0'
var AMP = '&'
var SP = ' '
var TB = '\t'
var GR = '`'
var DQ = '"'
var SQ = "'"
var EQ = '='
var LT = '<'
var GT = '>'
var SO = '/'
var LF = '\n'
var CR = '\r'
var FF = '\f'

var whitespace = [SP, TB, LF, CR, FF]
// https://html.spec.whatwg.org/#attribute-name-state
var name = whitespace.concat(AMP, SO, GT, EQ)
// https://html.spec.whatwg.org/#attribute-value-(unquoted)-state
var unquoted = whitespace.concat(AMP, GT)
var unquotedSafe = unquoted.concat(NULL, DQ, SQ, LT, EQ, GR)
// https://html.spec.whatwg.org/#attribute-value-(single-quoted)-state
var singleQuoted = [AMP, SQ]
// https://html.spec.whatwg.org/#attribute-value-(double-quoted)-state
var doubleQuoted = [AMP, DQ]

// Maps of subsets. Each value is a matrix of tuples.
// The first value causes parse errors, the second is valid.
// Of both values, the first value is unsafe, and the second is safe.
module.exports = {
  name: [
    [name, name.concat(DQ, SQ, GR)],
    [name.concat(NULL, DQ, SQ, LT), name.concat(NULL, DQ, SQ, LT, GR)]
  ],
  unquoted: [[unquoted, unquotedSafe], [unquotedSafe, unquotedSafe]],
  single: [
    [singleQuoted, singleQuoted.concat(DQ, GR)],
    [singleQuoted.concat(NULL), singleQuoted.concat(NULL, DQ, GR)]
  ],
  double: [
    [doubleQuoted, doubleQuoted.concat(SQ, GR)],
    [doubleQuoted.concat(NULL), doubleQuoted.concat(NULL, SQ, GR)]
  ]
}

},{}],28:[function(require,module,exports){
'use strict'

module.exports = doctype

/* Stringify a doctype `node`. */
function doctype(ctx, node) {
  var sep = ctx.tightDoctype ? '' : ' '
  var name = node.name
  var pub = node.public
  var sys = node.system
  var val = ['<!doctype']

  if (name) {
    val.push(sep, name)

    if (pub != null) {
      val.push(' public', sep, smart(pub))
    } else if (sys != null) {
      val.push(' system')
    }

    if (sys != null) {
      val.push(sep, smart(sys))
    }
  }

  return val.join('') + '>'
}

function smart(value) {
  var quote = value.indexOf('"') === -1 ? '"' : "'"
  return quote + value + quote
}

},{}],29:[function(require,module,exports){
'use strict'

var xtend = require('xtend')
var svg = require('property-information/svg')
var find = require('property-information/find')
var spaces = require('space-separated-tokens').stringify
var commas = require('comma-separated-tokens').stringify
var entities = require('stringify-entities')
var ccount = require('ccount')
var all = require('./all')
var constants = require('./constants')

module.exports = element

/* Constants. */
var EMPTY = ''

/* Characters. */
var SPACE = ' '
var DQ = '"'
var SQ = "'"
var EQ = '='
var LT = '<'
var GT = '>'
var SO = '/'

/* Stringify an element `node`. */
function element(ctx, node, index, parent) {
  var parentSchema = ctx.schema
  var name = node.tagName
  var value = ''
  var selfClosing
  var close
  var omit
  var root = node
  var content
  var attrs

  if (parentSchema.space === 'html' && name === 'svg') {
    ctx.schema = svg
  }

  attrs = attributes(ctx, node.properties)

  if (ctx.schema.space === 'svg') {
    omit = false
    close = true
    selfClosing = ctx.closeEmpty
  } else {
    omit = ctx.omit
    close = ctx.close
    selfClosing = ctx.voids.indexOf(name.toLowerCase()) !== -1

    if (name === 'template') {
      root = node.content
    }
  }

  content = all(ctx, root)

  /* If the node is categorised as void, but it has
   * children, remove the categorisation.  This
   * enables for example `menuitem`s, which are
   * void in W3C HTML but not void in WHATWG HTML, to
   * be stringified properly. */
  selfClosing = content ? false : selfClosing

  if (attrs || !omit || !omit.opening(node, index, parent)) {
    value = LT + name + (attrs ? SPACE + attrs : EMPTY)

    if (selfClosing && close) {
      if (!ctx.tightClose || attrs.charAt(attrs.length - 1) === SO) {
        value += SPACE
      }

      value += SO
    }

    value += GT
  }

  value += content

  if (!selfClosing && (!omit || !omit.closing(node, index, parent))) {
    value += LT + SO + name + GT
  }

  ctx.schema = parentSchema

  return value
}

/* Stringify all attributes. */
function attributes(ctx, props) {
  var values = []
  var key
  var value
  var result
  var length
  var index
  var last

  for (key in props) {
    value = props[key]

    if (value == null) {
      continue
    }

    result = attribute(ctx, key, value)

    if (result) {
      values.push(result)
    }
  }

  length = values.length
  index = -1

  while (++index < length) {
    result = values[index]
    last = null

    if (ctx.schema.space === 'html' && ctx.tight) {
      last = result.charAt(result.length - 1)
    }

    /* In tight mode, don’t add a space after quoted attributes. */
    if (index !== length - 1 && last !== DQ && last !== SQ) {
      values[index] = result + SPACE
    }
  }

  return values.join(EMPTY)
}

/* Stringify one attribute. */
function attribute(ctx, key, value) {
  var schema = ctx.schema
  var space = schema.space
  var info = find(schema, key)
  var name = info.attribute

  if (info.overloadedBoolean && (value === name || value === '')) {
    value = true
  } else if (
    info.boolean ||
    (info.overloadedBoolean && typeof value !== 'string')
  ) {
    value = Boolean(value)
  }

  if (
    value == null ||
    value === false ||
    (typeof value === 'number' && isNaN(value))
  ) {
    return EMPTY
  }

  name = attributeName(ctx, name)

  if (value === true) {
    if (space === 'html') {
      return name
    }

    value = name
  }

  return name + attributeValue(ctx, key, value, info)
}

/* Stringify the attribute name. */
function attributeName(ctx, name) {
  // Always encode without parse errors in non-HTML.
  var valid = ctx.schema.space === 'html' ? ctx.valid : 1
  var subset = constants.name[valid][ctx.safe]

  return entities(name, xtend(ctx.entities, {subset: subset}))
}

/* Stringify the attribute value. */
function attributeValue(ctx, key, value, info) {
  var options = ctx.entities
  var quote = ctx.quote
  var alternative = ctx.alternative
  var space = ctx.schema.space
  var unquoted
  var subset

  if (typeof value === 'object' && 'length' in value) {
    /* `spaces` doesn’t accept a second argument, but it’s
     * given here just to keep the code cleaner. */
    value = (info.commaSeparated ? commas : spaces)(value, {
      padLeft: !ctx.tightLists
    })
  }

  value = String(value)

  if (space !== 'html' || value || !ctx.collapseEmpty) {
    unquoted = value

    /* Check unquoted value. */
    if (space === 'html' && ctx.unquoted) {
      subset = constants.unquoted[ctx.valid][ctx.safe]
      unquoted = entities(
        value,
        xtend(options, {subset: subset, attribute: true})
      )
    }

    /* If `value` contains entities when unquoted... */
    if (space !== 'html' || !ctx.unquoted || unquoted !== value) {
      /* If the alternative is less common than `quote`, switch. */
      if (alternative && ccount(value, quote) > ccount(value, alternative)) {
        quote = alternative
      }

      subset = quote === SQ ? constants.single : constants.double
      // Always encode without parse errors in non-HTML.
      subset = subset[space === 'html' ? ctx.valid : 1][ctx.safe]

      value = entities(value, xtend(options, {subset: subset, attribute: true}))

      value = quote + value + quote
    }

    /* Don’t add a `=` for unquoted empties. */
    value = value ? EQ + value : value
  }

  return value
}

},{"./all":25,"./constants":27,"ccount":7,"comma-separated-tokens":12,"property-information/find":157,"property-information/svg":174,"space-separated-tokens":275,"stringify-entities":278,"xtend":301}],30:[function(require,module,exports){
'use strict'

var html = require('property-information/html')
var svg = require('property-information/svg')
var voids = require('html-void-elements')
var omission = require('./omission')
var one = require('./one')

module.exports = toHTML

/* Characters. */
var DQ = '"'
var SQ = "'"

/* Stringify the given HAST node. */
function toHTML(node, options) {
  var settings = options || {}
  var quote = settings.quote || DQ
  var alternative = quote === DQ ? SQ : DQ
  var smart = settings.quoteSmart

  if (quote !== DQ && quote !== SQ) {
    throw new Error(
      'Invalid quote `' + quote + '`, expected `' + SQ + '` or `' + DQ + '`'
    )
  }

  return one(
    {
      valid: settings.allowParseErrors ? 0 : 1,
      safe: settings.allowDangerousCharacters ? 0 : 1,
      schema: settings.space === 'svg' ? svg : html,
      omit: settings.omitOptionalTags && omission,
      quote: quote,
      alternative: smart ? alternative : null,
      unquoted: Boolean(settings.preferUnquoted),
      tight: settings.tightAttributes,
      tightDoctype: Boolean(settings.tightDoctype),
      tightLists: settings.tightCommaSeparatedLists,
      tightClose: settings.tightSelfClosing,
      collapseEmpty: settings.collapseEmptyAttributes,
      dangerous: settings.allowDangerousHTML,
      voids: settings.voids || voids.concat(),
      entities: settings.entities || {},
      close: settings.closeSelfClosing,
      closeEmpty: settings.closeEmptyElements
    },
    node
  )
}

},{"./omission":32,"./one":39,"html-void-elements":82,"property-information/html":158,"property-information/svg":174}],31:[function(require,module,exports){
'use strict'

var is = require('unist-util-is')
var element = require('hast-util-is-element')
var whiteSpaceLeft = require('./util/white-space-left')
var after = require('./util/siblings').after
var omission = require('./omission')

var optionGroup = 'optgroup'
var options = ['option'].concat(optionGroup)
var dataListItem = ['dt', 'dd']
var listItem = 'li'
var menuContent = ['menuitem', 'hr', 'menu']
var ruby = ['rp', 'rt']
var tableContainer = ['tbody', 'tfoot']
var tableRow = 'tr'
var tableCell = ['td', 'th']

var confusingParagraphParent = [
  'a',
  'audio',
  'del',
  'ins',
  'map',
  'noscript',
  'video'
]

var clearParagraphSibling = [
  'address',
  'article',
  'aside',
  'blockquote',
  'details',
  'div',
  'dl',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hgroup',
  'hr',
  'main',
  'menu',
  'nav',
  'ol',
  'p',
  'pre',
  'section',
  'table',
  'ul'
]

module.exports = omission({
  html: html,
  head: headOrColgroupOrCaption,
  body: body,
  p: p,
  li: li,
  dt: dt,
  dd: dd,
  rt: rubyElement,
  rp: rubyElement,
  optgroup: optgroup,
  option: option,
  menuitem: menuitem,
  colgroup: headOrColgroupOrCaption,
  caption: headOrColgroupOrCaption,
  thead: thead,
  tbody: tbody,
  tfoot: tfoot,
  tr: tr,
  td: cells,
  th: cells
})

/* Macro for `</head>`, `</colgroup>`, and `</caption>`. */
function headOrColgroupOrCaption(node, index, parent) {
  var next = after(parent, index, true)
  return !next || (!is('comment', next) && !whiteSpaceLeft(next))
}

/* Whether to omit `</html>`. */
function html(node, index, parent) {
  var next = after(parent, index)
  return !next || !is('comment', next)
}

/* Whether to omit `</body>`. */
function body(node, index, parent) {
  var next = after(parent, index)
  return !next || !is('comment', next)
}

/* Whether to omit `</p>`. */
function p(node, index, parent) {
  var next = after(parent, index)
  return next
    ? element(next, clearParagraphSibling)
    : !parent || !element(parent, confusingParagraphParent)
}

/* Whether to omit `</li>`. */
function li(node, index, parent) {
  var next = after(parent, index)
  return !next || element(next, listItem)
}

/* Whether to omit `</dt>`. */
function dt(node, index, parent) {
  var next = after(parent, index)
  return next && element(next, dataListItem)
}

/* Whether to omit `</dd>`. */
function dd(node, index, parent) {
  var next = after(parent, index)
  return !next || element(next, dataListItem)
}

/* Whether to omit `</rt>` or `</rp>`. */
function rubyElement(node, index, parent) {
  var next = after(parent, index)
  return !next || element(next, ruby)
}

/* Whether to omit `</optgroup>`. */
function optgroup(node, index, parent) {
  var next = after(parent, index)
  return !next || element(next, optionGroup)
}

/* Whether to omit `</option>`. */
function option(node, index, parent) {
  var next = after(parent, index)
  return !next || element(next, options)
}

/* Whether to omit `</menuitem>`. */
function menuitem(node, index, parent) {
  var next = after(parent, index)
  return !next || element(next, menuContent)
}

/* Whether to omit `</thead>`. */
function thead(node, index, parent) {
  var next = after(parent, index)
  return next && element(next, tableContainer)
}

/* Whether to omit `</tbody>`. */
function tbody(node, index, parent) {
  var next = after(parent, index)
  return !next || element(next, tableContainer)
}

/* Whether to omit `</tfoot>`. */
function tfoot(node, index, parent) {
  return !after(parent, index)
}

/* Whether to omit `</tr>`. */
function tr(node, index, parent) {
  var next = after(parent, index)
  return !next || element(next, tableRow)
}

/* Whether to omit `</td>` or `</th>`. */
function cells(node, index, parent) {
  var next = after(parent, index)
  return !next || element(next, tableCell)
}

},{"./omission":33,"./util/siblings":37,"./util/white-space-left":38,"hast-util-is-element":19,"unist-util-is":288}],32:[function(require,module,exports){
'use strict'
exports.opening = require('./opening')
exports.closing = require('./closing')

},{"./closing":31,"./opening":34}],33:[function(require,module,exports){
'use strict'

module.exports = omission

var own = {}.hasOwnProperty

/* Factory to check if a given node can have a tag omitted. */
function omission(handlers) {
  return omit

  /* Check if a given node can have a tag omitted.   */
  function omit(node, index, parent) {
    var name = node.tagName
    var fn = own.call(handlers, name) ? handlers[name] : false

    return fn ? fn(node, index, parent) : false
  }
}

},{}],34:[function(require,module,exports){
'use strict'

var is = require('unist-util-is')
var element = require('hast-util-is-element')
var before = require('./util/siblings').before
var first = require('./util/first')
var place = require('./util/place')
var whiteSpaceLeft = require('./util/white-space-left')
var closing = require('./closing')
var omission = require('./omission')

var own = {}.hasOwnProperty

var uniqueHeadMetadata = ['title', 'base']
var meta = ['meta', 'link', 'script', 'style', 'template']
var tableContainers = ['thead', 'tbody']
var tableRow = 'tr'

module.exports = omission({
  html: html,
  head: head,
  body: body,
  colgroup: colgroup,
  tbody: tbody
})

/* Whether to omit `<html>`. */
function html(node) {
  var head = first(node)
  return !head || !is('comment', head)
}

/* Whether to omit `<head>`. */
function head(node) {
  var children = node.children
  var length = children.length
  var map = {}
  var index = -1
  var child
  var name

  while (++index < length) {
    child = children[index]
    name = child.tagName

    if (element(child, uniqueHeadMetadata)) {
      if (own.call(map, name)) {
        return false
      }

      map[name] = true
    }
  }

  return Boolean(length)
}

/* Whether to omit `<body>`. */
function body(node) {
  var head = first(node, true)

  return (
    !head ||
    (!is('comment', head) && !whiteSpaceLeft(head) && !element(head, meta))
  )
}

/* Whether to omit `<colgroup>`.
 * The spec describes some logic for the opening tag,
 * but it’s easier to implement in the closing tag, to
 * the same effect, so we handle it there instead. */
function colgroup(node, index, parent) {
  var prev = before(parent, index)
  var head = first(node, true)

  /* Previous colgroup was already omitted. */
  if (element(prev, 'colgroup') && closing(prev, place(parent, prev), parent)) {
    return false
  }

  return head && element(head, 'col')
}

/* Whether to omit `<tbody>`. */
function tbody(node, index, parent) {
  var prev = before(parent, index)
  var head = first(node)

  /* Previous table section was already omitted. */
  if (
    element(prev, tableContainers) &&
    closing(prev, place(parent, prev), parent)
  ) {
    return false
  }

  return head && element(head, tableRow)
}

},{"./closing":31,"./omission":33,"./util/first":35,"./util/place":36,"./util/siblings":37,"./util/white-space-left":38,"hast-util-is-element":19,"unist-util-is":288}],35:[function(require,module,exports){
'use strict'

var after = require('./siblings').after

module.exports = first

/* Get the first child in `parent`. */
function first(parent, includeWhiteSpace) {
  return after(parent, -1, includeWhiteSpace)
}

},{"./siblings":37}],36:[function(require,module,exports){
'use strict'

module.exports = place

/* Get the position of `node` in `parent`. */
function place(parent, child) {
  return parent && parent.children && parent.children.indexOf(child)
}

},{}],37:[function(require,module,exports){
'use strict'

var whiteSpace = require('hast-util-whitespace')

exports.before = siblings(-1)
exports.after = siblings(1)

/* Factory to check siblings in a direction. */
function siblings(increment) {
  return sibling

  /* Find applicable siblings in a direction.   */
  function sibling(parent, index, includeWhiteSpace) {
    var siblings = parent && parent.children
    var next

    index += increment
    next = siblings && siblings[index]

    if (!includeWhiteSpace) {
      while (next && whiteSpace(next)) {
        index += increment
        next = siblings[index]
      }
    }

    return next
  }
}

},{"hast-util-whitespace":77}],38:[function(require,module,exports){
'use strict'

var is = require('unist-util-is')
var whiteSpace = require('hast-util-whitespace')

module.exports = whiteSpaceLeft

/* Check if `node` starts with white-space. */
function whiteSpaceLeft(node) {
  return is('text', node) && whiteSpace(node.value.charAt(0))
}

},{"hast-util-whitespace":77,"unist-util-is":288}],39:[function(require,module,exports){
'use strict'

module.exports = one

var own = {}.hasOwnProperty

var handlers = {}

handlers.root = require('./all')
handlers.text = require('./text')
handlers.element = require('./element')
handlers.doctype = require('./doctype')
handlers.comment = require('./comment')
handlers.raw = require('./raw')

/* Stringify `node`. */
function one(ctx, node, index, parent) {
  var type = node && node.type

  if (!type) {
    throw new Error('Expected node, not `' + node + '`')
  }

  if (!own.call(handlers, type)) {
    throw new Error('Cannot compile unknown node `' + type + '`')
  }

  return handlers[type](ctx, node, index, parent)
}

},{"./all":25,"./comment":26,"./doctype":28,"./element":29,"./raw":40,"./text":41}],40:[function(require,module,exports){
'use strict'

var text = require('./text')

module.exports = raw

/* Stringify `raw`. */
function raw(ctx, node) {
  return ctx.dangerous ? node.value : text(ctx, node)
}

},{"./text":41}],41:[function(require,module,exports){
'use strict'

var xtend = require('xtend')
var entities = require('stringify-entities')

module.exports = text

/* Stringify `text`. */
function text(ctx, node, index, parent) {
  var value = node.value

  return isLiteral(parent)
    ? value
    : entities(value, xtend(ctx.entities, {subset: ['<', '&']}))
}

/* Check if content of `node` should be escaped. */
function isLiteral(node) {
  return node && (node.tagName === 'script' || node.tagName === 'style')
}

},{"stringify-entities":278,"xtend":301}],42:[function(require,module,exports){
'use strict'

module.exports = toMdast

var minify = require('rehype-minify-whitespace')
var xtend = require('xtend')
var one = require('./lib/one')
var handlers = require('./lib/handlers')

function toMdast(tree, options) {
  var settings = options || {}
  var opts = {newlines: settings.newlines === true}

  h.baseFound = false
  h.frozenBaseURL = null

  h.handlers = xtend(handlers, settings.handlers || {})
  h.augment = augment
  h.document = settings.document

  return one(h, minify(opts)(tree), null)

  function h(node, type, props, children) {
    var result

    if (
      !children &&
      (typeof props === 'string' ||
        (typeof props === 'object' && 'length' in props))
    ) {
      children = props
      props = {}
    }

    result = xtend({type: type}, props)

    if (typeof children === 'string') {
      result.value = children
    } else if (children) {
      result.children = children
    }

    return augment(node, result)
  }

  // `right` is the finalized mdast node, created from `left`, a hast node.
  function augment(left, right) {
    if (left.position) {
      right.position = left.position
    }

    return right
  }
}

},{"./lib/handlers":54,"./lib/one":70,"rehype-minify-whitespace":175,"xtend":301}],43:[function(require,module,exports){
'use strict'

module.exports = all

var one = require('./one')

function all(h, parent) {
  var nodes = parent.children || []
  var length = nodes.length
  var values = []
  var index = -1
  var result

  while (++index < length) {
    result = one(h, nodes[index], parent)

    if (result) {
      values = values.concat(result)
    }
  }

  return values
}

},{"./one":70}],44:[function(require,module,exports){
'use strict'

module.exports = base

function base(h, node) {
  if (!h.baseFound) {
    h.frozenBaseURL = node.properties.href || null
    h.baseFound = true
  }
}

},{}],45:[function(require,module,exports){
'use strict'

module.exports = blockquote

var wrapChildren = require('../util/wrap-children')

function blockquote(h, node) {
  return h(node, 'blockquote', wrapChildren(h, node))
}

},{"../util/wrap-children":73}],46:[function(require,module,exports){
'use strict'

module.exports = br

function br(h, node) {
  return h(node, 'break')
}

},{}],47:[function(require,module,exports){
'use strict'

module.exports = code

var is = require('hast-util-is-element')
var has = require('hast-util-has-property')
var toString = require('hast-util-to-string')
var trim = require('trim-trailing-lines')

var prefix = 'language-'

function code(h, node) {
  var children = node.children
  var length = children.length
  var index = -1
  var child
  var classList
  var className
  var lang

  if (node.tagName === 'pre') {
    while (++index < length) {
      child = children[index]

      if (is(child, 'code') && has(child, 'className')) {
        classList = child.properties.className
        break
      }
    }
  }

  if (classList) {
    length = classList.length
    index = -1

    while (++index < length) {
      className = classList[index]

      if (className.slice(0, prefix.length) === prefix) {
        lang = className.slice(prefix.length)
        break
      }
    }
  }

  return h(node, 'code', {lang: lang || null, meta: null}, trim(toString(node)))
}

},{"hast-util-has-property":17,"hast-util-is-element":19,"hast-util-to-string":76,"trim-trailing-lines":280}],48:[function(require,module,exports){
'use strict'

module.exports = comment

function comment(h, node) {
  return h(node, 'html', '<!--' + node.value + '-->')
}

},{}],49:[function(require,module,exports){
'use strict'

module.exports = dataList

var is = require('hast-util-is-element')
var wrapListItems = require('../util/wrap-list-items')
var spread = require('../util/list-items-spread')

function dataList(h, node) {
  var children = node.children
  var length = children.length
  var index = -1
  var clean = []
  var groups = []
  var content
  var breakpoint
  var title
  var child
  var group = {titles: [], definitions: []}

  // Unwrap `<div>`s
  while (++index < length) {
    child = children[index]
    clean = clean.concat(is(child, 'div') ? child.children : child)
  }

  length = clean.length
  index = -1

  // Group titles and definitions.
  while (++index < length) {
    child = clean[index]
    title = is(child, 'dt')

    if (title && breakpoint) {
      groups.push(group)
      group = {titles: [], definitions: []}
    }

    group[title ? 'titles' : 'definitions'].push(child)
    breakpoint = is(child, 'dd')
  }

  groups.push(group)

  // Group titles and definitions.
  length = groups.length
  index = -1
  content = []

  while (++index < length) {
    group = groups[index]
    group = handle(h, group.titles).concat(handle(h, group.definitions))

    if (group.length !== 0) {
      content.push({
        type: 'listItem',
        spread: group.length > 1,
        checked: null,
        children: group
      })
    }
  }

  // Create a list if there are items.
  if (content.length !== 0) {
    return h(
      node,
      'list',
      {ordered: false, start: null, spread: spread(content)},
      content
    )
  }
}

function handle(h, category) {
  var nodes = wrapListItems(h, {children: category})

  if (nodes.length === 0) {
    return []
  }

  if (nodes.length === 1) {
    return nodes[0].children
  }

  return [
    {
      type: 'list',
      ordered: false,
      start: null,
      spread: spread(nodes),
      children: nodes
    }
  ]
}

},{"../util/list-items-spread":71,"../util/wrap-list-items":74,"hast-util-is-element":19}],50:[function(require,module,exports){
'use strict'

module.exports = strikethrough

var all = require('../all')

function strikethrough(h, node) {
  return h(node, 'delete', all(h, node))
}

},{"../all":43}],51:[function(require,module,exports){
'use strict'

module.exports = emphasis

var all = require('../all')

function emphasis(h, node) {
  return h(node, 'emphasis', all(h, node))
}

},{"../all":43}],52:[function(require,module,exports){
'use strict'

module.exports = heading

var all = require('../all')

function heading(h, node) {
  var depth = Number(node.tagName.charAt(1))

  /* istanbul ignore next - `else` shouldn’t happen, of course… */
  depth = depth || 1

  return h(node, 'heading', {depth: depth}, all(h, node))
}

},{"../all":43}],53:[function(require,module,exports){
'use strict'

module.exports = image

var resolve = require('../util/resolve')

function image(h, node) {
  var props = {
    url: resolve(h, node.properties.src),
    title: node.properties.title || null,
    alt: node.properties.alt || null
  }

  return h(node, 'image', props)
}

},{"../util/resolve":72}],54:[function(require,module,exports){
'use strict'

var all = require('../all')
var wrapped = require('../util/wrap-children')
var base = require('./base')
var blockquote = require('./blockquote')
var br = require('./break')
var cell = require('./table-cell')
var code = require('./code')
var comment = require('./comment')
var dataList = require('./data-list')
var del = require('./delete')
var emphasis = require('./emphasis')
var heading = require('./heading')
var image = require('./image')
var inlineCode = require('./inline-code')
var link = require('./link')
var list = require('./list')
var listItem = require('./list-item')
var media = require('./media')
var paragraph = require('./paragraph')
var quote = require('./q')
var root = require('./root')
var row = require('./table-row')
var strong = require('./strong')
var table = require('./table')
var text = require('./text')
var thematicBreak = require('./thematic-break')
var wbr = require('./wbr')

exports.root = root
exports.text = text
exports.comment = comment
exports.doctype = ignore

exports.applet = ignore
exports.area = ignore
exports.basefont = ignore
exports.bgsound = ignore
exports.caption = ignore
exports.col = ignore
exports.colgroup = ignore
exports.command = ignore
exports.content = ignore
exports.datalist = ignore
exports.dialog = ignore
exports.element = ignore
exports.embed = ignore
exports.input = ignore
exports.isindex = ignore
exports.keygen = ignore
exports.link = ignore
exports.map = ignore
exports.math = ignore
exports.menu = ignore
exports.menuitem = ignore
exports.meta = ignore
exports.nextid = ignore
exports.noscript = ignore
exports.object = ignore
exports.optgroup = ignore
exports.option = ignore
exports.param = ignore
exports.script = ignore
exports.select = ignore
exports.shadow = ignore
exports.source = ignore
exports.spacer = ignore
exports.style = ignore
exports.svg = ignore
exports.template = ignore
exports.title = ignore
exports.track = ignore

exports.abbr = all
exports.acronym = all
exports.bdi = all
exports.bdo = all
exports.big = all
exports.blink = all
exports.canvas = all
exports.cite = all
exports.data = all
exports.details = all
exports.dfn = all
exports.font = all
exports.marquee = all
exports.meter = all
exports.nobr = all
exports.output = all
exports.progress = all
exports.slot = all
exports.small = all
exports.span = all
exports.sup = all
exports.sub = all
exports.tbody = all
exports.tfoot = all
exports.thead = all
exports.time = all

exports.address = wrapped
exports.article = wrapped
exports.aside = wrapped
exports.body = wrapped
exports.center = wrapped
exports.div = wrapped
exports.figcaption = wrapped
exports.figure = wrapped
exports.footer = wrapped
exports.header = wrapped
exports.hgroup = wrapped
exports.html = wrapped
exports.main = wrapped
exports.multicol = wrapped
exports.nav = wrapped
exports.picture = wrapped
exports.section = wrapped

exports.a = link
exports.audio = media
exports.b = strong
exports.base = base
exports.blockquote = blockquote
exports.br = br
exports.code = inlineCode
exports.dir = list
exports.dl = dataList
exports.dt = listItem
exports.dd = listItem
exports.del = del
exports.em = emphasis
exports.h1 = heading
exports.h2 = heading
exports.h3 = heading
exports.h4 = heading
exports.h5 = heading
exports.h6 = heading
exports.hr = thematicBreak
exports.i = emphasis
exports.img = image
exports.image = image
exports.kbd = inlineCode
exports.li = listItem
exports.listing = code
exports.mark = emphasis
exports.ol = list
exports.p = paragraph
exports.plaintext = code
exports.pre = code
exports.q = quote
exports.s = del
exports.samp = inlineCode
exports.strike = del
exports.strong = strong
exports.summary = paragraph
exports.table = table
exports.td = cell
exports.th = cell
exports.tr = row
exports.tt = inlineCode
exports.u = emphasis
exports.ul = list
exports.var = inlineCode
exports.video = media
exports.wbr = wbr
exports.xmp = code

function ignore() {}

},{"../all":43,"../util/wrap-children":73,"./base":44,"./blockquote":45,"./break":46,"./code":47,"./comment":48,"./data-list":49,"./delete":50,"./emphasis":51,"./heading":52,"./image":53,"./inline-code":55,"./link":56,"./list":58,"./list-item":57,"./media":59,"./paragraph":60,"./q":61,"./root":62,"./strong":63,"./table":66,"./table-cell":64,"./table-row":65,"./text":67,"./thematic-break":68,"./wbr":69}],55:[function(require,module,exports){
'use strict'

module.exports = inlineCode

var toString = require('hast-util-to-string')

function inlineCode(h, node) {
  return h(node, 'inlineCode', toString(node))
}

},{"hast-util-to-string":76}],56:[function(require,module,exports){
'use strict'

module.exports = link

var all = require('../all')
var resolve = require('../util/resolve')

function link(h, node) {
  var props = {
    url: resolve(h, node.properties.href),
    title: node.properties.title || null
  }

  return h(node, 'link', props, all(h, node))
}

},{"../all":43,"../util/resolve":72}],57:[function(require,module,exports){
'use strict'

module.exports = listItem

var is = require('hast-util-is-element')
var wrapChildren = require('../util/wrap-children')

function listItem(h, node) {
  var children = node.children
  var head = children[0]
  var checked = null
  var checkbox
  var grandchildren
  var content

  // Check if this node starts with a checkbox.
  if (head && is(head, 'p')) {
    grandchildren = head.children
    checkbox = grandchildren[0]

    if (
      checkbox &&
      is(checkbox, 'input') &&
      checkbox.properties.type === 'checkbox'
    ) {
      checked = Boolean(checkbox.properties.checked)
    }
  }

  content = wrapChildren(h, node)

  // Remove initial spacing if we previously found a checkbox.
  if (checked !== null) {
    grandchildren = content[0] && content[0].children
    head = grandchildren && grandchildren[0]

    if (head && head.type === 'text' && head.value.charAt(0) === ' ') {
      // Remove text with one space, or remove that one initial space.
      if (head.value.length === 1) {
        content[0].children = grandchildren.slice(1)
      } else {
        head.value = head.value.slice(1)
      }
    }
  }

  // Drop empty paragraph.
  if (content.length === 1) {
    head = content[0]

    if (head.type === 'paragraph' && head.children.length === 0) {
      content = []
    }
  }

  return h(
    node,
    'listItem',
    {spread: content.length > 1, checked: checked},
    content
  )
}

},{"../util/wrap-children":73,"hast-util-is-element":19}],58:[function(require,module,exports){
'use strict'

module.exports = list

var has = require('hast-util-has-property')
var wrapListItems = require('../util/wrap-list-items')
var spread = require('../util/list-items-spread')

function list(h, node) {
  var ordered = node.tagName === 'ol'
  var start = null
  var children

  if (ordered) {
    start = has(node, 'start') ? node.properties.start : 1
  }

  children = wrapListItems(h, node)

  return h(
    node,
    'list',
    {ordered: ordered, start: start, spread: spread(children)},
    children
  )
}

},{"../util/list-items-spread":71,"../util/wrap-list-items":74,"hast-util-has-property":17}],59:[function(require,module,exports){
'use strict'

module.exports = media

var visit = require('unist-util-visit')
var is = require('hast-util-is-element')
var toString = require('mdast-util-to-string')
var all = require('../all')
var resolve = require('../util/resolve')
var needed = require('../util/wrap').needed

function media(h, node) {
  var nodes = all(h, node)
  var poster = is(node, 'video') ? node.properties.poster : null
  var src = node.properties.src
  var children = node.children
  var length = children.length
  var index = -1
  var linkInFallbackContent = false
  var child

  // Find the source.
  while (!src && ++index < length) {
    child = children[index]

    if (is(child, 'source')) {
      src = child.properties.src
    }
  }

  visit({type: 'root', children: nodes}, 'link', findLink)

  // If the content links to something, or if it’s not phrasing...
  if (linkInFallbackContent || needed(nodes)) {
    return nodes
  }

  // If there’s a poster defined on the video, create an image.
  if (poster) {
    nodes = [
      {
        type: 'image',
        title: null,
        url: resolve(h, poster),
        alt: toString({children: nodes})
      }
    ]
  }

  // Link to the media resource.
  return {
    type: 'link',
    title: null,
    url: resolve(h, src),
    children: nodes
  }

  function findLink() {
    linkInFallbackContent = true
    return visit.EXIT
  }
}

},{"../all":43,"../util/resolve":72,"../util/wrap":75,"hast-util-is-element":19,"mdast-util-to-string":130,"unist-util-visit":294}],60:[function(require,module,exports){
'use strict'

module.exports = paragraph

var all = require('../all')

function paragraph(h, node) {
  return h(node, 'paragraph', all(h, node))
}

},{"../all":43}],61:[function(require,module,exports){
'use strict'

module.exports = q

var all = require('../all')

var quote = '"'

function q(h, node) {
  var contents = all(h, node)
  var head = contents[0]
  var tail = contents[contents.length - 1]

  if (head && head.type === 'text') {
    head.value = quote + head.value
  } else {
    contents.unshift({type: 'text', value: quote})
  }

  if (tail && tail.type === 'text') {
    tail.value += quote
  } else {
    contents.push({type: 'text', value: quote})
  }

  return contents
}

},{"../all":43}],62:[function(require,module,exports){
'use strict'

module.exports = root

var all = require('../all')
var wrap = require('../util/wrap')

function root(h, node) {
  var children = all(h, node)

  if (h.document || wrap.needed(children)) {
    children = wrap(children)
  }

  return h(node, 'root', children)
}

},{"../all":43,"../util/wrap":75}],63:[function(require,module,exports){
'use strict'

module.exports = strong

var all = require('../all')

function strong(h, node) {
  return h(node, 'strong', all(h, node))
}

},{"../all":43}],64:[function(require,module,exports){
'use strict'

module.exports = cell

var all = require('../all')

function cell(h, node) {
  return h(node, 'tableCell', all(h, node))
}

},{"../all":43}],65:[function(require,module,exports){
'use strict'

module.exports = row

var all = require('../all')

function row(h, node) {
  return h(node, 'tableRow', all(h, node))
}

},{"../all":43}],66:[function(require,module,exports){
'use strict'

module.exports = table

var visit = require('unist-util-visit')
var all = require('../all')

function table(h, node) {
  var align = alignment(node)
  return h(node, 'table', {align: align}, patch(all(h, node), align.length))
}

// Infer the alignment of the table.
function alignment(node) {
  var align = []

  visit(node, visitor)

  return align

  function visitor(child, index, parent) {
    var pos

    if (cell(child)) {
      pos = cellsBefore(parent, child)
      if (!align[pos]) {
        align[pos] = child.properties.align || null
      }
    }
  }
}

// Count cells in `parent` before `node`.
function cellsBefore(parent, node) {
  var children = parent.children
  var length = children.length
  var index = -1
  var child
  var pos = 0

  while (++index < length) {
    child = children[index]

    if (child === node) {
      break
    }

    /* istanbul ignore else - When proper HTML, should always be a cell */
    if (cell(child)) {
      pos++
    }
  }

  return pos
}

// Check if `node` is a cell.
function cell(node) {
  return node.tagName === 'th' || node.tagName === 'td'
}

// Ensure the amount of cells in a row matches `align.left`.
function patch(rows, count) {
  var length = rows.length
  var index = -1

  while (++index < length) {
    one(rows[index], count)
  }

  return rows
}

function one(row, count) {
  var children = row.children
  var length = count + 1
  var index = children.length

  while (++index < length) {
    children.push({type: 'tableCell', children: []})
  }
}

},{"../all":43,"unist-util-visit":294}],67:[function(require,module,exports){
'use strict'

module.exports = text

function text(h, node) {
  return h.augment(node, {type: 'text', value: node.value})
}

},{}],68:[function(require,module,exports){
'use strict'

module.exports = thematicBreak

function thematicBreak(h, node) {
  return h(node, 'thematicBreak')
}

},{}],69:[function(require,module,exports){
'use strict'

module.exports = zws

function zws(h, node) {
  return h.augment(node, {type: 'text', value: '\u200B'})
}

},{}],70:[function(require,module,exports){
'use strict'

module.exports = one

var all = require('./all')

var own = {}.hasOwnProperty

function one(h, node, parent) {
  var fn = null

  if (node.type === 'element') {
    if (node.properties && node.properties.dataMdast === 'ignore') {
      return
    }

    if (own.call(h.handlers, node.tagName)) {
      fn = h.handlers[node.tagName]
    }
  } else if (own.call(h.handlers, node.type)) {
    fn = h.handlers[node.type]
  }

  return (typeof fn === 'function' ? fn : unknown)(h, node, parent)
}

function unknown(h, node) {
  if (node.value) {
    return h.augment(node, {type: 'text', value: node.value})
  }

  return all(h, node)
}

},{"./all":43}],71:[function(require,module,exports){
'use strict'

module.exports = spread

function spread(children) {
  var length = children.length
  var index = -1

  if (length > 1) {
    while (++index < length) {
      if (children[index].spread) {
        return true
      }
    }
  }

  return false
}

},{}],72:[function(require,module,exports){
'use strict'

module.exports = resolve

function resolve(h, url) {
  if (url === null || url === undefined) {
    return ''
  }

  /* istanbul ignore next - ignored for older Node */
  if (h.frozenBaseURL && typeof URL !== 'undefined') {
    return String(new URL(url, h.frozenBaseURL))
  }

  return url
}

},{}],73:[function(require,module,exports){
'use strict'

module.exports = wrapped

var all = require('../all')
var wrap = require('./wrap')

function wrapped(h, node) {
  return wrap(all(h, node))
}

},{"../all":43,"./wrap":75}],74:[function(require,module,exports){
'use strict'

module.exports = wrapped

var all = require('../all')

function wrapped(h, node) {
  var children = all(h, node)
  var length = children.length
  var index = -1
  var child

  while (++index < length) {
    child = children[index]

    if (child.type !== 'listItem') {
      children[index] = {
        type: 'listItem',
        spread: false,
        checked: null,
        children: [child]
      }
    }
  }

  return children
}

},{"../all":43}],75:[function(require,module,exports){
'use strict'

module.exports = wrap

wrap.needed = needed

var phrasing = require('mdast-util-phrasing')

// Wrap all inline runs of mdast content in `paragraph` nodes.
function wrap(nodes) {
  var result = []
  var length = nodes.length
  var index = -1
  var node
  var queue

  while (++index < length) {
    node = nodes[index]

    if (phrasing(node)) {
      if (queue === undefined) {
        queue = []
      }

      queue.push(node)
    } else {
      flush()
      result.push(node)
    }
  }

  flush()

  return result

  function flush() {
    if (queue !== undefined) {
      if (
        queue.length !== 1 ||
        queue[0].type !== 'text' ||
        (queue[0].value !== ' ' && queue[0].value !== '\n')
      ) {
        result.push({type: 'paragraph', children: queue})
      }
    }

    queue = undefined
  }
}

// Check if there are non-inline mdast nodes returned.  This is needed if a
// fragment is given, which could just be a sentence, and doesn’t need a
// wrapper paragraph.
function needed(nodes) {
  var length = nodes.length
  var index = -1

  while (++index < length) {
    if (!phrasing(nodes[index])) {
      return true
    }
  }

  return false
}

},{"mdast-util-phrasing":99}],76:[function(require,module,exports){
/**
 * @fileoverview
 *   Get the plain-text value of a HAST node.
 * @longdescription
 *   ## Usage
 *
 *   ```javascript
 *   var h = require('hastscript');
 *   var toString = require('hast-util-to-string');
 *
 *   toString(h('p', 'Alpha'));
 *   //=> 'Alpha'
 *   toString(h('div', [h('b', 'Bold'), ' and ', h('i', 'italic'), '.']));
 *   //=> 'Bold and italic.'
 *   ```
 *
 *   ## API
 *
 *   ### `toString(node)`
 *
 *   Transform a node to string.
 */

'use strict';

module.exports = toString;

function toString(node) {
  /* “The concatenation of data of all the Text node descendants
   * of the context object, in tree order.” */
  if ('children' in node) {
    return all(node);
  }

  /* “Context object’s data.” */
  return 'value' in node ? node.value : '';
}

function one(node) {
  if (node.type === 'text') {
    return node.value;
  }

  return node.children ? all(node) : '';
}

function all(node) {
  var children = node.children;
  var length = children.length;
  var index = -1;
  var result = [];

  while (++index < length) {
    result[index] = one(children[index]);
  }

  return result.join('');
}

},{}],77:[function(require,module,exports){
'use strict'

module.exports = interElementWhiteSpace

/* HTML white-space expression.
 * See <https://html.spec.whatwg.org/#space-character>. */
var re = /[ \t\n\f\r]/g

/* Check if `node` is a inter-element white-space. */
function interElementWhiteSpace(node) {
  var value

  if (node && typeof node === 'object' && node.type === 'text') {
    value = node.value || ''
  } else if (typeof node === 'string') {
    value = node
  } else {
    return false
  }

  return value.replace(re, '') === ''
}

},{}],78:[function(require,module,exports){
'use strict'

var find = require('property-information/find')
var normalize = require('property-information/normalize')
var parseSelector = require('hast-util-parse-selector')
var spaces = require('space-separated-tokens').parse
var commas = require('comma-separated-tokens').parse

module.exports = factory

function factory(schema, defaultTagName) {
  return h

  /* Hyperscript compatible DSL for creating virtual HAST trees. */
  function h(selector, properties) {
    var node = parseSelector(selector, defaultTagName)
    var children = Array.prototype.slice.call(arguments, 2)
    var property

    if (properties && isChildren(properties, node)) {
      children.unshift(properties)
      properties = null
    }

    if (properties) {
      for (property in properties) {
        addProperty(node.properties, property, properties[property])
      }
    }

    addChild(node.children, children)

    if (node.tagName === 'template') {
      node.content = {type: 'root', children: node.children}
      node.children = []
    }

    return node
  }

  function addProperty(properties, key, value) {
    var info
    var property
    var result

    /* Ignore nully and NaN values. */
    if (value === null || value === undefined || value !== value) {
      return
    }

    info = find(schema, key)
    property = info.property
    result = value

    /* Handle list values. */
    if (typeof result === 'string') {
      if (info.spaceSeparated) {
        result = spaces(result)
      } else if (info.commaSeparated) {
        result = commas(result)
      } else if (info.commaOrSpaceSeparated) {
        result = spaces(commas(result).join(' '))
      }
    }

    /* Accept `object` on style. */
    if (property === 'style' && typeof value !== 'string') {
      result = style(result)
    }

    /* Class-names (which can be added both on the `selector` and here). */
    if (property === 'className' && properties.className) {
      result = properties.className.concat(result)
    }

    properties[property] = parsePrimitives(info, property, result)
  }
}

function isChildren(value, node) {
  return (
    typeof value === 'string' ||
    'length' in value ||
    isNode(node.tagName, value)
  )
}

function isNode(tagName, value) {
  var type = value.type

  if (tagName === 'input' || !type || typeof type !== 'string') {
    return false
  }

  if (typeof value.children === 'object' && 'length' in value.children) {
    return true
  }

  type = type.toLowerCase()

  if (tagName === 'button') {
    return (
      type !== 'menu' &&
      type !== 'submit' &&
      type !== 'reset' &&
      type !== 'button'
    )
  }

  return 'value' in value
}

function addChild(nodes, value) {
  var index
  var length

  if (typeof value === 'string' || typeof value === 'number') {
    nodes.push({type: 'text', value: String(value)})
    return
  }

  if (typeof value === 'object' && 'length' in value) {
    index = -1
    length = value.length

    while (++index < length) {
      addChild(nodes, value[index])
    }

    return
  }

  if (typeof value !== 'object' || !('type' in value)) {
    throw new Error('Expected node, nodes, or string, got `' + value + '`')
  }

  nodes.push(value)
}

/* Parse a (list of) primitives. */
function parsePrimitives(info, name, value) {
  var index
  var length
  var result

  if (typeof value !== 'object' || !('length' in value)) {
    return parsePrimitive(info, name, value)
  }

  length = value.length
  index = -1
  result = []

  while (++index < length) {
    result[index] = parsePrimitive(info, name, value[index])
  }

  return result
}

/* Parse a single primitives. */
function parsePrimitive(info, name, value) {
  var result = value

  if (info.number || info.positiveNumber) {
    if (!isNaN(result) && result !== '') {
      result = Number(result)
    }
  } else if (info.boolean || info.overloadedBoolean) {
    /* Accept `boolean` and `string`. */
    if (
      typeof result === 'string' &&
      (result === '' || normalize(value) === normalize(name))
    ) {
      result = true
    }
  }

  return result
}

function style(value) {
  var result = []
  var key

  for (key in value) {
    result.push([key, value[key]].join(': '))
  }

  return result.join('; ')
}

},{"comma-separated-tokens":12,"hast-util-parse-selector":20,"property-information/find":157,"property-information/normalize":173,"space-separated-tokens":275}],79:[function(require,module,exports){
'use strict'

var schema = require('property-information/html')
var factory = require('./factory')

var html = factory(schema, 'div')
html.displayName = 'html'

module.exports = html

},{"./factory":78,"property-information/html":158}],80:[function(require,module,exports){
'use strict'

module.exports = require('./html')

},{"./html":79}],81:[function(require,module,exports){
'use strict'

var schema = require('property-information/svg')
var factory = require('./factory')

var svg = factory(schema, 'g')
svg.displayName = 'svg'

module.exports = svg

},{"./factory":78,"property-information/svg":174}],82:[function(require,module,exports){
module.exports=[
  "area",
  "base",
  "basefont",
  "bgsound",
  "br",
  "col",
  "command",
  "embed",
  "frame",
  "hr",
  "image",
  "img",
  "input",
  "isindex",
  "keygen",
  "link",
  "menuitem",
  "meta",
  "nextid",
  "param",
  "source",
  "track",
  "wbr"
]

},{}],83:[function(require,module,exports){
module.exports=[
  "script",
  "style",
  "pre",
  "textarea"
]

},{}],84:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],85:[function(require,module,exports){
'use strict'

module.exports = alphabetical

/* Check if the given character code, or the character
 * code at the first character, is alphabetical. */
function alphabetical(character) {
  var code = typeof character === 'string' ? character.charCodeAt(0) : character

  return (
    (code >= 97 && code <= 122) /* a-z */ ||
    (code >= 65 && code <= 90) /* A-Z */
  )
}

},{}],86:[function(require,module,exports){
'use strict';
module.exports = function (str) {
	if (typeof str !== 'string') {
		throw new TypeError('Expected a string');
	}

	return !/[^0-9a-z\xDF-\xFF]/.test(str.toLowerCase());
};

},{}],87:[function(require,module,exports){
'use strict'

var alphabetical = require('is-alphabetical')
var decimal = require('is-decimal')

module.exports = alphanumerical

/* Check if the given character code, or the character
 * code at the first character, is alphanumerical. */
function alphanumerical(character) {
  return alphabetical(character) || decimal(character)
}

},{"is-alphabetical":85,"is-decimal":89}],88:[function(require,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

module.exports = function isBuffer (obj) {
  return obj != null && obj.constructor != null &&
    typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

},{}],89:[function(require,module,exports){
'use strict'

module.exports = decimal

/* Check if the given character code, or the character
 * code at the first character, is decimal. */
function decimal(character) {
  var code = typeof character === 'string' ? character.charCodeAt(0) : character

  return code >= 48 && code <= 57 /* 0-9 */
}

},{}],90:[function(require,module,exports){
'use strict'

module.exports = hexadecimal

/* Check if the given character code, or the character
 * code at the first character, is hexadecimal. */
function hexadecimal(character) {
  var code = typeof character === 'string' ? character.charCodeAt(0) : character

  return (
    (code >= 97 /* a */ && code <= 102) /* z */ ||
    (code >= 65 /* A */ && code <= 70) /* Z */ ||
    (code >= 48 /* A */ && code <= 57) /* Z */
  )
}

},{}],91:[function(require,module,exports){
'use strict';
var toString = Object.prototype.toString;

module.exports = function (x) {
	var prototype;
	return toString.call(x) === '[object Object]' && (prototype = Object.getPrototypeOf(x), prototype === null || prototype === Object.getPrototypeOf({}));
};

},{}],92:[function(require,module,exports){
'use strict'

module.exports = whitespace

var fromCode = String.fromCharCode
var re = /\s/

/* Check if the given character code, or the character
 * code at the first character, is a whitespace character. */
function whitespace(character) {
  return re.test(
    typeof character === 'number' ? fromCode(character) : character.charAt(0)
  )
}

},{}],93:[function(require,module,exports){
'use strict'

module.exports = wordCharacter

var fromCode = String.fromCharCode
var re = /\w/

/* Check if the given character code, or the character
 * code at the first character, is a word character. */
function wordCharacter(character) {
  return re.test(
    typeof character === 'number' ? fromCode(character) : character.charAt(0)
  )
}

},{}],94:[function(require,module,exports){
'use strict';

/* Expose. */
module.exports = longestStreak;

/* Get the count of the longest repeating streak of
 * `character` in `value`. */
function longestStreak(value, character) {
  var count = 0;
  var maximum = 0;
  var expected;
  var index;

  if (typeof character !== 'string' || character.length !== 1) {
    throw new Error('Expected character');
  }

  value = String(value);
  index = value.indexOf(character);
  expected = index;

  while (index !== -1) {
    count++;

    if (index === expected) {
      if (count > maximum) {
        maximum = count;
      }
    } else {
      count = 1;
    }

    expected = index + 1;
    index = value.indexOf(character, expected);
  }

  return maximum;
}

},{}],95:[function(require,module,exports){
'use strict'

module.exports = escapes

var defaults = [
  '\\',
  '`',
  '*',
  '{',
  '}',
  '[',
  ']',
  '(',
  ')',
  '#',
  '+',
  '-',
  '.',
  '!',
  '_',
  '>'
]

var gfm = defaults.concat(['~', '|'])

var commonmark = gfm.concat([
  '\n',
  '"',
  '$',
  '%',
  '&',
  "'",
  ',',
  '/',
  ':',
  ';',
  '<',
  '=',
  '?',
  '@',
  '^'
])

escapes.default = defaults
escapes.gfm = gfm
escapes.commonmark = commonmark

/* Get markdown escapes. */
function escapes(options) {
  var settings = options || {}

  if (settings.commonmark) {
    return commonmark
  }

  return settings.gfm ? gfm : defaults
}

},{}],96:[function(require,module,exports){
'use strict'

/* Expose. */
module.exports = markdownTable

/* Expressions. */
var EXPRESSION_DOT = /\./
var EXPRESSION_LAST_DOT = /\.[^.]*$/

/* Allowed alignment values. */
var LEFT = 'l'
var RIGHT = 'r'
var CENTER = 'c'
var DOT = '.'
var NULL = ''

var ALLIGNMENT = [LEFT, RIGHT, CENTER, DOT, NULL]
var MIN_CELL_SIZE = 3

/* Characters. */
var COLON = ':'
var DASH = '-'
var PIPE = '|'
var SPACE = ' '
var NEW_LINE = '\n'

/* Create a table from a matrix of strings. */
function markdownTable(table, options) {
  var settings = options || {}
  var delimiter = settings.delimiter
  var start = settings.start
  var end = settings.end
  var alignment = settings.align
  var calculateStringLength = settings.stringLength || lengthNoop
  var cellCount = 0
  var rowIndex = -1
  var rowLength = table.length
  var sizes = []
  var align
  var rule
  var rows
  var row
  var cells
  var index
  var position
  var size
  var value
  var spacing
  var before
  var after

  alignment = alignment ? alignment.concat() : []

  if (delimiter === null || delimiter === undefined) {
    delimiter = SPACE + PIPE + SPACE
  }

  if (start === null || start === undefined) {
    start = PIPE + SPACE
  }

  if (end === null || end === undefined) {
    end = SPACE + PIPE
  }

  while (++rowIndex < rowLength) {
    row = table[rowIndex]

    index = -1

    if (row.length > cellCount) {
      cellCount = row.length
    }

    while (++index < cellCount) {
      position = row[index] ? dotindex(row[index]) : null

      if (!sizes[index]) {
        sizes[index] = MIN_CELL_SIZE
      }

      if (position > sizes[index]) {
        sizes[index] = position
      }
    }
  }

  if (typeof alignment === 'string') {
    alignment = pad(cellCount, alignment).split('')
  }

  /* Make sure only valid alignments are used. */
  index = -1

  while (++index < cellCount) {
    align = alignment[index]

    if (typeof align === 'string') {
      align = align.charAt(0).toLowerCase()
    }

    if (ALLIGNMENT.indexOf(align) === -1) {
      align = NULL
    }

    alignment[index] = align
  }

  rowIndex = -1
  rows = []

  while (++rowIndex < rowLength) {
    row = table[rowIndex]

    index = -1
    cells = []

    while (++index < cellCount) {
      value = row[index]

      value = stringify(value)

      if (alignment[index] === DOT) {
        position = dotindex(value)

        size =
          sizes[index] +
          (EXPRESSION_DOT.test(value) ? 0 : 1) -
          (calculateStringLength(value) - position)

        cells[index] = value + pad(size - 1)
      } else {
        cells[index] = value
      }
    }

    rows[rowIndex] = cells
  }

  sizes = []
  rowIndex = -1

  while (++rowIndex < rowLength) {
    cells = rows[rowIndex]

    index = -1

    while (++index < cellCount) {
      value = cells[index]

      if (!sizes[index]) {
        sizes[index] = MIN_CELL_SIZE
      }

      size = calculateStringLength(value)

      if (size > sizes[index]) {
        sizes[index] = size
      }
    }
  }

  rowIndex = -1

  while (++rowIndex < rowLength) {
    cells = rows[rowIndex]

    index = -1

    if (settings.pad !== false) {
      while (++index < cellCount) {
        value = cells[index]

        position = sizes[index] - (calculateStringLength(value) || 0)
        spacing = pad(position)

        if (alignment[index] === RIGHT || alignment[index] === DOT) {
          value = spacing + value
        } else if (alignment[index] === CENTER) {
          position /= 2

          if (position % 1 === 0) {
            before = position
            after = position
          } else {
            before = position + 0.5
            after = position - 0.5
          }

          value = pad(before) + value + pad(after)
        } else {
          value += spacing
        }

        cells[index] = value
      }
    }

    rows[rowIndex] = cells.join(delimiter)
  }

  if (settings.rule !== false) {
    index = -1
    rule = []

    while (++index < cellCount) {
      /* When `pad` is false, make the rule the same size as the first row. */
      if (settings.pad === false) {
        value = table[0][index]
        spacing = calculateStringLength(stringify(value))
        spacing = spacing > MIN_CELL_SIZE ? spacing : MIN_CELL_SIZE
      } else {
        spacing = sizes[index]
      }

      align = alignment[index]

      /* When `align` is left, don't add colons. */
      value = align === RIGHT || align === NULL ? DASH : COLON
      value += pad(spacing - 2, DASH)
      value += align !== LEFT && align !== NULL ? COLON : DASH

      rule[index] = value
    }

    rows.splice(1, 0, rule.join(delimiter))
  }

  return start + rows.join(end + NEW_LINE + start) + end
}

function stringify(value) {
  return value === null || value === undefined ? '' : String(value)
}

/* Get the length of `value`. */
function lengthNoop(value) {
  return String(value).length
}

/* Get a string consisting of `length` `character`s. */
function pad(length, character) {
  return new Array(length + 1).join(character || SPACE)
}

/* Get the position of the last dot in `value`. */
function dotindex(value) {
  var match = EXPRESSION_LAST_DOT.exec(value)

  return match ? match.index + 1 : value.length
}

},{}],97:[function(require,module,exports){
'use strict'

var visit = require('unist-util-visit')

module.exports = compact

/* Make an MDAST tree compact by merging adjacent text nodes. */
function compact(tree, commonmark) {
  visit(tree, visitor)

  return tree

  function visitor(child, index, parent) {
    var siblings = parent ? parent.children : []
    var prev = index && siblings[index - 1]

    if (
      prev &&
      child.type === prev.type &&
      mergeable(prev, commonmark) &&
      mergeable(child, commonmark)
    ) {
      if (child.value) {
        prev.value += child.value
      }

      if (child.children) {
        prev.children = prev.children.concat(child.children)
      }

      siblings.splice(index, 1)

      if (prev.position && child.position) {
        prev.position.end = child.position.end
      }

      return index
    }
  }
}

function mergeable(node, commonmark) {
  var start
  var end

  if (node.type === 'text') {
    if (!node.position) {
      return true
    }

    start = node.position.start
    end = node.position.end

    /* Only merge nodes which occupy the same size as their `value`. */
    return (
      start.line !== end.line || end.column - start.column === node.value.length
    )
  }

  return commonmark && node.type === 'blockquote'
}

},{"unist-util-visit":294}],98:[function(require,module,exports){
'use strict'

var visit = require('unist-util-visit')

module.exports = getDefinitionFactory

var own = {}.hasOwnProperty

/* Get a definition in `node` by `identifier`. */
function getDefinitionFactory(node, options) {
  return getterFactory(gather(node, options))
}

/* Gather all definitions in `node` */
function gather(node, options) {
  var cache = {}

  if (!node || !node.type) {
    throw new Error('mdast-util-definitions expected node')
  }

  visit(node, 'definition', options && options.commonmark ? commonmark : normal)

  return cache

  function commonmark(definition) {
    var id = normalise(definition.identifier)
    if (!own.call(cache, id)) {
      cache[id] = definition
    }
  }

  function normal(definition) {
    cache[normalise(definition.identifier)] = definition
  }
}

/* Factory to get a node from the given definition-cache. */
function getterFactory(cache) {
  return getter

  /* Get a node from the bound definition-cache. */
  function getter(identifier) {
    var id = identifier && normalise(identifier)
    return id && own.call(cache, id) ? cache[id] : null
  }
}

function normalise(identifier) {
  return identifier.toUpperCase()
}

},{"unist-util-visit":294}],99:[function(require,module,exports){
'use strict'

var is = require('unist-util-is')

module.exports = isPhrasing

var phrasing = [
  'inlineCode',
  'emphasis',
  'break',
  'strong',
  'delete',
  'link',
  'image',
  'footnote',
  'linkReference',
  'imageReference',
  'footnoteReference',
  'text'
]

/* Check if a node is a phrasing element */
function isPhrasing(node) {
  return is(phrasing, node)
}

},{"unist-util-is":288}],100:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"./lib":126,"dup":21}],101:[function(require,module,exports){
'use strict'

module.exports = all

var trim = require('trim')
var one = require('./one')

function all(h, parent) {
  var nodes = parent.children || []
  var length = nodes.length
  var values = []
  var index = -1
  var result
  var head

  while (++index < length) {
    result = one(h, nodes[index], parent)

    if (result) {
      if (index && nodes[index - 1].type === 'break') {
        if (result.value) {
          result.value = trim.left(result.value)
        }

        head = result.children && result.children[0]

        if (head && head.value) {
          head.value = trim.left(head.value)
        }
      }

      values = values.concat(result)
    }
  }

  return values
}

},{"./one":127,"trim":281}],102:[function(require,module,exports){
'use strict'

module.exports = generateFootnotes

var thematicBreak = require('./handlers/thematic-break')
var list = require('./handlers/list')
var wrap = require('./wrap')

function generateFootnotes(h) {
  var footnotes = h.footnotes
  var length = footnotes.length
  var index = -1
  var listItems = []
  var def
  var backReference
  var content
  var tail

  if (!length) {
    return null
  }

  while (++index < length) {
    def = footnotes[index]
    content = def.children.concat()
    tail = content[content.length - 1]
    backReference = {
      type: 'link',
      url: '#fnref-' + def.identifier,
      data: {hProperties: {className: ['footnote-backref']}},
      children: [{type: 'text', value: '↩'}]
    }

    if (!tail || tail.type !== 'paragraph') {
      tail = {type: 'paragraph', children: []}
      content.push(tail)
    }

    tail.children.push(backReference)

    listItems[index] = {
      type: 'listItem',
      data: {hProperties: {id: 'fn-' + def.identifier}},
      children: content,
      position: def.position
    }
  }

  return h(
    null,
    'div',
    {className: ['footnotes']},
    wrap(
      [
        thematicBreak(h),
        list(h, {type: 'list', ordered: true, children: listItems})
      ],
      true
    )
  )
}

},{"./handlers/list":119,"./handlers/thematic-break":125,"./wrap":129}],103:[function(require,module,exports){
'use strict'

module.exports = blockquote

var wrap = require('../wrap')
var all = require('../all')

function blockquote(h, node) {
  return h(node, 'blockquote', wrap(all(h, node), true))
}

},{"../all":101,"../wrap":129}],104:[function(require,module,exports){
'use strict'

module.exports = hardBreak

var u = require('unist-builder')

function hardBreak(h, node) {
  return [h(node, 'br'), u('text', '\n')]
}

},{"unist-builder":286}],105:[function(require,module,exports){
'use strict'

module.exports = code

var detab = require('detab')
var u = require('unist-builder')

function code(h, node) {
  var value = node.value ? detab(node.value + '\n') : ''
  var lang = node.lang && node.lang.match(/^[^ \t]+(?=[ \t]|$)/)
  var props = {}

  if (lang) {
    props.className = ['language-' + lang]
  }

  return h(node.position, 'pre', [h(node, 'code', props, [u('text', value)])])
}

},{"detab":13,"unist-builder":286}],106:[function(require,module,exports){
'use strict'

module.exports = strikethrough

var all = require('../all')

function strikethrough(h, node) {
  return h(node, 'del', all(h, node))
}

},{"../all":101}],107:[function(require,module,exports){
'use strict'

module.exports = emphasis

var all = require('../all')

function emphasis(h, node) {
  return h(node, 'em', all(h, node))
}

},{"../all":101}],108:[function(require,module,exports){
'use strict'

module.exports = footnoteReference

var u = require('unist-builder')

function footnoteReference(h, node) {
  var identifier = node.identifier

  return h(node.position, 'sup', {id: 'fnref-' + identifier}, [
    h(node, 'a', {href: '#fn-' + identifier, className: ['footnote-ref']}, [
      u('text', identifier)
    ])
  ])
}

},{"unist-builder":286}],109:[function(require,module,exports){
'use strict'

module.exports = footnote

var footnoteReference = require('./footnote-reference')

function footnote(h, node) {
  var identifiers = []
  var identifier = 1
  var footnotes = h.footnotes
  var length = footnotes.length
  var index = -1

  while (++index < length) {
    identifiers[index] = footnotes[index].identifier
  }

  while (identifiers.indexOf(String(identifier)) !== -1) {
    identifier++
  }

  identifier = String(identifier)

  footnotes.push({
    type: 'footnoteDefinition',
    identifier: identifier,
    children: [{type: 'paragraph', children: node.children}],
    position: node.position
  })

  return footnoteReference(h, {
    type: 'footnoteReference',
    identifier: identifier,
    position: node.position
  })
}

},{"./footnote-reference":108}],110:[function(require,module,exports){
'use strict'

module.exports = heading

var all = require('../all')

function heading(h, node) {
  return h(node, 'h' + node.depth, all(h, node))
}

},{"../all":101}],111:[function(require,module,exports){
'use strict'

module.exports = html

var u = require('unist-builder')

// Return either a `raw` node, in dangerous mode, or nothing.
function html(h, node) {
  return h.dangerous ? h.augment(node, u('raw', node.value)) : null
}

},{"unist-builder":286}],112:[function(require,module,exports){
'use strict'

module.exports = imageReference

var normalize = require('mdurl/encode')
var revert = require('../revert')

function imageReference(h, node) {
  var def = h.definition(node.identifier)
  var props

  if (!def) {
    return revert(h, node)
  }

  props = {src: normalize(def.url || ''), alt: node.alt}

  if (def.title !== null && def.title !== undefined) {
    props.title = def.title
  }

  return h(node, 'img', props)
}

},{"../revert":128,"mdurl/encode":131}],113:[function(require,module,exports){
'use strict'

var normalize = require('mdurl/encode')

module.exports = image

function image(h, node) {
  var props = {src: normalize(node.url), alt: node.alt}

  if (node.title !== null && node.title !== undefined) {
    props.title = node.title
  }

  return h(node, 'img', props)
}

},{"mdurl/encode":131}],114:[function(require,module,exports){
'use strict'

module.exports = {
  blockquote: require('./blockquote'),
  break: require('./break'),
  code: require('./code'),
  delete: require('./delete'),
  emphasis: require('./emphasis'),
  footnoteReference: require('./footnote-reference'),
  footnote: require('./footnote'),
  heading: require('./heading'),
  html: require('./html'),
  imageReference: require('./image-reference'),
  image: require('./image'),
  inlineCode: require('./inline-code'),
  linkReference: require('./link-reference'),
  link: require('./link'),
  listItem: require('./list-item'),
  list: require('./list'),
  paragraph: require('./paragraph'),
  root: require('./root'),
  strong: require('./strong'),
  table: require('./table'),
  text: require('./text'),
  thematicBreak: require('./thematic-break'),
  toml: ignore,
  yaml: ignore,
  definition: ignore,
  footnoteDefinition: ignore
}

// Return nothing for nodes which are ignored.
function ignore() {
  return null
}

},{"./blockquote":103,"./break":104,"./code":105,"./delete":106,"./emphasis":107,"./footnote":109,"./footnote-reference":108,"./heading":110,"./html":111,"./image":113,"./image-reference":112,"./inline-code":115,"./link":117,"./link-reference":116,"./list":119,"./list-item":118,"./paragraph":120,"./root":121,"./strong":122,"./table":123,"./text":124,"./thematic-break":125}],115:[function(require,module,exports){
'use strict'

module.exports = inlineCode

var collapse = require('collapse-white-space')
var u = require('unist-builder')

function inlineCode(h, node) {
  return h(node, 'code', [u('text', collapse(node.value))])
}

},{"collapse-white-space":11,"unist-builder":286}],116:[function(require,module,exports){
'use strict'

module.exports = linkReference

var normalize = require('mdurl/encode')
var revert = require('../revert')
var all = require('../all')

function linkReference(h, node) {
  var def = h.definition(node.identifier)
  var props

  if (!def) {
    return revert(h, node)
  }

  props = {href: normalize(def.url || '')}

  if (def.title !== null && def.title !== undefined) {
    props.title = def.title
  }

  return h(node, 'a', props, all(h, node))
}

},{"../all":101,"../revert":128,"mdurl/encode":131}],117:[function(require,module,exports){
'use strict'

var normalize = require('mdurl/encode')
var all = require('../all')

module.exports = link

function link(h, node) {
  var props = {href: normalize(node.url)}

  if (node.title !== null && node.title !== undefined) {
    props.title = node.title
  }

  return h(node, 'a', props, all(h, node))
}

},{"../all":101,"mdurl/encode":131}],118:[function(require,module,exports){
'use strict'

module.exports = listItem

var u = require('unist-builder')
var wrap = require('../wrap')
var all = require('../all')

function listItem(h, node, parent) {
  var children = node.children
  var head = children[0]
  var raw = all(h, node)
  var loose = parent ? listLoose(parent) : listItemLoose(node)
  var props = {}
  var result
  var container
  var index
  var length
  var child

  /* Tight lists should not render 'paragraph' nodes as 'p' tags */
  if (loose) {
    result = raw
  } else {
    result = []
    length = raw.length
    index = -1

    while (++index < length) {
      child = raw[index]

      if (child.tagName === 'p') {
        result = result.concat(child.children)
      } else {
        result.push(child)
      }
    }
  }

  if (typeof node.checked === 'boolean') {
    if (loose && (!head || head.type !== 'paragraph')) {
      result.unshift(h(null, 'p', []))
    }

    container = loose ? result[0].children : result

    if (container.length !== 0) {
      container.unshift(u('text', ' '))
    }

    container.unshift(
      h(null, 'input', {
        type: 'checkbox',
        checked: node.checked,
        disabled: true
      })
    )

    // According to github-markdown-css, this class hides bullet.
    props.className = ['task-list-item']
  }

  if (loose && result.length !== 0) {
    result = wrap(result, true)
  }

  return h(node, 'li', props, result)
}

function listLoose(node) {
  var loose = node.spread
  var children = node.children
  var length = children.length
  var index = -1

  while (!loose && ++index < length) {
    loose = listItemLoose(children[index])
  }

  return loose
}

function listItemLoose(node) {
  var spread = node.spread

  return spread === undefined || spread === null
    ? node.children.length > 1
    : spread
}

},{"../all":101,"../wrap":129,"unist-builder":286}],119:[function(require,module,exports){
'use strict'

module.exports = list

var wrap = require('../wrap')
var all = require('../all')

function list(h, node) {
  var props = {}
  var name = node.ordered ? 'ol' : 'ul'

  if (typeof node.start === 'number' && node.start !== 1) {
    props.start = node.start
  }

  return h(node, name, props, wrap(all(h, node), true))
}

},{"../all":101,"../wrap":129}],120:[function(require,module,exports){
'use strict'

module.exports = paragraph

var all = require('../all')

function paragraph(h, node) {
  return h(node, 'p', all(h, node))
}

},{"../all":101}],121:[function(require,module,exports){
'use strict'

module.exports = root

var u = require('unist-builder')
var wrap = require('../wrap')
var all = require('../all')

function root(h, node) {
  return h.augment(node, u('root', wrap(all(h, node))))
}

},{"../all":101,"../wrap":129,"unist-builder":286}],122:[function(require,module,exports){
arguments[4][63][0].apply(exports,arguments)
},{"../all":101,"dup":63}],123:[function(require,module,exports){
'use strict'

module.exports = table

var position = require('unist-util-position')
var wrap = require('../wrap')
var all = require('../all')

function table(h, node) {
  var rows = node.children
  var index = rows.length
  var align = node.align
  var alignLength = align.length
  var result = []
  var pos
  var row
  var out
  var name
  var cell

  while (index--) {
    row = rows[index].children
    name = index === 0 ? 'th' : 'td'
    pos = alignLength
    out = []

    while (pos--) {
      cell = row[pos]
      out[pos] = h(cell, name, {align: align[pos]}, cell ? all(h, cell) : [])
    }

    result[index] = h(rows[index], 'tr', wrap(out, true))
  }

  return h(
    node,
    'table',
    wrap(
      [
        h(result[0].position, 'thead', wrap([result[0]], true)),
        h(
          {
            start: position.start(result[1]),
            end: position.end(result[result.length - 1])
          },
          'tbody',
          wrap(result.slice(1), true)
        )
      ],
      true
    )
  )
}

},{"../all":101,"../wrap":129,"unist-util-position":290}],124:[function(require,module,exports){
'use strict'

module.exports = text

var u = require('unist-builder')
var trimLines = require('trim-lines')

function text(h, node) {
  return h.augment(node, u('text', trimLines(node.value)))
}

},{"trim-lines":279,"unist-builder":286}],125:[function(require,module,exports){
'use strict'

module.exports = thematicBreak

function thematicBreak(h, node) {
  return h(node, 'hr')
}

},{}],126:[function(require,module,exports){
'use strict'

module.exports = toHast

var xtend = require('xtend')
var u = require('unist-builder')
var visit = require('unist-util-visit')
var position = require('unist-util-position')
var generated = require('unist-util-generated')
var definitions = require('mdast-util-definitions')
var one = require('./one')
var footer = require('./footer')
var handlers = require('./handlers')

// Factory to transform.
function factory(tree, options) {
  var settings = options || {}
  var dangerous = settings.allowDangerousHTML

  h.dangerous = dangerous
  h.definition = definitions(tree, settings)
  h.footnotes = []
  h.augment = augment
  h.handlers = xtend(handlers, settings.handlers || {})

  visit(tree, 'footnoteDefinition', visitor)

  return h

  // Finalise the created `right`, a hast node, from `left`, an mdast node.
  function augment(left, right) {
    var data
    var ctx

    // Handle `data.hName`, `data.hProperties, `hChildren`.
    if (left && 'data' in left) {
      data = left.data

      if (right.type === 'element' && data.hName) {
        right.tagName = data.hName
      }

      if (right.type === 'element' && data.hProperties) {
        right.properties = xtend(right.properties, data.hProperties)
      }

      if (right.children && data.hChildren) {
        right.children = data.hChildren
      }
    }

    ctx = left && left.position ? left : {position: left}

    if (!generated(ctx)) {
      right.position = {
        start: position.start(ctx),
        end: position.end(ctx)
      }
    }

    return right
  }

  // Create an element for a `node`.
  function h(node, tagName, props, children) {
    if (
      (children === undefined || children === null) &&
      typeof props === 'object' &&
      'length' in props
    ) {
      children = props
      props = {}
    }

    return augment(node, {
      type: 'element',
      tagName: tagName,
      properties: props || {},
      children: children || []
    })
  }

  function visitor(definition) {
    h.footnotes.push(definition)
  }
}

// Transform `tree`, which is an mdast node, to a hast node.
function toHast(tree, options) {
  var h = factory(tree, options)
  var node = one(h, tree)
  var footnotes = footer(h)

  if (node && node.children && footnotes) {
    node.children = node.children.concat(u('text', '\n'), footnotes)
  }

  return node
}

},{"./footer":102,"./handlers":114,"./one":127,"mdast-util-definitions":98,"unist-builder":286,"unist-util-generated":287,"unist-util-position":290,"unist-util-visit":294,"xtend":301}],127:[function(require,module,exports){
'use strict'

module.exports = one

var u = require('unist-builder')
var all = require('./all')

var own = {}.hasOwnProperty

// Transform an unknown node.
function unknown(h, node) {
  if (text(node)) {
    return h.augment(node, u('text', node.value))
  }

  return h(node, 'div', all(h, node))
}

// Visit a node.
function one(h, node, parent) {
  var type = node && node.type
  var fn = own.call(h.handlers, type) ? h.handlers[type] : null

  // Fail on non-nodes.
  if (!type) {
    throw new Error('Expected node, got `' + node + '`')
  }

  return (typeof fn === 'function' ? fn : unknown)(h, node, parent)
}

// Check if the node should be renderered a text node.
function text(node) {
  var data = node.data || {}

  if (
    own.call(data, 'hName') ||
    own.call(data, 'hProperties') ||
    own.call(data, 'hChildren')
  ) {
    return false
  }

  return 'value' in node
}

},{"./all":101,"unist-builder":286}],128:[function(require,module,exports){
'use strict'

module.exports = revert

var u = require('unist-builder')
var all = require('./all')

// Return the content of a reference without definition as markdown.
function revert(h, node) {
  var subtype = node.referenceType
  var suffix = ']'
  var contents
  var head
  var tail

  if (subtype === 'collapsed') {
    suffix += '[]'
  } else if (subtype === 'full') {
    suffix += '[' + (node.label || node.identifier) + ']'
  }

  if (node.type === 'imageReference') {
    return u('text', '![' + node.alt + suffix)
  }

  contents = all(h, node)
  head = contents[0]

  if (head && head.type === 'text') {
    head.value = '[' + head.value
  } else {
    contents.unshift(u('text', '['))
  }

  tail = contents[contents.length - 1]

  if (tail && tail.type === 'text') {
    tail.value += suffix
  } else {
    contents.push(u('text', suffix))
  }

  return contents
}

},{"./all":101,"unist-builder":286}],129:[function(require,module,exports){
'use strict'

module.exports = wrap

var u = require('unist-builder')

// Wrap `nodes` with newlines between each entry.  Optionally adds newlines at
// the start and end.
function wrap(nodes, loose) {
  var result = []
  var index = -1
  var length = nodes.length

  if (loose) {
    result.push(u('text', '\n'))
  }

  while (++index < length) {
    if (index) {
      result.push(u('text', '\n'))
    }

    result.push(nodes[index])
  }

  if (loose && nodes.length !== 0) {
    result.push(u('text', '\n'))
  }

  return result
}

},{"unist-builder":286}],130:[function(require,module,exports){
'use strict'

module.exports = toString

/* Get the text content of a node.  If the node itself
 * does not expose plain-text fields, `toString` will
 * recursivly try its children. */
function toString(node) {
  return (
    valueOf(node) ||
    (node.children && node.children.map(toString).join('')) ||
    ''
  )
}

/* Get the value of `node`.  Checks, `value`,
 * `alt`, and `title`, in that order. */
function valueOf(node) {
  return (
    (node && node.value ? node.value : node.alt ? node.alt : node.title) || ''
  )
}

},{}],131:[function(require,module,exports){

'use strict';


var encodeCache = {};


// Create a lookup array where anything but characters in `chars` string
// and alphanumeric chars is percent-encoded.
//
function getEncodeCache(exclude) {
  var i, ch, cache = encodeCache[exclude];
  if (cache) { return cache; }

  cache = encodeCache[exclude] = [];

  for (i = 0; i < 128; i++) {
    ch = String.fromCharCode(i);

    if (/^[0-9a-z]$/i.test(ch)) {
      // always allow unencoded alphanumeric characters
      cache.push(ch);
    } else {
      cache.push('%' + ('0' + i.toString(16).toUpperCase()).slice(-2));
    }
  }

  for (i = 0; i < exclude.length; i++) {
    cache[exclude.charCodeAt(i)] = exclude[i];
  }

  return cache;
}


// Encode unsafe characters with percent-encoding, skipping already
// encoded sequences.
//
//  - string       - string to encode
//  - exclude      - list of characters to ignore (in addition to a-zA-Z0-9)
//  - keepEscaped  - don't encode '%' in a correct escape sequence (default: true)
//
function encode(string, exclude, keepEscaped) {
  var i, l, code, nextCode, cache,
      result = '';

  if (typeof exclude !== 'string') {
    // encode(string, keepEscaped)
    keepEscaped  = exclude;
    exclude = encode.defaultChars;
  }

  if (typeof keepEscaped === 'undefined') {
    keepEscaped = true;
  }

  cache = getEncodeCache(exclude);

  for (i = 0, l = string.length; i < l; i++) {
    code = string.charCodeAt(i);

    if (keepEscaped && code === 0x25 /* % */ && i + 2 < l) {
      if (/^[0-9a-f]{2}$/i.test(string.slice(i + 1, i + 3))) {
        result += string.slice(i, i + 3);
        i += 2;
        continue;
      }
    }

    if (code < 128) {
      result += cache[code];
      continue;
    }

    if (code >= 0xD800 && code <= 0xDFFF) {
      if (code >= 0xD800 && code <= 0xDBFF && i + 1 < l) {
        nextCode = string.charCodeAt(i + 1);
        if (nextCode >= 0xDC00 && nextCode <= 0xDFFF) {
          result += encodeURIComponent(string[i] + string[i + 1]);
          i++;
          continue;
        }
      }
      result += '%EF%BF%BD';
      continue;
    }

    result += encodeURIComponent(string[i]);
  }

  return result;
}

encode.defaultChars   = ";/?:@&=+$,-_.!~*'()#";
encode.componentChars = "-_.!~*'()";


module.exports = encode;

},{}],132:[function(require,module,exports){
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/

'use strict';
/* eslint-disable no-unused-vars */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (getOwnPropertySymbols) {
			symbols = getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

},{}],133:[function(require,module,exports){
'use strict'

/* eslint-env browser */

var el

module.exports = decodeEntity

function decodeEntity(characters) {
  var entity = '&' + characters + ';'
  var char

  el = el || document.createElement('i')
  el.innerHTML = entity
  char = el.textContent

  // Some entities do not require the closing semicolon (&not - for instance),
  // which leads to situations where parsing the assumed entity of &notit; will
  // result in the string `¬it;`.  When we encounter a trailing semicolon after
  // parsing and the entity to decode was not a semicolon (&semi;), we can
  // assume that the matching was incomplete
  if (char.slice(-1) === ';' && characters !== 'semi') {
    return false
  }

  // If the decoded string is equal to the input, the entity was not valid
  return char === entity ? false : char
}

},{}],134:[function(require,module,exports){
'use strict'

var legacy = require('character-entities-legacy')
var invalid = require('character-reference-invalid')
var decimal = require('is-decimal')
var hexadecimal = require('is-hexadecimal')
var alphanumerical = require('is-alphanumerical')
var decodeEntity = require('./decode-entity')

module.exports = parseEntities

var own = {}.hasOwnProperty
var fromCharCode = String.fromCharCode
var noop = Function.prototype

/* Default settings. */
var defaults = {
  warning: null,
  reference: null,
  text: null,
  warningContext: null,
  referenceContext: null,
  textContext: null,
  position: {},
  additional: null,
  attribute: false,
  nonTerminated: true
}

/* Reference types. */
var NAMED = 'named'
var HEXADECIMAL = 'hexadecimal'
var DECIMAL = 'decimal'

/* Map of bases. */
var BASE = {}

BASE[HEXADECIMAL] = 16
BASE[DECIMAL] = 10

/* Map of types to tests. Each type of character reference
 * accepts different characters. This test is used to
 * detect whether a reference has ended (as the semicolon
 * is not strictly needed). */
var TESTS = {}

TESTS[NAMED] = alphanumerical
TESTS[DECIMAL] = decimal
TESTS[HEXADECIMAL] = hexadecimal

/* Warning messages. */
var NAMED_NOT_TERMINATED = 1
var NUMERIC_NOT_TERMINATED = 2
var NAMED_EMPTY = 3
var NUMERIC_EMPTY = 4
var NAMED_UNKNOWN = 5
var NUMERIC_DISALLOWED = 6
var NUMERIC_PROHIBITED = 7

var MESSAGES = {}

MESSAGES[NAMED_NOT_TERMINATED] =
  'Named character references must be terminated by a semicolon'
MESSAGES[NUMERIC_NOT_TERMINATED] =
  'Numeric character references must be terminated by a semicolon'
MESSAGES[NAMED_EMPTY] = 'Named character references cannot be empty'
MESSAGES[NUMERIC_EMPTY] = 'Numeric character references cannot be empty'
MESSAGES[NAMED_UNKNOWN] = 'Named character references must be known'
MESSAGES[NUMERIC_DISALLOWED] =
  'Numeric character references cannot be disallowed'
MESSAGES[NUMERIC_PROHIBITED] =
  'Numeric character references cannot be outside the permissible Unicode range'

/* Wrap to ensure clean parameters are given to `parse`. */
function parseEntities(value, options) {
  var settings = {}
  var option
  var key

  if (!options) {
    options = {}
  }

  for (key in defaults) {
    option = options[key]
    settings[key] =
      option === null || option === undefined ? defaults[key] : option
  }

  if (settings.position.indent || settings.position.start) {
    settings.indent = settings.position.indent || []
    settings.position = settings.position.start
  }

  return parse(value, settings)
}

/* Parse entities. */
function parse(value, settings) {
  var additional = settings.additional
  var nonTerminated = settings.nonTerminated
  var handleText = settings.text
  var handleReference = settings.reference
  var handleWarning = settings.warning
  var textContext = settings.textContext
  var referenceContext = settings.referenceContext
  var warningContext = settings.warningContext
  var pos = settings.position
  var indent = settings.indent || []
  var length = value.length
  var index = 0
  var lines = -1
  var column = pos.column || 1
  var line = pos.line || 1
  var queue = ''
  var result = []
  var entityCharacters
  var namedEntity
  var terminated
  var characters
  var character
  var reference
  var following
  var warning
  var reason
  var output
  var entity
  var begin
  var start
  var type
  var test
  var prev
  var next
  var diff
  var end

  /* Cache the current point. */
  prev = now()

  /* Wrap `handleWarning`. */
  warning = handleWarning ? parseError : noop

  /* Ensure the algorithm walks over the first character
   * and the end (inclusive). */
  index--
  length++

  while (++index < length) {
    /* If the previous character was a newline. */
    if (character === '\n') {
      column = indent[lines] || 1
    }

    character = at(index)

    /* Handle anything other than an ampersand,
     * including newlines and EOF. */
    if (character !== '&') {
      if (character === '\n') {
        line++
        lines++
        column = 0
      }

      if (character) {
        queue += character
        column++
      } else {
        flush()
      }
    } else {
      following = at(index + 1)

      /* The behaviour depends on the identity of the next
       * character. */
      if (
        following === '\t' /* Tab */ ||
        following === '\n' /* Newline */ ||
        following === '\f' /* Form feed */ ||
        following === ' ' /* Space */ ||
        following === '<' /* Less-than */ ||
        following === '&' /* Ampersand */ ||
        following === '' ||
        (additional && following === additional)
      ) {
        /* Not a character reference. No characters
         * are consumed, and nothing is returned.
         * This is not an error, either. */
        queue += character
        column++

        continue
      }

      start = index + 1
      begin = start
      end = start

      /* Numerical entity. */
      if (following !== '#') {
        type = NAMED
      } else {
        end = ++begin

        /* The behaviour further depends on the
         * character after the U+0023 NUMBER SIGN. */
        following = at(end)

        if (following === 'x' || following === 'X') {
          /* ASCII hex digits. */
          type = HEXADECIMAL
          end = ++begin
        } else {
          /* ASCII digits. */
          type = DECIMAL
        }
      }

      entityCharacters = ''
      entity = ''
      characters = ''
      test = TESTS[type]
      end--

      while (++end < length) {
        following = at(end)

        if (!test(following)) {
          break
        }

        characters += following

        /* Check if we can match a legacy named
         * reference.  If so, we cache that as the
         * last viable named reference.  This
         * ensures we do not need to walk backwards
         * later. */
        if (type === NAMED && own.call(legacy, characters)) {
          entityCharacters = characters
          entity = legacy[characters]
        }
      }

      terminated = at(end) === ';'

      if (terminated) {
        end++

        namedEntity = type === NAMED ? decodeEntity(characters) : false

        if (namedEntity) {
          entityCharacters = characters
          entity = namedEntity
        }
      }

      diff = 1 + end - start

      if (!terminated && !nonTerminated) {
        /* Empty. */
      } else if (!characters) {
        /* An empty (possible) entity is valid, unless
         * its numeric (thus an ampersand followed by
         * an octothorp). */
        if (type !== NAMED) {
          warning(NUMERIC_EMPTY, diff)
        }
      } else if (type === NAMED) {
        /* An ampersand followed by anything
         * unknown, and not terminated, is invalid. */
        if (terminated && !entity) {
          warning(NAMED_UNKNOWN, 1)
        } else {
          /* If theres something after an entity
           * name which is not known, cap the
           * reference. */
          if (entityCharacters !== characters) {
            end = begin + entityCharacters.length
            diff = 1 + end - begin
            terminated = false
          }

          /* If the reference is not terminated,
           * warn. */
          if (!terminated) {
            reason = entityCharacters ? NAMED_NOT_TERMINATED : NAMED_EMPTY

            if (!settings.attribute) {
              warning(reason, diff)
            } else {
              following = at(end)

              if (following === '=') {
                warning(reason, diff)
                entity = null
              } else if (alphanumerical(following)) {
                entity = null
              } else {
                warning(reason, diff)
              }
            }
          }
        }

        reference = entity
      } else {
        if (!terminated) {
          /* All non-terminated numeric entities are
           * not rendered, and trigger a warning. */
          warning(NUMERIC_NOT_TERMINATED, diff)
        }

        /* When terminated and number, parse as
         * either hexadecimal or decimal. */
        reference = parseInt(characters, BASE[type])

        /* Trigger a warning when the parsed number
         * is prohibited, and replace with
         * replacement character. */
        if (prohibited(reference)) {
          warning(NUMERIC_PROHIBITED, diff)
          reference = '\uFFFD'
        } else if (reference in invalid) {
          /* Trigger a warning when the parsed number
           * is disallowed, and replace by an
           * alternative. */
          warning(NUMERIC_DISALLOWED, diff)
          reference = invalid[reference]
        } else {
          /* Parse the number. */
          output = ''

          /* Trigger a warning when the parsed
           * number should not be used. */
          if (disallowed(reference)) {
            warning(NUMERIC_DISALLOWED, diff)
          }

          /* Stringify the number. */
          if (reference > 0xffff) {
            reference -= 0x10000
            output += fromCharCode((reference >>> (10 & 0x3ff)) | 0xd800)
            reference = 0xdc00 | (reference & 0x3ff)
          }

          reference = output + fromCharCode(reference)
        }
      }

      /* If we could not find a reference, queue the
       * checked characters (as normal characters),
       * and move the pointer to their end. This is
       * possible because we can be certain neither
       * newlines nor ampersands are included. */
      if (!reference) {
        characters = value.slice(start - 1, end)
        queue += characters
        column += characters.length
        index = end - 1
      } else {
        /* Found it! First eat the queued
         * characters as normal text, then eat
         * an entity. */
        flush()

        prev = now()
        index = end - 1
        column += end - start + 1
        result.push(reference)
        next = now()
        next.offset++

        if (handleReference) {
          handleReference.call(
            referenceContext,
            reference,
            {start: prev, end: next},
            value.slice(start - 1, end)
          )
        }

        prev = next
      }
    }
  }

  /* Return the reduced nodes, and any possible warnings. */
  return result.join('')

  /* Get current position. */
  function now() {
    return {
      line: line,
      column: column,
      offset: index + (pos.offset || 0)
    }
  }

  /* “Throw” a parse-error: a warning. */
  function parseError(code, offset) {
    var position = now()

    position.column += offset
    position.offset += offset

    handleWarning.call(warningContext, MESSAGES[code], position, code)
  }

  /* Get character at position. */
  function at(position) {
    return value.charAt(position)
  }

  /* Flush `queue` (normal text). Macro invoked before
   * each entity and at the end of `value`.
   * Does nothing when `queue` is empty. */
  function flush() {
    if (queue) {
      result.push(queue)

      if (handleText) {
        handleText.call(textContext, queue, {start: prev, end: now()})
      }

      queue = ''
    }
  }
}

/* Check if `character` is outside the permissible unicode range. */
function prohibited(code) {
  return (code >= 0xd800 && code <= 0xdfff) || code > 0x10ffff
}

/* Check if `character` is disallowed. */
function disallowed(code) {
  return (
    (code >= 0x0001 && code <= 0x0008) ||
    code === 0x000b ||
    (code >= 0x000d && code <= 0x001f) ||
    (code >= 0x007f && code <= 0x009f) ||
    (code >= 0xfdd0 && code <= 0xfdef) ||
    (code & 0xffff) === 0xffff ||
    (code & 0xffff) === 0xfffe
  )
}

},{"./decode-entity":133,"character-entities-legacy":9,"character-reference-invalid":10,"is-alphanumerical":87,"is-decimal":89,"is-hexadecimal":90}],135:[function(require,module,exports){
'use strict';

const { DOCUMENT_MODE } = require('./html');

//Const
const VALID_DOCTYPE_NAME = 'html';
const VALID_SYSTEM_ID = 'about:legacy-compat';
const QUIRKS_MODE_SYSTEM_ID = 'http://www.ibm.com/data/dtd/v11/ibmxhtml1-transitional.dtd';

const QUIRKS_MODE_PUBLIC_ID_PREFIXES = [
    '+//silmaril//dtd html pro v0r11 19970101//en',
    '-//advasoft ltd//dtd html 3.0 aswedit + extensions//en',
    '-//as//dtd html 3.0 aswedit + extensions//en',
    '-//ietf//dtd html 2.0 level 1//en',
    '-//ietf//dtd html 2.0 level 2//en',
    '-//ietf//dtd html 2.0 strict level 1//en',
    '-//ietf//dtd html 2.0 strict level 2//en',
    '-//ietf//dtd html 2.0 strict//en',
    '-//ietf//dtd html 2.0//en',
    '-//ietf//dtd html 2.1e//en',
    '-//ietf//dtd html 3.0//en',
    '-//ietf//dtd html 3.0//en//',
    '-//ietf//dtd html 3.2 final//en',
    '-//ietf//dtd html 3.2//en',
    '-//ietf//dtd html 3//en',
    '-//ietf//dtd html level 0//en',
    '-//ietf//dtd html level 0//en//2.0',
    '-//ietf//dtd html level 1//en',
    '-//ietf//dtd html level 1//en//2.0',
    '-//ietf//dtd html level 2//en',
    '-//ietf//dtd html level 2//en//2.0',
    '-//ietf//dtd html level 3//en',
    '-//ietf//dtd html level 3//en//3.0',
    '-//ietf//dtd html strict level 0//en',
    '-//ietf//dtd html strict level 0//en//2.0',
    '-//ietf//dtd html strict level 1//en',
    '-//ietf//dtd html strict level 1//en//2.0',
    '-//ietf//dtd html strict level 2//en',
    '-//ietf//dtd html strict level 2//en//2.0',
    '-//ietf//dtd html strict level 3//en',
    '-//ietf//dtd html strict level 3//en//3.0',
    '-//ietf//dtd html strict//en',
    '-//ietf//dtd html strict//en//2.0',
    '-//ietf//dtd html strict//en//3.0',
    '-//ietf//dtd html//en',
    '-//ietf//dtd html//en//2.0',
    '-//ietf//dtd html//en//3.0',
    '-//metrius//dtd metrius presentational//en',
    '-//microsoft//dtd internet explorer 2.0 html strict//en',
    '-//microsoft//dtd internet explorer 2.0 html//en',
    '-//microsoft//dtd internet explorer 2.0 tables//en',
    '-//microsoft//dtd internet explorer 3.0 html strict//en',
    '-//microsoft//dtd internet explorer 3.0 html//en',
    '-//microsoft//dtd internet explorer 3.0 tables//en',
    '-//netscape comm. corp.//dtd html//en',
    '-//netscape comm. corp.//dtd strict html//en',
    "-//o'reilly and associates//dtd html 2.0//en",
    "-//o'reilly and associates//dtd html extended 1.0//en",
    '-//spyglass//dtd html 2.0 extended//en',
    '-//sq//dtd html 2.0 hotmetal + extensions//en',
    '-//sun microsystems corp.//dtd hotjava html//en',
    '-//sun microsystems corp.//dtd hotjava strict html//en',
    '-//w3c//dtd html 3 1995-03-24//en',
    '-//w3c//dtd html 3.2 draft//en',
    '-//w3c//dtd html 3.2 final//en',
    '-//w3c//dtd html 3.2//en',
    '-//w3c//dtd html 3.2s draft//en',
    '-//w3c//dtd html 4.0 frameset//en',
    '-//w3c//dtd html 4.0 transitional//en',
    '-//w3c//dtd html experimental 19960712//en',
    '-//w3c//dtd html experimental 970421//en',
    '-//w3c//dtd w3 html//en',
    '-//w3o//dtd w3 html 3.0//en',
    '-//w3o//dtd w3 html 3.0//en//',
    '-//webtechs//dtd mozilla html 2.0//en',
    '-//webtechs//dtd mozilla html//en'
];

const QUIRKS_MODE_NO_SYSTEM_ID_PUBLIC_ID_PREFIXES = QUIRKS_MODE_PUBLIC_ID_PREFIXES.concat([
    '-//w3c//dtd html 4.01 frameset//',
    '-//w3c//dtd html 4.01 transitional//'
]);

const QUIRKS_MODE_PUBLIC_IDS = ['-//w3o//dtd w3 html strict 3.0//en//', '-/w3c/dtd html 4.0 transitional/en', 'html'];
const LIMITED_QUIRKS_PUBLIC_ID_PREFIXES = ['-//W3C//DTD XHTML 1.0 Frameset//', '-//W3C//DTD XHTML 1.0 Transitional//'];

const LIMITED_QUIRKS_WITH_SYSTEM_ID_PUBLIC_ID_PREFIXES = LIMITED_QUIRKS_PUBLIC_ID_PREFIXES.concat([
    '-//W3C//DTD HTML 4.01 Frameset//',
    '-//W3C//DTD HTML 4.01 Transitional//'
]);

//Utils
function enquoteDoctypeId(id) {
    const quote = id.indexOf('"') !== -1 ? "'" : '"';

    return quote + id + quote;
}

function hasPrefix(publicId, prefixes) {
    for (let i = 0; i < prefixes.length; i++) {
        if (publicId.indexOf(prefixes[i]) === 0) {
            return true;
        }
    }

    return false;
}

//API
exports.isConforming = function(token) {
    return (
        token.name === VALID_DOCTYPE_NAME &&
        token.publicId === null &&
        (token.systemId === null || token.systemId === VALID_SYSTEM_ID)
    );
};

exports.getDocumentMode = function(token) {
    if (token.name !== VALID_DOCTYPE_NAME) {
        return DOCUMENT_MODE.QUIRKS;
    }

    const systemId = token.systemId;

    if (systemId && systemId.toLowerCase() === QUIRKS_MODE_SYSTEM_ID) {
        return DOCUMENT_MODE.QUIRKS;
    }

    let publicId = token.publicId;

    if (publicId !== null) {
        publicId = publicId.toLowerCase();

        if (QUIRKS_MODE_PUBLIC_IDS.indexOf(publicId) > -1) {
            return DOCUMENT_MODE.QUIRKS;
        }

        let prefixes = systemId === null ? QUIRKS_MODE_NO_SYSTEM_ID_PUBLIC_ID_PREFIXES : QUIRKS_MODE_PUBLIC_ID_PREFIXES;

        if (hasPrefix(publicId, prefixes)) {
            return DOCUMENT_MODE.QUIRKS;
        }

        prefixes =
            systemId === null ? LIMITED_QUIRKS_PUBLIC_ID_PREFIXES : LIMITED_QUIRKS_WITH_SYSTEM_ID_PUBLIC_ID_PREFIXES;

        if (hasPrefix(publicId, prefixes)) {
            return DOCUMENT_MODE.LIMITED_QUIRKS;
        }
    }

    return DOCUMENT_MODE.NO_QUIRKS;
};

exports.serializeContent = function(name, publicId, systemId) {
    let str = '!DOCTYPE ';

    if (name) {
        str += name;
    }

    if (publicId) {
        str += ' PUBLIC ' + enquoteDoctypeId(publicId);
    } else if (systemId) {
        str += ' SYSTEM';
    }

    if (systemId !== null) {
        str += ' ' + enquoteDoctypeId(systemId);
    }

    return str;
};

},{"./html":138}],136:[function(require,module,exports){
'use strict';

module.exports = {
    controlCharacterInInputStream: 'control-character-in-input-stream',
    noncharacterInInputStream: 'noncharacter-in-input-stream',
    surrogateInInputStream: 'surrogate-in-input-stream',
    nonVoidHtmlElementStartTagWithTrailingSolidus: 'non-void-html-element-start-tag-with-trailing-solidus',
    endTagWithAttributes: 'end-tag-with-attributes',
    endTagWithTrailingSolidus: 'end-tag-with-trailing-solidus',
    unexpectedSolidusInTag: 'unexpected-solidus-in-tag',
    unexpectedNullCharacter: 'unexpected-null-character',
    unexpectedQuestionMarkInsteadOfTagName: 'unexpected-question-mark-instead-of-tag-name',
    invalidFirstCharacterOfTagName: 'invalid-first-character-of-tag-name',
    unexpectedEqualsSignBeforeAttributeName: 'unexpected-equals-sign-before-attribute-name',
    missingEndTagName: 'missing-end-tag-name',
    unexpectedCharacterInAttributeName: 'unexpected-character-in-attribute-name',
    unknownNamedCharacterReference: 'unknown-named-character-reference',
    missingSemicolonAfterCharacterReference: 'missing-semicolon-after-character-reference',
    unexpectedCharacterAfterDoctypeSystemIdentifier: 'unexpected-character-after-doctype-system-identifier',
    unexpectedCharacterInUnquotedAttributeValue: 'unexpected-character-in-unquoted-attribute-value',
    eofBeforeTagName: 'eof-before-tag-name',
    eofInTag: 'eof-in-tag',
    missingAttributeValue: 'missing-attribute-value',
    missingWhitespaceBetweenAttributes: 'missing-whitespace-between-attributes',
    missingWhitespaceAfterDoctypePublicKeyword: 'missing-whitespace-after-doctype-public-keyword',
    missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers:
        'missing-whitespace-between-doctype-public-and-system-identifiers',
    missingWhitespaceAfterDoctypeSystemKeyword: 'missing-whitespace-after-doctype-system-keyword',
    missingQuoteBeforeDoctypePublicIdentifier: 'missing-quote-before-doctype-public-identifier',
    missingQuoteBeforeDoctypeSystemIdentifier: 'missing-quote-before-doctype-system-identifier',
    missingDoctypePublicIdentifier: 'missing-doctype-public-identifier',
    missingDoctypeSystemIdentifier: 'missing-doctype-system-identifier',
    abruptDoctypePublicIdentifier: 'abrupt-doctype-public-identifier',
    abruptDoctypeSystemIdentifier: 'abrupt-doctype-system-identifier',
    cdataInHtmlContent: 'cdata-in-html-content',
    incorrectlyOpenedComment: 'incorrectly-opened-comment',
    eofInScriptHtmlCommentLikeText: 'eof-in-script-html-comment-like-text',
    eofInDoctype: 'eof-in-doctype',
    nestedComment: 'nested-comment',
    abruptClosingOfEmptyComment: 'abrupt-closing-of-empty-comment',
    eofInComment: 'eof-in-comment',
    incorrectlyClosedComment: 'incorrectly-closed-comment',
    eofInCdata: 'eof-in-cdata',
    absenceOfDigitsInNumericCharacterReference: 'absence-of-digits-in-numeric-character-reference',
    nullCharacterReference: 'null-character-reference',
    surrogateCharacterReference: 'surrogate-character-reference',
    characterReferenceOutsideUnicodeRange: 'character-reference-outside-unicode-range',
    controlCharacterReference: 'control-character-reference',
    noncharacterCharacterReference: 'noncharacter-character-reference',
    missingWhitespaceBeforeDoctypeName: 'missing-whitespace-before-doctype-name',
    missingDoctypeName: 'missing-doctype-name',
    invalidCharacterSequenceAfterDoctypeName: 'invalid-character-sequence-after-doctype-name',
    duplicateAttribute: 'duplicate-attribute',
    nonConformingDoctype: 'non-conforming-doctype',
    missingDoctype: 'missing-doctype',
    misplacedDoctype: 'misplaced-doctype',
    endTagWithoutMatchingOpenElement: 'end-tag-without-matching-open-element',
    closingOfElementWithOpenChildElements: 'closing-of-element-with-open-child-elements',
    disallowedContentInNoscriptInHead: 'disallowed-content-in-noscript-in-head',
    openElementsLeftAfterEof: 'open-elements-left-after-eof',
    abandonedHeadElementChild: 'abandoned-head-element-child',
    misplacedStartTagForHeadElement: 'misplaced-start-tag-for-head-element',
    nestedNoscriptInHead: 'nested-noscript-in-head',
    eofInElementThatCanContainOnlyText: 'eof-in-element-that-can-contain-only-text'
};

},{}],137:[function(require,module,exports){
'use strict';

const Tokenizer = require('../tokenizer');
const HTML = require('./html');

//Aliases
const $ = HTML.TAG_NAMES;
const NS = HTML.NAMESPACES;
const ATTRS = HTML.ATTRS;

//MIME types
const MIME_TYPES = {
    TEXT_HTML: 'text/html',
    APPLICATION_XML: 'application/xhtml+xml'
};

//Attributes
const DEFINITION_URL_ATTR = 'definitionurl';
const ADJUSTED_DEFINITION_URL_ATTR = 'definitionURL';
const SVG_ATTRS_ADJUSTMENT_MAP = {
    attributename: 'attributeName',
    attributetype: 'attributeType',
    basefrequency: 'baseFrequency',
    baseprofile: 'baseProfile',
    calcmode: 'calcMode',
    clippathunits: 'clipPathUnits',
    diffuseconstant: 'diffuseConstant',
    edgemode: 'edgeMode',
    filterunits: 'filterUnits',
    glyphref: 'glyphRef',
    gradienttransform: 'gradientTransform',
    gradientunits: 'gradientUnits',
    kernelmatrix: 'kernelMatrix',
    kernelunitlength: 'kernelUnitLength',
    keypoints: 'keyPoints',
    keysplines: 'keySplines',
    keytimes: 'keyTimes',
    lengthadjust: 'lengthAdjust',
    limitingconeangle: 'limitingConeAngle',
    markerheight: 'markerHeight',
    markerunits: 'markerUnits',
    markerwidth: 'markerWidth',
    maskcontentunits: 'maskContentUnits',
    maskunits: 'maskUnits',
    numoctaves: 'numOctaves',
    pathlength: 'pathLength',
    patterncontentunits: 'patternContentUnits',
    patterntransform: 'patternTransform',
    patternunits: 'patternUnits',
    pointsatx: 'pointsAtX',
    pointsaty: 'pointsAtY',
    pointsatz: 'pointsAtZ',
    preservealpha: 'preserveAlpha',
    preserveaspectratio: 'preserveAspectRatio',
    primitiveunits: 'primitiveUnits',
    refx: 'refX',
    refy: 'refY',
    repeatcount: 'repeatCount',
    repeatdur: 'repeatDur',
    requiredextensions: 'requiredExtensions',
    requiredfeatures: 'requiredFeatures',
    specularconstant: 'specularConstant',
    specularexponent: 'specularExponent',
    spreadmethod: 'spreadMethod',
    startoffset: 'startOffset',
    stddeviation: 'stdDeviation',
    stitchtiles: 'stitchTiles',
    surfacescale: 'surfaceScale',
    systemlanguage: 'systemLanguage',
    tablevalues: 'tableValues',
    targetx: 'targetX',
    targety: 'targetY',
    textlength: 'textLength',
    viewbox: 'viewBox',
    viewtarget: 'viewTarget',
    xchannelselector: 'xChannelSelector',
    ychannelselector: 'yChannelSelector',
    zoomandpan: 'zoomAndPan'
};

const XML_ATTRS_ADJUSTMENT_MAP = {
    'xlink:actuate': { prefix: 'xlink', name: 'actuate', namespace: NS.XLINK },
    'xlink:arcrole': { prefix: 'xlink', name: 'arcrole', namespace: NS.XLINK },
    'xlink:href': { prefix: 'xlink', name: 'href', namespace: NS.XLINK },
    'xlink:role': { prefix: 'xlink', name: 'role', namespace: NS.XLINK },
    'xlink:show': { prefix: 'xlink', name: 'show', namespace: NS.XLINK },
    'xlink:title': { prefix: 'xlink', name: 'title', namespace: NS.XLINK },
    'xlink:type': { prefix: 'xlink', name: 'type', namespace: NS.XLINK },
    'xml:base': { prefix: 'xml', name: 'base', namespace: NS.XML },
    'xml:lang': { prefix: 'xml', name: 'lang', namespace: NS.XML },
    'xml:space': { prefix: 'xml', name: 'space', namespace: NS.XML },
    xmlns: { prefix: '', name: 'xmlns', namespace: NS.XMLNS },
    'xmlns:xlink': { prefix: 'xmlns', name: 'xlink', namespace: NS.XMLNS }
};

//SVG tag names adjustment map
const SVG_TAG_NAMES_ADJUSTMENT_MAP = (exports.SVG_TAG_NAMES_ADJUSTMENT_MAP = {
    altglyph: 'altGlyph',
    altglyphdef: 'altGlyphDef',
    altglyphitem: 'altGlyphItem',
    animatecolor: 'animateColor',
    animatemotion: 'animateMotion',
    animatetransform: 'animateTransform',
    clippath: 'clipPath',
    feblend: 'feBlend',
    fecolormatrix: 'feColorMatrix',
    fecomponenttransfer: 'feComponentTransfer',
    fecomposite: 'feComposite',
    feconvolvematrix: 'feConvolveMatrix',
    fediffuselighting: 'feDiffuseLighting',
    fedisplacementmap: 'feDisplacementMap',
    fedistantlight: 'feDistantLight',
    feflood: 'feFlood',
    fefunca: 'feFuncA',
    fefuncb: 'feFuncB',
    fefuncg: 'feFuncG',
    fefuncr: 'feFuncR',
    fegaussianblur: 'feGaussianBlur',
    feimage: 'feImage',
    femerge: 'feMerge',
    femergenode: 'feMergeNode',
    femorphology: 'feMorphology',
    feoffset: 'feOffset',
    fepointlight: 'fePointLight',
    fespecularlighting: 'feSpecularLighting',
    fespotlight: 'feSpotLight',
    fetile: 'feTile',
    feturbulence: 'feTurbulence',
    foreignobject: 'foreignObject',
    glyphref: 'glyphRef',
    lineargradient: 'linearGradient',
    radialgradient: 'radialGradient',
    textpath: 'textPath'
});

//Tags that causes exit from foreign content
const EXITS_FOREIGN_CONTENT = {
    [$.B]: true,
    [$.BIG]: true,
    [$.BLOCKQUOTE]: true,
    [$.BODY]: true,
    [$.BR]: true,
    [$.CENTER]: true,
    [$.CODE]: true,
    [$.DD]: true,
    [$.DIV]: true,
    [$.DL]: true,
    [$.DT]: true,
    [$.EM]: true,
    [$.EMBED]: true,
    [$.H1]: true,
    [$.H2]: true,
    [$.H3]: true,
    [$.H4]: true,
    [$.H5]: true,
    [$.H6]: true,
    [$.HEAD]: true,
    [$.HR]: true,
    [$.I]: true,
    [$.IMG]: true,
    [$.LI]: true,
    [$.LISTING]: true,
    [$.MENU]: true,
    [$.META]: true,
    [$.NOBR]: true,
    [$.OL]: true,
    [$.P]: true,
    [$.PRE]: true,
    [$.RUBY]: true,
    [$.S]: true,
    [$.SMALL]: true,
    [$.SPAN]: true,
    [$.STRONG]: true,
    [$.STRIKE]: true,
    [$.SUB]: true,
    [$.SUP]: true,
    [$.TABLE]: true,
    [$.TT]: true,
    [$.U]: true,
    [$.UL]: true,
    [$.VAR]: true
};

//Check exit from foreign content
exports.causesExit = function(startTagToken) {
    const tn = startTagToken.tagName;
    const isFontWithAttrs =
        tn === $.FONT &&
        (Tokenizer.getTokenAttr(startTagToken, ATTRS.COLOR) !== null ||
            Tokenizer.getTokenAttr(startTagToken, ATTRS.SIZE) !== null ||
            Tokenizer.getTokenAttr(startTagToken, ATTRS.FACE) !== null);

    return isFontWithAttrs ? true : EXITS_FOREIGN_CONTENT[tn];
};

//Token adjustments
exports.adjustTokenMathMLAttrs = function(token) {
    for (let i = 0; i < token.attrs.length; i++) {
        if (token.attrs[i].name === DEFINITION_URL_ATTR) {
            token.attrs[i].name = ADJUSTED_DEFINITION_URL_ATTR;
            break;
        }
    }
};

exports.adjustTokenSVGAttrs = function(token) {
    for (let i = 0; i < token.attrs.length; i++) {
        const adjustedAttrName = SVG_ATTRS_ADJUSTMENT_MAP[token.attrs[i].name];

        if (adjustedAttrName) {
            token.attrs[i].name = adjustedAttrName;
        }
    }
};

exports.adjustTokenXMLAttrs = function(token) {
    for (let i = 0; i < token.attrs.length; i++) {
        const adjustedAttrEntry = XML_ATTRS_ADJUSTMENT_MAP[token.attrs[i].name];

        if (adjustedAttrEntry) {
            token.attrs[i].prefix = adjustedAttrEntry.prefix;
            token.attrs[i].name = adjustedAttrEntry.name;
            token.attrs[i].namespace = adjustedAttrEntry.namespace;
        }
    }
};

exports.adjustTokenSVGTagName = function(token) {
    const adjustedTagName = SVG_TAG_NAMES_ADJUSTMENT_MAP[token.tagName];

    if (adjustedTagName) {
        token.tagName = adjustedTagName;
    }
};

//Integration points
function isMathMLTextIntegrationPoint(tn, ns) {
    return ns === NS.MATHML && (tn === $.MI || tn === $.MO || tn === $.MN || tn === $.MS || tn === $.MTEXT);
}

function isHtmlIntegrationPoint(tn, ns, attrs) {
    if (ns === NS.MATHML && tn === $.ANNOTATION_XML) {
        for (let i = 0; i < attrs.length; i++) {
            if (attrs[i].name === ATTRS.ENCODING) {
                const value = attrs[i].value.toLowerCase();

                return value === MIME_TYPES.TEXT_HTML || value === MIME_TYPES.APPLICATION_XML;
            }
        }
    }

    return ns === NS.SVG && (tn === $.FOREIGN_OBJECT || tn === $.DESC || tn === $.TITLE);
}

exports.isIntegrationPoint = function(tn, ns, attrs, foreignNS) {
    if ((!foreignNS || foreignNS === NS.HTML) && isHtmlIntegrationPoint(tn, ns, attrs)) {
        return true;
    }

    if ((!foreignNS || foreignNS === NS.MATHML) && isMathMLTextIntegrationPoint(tn, ns)) {
        return true;
    }

    return false;
};

},{"../tokenizer":151,"./html":138}],138:[function(require,module,exports){
'use strict';

const NS = (exports.NAMESPACES = {
    HTML: 'http://www.w3.org/1999/xhtml',
    MATHML: 'http://www.w3.org/1998/Math/MathML',
    SVG: 'http://www.w3.org/2000/svg',
    XLINK: 'http://www.w3.org/1999/xlink',
    XML: 'http://www.w3.org/XML/1998/namespace',
    XMLNS: 'http://www.w3.org/2000/xmlns/'
});

exports.ATTRS = {
    TYPE: 'type',
    ACTION: 'action',
    ENCODING: 'encoding',
    PROMPT: 'prompt',
    NAME: 'name',
    COLOR: 'color',
    FACE: 'face',
    SIZE: 'size'
};

exports.DOCUMENT_MODE = {
    NO_QUIRKS: 'no-quirks',
    QUIRKS: 'quirks',
    LIMITED_QUIRKS: 'limited-quirks'
};

const $ = (exports.TAG_NAMES = {
    A: 'a',
    ADDRESS: 'address',
    ANNOTATION_XML: 'annotation-xml',
    APPLET: 'applet',
    AREA: 'area',
    ARTICLE: 'article',
    ASIDE: 'aside',

    B: 'b',
    BASE: 'base',
    BASEFONT: 'basefont',
    BGSOUND: 'bgsound',
    BIG: 'big',
    BLOCKQUOTE: 'blockquote',
    BODY: 'body',
    BR: 'br',
    BUTTON: 'button',

    CAPTION: 'caption',
    CENTER: 'center',
    CODE: 'code',
    COL: 'col',
    COLGROUP: 'colgroup',

    DD: 'dd',
    DESC: 'desc',
    DETAILS: 'details',
    DIALOG: 'dialog',
    DIR: 'dir',
    DIV: 'div',
    DL: 'dl',
    DT: 'dt',

    EM: 'em',
    EMBED: 'embed',

    FIELDSET: 'fieldset',
    FIGCAPTION: 'figcaption',
    FIGURE: 'figure',
    FONT: 'font',
    FOOTER: 'footer',
    FOREIGN_OBJECT: 'foreignObject',
    FORM: 'form',
    FRAME: 'frame',
    FRAMESET: 'frameset',

    H1: 'h1',
    H2: 'h2',
    H3: 'h3',
    H4: 'h4',
    H5: 'h5',
    H6: 'h6',
    HEAD: 'head',
    HEADER: 'header',
    HGROUP: 'hgroup',
    HR: 'hr',
    HTML: 'html',

    I: 'i',
    IMG: 'img',
    IMAGE: 'image',
    INPUT: 'input',
    IFRAME: 'iframe',

    KEYGEN: 'keygen',

    LABEL: 'label',
    LI: 'li',
    LINK: 'link',
    LISTING: 'listing',

    MAIN: 'main',
    MALIGNMARK: 'malignmark',
    MARQUEE: 'marquee',
    MATH: 'math',
    MENU: 'menu',
    META: 'meta',
    MGLYPH: 'mglyph',
    MI: 'mi',
    MO: 'mo',
    MN: 'mn',
    MS: 'ms',
    MTEXT: 'mtext',

    NAV: 'nav',
    NOBR: 'nobr',
    NOFRAMES: 'noframes',
    NOEMBED: 'noembed',
    NOSCRIPT: 'noscript',

    OBJECT: 'object',
    OL: 'ol',
    OPTGROUP: 'optgroup',
    OPTION: 'option',

    P: 'p',
    PARAM: 'param',
    PLAINTEXT: 'plaintext',
    PRE: 'pre',

    RB: 'rb',
    RP: 'rp',
    RT: 'rt',
    RTC: 'rtc',
    RUBY: 'ruby',

    S: 's',
    SCRIPT: 'script',
    SECTION: 'section',
    SELECT: 'select',
    SOURCE: 'source',
    SMALL: 'small',
    SPAN: 'span',
    STRIKE: 'strike',
    STRONG: 'strong',
    STYLE: 'style',
    SUB: 'sub',
    SUMMARY: 'summary',
    SUP: 'sup',

    TABLE: 'table',
    TBODY: 'tbody',
    TEMPLATE: 'template',
    TEXTAREA: 'textarea',
    TFOOT: 'tfoot',
    TD: 'td',
    TH: 'th',
    THEAD: 'thead',
    TITLE: 'title',
    TR: 'tr',
    TRACK: 'track',
    TT: 'tt',

    U: 'u',
    UL: 'ul',

    SVG: 'svg',

    VAR: 'var',

    WBR: 'wbr',

    XMP: 'xmp'
});

exports.SPECIAL_ELEMENTS = {
    [NS.HTML]: {
        [$.ADDRESS]: true,
        [$.APPLET]: true,
        [$.AREA]: true,
        [$.ARTICLE]: true,
        [$.ASIDE]: true,
        [$.BASE]: true,
        [$.BASEFONT]: true,
        [$.BGSOUND]: true,
        [$.BLOCKQUOTE]: true,
        [$.BODY]: true,
        [$.BR]: true,
        [$.BUTTON]: true,
        [$.CAPTION]: true,
        [$.CENTER]: true,
        [$.COL]: true,
        [$.COLGROUP]: true,
        [$.DD]: true,
        [$.DETAILS]: true,
        [$.DIR]: true,
        [$.DIV]: true,
        [$.DL]: true,
        [$.DT]: true,
        [$.EMBED]: true,
        [$.FIELDSET]: true,
        [$.FIGCAPTION]: true,
        [$.FIGURE]: true,
        [$.FOOTER]: true,
        [$.FORM]: true,
        [$.FRAME]: true,
        [$.FRAMESET]: true,
        [$.H1]: true,
        [$.H2]: true,
        [$.H3]: true,
        [$.H4]: true,
        [$.H5]: true,
        [$.H6]: true,
        [$.HEAD]: true,
        [$.HEADER]: true,
        [$.HGROUP]: true,
        [$.HR]: true,
        [$.HTML]: true,
        [$.IFRAME]: true,
        [$.IMG]: true,
        [$.INPUT]: true,
        [$.LI]: true,
        [$.LINK]: true,
        [$.LISTING]: true,
        [$.MAIN]: true,
        [$.MARQUEE]: true,
        [$.MENU]: true,
        [$.META]: true,
        [$.NAV]: true,
        [$.NOEMBED]: true,
        [$.NOFRAMES]: true,
        [$.NOSCRIPT]: true,
        [$.OBJECT]: true,
        [$.OL]: true,
        [$.P]: true,
        [$.PARAM]: true,
        [$.PLAINTEXT]: true,
        [$.PRE]: true,
        [$.SCRIPT]: true,
        [$.SECTION]: true,
        [$.SELECT]: true,
        [$.SOURCE]: true,
        [$.STYLE]: true,
        [$.SUMMARY]: true,
        [$.TABLE]: true,
        [$.TBODY]: true,
        [$.TD]: true,
        [$.TEMPLATE]: true,
        [$.TEXTAREA]: true,
        [$.TFOOT]: true,
        [$.TH]: true,
        [$.THEAD]: true,
        [$.TITLE]: true,
        [$.TR]: true,
        [$.TRACK]: true,
        [$.UL]: true,
        [$.WBR]: true,
        [$.XMP]: true
    },
    [NS.MATHML]: {
        [$.MI]: true,
        [$.MO]: true,
        [$.MN]: true,
        [$.MS]: true,
        [$.MTEXT]: true,
        [$.ANNOTATION_XML]: true
    },
    [NS.SVG]: {
        [$.TITLE]: true,
        [$.FOREIGN_OBJECT]: true,
        [$.DESC]: true
    }
};

},{}],139:[function(require,module,exports){
'use strict';

const UNDEFINED_CODE_POINTS = [
    0xfffe,
    0xffff,
    0x1fffe,
    0x1ffff,
    0x2fffe,
    0x2ffff,
    0x3fffe,
    0x3ffff,
    0x4fffe,
    0x4ffff,
    0x5fffe,
    0x5ffff,
    0x6fffe,
    0x6ffff,
    0x7fffe,
    0x7ffff,
    0x8fffe,
    0x8ffff,
    0x9fffe,
    0x9ffff,
    0xafffe,
    0xaffff,
    0xbfffe,
    0xbffff,
    0xcfffe,
    0xcffff,
    0xdfffe,
    0xdffff,
    0xefffe,
    0xeffff,
    0xffffe,
    0xfffff,
    0x10fffe,
    0x10ffff
];

exports.REPLACEMENT_CHARACTER = '\uFFFD';

exports.CODE_POINTS = {
    EOF: -1,
    NULL: 0x00,
    TABULATION: 0x09,
    CARRIAGE_RETURN: 0x0d,
    LINE_FEED: 0x0a,
    FORM_FEED: 0x0c,
    SPACE: 0x20,
    EXCLAMATION_MARK: 0x21,
    QUOTATION_MARK: 0x22,
    NUMBER_SIGN: 0x23,
    AMPERSAND: 0x26,
    APOSTROPHE: 0x27,
    HYPHEN_MINUS: 0x2d,
    SOLIDUS: 0x2f,
    DIGIT_0: 0x30,
    DIGIT_9: 0x39,
    SEMICOLON: 0x3b,
    LESS_THAN_SIGN: 0x3c,
    EQUALS_SIGN: 0x3d,
    GREATER_THAN_SIGN: 0x3e,
    QUESTION_MARK: 0x3f,
    LATIN_CAPITAL_A: 0x41,
    LATIN_CAPITAL_F: 0x46,
    LATIN_CAPITAL_X: 0x58,
    LATIN_CAPITAL_Z: 0x5a,
    RIGHT_SQUARE_BRACKET: 0x5d,
    GRAVE_ACCENT: 0x60,
    LATIN_SMALL_A: 0x61,
    LATIN_SMALL_F: 0x66,
    LATIN_SMALL_X: 0x78,
    LATIN_SMALL_Z: 0x7a,
    REPLACEMENT_CHARACTER: 0xfffd
};

exports.CODE_POINT_SEQUENCES = {
    DASH_DASH_STRING: [0x2d, 0x2d], //--
    DOCTYPE_STRING: [0x44, 0x4f, 0x43, 0x54, 0x59, 0x50, 0x45], //DOCTYPE
    CDATA_START_STRING: [0x5b, 0x43, 0x44, 0x41, 0x54, 0x41, 0x5b], //[CDATA[
    SCRIPT_STRING: [0x73, 0x63, 0x72, 0x69, 0x70, 0x74], //script
    PUBLIC_STRING: [0x50, 0x55, 0x42, 0x4c, 0x49, 0x43], //PUBLIC
    SYSTEM_STRING: [0x53, 0x59, 0x53, 0x54, 0x45, 0x4d] //SYSTEM
};

//Surrogates
exports.isSurrogate = function(cp) {
    return cp >= 0xd800 && cp <= 0xdfff;
};

exports.isSurrogatePair = function(cp) {
    return cp >= 0xdc00 && cp <= 0xdfff;
};

exports.getSurrogatePairCodePoint = function(cp1, cp2) {
    return (cp1 - 0xd800) * 0x400 + 0x2400 + cp2;
};

//NOTE: excluding NULL and ASCII whitespace
exports.isControlCodePoint = function(cp) {
    return (
        (cp !== 0x20 && cp !== 0x0a && cp !== 0x0d && cp !== 0x09 && cp !== 0x0c && cp >= 0x01 && cp <= 0x1f) ||
        (cp >= 0x7f && cp <= 0x9f)
    );
};

exports.isUndefinedCodePoint = function(cp) {
    return (cp >= 0xfdd0 && cp <= 0xfdef) || UNDEFINED_CODE_POINTS.indexOf(cp) > -1;
};

},{}],140:[function(require,module,exports){
'use strict';

const Mixin = require('../../utils/mixin');

class ErrorReportingMixinBase extends Mixin {
    constructor(host, opts) {
        super(host);

        this.posTracker = null;
        this.onParseError = opts.onParseError;
    }

    _setErrorLocation(err) {
        err.startLine = err.endLine = this.posTracker.line;
        err.startCol = err.endCol = this.posTracker.col;
        err.startOffset = err.endOffset = this.posTracker.offset;
    }

    _reportError(code) {
        const err = {
            code: code,
            startLine: -1,
            startCol: -1,
            startOffset: -1,
            endLine: -1,
            endCol: -1,
            endOffset: -1
        };

        this._setErrorLocation(err);
        this.onParseError(err);
    }

    _getOverriddenMethods(mxn) {
        return {
            _err(code) {
                mxn._reportError(code);
            }
        };
    }
}

module.exports = ErrorReportingMixinBase;

},{"../../utils/mixin":156}],141:[function(require,module,exports){
'use strict';

const ErrorReportingMixinBase = require('./mixin-base');
const ErrorReportingTokenizerMixin = require('./tokenizer-mixin');
const LocationInfoTokenizerMixin = require('../location-info/tokenizer-mixin');
const Mixin = require('../../utils/mixin');

class ErrorReportingParserMixin extends ErrorReportingMixinBase {
    constructor(parser, opts) {
        super(parser, opts);

        this.opts = opts;
        this.ctLoc = null;
        this.locBeforeToken = false;
    }

    _setErrorLocation(err) {
        if (this.ctLoc) {
            err.startLine = this.ctLoc.startLine;
            err.startCol = this.ctLoc.startCol;
            err.startOffset = this.ctLoc.startOffset;

            err.endLine = this.locBeforeToken ? this.ctLoc.startLine : this.ctLoc.endLine;
            err.endCol = this.locBeforeToken ? this.ctLoc.startCol : this.ctLoc.endCol;
            err.endOffset = this.locBeforeToken ? this.ctLoc.startOffset : this.ctLoc.endOffset;
        }
    }

    _getOverriddenMethods(mxn, orig) {
        return {
            _bootstrap(document, fragmentContext) {
                orig._bootstrap.call(this, document, fragmentContext);

                Mixin.install(this.tokenizer, ErrorReportingTokenizerMixin, mxn.opts);
                Mixin.install(this.tokenizer, LocationInfoTokenizerMixin);
            },

            _processInputToken(token) {
                mxn.ctLoc = token.location;

                orig._processInputToken.call(this, token);
            },

            _err(code, options) {
                mxn.locBeforeToken = options && options.beforeToken;
                mxn._reportError(code);
            }
        };
    }
}

module.exports = ErrorReportingParserMixin;

},{"../../utils/mixin":156,"../location-info/tokenizer-mixin":146,"./mixin-base":140,"./tokenizer-mixin":143}],142:[function(require,module,exports){
'use strict';

const ErrorReportingMixinBase = require('./mixin-base');
const PositionTrackingPreprocessorMixin = require('../position-tracking/preprocessor-mixin');
const Mixin = require('../../utils/mixin');

class ErrorReportingPreprocessorMixin extends ErrorReportingMixinBase {
    constructor(preprocessor, opts) {
        super(preprocessor, opts);

        this.posTracker = Mixin.install(preprocessor, PositionTrackingPreprocessorMixin);
        this.lastErrOffset = -1;
    }

    _reportError(code) {
        //NOTE: avoid reporting error twice on advance/retreat
        if (this.lastErrOffset !== this.posTracker.offset) {
            this.lastErrOffset = this.posTracker.offset;
            super._reportError(code);
        }
    }
}

module.exports = ErrorReportingPreprocessorMixin;

},{"../../utils/mixin":156,"../position-tracking/preprocessor-mixin":147,"./mixin-base":140}],143:[function(require,module,exports){
'use strict';

const ErrorReportingMixinBase = require('./mixin-base');
const ErrorReportingPreprocessorMixin = require('./preprocessor-mixin');
const Mixin = require('../../utils/mixin');

class ErrorReportingTokenizerMixin extends ErrorReportingMixinBase {
    constructor(tokenizer, opts) {
        super(tokenizer, opts);

        const preprocessorMixin = Mixin.install(tokenizer.preprocessor, ErrorReportingPreprocessorMixin, opts);

        this.posTracker = preprocessorMixin.posTracker;
    }
}

module.exports = ErrorReportingTokenizerMixin;

},{"../../utils/mixin":156,"./mixin-base":140,"./preprocessor-mixin":142}],144:[function(require,module,exports){
'use strict';

const Mixin = require('../../utils/mixin');

class LocationInfoOpenElementStackMixin extends Mixin {
    constructor(stack, opts) {
        super(stack);

        this.onItemPop = opts.onItemPop;
    }

    _getOverriddenMethods(mxn, orig) {
        return {
            pop() {
                mxn.onItemPop(this.current);
                orig.pop.call(this);
            },

            popAllUpToHtmlElement() {
                for (let i = this.stackTop; i > 0; i--) {
                    mxn.onItemPop(this.items[i]);
                }

                orig.popAllUpToHtmlElement.call(this);
            },

            remove(element) {
                mxn.onItemPop(this.current);
                orig.remove.call(this, element);
            }
        };
    }
}

module.exports = LocationInfoOpenElementStackMixin;

},{"../../utils/mixin":156}],145:[function(require,module,exports){
'use strict';

const Mixin = require('../../utils/mixin');
const Tokenizer = require('../../tokenizer');
const LocationInfoTokenizerMixin = require('./tokenizer-mixin');
const LocationInfoOpenElementStackMixin = require('./open-element-stack-mixin');
const HTML = require('../../common/html');

//Aliases
const $ = HTML.TAG_NAMES;

class LocationInfoParserMixin extends Mixin {
    constructor(parser) {
        super(parser);

        this.parser = parser;
        this.treeAdapter = this.parser.treeAdapter;
        this.posTracker = null;
        this.lastStartTagToken = null;
        this.lastFosterParentingLocation = null;
        this.currentToken = null;
    }

    _setStartLocation(element) {
        let loc = null;

        if (this.lastStartTagToken) {
            loc = Object.assign({}, this.lastStartTagToken.location);
            loc.startTag = this.lastStartTagToken.location;
        }

        this.treeAdapter.setNodeSourceCodeLocation(element, loc);
    }

    _setEndLocation(element, closingToken) {
        const loc = this.treeAdapter.getNodeSourceCodeLocation(element);

        if (loc) {
            if (closingToken.location) {
                const ctLoc = closingToken.location;
                const tn = this.treeAdapter.getTagName(element);

                // NOTE: For cases like <p> <p> </p> - First 'p' closes without a closing
                // tag and for cases like <td> <p> </td> - 'p' closes without a closing tag.
                const isClosingEndTag = closingToken.type === Tokenizer.END_TAG_TOKEN && tn === closingToken.tagName;

                if (isClosingEndTag) {
                    loc.endTag = Object.assign({}, ctLoc);
                    loc.endLine = ctLoc.endLine;
                    loc.endCol = ctLoc.endCol;
                    loc.endOffset = ctLoc.endOffset;
                } else {
                    loc.endLine = ctLoc.startLine;
                    loc.endCol = ctLoc.startCol;
                    loc.endOffset = ctLoc.startOffset;
                }
            }
        }
    }

    _getOverriddenMethods(mxn, orig) {
        return {
            _bootstrap(document, fragmentContext) {
                orig._bootstrap.call(this, document, fragmentContext);

                mxn.lastStartTagToken = null;
                mxn.lastFosterParentingLocation = null;
                mxn.currentToken = null;

                const tokenizerMixin = Mixin.install(this.tokenizer, LocationInfoTokenizerMixin);

                mxn.posTracker = tokenizerMixin.posTracker;

                Mixin.install(this.openElements, LocationInfoOpenElementStackMixin, {
                    onItemPop: function(element) {
                        mxn._setEndLocation(element, mxn.currentToken);
                    }
                });
            },

            _runParsingLoop(scriptHandler) {
                orig._runParsingLoop.call(this, scriptHandler);

                // NOTE: generate location info for elements
                // that remains on open element stack
                for (let i = this.openElements.stackTop; i >= 0; i--) {
                    mxn._setEndLocation(this.openElements.items[i], mxn.currentToken);
                }
            },

            //Token processing
            _processTokenInForeignContent(token) {
                mxn.currentToken = token;
                orig._processTokenInForeignContent.call(this, token);
            },

            _processToken(token) {
                mxn.currentToken = token;
                orig._processToken.call(this, token);

                //NOTE: <body> and <html> are never popped from the stack, so we need to updated
                //their end location explicitly.
                const requireExplicitUpdate =
                    token.type === Tokenizer.END_TAG_TOKEN &&
                    (token.tagName === $.HTML || (token.tagName === $.BODY && this.openElements.hasInScope($.BODY)));

                if (requireExplicitUpdate) {
                    for (let i = this.openElements.stackTop; i >= 0; i--) {
                        const element = this.openElements.items[i];

                        if (this.treeAdapter.getTagName(element) === token.tagName) {
                            mxn._setEndLocation(element, token);
                            break;
                        }
                    }
                }
            },

            //Doctype
            _setDocumentType(token) {
                orig._setDocumentType.call(this, token);

                const documentChildren = this.treeAdapter.getChildNodes(this.document);
                const cnLength = documentChildren.length;

                for (let i = 0; i < cnLength; i++) {
                    const node = documentChildren[i];

                    if (this.treeAdapter.isDocumentTypeNode(node)) {
                        this.treeAdapter.setNodeSourceCodeLocation(node, token.location);
                        break;
                    }
                }
            },

            //Elements
            _attachElementToTree(element) {
                //NOTE: _attachElementToTree is called from _appendElement, _insertElement and _insertTemplate methods.
                //So we will use token location stored in this methods for the element.
                mxn._setStartLocation(element);
                mxn.lastStartTagToken = null;
                orig._attachElementToTree.call(this, element);
            },

            _appendElement(token, namespaceURI) {
                mxn.lastStartTagToken = token;
                orig._appendElement.call(this, token, namespaceURI);
            },

            _insertElement(token, namespaceURI) {
                mxn.lastStartTagToken = token;
                orig._insertElement.call(this, token, namespaceURI);
            },

            _insertTemplate(token) {
                mxn.lastStartTagToken = token;
                orig._insertTemplate.call(this, token);

                const tmplContent = this.treeAdapter.getTemplateContent(this.openElements.current);

                this.treeAdapter.setNodeSourceCodeLocation(tmplContent, null);
            },

            _insertFakeRootElement() {
                orig._insertFakeRootElement.call(this);
                this.treeAdapter.setNodeSourceCodeLocation(this.openElements.current, null);
            },

            //Comments
            _appendCommentNode(token, parent) {
                orig._appendCommentNode.call(this, token, parent);

                const children = this.treeAdapter.getChildNodes(parent);
                const commentNode = children[children.length - 1];

                this.treeAdapter.setNodeSourceCodeLocation(commentNode, token.location);
            },

            //Text
            _findFosterParentingLocation() {
                //NOTE: store last foster parenting location, so we will be able to find inserted text
                //in case of foster parenting
                mxn.lastFosterParentingLocation = orig._findFosterParentingLocation.call(this);

                return mxn.lastFosterParentingLocation;
            },

            _insertCharacters(token) {
                orig._insertCharacters.call(this, token);

                const hasFosterParent = this._shouldFosterParentOnInsertion();

                const parent =
                    (hasFosterParent && mxn.lastFosterParentingLocation.parent) ||
                    this.openElements.currentTmplContent ||
                    this.openElements.current;

                const siblings = this.treeAdapter.getChildNodes(parent);

                const textNodeIdx =
                    hasFosterParent && mxn.lastFosterParentingLocation.beforeElement
                        ? siblings.indexOf(mxn.lastFosterParentingLocation.beforeElement) - 1
                        : siblings.length - 1;

                const textNode = siblings[textNodeIdx];

                //NOTE: if we have location assigned by another token, then just update end position
                const tnLoc = this.treeAdapter.getNodeSourceCodeLocation(textNode);

                if (tnLoc) {
                    tnLoc.endLine = token.location.endLine;
                    tnLoc.endCol = token.location.endCol;
                    tnLoc.endOffset = token.location.endOffset;
                } else {
                    this.treeAdapter.setNodeSourceCodeLocation(textNode, token.location);
                }
            }
        };
    }
}

module.exports = LocationInfoParserMixin;

},{"../../common/html":138,"../../tokenizer":151,"../../utils/mixin":156,"./open-element-stack-mixin":144,"./tokenizer-mixin":146}],146:[function(require,module,exports){
'use strict';

const Mixin = require('../../utils/mixin');
const Tokenizer = require('../../tokenizer');
const PositionTrackingPreprocessorMixin = require('../position-tracking/preprocessor-mixin');

class LocationInfoTokenizerMixin extends Mixin {
    constructor(tokenizer) {
        super(tokenizer);

        this.tokenizer = tokenizer;
        this.posTracker = Mixin.install(tokenizer.preprocessor, PositionTrackingPreprocessorMixin);
        this.currentAttrLocation = null;
        this.ctLoc = null;
    }

    _getCurrentLocation() {
        return {
            startLine: this.posTracker.line,
            startCol: this.posTracker.col,
            startOffset: this.posTracker.offset,
            endLine: -1,
            endCol: -1,
            endOffset: -1
        };
    }

    _attachCurrentAttrLocationInfo() {
        this.currentAttrLocation.endLine = this.posTracker.line;
        this.currentAttrLocation.endCol = this.posTracker.col;
        this.currentAttrLocation.endOffset = this.posTracker.offset;

        const currentToken = this.tokenizer.currentToken;
        const currentAttr = this.tokenizer.currentAttr;

        if (!currentToken.location.attrs) {
            currentToken.location.attrs = Object.create(null);
        }

        currentToken.location.attrs[currentAttr.name] = this.currentAttrLocation;
    }

    _getOverriddenMethods(mxn, orig) {
        const methods = {
            _createStartTagToken() {
                orig._createStartTagToken.call(this);
                this.currentToken.location = mxn.ctLoc;
            },

            _createEndTagToken() {
                orig._createEndTagToken.call(this);
                this.currentToken.location = mxn.ctLoc;
            },

            _createCommentToken() {
                orig._createCommentToken.call(this);
                this.currentToken.location = mxn.ctLoc;
            },

            _createDoctypeToken(initialName) {
                orig._createDoctypeToken.call(this, initialName);
                this.currentToken.location = mxn.ctLoc;
            },

            _createCharacterToken(type, ch) {
                orig._createCharacterToken.call(this, type, ch);
                this.currentCharacterToken.location = mxn.ctLoc;
            },

            _createEOFToken() {
                orig._createEOFToken.call(this);
                this.currentToken.location = mxn._getCurrentLocation();
            },

            _createAttr(attrNameFirstCh) {
                orig._createAttr.call(this, attrNameFirstCh);
                mxn.currentAttrLocation = mxn._getCurrentLocation();
            },

            _leaveAttrName(toState) {
                orig._leaveAttrName.call(this, toState);
                mxn._attachCurrentAttrLocationInfo();
            },

            _leaveAttrValue(toState) {
                orig._leaveAttrValue.call(this, toState);
                mxn._attachCurrentAttrLocationInfo();
            },

            _emitCurrentToken() {
                const ctLoc = this.currentToken.location;

                //NOTE: if we have pending character token make it's end location equal to the
                //current token's start location.
                if (this.currentCharacterToken) {
                    this.currentCharacterToken.location.endLine = ctLoc.startLine;
                    this.currentCharacterToken.location.endCol = ctLoc.startCol;
                    this.currentCharacterToken.location.endOffset = ctLoc.startOffset;
                }

                if (this.currentToken.type === Tokenizer.EOF_TOKEN) {
                    ctLoc.endLine = ctLoc.startLine;
                    ctLoc.endCol = ctLoc.startCol;
                    ctLoc.endOffset = ctLoc.startOffset;
                } else {
                    ctLoc.endLine = mxn.posTracker.line;
                    ctLoc.endCol = mxn.posTracker.col + 1;
                    ctLoc.endOffset = mxn.posTracker.offset + 1;
                }

                orig._emitCurrentToken.call(this);
            },

            _emitCurrentCharacterToken() {
                const ctLoc = this.currentCharacterToken && this.currentCharacterToken.location;

                //NOTE: if we have character token and it's location wasn't set in the _emitCurrentToken(),
                //then set it's location at the current preprocessor position.
                //We don't need to increment preprocessor position, since character token
                //emission is always forced by the start of the next character token here.
                //So, we already have advanced position.
                if (ctLoc && ctLoc.endOffset === -1) {
                    ctLoc.endLine = mxn.posTracker.line;
                    ctLoc.endCol = mxn.posTracker.col;
                    ctLoc.endOffset = mxn.posTracker.offset;
                }

                orig._emitCurrentCharacterToken.call(this);
            }
        };

        //NOTE: patch initial states for each mode to obtain token start position
        Object.keys(Tokenizer.MODE).forEach(modeName => {
            const state = Tokenizer.MODE[modeName];

            methods[state] = function(cp) {
                mxn.ctLoc = mxn._getCurrentLocation();
                orig[state].call(this, cp);
            };
        });

        return methods;
    }
}

module.exports = LocationInfoTokenizerMixin;

},{"../../tokenizer":151,"../../utils/mixin":156,"../position-tracking/preprocessor-mixin":147}],147:[function(require,module,exports){
'use strict';

const Mixin = require('../../utils/mixin');

class PositionTrackingPreprocessorMixin extends Mixin {
    constructor(preprocessor) {
        super(preprocessor);

        this.preprocessor = preprocessor;
        this.isEol = false;
        this.lineStartPos = 0;
        this.droppedBufferSize = 0;

        this.offset = 0;
        this.col = 0;
        this.line = 1;
    }

    _getOverriddenMethods(mxn, orig) {
        return {
            advance() {
                const pos = this.pos + 1;
                const ch = this.html[pos];

                //NOTE: LF should be in the last column of the line
                if (mxn.isEol) {
                    mxn.isEol = false;
                    mxn.line++;
                    mxn.lineStartPos = pos;
                }

                if (ch === '\n' || (ch === '\r' && this.html[pos + 1] !== '\n')) {
                    mxn.isEol = true;
                }

                mxn.col = pos - mxn.lineStartPos + 1;
                mxn.offset = mxn.droppedBufferSize + pos;

                return orig.advance.call(this);
            },

            retreat() {
                orig.retreat.call(this);

                mxn.isEol = false;
                mxn.col = this.pos - mxn.lineStartPos + 1;
            },

            dropParsedChunk() {
                const prevPos = this.pos;

                orig.dropParsedChunk.call(this);

                const reduction = prevPos - this.pos;

                mxn.lineStartPos -= reduction;
                mxn.droppedBufferSize += reduction;
                mxn.offset = mxn.droppedBufferSize + this.pos;
            }
        };
    }
}

module.exports = PositionTrackingPreprocessorMixin;

},{"../../utils/mixin":156}],148:[function(require,module,exports){
'use strict';

//Const
const NOAH_ARK_CAPACITY = 3;

//List of formatting elements
class FormattingElementList {
    constructor(treeAdapter) {
        this.length = 0;
        this.entries = [];
        this.treeAdapter = treeAdapter;
        this.bookmark = null;
    }

    //Noah Ark's condition
    //OPTIMIZATION: at first we try to find possible candidates for exclusion using
    //lightweight heuristics without thorough attributes check.
    _getNoahArkConditionCandidates(newElement) {
        const candidates = [];

        if (this.length >= NOAH_ARK_CAPACITY) {
            const neAttrsLength = this.treeAdapter.getAttrList(newElement).length;
            const neTagName = this.treeAdapter.getTagName(newElement);
            const neNamespaceURI = this.treeAdapter.getNamespaceURI(newElement);

            for (let i = this.length - 1; i >= 0; i--) {
                const entry = this.entries[i];

                if (entry.type === FormattingElementList.MARKER_ENTRY) {
                    break;
                }

                const element = entry.element;
                const elementAttrs = this.treeAdapter.getAttrList(element);

                const isCandidate =
                    this.treeAdapter.getTagName(element) === neTagName &&
                    this.treeAdapter.getNamespaceURI(element) === neNamespaceURI &&
                    elementAttrs.length === neAttrsLength;

                if (isCandidate) {
                    candidates.push({ idx: i, attrs: elementAttrs });
                }
            }
        }

        return candidates.length < NOAH_ARK_CAPACITY ? [] : candidates;
    }

    _ensureNoahArkCondition(newElement) {
        const candidates = this._getNoahArkConditionCandidates(newElement);
        let cLength = candidates.length;

        if (cLength) {
            const neAttrs = this.treeAdapter.getAttrList(newElement);
            const neAttrsLength = neAttrs.length;
            const neAttrsMap = Object.create(null);

            //NOTE: build attrs map for the new element so we can perform fast lookups
            for (let i = 0; i < neAttrsLength; i++) {
                const neAttr = neAttrs[i];

                neAttrsMap[neAttr.name] = neAttr.value;
            }

            for (let i = 0; i < neAttrsLength; i++) {
                for (let j = 0; j < cLength; j++) {
                    const cAttr = candidates[j].attrs[i];

                    if (neAttrsMap[cAttr.name] !== cAttr.value) {
                        candidates.splice(j, 1);
                        cLength--;
                    }

                    if (candidates.length < NOAH_ARK_CAPACITY) {
                        return;
                    }
                }
            }

            //NOTE: remove bottommost candidates until Noah's Ark condition will not be met
            for (let i = cLength - 1; i >= NOAH_ARK_CAPACITY - 1; i--) {
                this.entries.splice(candidates[i].idx, 1);
                this.length--;
            }
        }
    }

    //Mutations
    insertMarker() {
        this.entries.push({ type: FormattingElementList.MARKER_ENTRY });
        this.length++;
    }

    pushElement(element, token) {
        this._ensureNoahArkCondition(element);

        this.entries.push({
            type: FormattingElementList.ELEMENT_ENTRY,
            element: element,
            token: token
        });

        this.length++;
    }

    insertElementAfterBookmark(element, token) {
        let bookmarkIdx = this.length - 1;

        for (; bookmarkIdx >= 0; bookmarkIdx--) {
            if (this.entries[bookmarkIdx] === this.bookmark) {
                break;
            }
        }

        this.entries.splice(bookmarkIdx + 1, 0, {
            type: FormattingElementList.ELEMENT_ENTRY,
            element: element,
            token: token
        });

        this.length++;
    }

    removeEntry(entry) {
        for (let i = this.length - 1; i >= 0; i--) {
            if (this.entries[i] === entry) {
                this.entries.splice(i, 1);
                this.length--;
                break;
            }
        }
    }

    clearToLastMarker() {
        while (this.length) {
            const entry = this.entries.pop();

            this.length--;

            if (entry.type === FormattingElementList.MARKER_ENTRY) {
                break;
            }
        }
    }

    //Search
    getElementEntryInScopeWithTagName(tagName) {
        for (let i = this.length - 1; i >= 0; i--) {
            const entry = this.entries[i];

            if (entry.type === FormattingElementList.MARKER_ENTRY) {
                return null;
            }

            if (this.treeAdapter.getTagName(entry.element) === tagName) {
                return entry;
            }
        }

        return null;
    }

    getElementEntry(element) {
        for (let i = this.length - 1; i >= 0; i--) {
            const entry = this.entries[i];

            if (entry.type === FormattingElementList.ELEMENT_ENTRY && entry.element === element) {
                return entry;
            }
        }

        return null;
    }
}

//Entry types
FormattingElementList.MARKER_ENTRY = 'MARKER_ENTRY';
FormattingElementList.ELEMENT_ENTRY = 'ELEMENT_ENTRY';

module.exports = FormattingElementList;

},{}],149:[function(require,module,exports){
'use strict';

const Tokenizer = require('../tokenizer');
const OpenElementStack = require('./open-element-stack');
const FormattingElementList = require('./formatting-element-list');
const LocationInfoParserMixin = require('../extensions/location-info/parser-mixin');
const ErrorReportingParserMixin = require('../extensions/error-reporting/parser-mixin');
const Mixin = require('../utils/mixin');
const defaultTreeAdapter = require('../tree-adapters/default');
const mergeOptions = require('../utils/merge-options');
const doctype = require('../common/doctype');
const foreignContent = require('../common/foreign-content');
const ERR = require('../common/error-codes');
const unicode = require('../common/unicode');
const HTML = require('../common/html');

//Aliases
const $ = HTML.TAG_NAMES;
const NS = HTML.NAMESPACES;
const ATTRS = HTML.ATTRS;

const DEFAULT_OPTIONS = {
    scriptingEnabled: true,
    sourceCodeLocationInfo: false,
    onParseError: null,
    treeAdapter: defaultTreeAdapter
};

//Misc constants
const HIDDEN_INPUT_TYPE = 'hidden';

//Adoption agency loops iteration count
const AA_OUTER_LOOP_ITER = 8;
const AA_INNER_LOOP_ITER = 3;

//Insertion modes
const INITIAL_MODE = 'INITIAL_MODE';
const BEFORE_HTML_MODE = 'BEFORE_HTML_MODE';
const BEFORE_HEAD_MODE = 'BEFORE_HEAD_MODE';
const IN_HEAD_MODE = 'IN_HEAD_MODE';
const IN_HEAD_NO_SCRIPT_MODE = 'IN_HEAD_NO_SCRIPT_MODE';
const AFTER_HEAD_MODE = 'AFTER_HEAD_MODE';
const IN_BODY_MODE = 'IN_BODY_MODE';
const TEXT_MODE = 'TEXT_MODE';
const IN_TABLE_MODE = 'IN_TABLE_MODE';
const IN_TABLE_TEXT_MODE = 'IN_TABLE_TEXT_MODE';
const IN_CAPTION_MODE = 'IN_CAPTION_MODE';
const IN_COLUMN_GROUP_MODE = 'IN_COLUMN_GROUP_MODE';
const IN_TABLE_BODY_MODE = 'IN_TABLE_BODY_MODE';
const IN_ROW_MODE = 'IN_ROW_MODE';
const IN_CELL_MODE = 'IN_CELL_MODE';
const IN_SELECT_MODE = 'IN_SELECT_MODE';
const IN_SELECT_IN_TABLE_MODE = 'IN_SELECT_IN_TABLE_MODE';
const IN_TEMPLATE_MODE = 'IN_TEMPLATE_MODE';
const AFTER_BODY_MODE = 'AFTER_BODY_MODE';
const IN_FRAMESET_MODE = 'IN_FRAMESET_MODE';
const AFTER_FRAMESET_MODE = 'AFTER_FRAMESET_MODE';
const AFTER_AFTER_BODY_MODE = 'AFTER_AFTER_BODY_MODE';
const AFTER_AFTER_FRAMESET_MODE = 'AFTER_AFTER_FRAMESET_MODE';

//Insertion mode reset map
const INSERTION_MODE_RESET_MAP = {
    [$.TR]: IN_ROW_MODE,
    [$.TBODY]: IN_TABLE_BODY_MODE,
    [$.THEAD]: IN_TABLE_BODY_MODE,
    [$.TFOOT]: IN_TABLE_BODY_MODE,
    [$.CAPTION]: IN_CAPTION_MODE,
    [$.COLGROUP]: IN_COLUMN_GROUP_MODE,
    [$.TABLE]: IN_TABLE_MODE,
    [$.BODY]: IN_BODY_MODE,
    [$.FRAMESET]: IN_FRAMESET_MODE
};

//Template insertion mode switch map
const TEMPLATE_INSERTION_MODE_SWITCH_MAP = {
    [$.CAPTION]: IN_TABLE_MODE,
    [$.COLGROUP]: IN_TABLE_MODE,
    [$.TBODY]: IN_TABLE_MODE,
    [$.TFOOT]: IN_TABLE_MODE,
    [$.THEAD]: IN_TABLE_MODE,
    [$.COL]: IN_COLUMN_GROUP_MODE,
    [$.TR]: IN_TABLE_BODY_MODE,
    [$.TD]: IN_ROW_MODE,
    [$.TH]: IN_ROW_MODE
};

//Token handlers map for insertion modes
const TOKEN_HANDLERS = {
    [INITIAL_MODE]: {
        [Tokenizer.CHARACTER_TOKEN]: tokenInInitialMode,
        [Tokenizer.NULL_CHARACTER_TOKEN]: tokenInInitialMode,
        [Tokenizer.WHITESPACE_CHARACTER_TOKEN]: ignoreToken,
        [Tokenizer.COMMENT_TOKEN]: appendComment,
        [Tokenizer.DOCTYPE_TOKEN]: doctypeInInitialMode,
        [Tokenizer.START_TAG_TOKEN]: tokenInInitialMode,
        [Tokenizer.END_TAG_TOKEN]: tokenInInitialMode,
        [Tokenizer.EOF_TOKEN]: tokenInInitialMode
    },
    [BEFORE_HTML_MODE]: {
        [Tokenizer.CHARACTER_TOKEN]: tokenBeforeHtml,
        [Tokenizer.NULL_CHARACTER_TOKEN]: tokenBeforeHtml,
        [Tokenizer.WHITESPACE_CHARACTER_TOKEN]: ignoreToken,
        [Tokenizer.COMMENT_TOKEN]: appendComment,
        [Tokenizer.DOCTYPE_TOKEN]: ignoreToken,
        [Tokenizer.START_TAG_TOKEN]: startTagBeforeHtml,
        [Tokenizer.END_TAG_TOKEN]: endTagBeforeHtml,
        [Tokenizer.EOF_TOKEN]: tokenBeforeHtml
    },
    [BEFORE_HEAD_MODE]: {
        [Tokenizer.CHARACTER_TOKEN]: tokenBeforeHead,
        [Tokenizer.NULL_CHARACTER_TOKEN]: tokenBeforeHead,
        [Tokenizer.WHITESPACE_CHARACTER_TOKEN]: ignoreToken,
        [Tokenizer.COMMENT_TOKEN]: appendComment,
        [Tokenizer.DOCTYPE_TOKEN]: misplacedDoctype,
        [Tokenizer.START_TAG_TOKEN]: startTagBeforeHead,
        [Tokenizer.END_TAG_TOKEN]: endTagBeforeHead,
        [Tokenizer.EOF_TOKEN]: tokenBeforeHead
    },
    [IN_HEAD_MODE]: {
        [Tokenizer.CHARACTER_TOKEN]: tokenInHead,
        [Tokenizer.NULL_CHARACTER_TOKEN]: tokenInHead,
        [Tokenizer.WHITESPACE_CHARACTER_TOKEN]: insertCharacters,
        [Tokenizer.COMMENT_TOKEN]: appendComment,
        [Tokenizer.DOCTYPE_TOKEN]: misplacedDoctype,
        [Tokenizer.START_TAG_TOKEN]: startTagInHead,
        [Tokenizer.END_TAG_TOKEN]: endTagInHead,
        [Tokenizer.EOF_TOKEN]: tokenInHead
    },
    [IN_HEAD_NO_SCRIPT_MODE]: {
        [Tokenizer.CHARACTER_TOKEN]: tokenInHeadNoScript,
        [Tokenizer.NULL_CHARACTER_TOKEN]: tokenInHeadNoScript,
        [Tokenizer.WHITESPACE_CHARACTER_TOKEN]: insertCharacters,
        [Tokenizer.COMMENT_TOKEN]: appendComment,
        [Tokenizer.DOCTYPE_TOKEN]: misplacedDoctype,
        [Tokenizer.START_TAG_TOKEN]: startTagInHeadNoScript,
        [Tokenizer.END_TAG_TOKEN]: endTagInHeadNoScript,
        [Tokenizer.EOF_TOKEN]: tokenInHeadNoScript
    },
    [AFTER_HEAD_MODE]: {
        [Tokenizer.CHARACTER_TOKEN]: tokenAfterHead,
        [Tokenizer.NULL_CHARACTER_TOKEN]: tokenAfterHead,
        [Tokenizer.WHITESPACE_CHARACTER_TOKEN]: insertCharacters,
        [Tokenizer.COMMENT_TOKEN]: appendComment,
        [Tokenizer.DOCTYPE_TOKEN]: misplacedDoctype,
        [Tokenizer.START_TAG_TOKEN]: startTagAfterHead,
        [Tokenizer.END_TAG_TOKEN]: endTagAfterHead,
        [Tokenizer.EOF_TOKEN]: tokenAfterHead
    },
    [IN_BODY_MODE]: {
        [Tokenizer.CHARACTER_TOKEN]: characterInBody,
        [Tokenizer.NULL_CHARACTER_TOKEN]: ignoreToken,
        [Tokenizer.WHITESPACE_CHARACTER_TOKEN]: whitespaceCharacterInBody,
        [Tokenizer.COMMENT_TOKEN]: appendComment,
        [Tokenizer.DOCTYPE_TOKEN]: ignoreToken,
        [Tokenizer.START_TAG_TOKEN]: startTagInBody,
        [Tokenizer.END_TAG_TOKEN]: endTagInBody,
        [Tokenizer.EOF_TOKEN]: eofInBody
    },
    [TEXT_MODE]: {
        [Tokenizer.CHARACTER_TOKEN]: insertCharacters,
        [Tokenizer.NULL_CHARACTER_TOKEN]: insertCharacters,
        [Tokenizer.WHITESPACE_CHARACTER_TOKEN]: insertCharacters,
        [Tokenizer.COMMENT_TOKEN]: ignoreToken,
        [Tokenizer.DOCTYPE_TOKEN]: ignoreToken,
        [Tokenizer.START_TAG_TOKEN]: ignoreToken,
        [Tokenizer.END_TAG_TOKEN]: endTagInText,
        [Tokenizer.EOF_TOKEN]: eofInText
    },
    [IN_TABLE_MODE]: {
        [Tokenizer.CHARACTER_TOKEN]: characterInTable,
        [Tokenizer.NULL_CHARACTER_TOKEN]: characterInTable,
        [Tokenizer.WHITESPACE_CHARACTER_TOKEN]: characterInTable,
        [Tokenizer.COMMENT_TOKEN]: appendComment,
        [Tokenizer.DOCTYPE_TOKEN]: ignoreToken,
        [Tokenizer.START_TAG_TOKEN]: startTagInTable,
        [Tokenizer.END_TAG_TOKEN]: endTagInTable,
        [Tokenizer.EOF_TOKEN]: eofInBody
    },
    [IN_TABLE_TEXT_MODE]: {
        [Tokenizer.CHARACTER_TOKEN]: characterInTableText,
        [Tokenizer.NULL_CHARACTER_TOKEN]: ignoreToken,
        [Tokenizer.WHITESPACE_CHARACTER_TOKEN]: whitespaceCharacterInTableText,
        [Tokenizer.COMMENT_TOKEN]: tokenInTableText,
        [Tokenizer.DOCTYPE_TOKEN]: tokenInTableText,
        [Tokenizer.START_TAG_TOKEN]: tokenInTableText,
        [Tokenizer.END_TAG_TOKEN]: tokenInTableText,
        [Tokenizer.EOF_TOKEN]: tokenInTableText
    },
    [IN_CAPTION_MODE]: {
        [Tokenizer.CHARACTER_TOKEN]: characterInBody,
        [Tokenizer.NULL_CHARACTER_TOKEN]: ignoreToken,
        [Tokenizer.WHITESPACE_CHARACTER_TOKEN]: whitespaceCharacterInBody,
        [Tokenizer.COMMENT_TOKEN]: appendComment,
        [Tokenizer.DOCTYPE_TOKEN]: ignoreToken,
        [Tokenizer.START_TAG_TOKEN]: startTagInCaption,
        [Tokenizer.END_TAG_TOKEN]: endTagInCaption,
        [Tokenizer.EOF_TOKEN]: eofInBody
    },
    [IN_COLUMN_GROUP_MODE]: {
        [Tokenizer.CHARACTER_TOKEN]: tokenInColumnGroup,
        [Tokenizer.NULL_CHARACTER_TOKEN]: tokenInColumnGroup,
        [Tokenizer.WHITESPACE_CHARACTER_TOKEN]: insertCharacters,
        [Tokenizer.COMMENT_TOKEN]: appendComment,
        [Tokenizer.DOCTYPE_TOKEN]: ignoreToken,
        [Tokenizer.START_TAG_TOKEN]: startTagInColumnGroup,
        [Tokenizer.END_TAG_TOKEN]: endTagInColumnGroup,
        [Tokenizer.EOF_TOKEN]: eofInBody
    },
    [IN_TABLE_BODY_MODE]: {
        [Tokenizer.CHARACTER_TOKEN]: characterInTable,
        [Tokenizer.NULL_CHARACTER_TOKEN]: characterInTable,
        [Tokenizer.WHITESPACE_CHARACTER_TOKEN]: characterInTable,
        [Tokenizer.COMMENT_TOKEN]: appendComment,
        [Tokenizer.DOCTYPE_TOKEN]: ignoreToken,
        [Tokenizer.START_TAG_TOKEN]: startTagInTableBody,
        [Tokenizer.END_TAG_TOKEN]: endTagInTableBody,
        [Tokenizer.EOF_TOKEN]: eofInBody
    },
    [IN_ROW_MODE]: {
        [Tokenizer.CHARACTER_TOKEN]: characterInTable,
        [Tokenizer.NULL_CHARACTER_TOKEN]: characterInTable,
        [Tokenizer.WHITESPACE_CHARACTER_TOKEN]: characterInTable,
        [Tokenizer.COMMENT_TOKEN]: appendComment,
        [Tokenizer.DOCTYPE_TOKEN]: ignoreToken,
        [Tokenizer.START_TAG_TOKEN]: startTagInRow,
        [Tokenizer.END_TAG_TOKEN]: endTagInRow,
        [Tokenizer.EOF_TOKEN]: eofInBody
    },
    [IN_CELL_MODE]: {
        [Tokenizer.CHARACTER_TOKEN]: characterInBody,
        [Tokenizer.NULL_CHARACTER_TOKEN]: ignoreToken,
        [Tokenizer.WHITESPACE_CHARACTER_TOKEN]: whitespaceCharacterInBody,
        [Tokenizer.COMMENT_TOKEN]: appendComment,
        [Tokenizer.DOCTYPE_TOKEN]: ignoreToken,
        [Tokenizer.START_TAG_TOKEN]: startTagInCell,
        [Tokenizer.END_TAG_TOKEN]: endTagInCell,
        [Tokenizer.EOF_TOKEN]: eofInBody
    },
    [IN_SELECT_MODE]: {
        [Tokenizer.CHARACTER_TOKEN]: insertCharacters,
        [Tokenizer.NULL_CHARACTER_TOKEN]: ignoreToken,
        [Tokenizer.WHITESPACE_CHARACTER_TOKEN]: insertCharacters,
        [Tokenizer.COMMENT_TOKEN]: appendComment,
        [Tokenizer.DOCTYPE_TOKEN]: ignoreToken,
        [Tokenizer.START_TAG_TOKEN]: startTagInSelect,
        [Tokenizer.END_TAG_TOKEN]: endTagInSelect,
        [Tokenizer.EOF_TOKEN]: eofInBody
    },
    [IN_SELECT_IN_TABLE_MODE]: {
        [Tokenizer.CHARACTER_TOKEN]: insertCharacters,
        [Tokenizer.NULL_CHARACTER_TOKEN]: ignoreToken,
        [Tokenizer.WHITESPACE_CHARACTER_TOKEN]: insertCharacters,
        [Tokenizer.COMMENT_TOKEN]: appendComment,
        [Tokenizer.DOCTYPE_TOKEN]: ignoreToken,
        [Tokenizer.START_TAG_TOKEN]: startTagInSelectInTable,
        [Tokenizer.END_TAG_TOKEN]: endTagInSelectInTable,
        [Tokenizer.EOF_TOKEN]: eofInBody
    },
    [IN_TEMPLATE_MODE]: {
        [Tokenizer.CHARACTER_TOKEN]: characterInBody,
        [Tokenizer.NULL_CHARACTER_TOKEN]: ignoreToken,
        [Tokenizer.WHITESPACE_CHARACTER_TOKEN]: whitespaceCharacterInBody,
        [Tokenizer.COMMENT_TOKEN]: appendComment,
        [Tokenizer.DOCTYPE_TOKEN]: ignoreToken,
        [Tokenizer.START_TAG_TOKEN]: startTagInTemplate,
        [Tokenizer.END_TAG_TOKEN]: endTagInTemplate,
        [Tokenizer.EOF_TOKEN]: eofInTemplate
    },
    [AFTER_BODY_MODE]: {
        [Tokenizer.CHARACTER_TOKEN]: tokenAfterBody,
        [Tokenizer.NULL_CHARACTER_TOKEN]: tokenAfterBody,
        [Tokenizer.WHITESPACE_CHARACTER_TOKEN]: whitespaceCharacterInBody,
        [Tokenizer.COMMENT_TOKEN]: appendCommentToRootHtmlElement,
        [Tokenizer.DOCTYPE_TOKEN]: ignoreToken,
        [Tokenizer.START_TAG_TOKEN]: startTagAfterBody,
        [Tokenizer.END_TAG_TOKEN]: endTagAfterBody,
        [Tokenizer.EOF_TOKEN]: stopParsing
    },
    [IN_FRAMESET_MODE]: {
        [Tokenizer.CHARACTER_TOKEN]: ignoreToken,
        [Tokenizer.NULL_CHARACTER_TOKEN]: ignoreToken,
        [Tokenizer.WHITESPACE_CHARACTER_TOKEN]: insertCharacters,
        [Tokenizer.COMMENT_TOKEN]: appendComment,
        [Tokenizer.DOCTYPE_TOKEN]: ignoreToken,
        [Tokenizer.START_TAG_TOKEN]: startTagInFrameset,
        [Tokenizer.END_TAG_TOKEN]: endTagInFrameset,
        [Tokenizer.EOF_TOKEN]: stopParsing
    },
    [AFTER_FRAMESET_MODE]: {
        [Tokenizer.CHARACTER_TOKEN]: ignoreToken,
        [Tokenizer.NULL_CHARACTER_TOKEN]: ignoreToken,
        [Tokenizer.WHITESPACE_CHARACTER_TOKEN]: insertCharacters,
        [Tokenizer.COMMENT_TOKEN]: appendComment,
        [Tokenizer.DOCTYPE_TOKEN]: ignoreToken,
        [Tokenizer.START_TAG_TOKEN]: startTagAfterFrameset,
        [Tokenizer.END_TAG_TOKEN]: endTagAfterFrameset,
        [Tokenizer.EOF_TOKEN]: stopParsing
    },
    [AFTER_AFTER_BODY_MODE]: {
        [Tokenizer.CHARACTER_TOKEN]: tokenAfterAfterBody,
        [Tokenizer.NULL_CHARACTER_TOKEN]: tokenAfterAfterBody,
        [Tokenizer.WHITESPACE_CHARACTER_TOKEN]: whitespaceCharacterInBody,
        [Tokenizer.COMMENT_TOKEN]: appendCommentToDocument,
        [Tokenizer.DOCTYPE_TOKEN]: ignoreToken,
        [Tokenizer.START_TAG_TOKEN]: startTagAfterAfterBody,
        [Tokenizer.END_TAG_TOKEN]: tokenAfterAfterBody,
        [Tokenizer.EOF_TOKEN]: stopParsing
    },
    [AFTER_AFTER_FRAMESET_MODE]: {
        [Tokenizer.CHARACTER_TOKEN]: ignoreToken,
        [Tokenizer.NULL_CHARACTER_TOKEN]: ignoreToken,
        [Tokenizer.WHITESPACE_CHARACTER_TOKEN]: whitespaceCharacterInBody,
        [Tokenizer.COMMENT_TOKEN]: appendCommentToDocument,
        [Tokenizer.DOCTYPE_TOKEN]: ignoreToken,
        [Tokenizer.START_TAG_TOKEN]: startTagAfterAfterFrameset,
        [Tokenizer.END_TAG_TOKEN]: ignoreToken,
        [Tokenizer.EOF_TOKEN]: stopParsing
    }
};

//Parser
class Parser {
    constructor(options) {
        this.options = mergeOptions(DEFAULT_OPTIONS, options);

        this.treeAdapter = this.options.treeAdapter;
        this.pendingScript = null;

        if (this.options.sourceCodeLocationInfo) {
            Mixin.install(this, LocationInfoParserMixin);
        }

        if (this.options.onParseError) {
            Mixin.install(this, ErrorReportingParserMixin, { onParseError: this.options.onParseError });
        }
    }

    // API
    parse(html) {
        const document = this.treeAdapter.createDocument();

        this._bootstrap(document, null);
        this.tokenizer.write(html, true);
        this._runParsingLoop(null);

        return document;
    }

    parseFragment(html, fragmentContext) {
        //NOTE: use <template> element as a fragment context if context element was not provided,
        //so we will parse in "forgiving" manner
        if (!fragmentContext) {
            fragmentContext = this.treeAdapter.createElement($.TEMPLATE, NS.HTML, []);
        }

        //NOTE: create fake element which will be used as 'document' for fragment parsing.
        //This is important for jsdom there 'document' can't be recreated, therefore
        //fragment parsing causes messing of the main `document`.
        const documentMock = this.treeAdapter.createElement('documentmock', NS.HTML, []);

        this._bootstrap(documentMock, fragmentContext);

        if (this.treeAdapter.getTagName(fragmentContext) === $.TEMPLATE) {
            this._pushTmplInsertionMode(IN_TEMPLATE_MODE);
        }

        this._initTokenizerForFragmentParsing();
        this._insertFakeRootElement();
        this._resetInsertionMode();
        this._findFormInFragmentContext();
        this.tokenizer.write(html, true);
        this._runParsingLoop(null);

        const rootElement = this.treeAdapter.getFirstChild(documentMock);
        const fragment = this.treeAdapter.createDocumentFragment();

        this._adoptNodes(rootElement, fragment);

        return fragment;
    }

    //Bootstrap parser
    _bootstrap(document, fragmentContext) {
        this.tokenizer = new Tokenizer(this.options);

        this.stopped = false;

        this.insertionMode = INITIAL_MODE;
        this.originalInsertionMode = '';

        this.document = document;
        this.fragmentContext = fragmentContext;

        this.headElement = null;
        this.formElement = null;

        this.openElements = new OpenElementStack(this.document, this.treeAdapter);
        this.activeFormattingElements = new FormattingElementList(this.treeAdapter);

        this.tmplInsertionModeStack = [];
        this.tmplInsertionModeStackTop = -1;
        this.currentTmplInsertionMode = null;

        this.pendingCharacterTokens = [];
        this.hasNonWhitespacePendingCharacterToken = false;

        this.framesetOk = true;
        this.skipNextNewLine = false;
        this.fosterParentingEnabled = false;
    }

    //Errors
    _err() {
        // NOTE: err reporting is noop by default. Enabled by mixin.
    }

    //Parsing loop
    _runParsingLoop(scriptHandler) {
        while (!this.stopped) {
            this._setupTokenizerCDATAMode();

            const token = this.tokenizer.getNextToken();

            if (token.type === Tokenizer.HIBERNATION_TOKEN) {
                break;
            }

            if (this.skipNextNewLine) {
                this.skipNextNewLine = false;

                if (token.type === Tokenizer.WHITESPACE_CHARACTER_TOKEN && token.chars[0] === '\n') {
                    if (token.chars.length === 1) {
                        continue;
                    }

                    token.chars = token.chars.substr(1);
                }
            }

            this._processInputToken(token);

            if (scriptHandler && this.pendingScript) {
                break;
            }
        }
    }

    runParsingLoopForCurrentChunk(writeCallback, scriptHandler) {
        this._runParsingLoop(scriptHandler);

        if (scriptHandler && this.pendingScript) {
            const script = this.pendingScript;

            this.pendingScript = null;

            scriptHandler(script);

            return;
        }

        if (writeCallback) {
            writeCallback();
        }
    }

    //Text parsing
    _setupTokenizerCDATAMode() {
        const current = this._getAdjustedCurrentElement();

        this.tokenizer.allowCDATA =
            current &&
            current !== this.document &&
            this.treeAdapter.getNamespaceURI(current) !== NS.HTML &&
            !this._isIntegrationPoint(current);
    }

    _switchToTextParsing(currentToken, nextTokenizerState) {
        this._insertElement(currentToken, NS.HTML);
        this.tokenizer.state = nextTokenizerState;
        this.originalInsertionMode = this.insertionMode;
        this.insertionMode = TEXT_MODE;
    }

    switchToPlaintextParsing() {
        this.insertionMode = TEXT_MODE;
        this.originalInsertionMode = IN_BODY_MODE;
        this.tokenizer.state = Tokenizer.MODE.PLAINTEXT;
    }

    //Fragment parsing
    _getAdjustedCurrentElement() {
        return this.openElements.stackTop === 0 && this.fragmentContext
            ? this.fragmentContext
            : this.openElements.current;
    }

    _findFormInFragmentContext() {
        let node = this.fragmentContext;

        do {
            if (this.treeAdapter.getTagName(node) === $.FORM) {
                this.formElement = node;
                break;
            }

            node = this.treeAdapter.getParentNode(node);
        } while (node);
    }

    _initTokenizerForFragmentParsing() {
        if (this.treeAdapter.getNamespaceURI(this.fragmentContext) === NS.HTML) {
            const tn = this.treeAdapter.getTagName(this.fragmentContext);

            if (tn === $.TITLE || tn === $.TEXTAREA) {
                this.tokenizer.state = Tokenizer.MODE.RCDATA;
            } else if (
                tn === $.STYLE ||
                tn === $.XMP ||
                tn === $.IFRAME ||
                tn === $.NOEMBED ||
                tn === $.NOFRAMES ||
                tn === $.NOSCRIPT
            ) {
                this.tokenizer.state = Tokenizer.MODE.RAWTEXT;
            } else if (tn === $.SCRIPT) {
                this.tokenizer.state = Tokenizer.MODE.SCRIPT_DATA;
            } else if (tn === $.PLAINTEXT) {
                this.tokenizer.state = Tokenizer.MODE.PLAINTEXT;
            }
        }
    }

    //Tree mutation
    _setDocumentType(token) {
        const name = token.name || '';
        const publicId = token.publicId || '';
        const systemId = token.systemId || '';

        this.treeAdapter.setDocumentType(this.document, name, publicId, systemId);
    }

    _attachElementToTree(element) {
        if (this._shouldFosterParentOnInsertion()) {
            this._fosterParentElement(element);
        } else {
            const parent = this.openElements.currentTmplContent || this.openElements.current;

            this.treeAdapter.appendChild(parent, element);
        }
    }

    _appendElement(token, namespaceURI) {
        const element = this.treeAdapter.createElement(token.tagName, namespaceURI, token.attrs);

        this._attachElementToTree(element);
    }

    _insertElement(token, namespaceURI) {
        const element = this.treeAdapter.createElement(token.tagName, namespaceURI, token.attrs);

        this._attachElementToTree(element);
        this.openElements.push(element);
    }

    _insertFakeElement(tagName) {
        const element = this.treeAdapter.createElement(tagName, NS.HTML, []);

        this._attachElementToTree(element);
        this.openElements.push(element);
    }

    _insertTemplate(token) {
        const tmpl = this.treeAdapter.createElement(token.tagName, NS.HTML, token.attrs);
        const content = this.treeAdapter.createDocumentFragment();

        this.treeAdapter.setTemplateContent(tmpl, content);
        this._attachElementToTree(tmpl);
        this.openElements.push(tmpl);
    }

    _insertFakeRootElement() {
        const element = this.treeAdapter.createElement($.HTML, NS.HTML, []);

        this.treeAdapter.appendChild(this.openElements.current, element);
        this.openElements.push(element);
    }

    _appendCommentNode(token, parent) {
        const commentNode = this.treeAdapter.createCommentNode(token.data);

        this.treeAdapter.appendChild(parent, commentNode);
    }

    _insertCharacters(token) {
        if (this._shouldFosterParentOnInsertion()) {
            this._fosterParentText(token.chars);
        } else {
            const parent = this.openElements.currentTmplContent || this.openElements.current;

            this.treeAdapter.insertText(parent, token.chars);
        }
    }

    _adoptNodes(donor, recipient) {
        for (let child = this.treeAdapter.getFirstChild(donor); child; child = this.treeAdapter.getFirstChild(donor)) {
            this.treeAdapter.detachNode(child);
            this.treeAdapter.appendChild(recipient, child);
        }
    }

    //Token processing
    _shouldProcessTokenInForeignContent(token) {
        const current = this._getAdjustedCurrentElement();

        if (!current || current === this.document) {
            return false;
        }

        const ns = this.treeAdapter.getNamespaceURI(current);

        if (ns === NS.HTML) {
            return false;
        }

        if (
            this.treeAdapter.getTagName(current) === $.ANNOTATION_XML &&
            ns === NS.MATHML &&
            token.type === Tokenizer.START_TAG_TOKEN &&
            token.tagName === $.SVG
        ) {
            return false;
        }

        const isCharacterToken =
            token.type === Tokenizer.CHARACTER_TOKEN ||
            token.type === Tokenizer.NULL_CHARACTER_TOKEN ||
            token.type === Tokenizer.WHITESPACE_CHARACTER_TOKEN;

        const isMathMLTextStartTag =
            token.type === Tokenizer.START_TAG_TOKEN && token.tagName !== $.MGLYPH && token.tagName !== $.MALIGNMARK;

        if ((isMathMLTextStartTag || isCharacterToken) && this._isIntegrationPoint(current, NS.MATHML)) {
            return false;
        }

        if (
            (token.type === Tokenizer.START_TAG_TOKEN || isCharacterToken) &&
            this._isIntegrationPoint(current, NS.HTML)
        ) {
            return false;
        }

        return token.type !== Tokenizer.EOF_TOKEN;
    }

    _processToken(token) {
        TOKEN_HANDLERS[this.insertionMode][token.type](this, token);
    }

    _processTokenInBodyMode(token) {
        TOKEN_HANDLERS[IN_BODY_MODE][token.type](this, token);
    }

    _processTokenInForeignContent(token) {
        if (token.type === Tokenizer.CHARACTER_TOKEN) {
            characterInForeignContent(this, token);
        } else if (token.type === Tokenizer.NULL_CHARACTER_TOKEN) {
            nullCharacterInForeignContent(this, token);
        } else if (token.type === Tokenizer.WHITESPACE_CHARACTER_TOKEN) {
            insertCharacters(this, token);
        } else if (token.type === Tokenizer.COMMENT_TOKEN) {
            appendComment(this, token);
        } else if (token.type === Tokenizer.START_TAG_TOKEN) {
            startTagInForeignContent(this, token);
        } else if (token.type === Tokenizer.END_TAG_TOKEN) {
            endTagInForeignContent(this, token);
        }
    }

    _processInputToken(token) {
        if (this._shouldProcessTokenInForeignContent(token)) {
            this._processTokenInForeignContent(token);
        } else {
            this._processToken(token);
        }

        if (token.type === Tokenizer.START_TAG_TOKEN && token.selfClosing && !token.ackSelfClosing) {
            this._err(ERR.nonVoidHtmlElementStartTagWithTrailingSolidus);
        }
    }

    //Integration points
    _isIntegrationPoint(element, foreignNS) {
        const tn = this.treeAdapter.getTagName(element);
        const ns = this.treeAdapter.getNamespaceURI(element);
        const attrs = this.treeAdapter.getAttrList(element);

        return foreignContent.isIntegrationPoint(tn, ns, attrs, foreignNS);
    }

    //Active formatting elements reconstruction
    _reconstructActiveFormattingElements() {
        const listLength = this.activeFormattingElements.length;

        if (listLength) {
            let unopenIdx = listLength;
            let entry = null;

            do {
                unopenIdx--;
                entry = this.activeFormattingElements.entries[unopenIdx];

                if (entry.type === FormattingElementList.MARKER_ENTRY || this.openElements.contains(entry.element)) {
                    unopenIdx++;
                    break;
                }
            } while (unopenIdx > 0);

            for (let i = unopenIdx; i < listLength; i++) {
                entry = this.activeFormattingElements.entries[i];
                this._insertElement(entry.token, this.treeAdapter.getNamespaceURI(entry.element));
                entry.element = this.openElements.current;
            }
        }
    }

    //Close elements
    _closeTableCell() {
        this.openElements.generateImpliedEndTags();
        this.openElements.popUntilTableCellPopped();
        this.activeFormattingElements.clearToLastMarker();
        this.insertionMode = IN_ROW_MODE;
    }

    _closePElement() {
        this.openElements.generateImpliedEndTagsWithExclusion($.P);
        this.openElements.popUntilTagNamePopped($.P);
    }

    //Insertion modes
    _resetInsertionMode() {
        for (let i = this.openElements.stackTop, last = false; i >= 0; i--) {
            let element = this.openElements.items[i];

            if (i === 0) {
                last = true;

                if (this.fragmentContext) {
                    element = this.fragmentContext;
                }
            }

            const tn = this.treeAdapter.getTagName(element);
            const newInsertionMode = INSERTION_MODE_RESET_MAP[tn];

            if (newInsertionMode) {
                this.insertionMode = newInsertionMode;
                break;
            } else if (!last && (tn === $.TD || tn === $.TH)) {
                this.insertionMode = IN_CELL_MODE;
                break;
            } else if (!last && tn === $.HEAD) {
                this.insertionMode = IN_HEAD_MODE;
                break;
            } else if (tn === $.SELECT) {
                this._resetInsertionModeForSelect(i);
                break;
            } else if (tn === $.TEMPLATE) {
                this.insertionMode = this.currentTmplInsertionMode;
                break;
            } else if (tn === $.HTML) {
                this.insertionMode = this.headElement ? AFTER_HEAD_MODE : BEFORE_HEAD_MODE;
                break;
            } else if (last) {
                this.insertionMode = IN_BODY_MODE;
                break;
            }
        }
    }

    _resetInsertionModeForSelect(selectIdx) {
        if (selectIdx > 0) {
            for (let i = selectIdx - 1; i > 0; i--) {
                const ancestor = this.openElements.items[i];
                const tn = this.treeAdapter.getTagName(ancestor);

                if (tn === $.TEMPLATE) {
                    break;
                } else if (tn === $.TABLE) {
                    this.insertionMode = IN_SELECT_IN_TABLE_MODE;
                    return;
                }
            }
        }

        this.insertionMode = IN_SELECT_MODE;
    }

    _pushTmplInsertionMode(mode) {
        this.tmplInsertionModeStack.push(mode);
        this.tmplInsertionModeStackTop++;
        this.currentTmplInsertionMode = mode;
    }

    _popTmplInsertionMode() {
        this.tmplInsertionModeStack.pop();
        this.tmplInsertionModeStackTop--;
        this.currentTmplInsertionMode = this.tmplInsertionModeStack[this.tmplInsertionModeStackTop];
    }

    //Foster parenting
    _isElementCausesFosterParenting(element) {
        const tn = this.treeAdapter.getTagName(element);

        return tn === $.TABLE || tn === $.TBODY || tn === $.TFOOT || tn === $.THEAD || tn === $.TR;
    }

    _shouldFosterParentOnInsertion() {
        return this.fosterParentingEnabled && this._isElementCausesFosterParenting(this.openElements.current);
    }

    _findFosterParentingLocation() {
        const location = {
            parent: null,
            beforeElement: null
        };

        for (let i = this.openElements.stackTop; i >= 0; i--) {
            const openElement = this.openElements.items[i];
            const tn = this.treeAdapter.getTagName(openElement);
            const ns = this.treeAdapter.getNamespaceURI(openElement);

            if (tn === $.TEMPLATE && ns === NS.HTML) {
                location.parent = this.treeAdapter.getTemplateContent(openElement);
                break;
            } else if (tn === $.TABLE) {
                location.parent = this.treeAdapter.getParentNode(openElement);

                if (location.parent) {
                    location.beforeElement = openElement;
                } else {
                    location.parent = this.openElements.items[i - 1];
                }

                break;
            }
        }

        if (!location.parent) {
            location.parent = this.openElements.items[0];
        }

        return location;
    }

    _fosterParentElement(element) {
        const location = this._findFosterParentingLocation();

        if (location.beforeElement) {
            this.treeAdapter.insertBefore(location.parent, element, location.beforeElement);
        } else {
            this.treeAdapter.appendChild(location.parent, element);
        }
    }

    _fosterParentText(chars) {
        const location = this._findFosterParentingLocation();

        if (location.beforeElement) {
            this.treeAdapter.insertTextBefore(location.parent, chars, location.beforeElement);
        } else {
            this.treeAdapter.insertText(location.parent, chars);
        }
    }

    //Special elements
    _isSpecialElement(element) {
        const tn = this.treeAdapter.getTagName(element);
        const ns = this.treeAdapter.getNamespaceURI(element);

        return HTML.SPECIAL_ELEMENTS[ns][tn];
    }
}

module.exports = Parser;

//Adoption agency algorithm
//(see: http://www.whatwg.org/specs/web-apps/current-work/multipage/tree-construction.html#adoptionAgency)
//------------------------------------------------------------------

//Steps 5-8 of the algorithm
function aaObtainFormattingElementEntry(p, token) {
    let formattingElementEntry = p.activeFormattingElements.getElementEntryInScopeWithTagName(token.tagName);

    if (formattingElementEntry) {
        if (!p.openElements.contains(formattingElementEntry.element)) {
            p.activeFormattingElements.removeEntry(formattingElementEntry);
            formattingElementEntry = null;
        } else if (!p.openElements.hasInScope(token.tagName)) {
            formattingElementEntry = null;
        }
    } else {
        genericEndTagInBody(p, token);
    }

    return formattingElementEntry;
}

//Steps 9 and 10 of the algorithm
function aaObtainFurthestBlock(p, formattingElementEntry) {
    let furthestBlock = null;

    for (let i = p.openElements.stackTop; i >= 0; i--) {
        const element = p.openElements.items[i];

        if (element === formattingElementEntry.element) {
            break;
        }

        if (p._isSpecialElement(element)) {
            furthestBlock = element;
        }
    }

    if (!furthestBlock) {
        p.openElements.popUntilElementPopped(formattingElementEntry.element);
        p.activeFormattingElements.removeEntry(formattingElementEntry);
    }

    return furthestBlock;
}

//Step 13 of the algorithm
function aaInnerLoop(p, furthestBlock, formattingElement) {
    let lastElement = furthestBlock;
    let nextElement = p.openElements.getCommonAncestor(furthestBlock);

    for (let i = 0, element = nextElement; element !== formattingElement; i++, element = nextElement) {
        //NOTE: store next element for the next loop iteration (it may be deleted from the stack by step 9.5)
        nextElement = p.openElements.getCommonAncestor(element);

        const elementEntry = p.activeFormattingElements.getElementEntry(element);
        const counterOverflow = elementEntry && i >= AA_INNER_LOOP_ITER;
        const shouldRemoveFromOpenElements = !elementEntry || counterOverflow;

        if (shouldRemoveFromOpenElements) {
            if (counterOverflow) {
                p.activeFormattingElements.removeEntry(elementEntry);
            }

            p.openElements.remove(element);
        } else {
            element = aaRecreateElementFromEntry(p, elementEntry);

            if (lastElement === furthestBlock) {
                p.activeFormattingElements.bookmark = elementEntry;
            }

            p.treeAdapter.detachNode(lastElement);
            p.treeAdapter.appendChild(element, lastElement);
            lastElement = element;
        }
    }

    return lastElement;
}

//Step 13.7 of the algorithm
function aaRecreateElementFromEntry(p, elementEntry) {
    const ns = p.treeAdapter.getNamespaceURI(elementEntry.element);
    const newElement = p.treeAdapter.createElement(elementEntry.token.tagName, ns, elementEntry.token.attrs);

    p.openElements.replace(elementEntry.element, newElement);
    elementEntry.element = newElement;

    return newElement;
}

//Step 14 of the algorithm
function aaInsertLastNodeInCommonAncestor(p, commonAncestor, lastElement) {
    if (p._isElementCausesFosterParenting(commonAncestor)) {
        p._fosterParentElement(lastElement);
    } else {
        const tn = p.treeAdapter.getTagName(commonAncestor);
        const ns = p.treeAdapter.getNamespaceURI(commonAncestor);

        if (tn === $.TEMPLATE && ns === NS.HTML) {
            commonAncestor = p.treeAdapter.getTemplateContent(commonAncestor);
        }

        p.treeAdapter.appendChild(commonAncestor, lastElement);
    }
}

//Steps 15-19 of the algorithm
function aaReplaceFormattingElement(p, furthestBlock, formattingElementEntry) {
    const ns = p.treeAdapter.getNamespaceURI(formattingElementEntry.element);
    const token = formattingElementEntry.token;
    const newElement = p.treeAdapter.createElement(token.tagName, ns, token.attrs);

    p._adoptNodes(furthestBlock, newElement);
    p.treeAdapter.appendChild(furthestBlock, newElement);

    p.activeFormattingElements.insertElementAfterBookmark(newElement, formattingElementEntry.token);
    p.activeFormattingElements.removeEntry(formattingElementEntry);

    p.openElements.remove(formattingElementEntry.element);
    p.openElements.insertAfter(furthestBlock, newElement);
}

//Algorithm entry point
function callAdoptionAgency(p, token) {
    let formattingElementEntry;

    for (let i = 0; i < AA_OUTER_LOOP_ITER; i++) {
        formattingElementEntry = aaObtainFormattingElementEntry(p, token, formattingElementEntry);

        if (!formattingElementEntry) {
            break;
        }

        const furthestBlock = aaObtainFurthestBlock(p, formattingElementEntry);

        if (!furthestBlock) {
            break;
        }

        p.activeFormattingElements.bookmark = formattingElementEntry;

        const lastElement = aaInnerLoop(p, furthestBlock, formattingElementEntry.element);
        const commonAncestor = p.openElements.getCommonAncestor(formattingElementEntry.element);

        p.treeAdapter.detachNode(lastElement);
        aaInsertLastNodeInCommonAncestor(p, commonAncestor, lastElement);
        aaReplaceFormattingElement(p, furthestBlock, formattingElementEntry);
    }
}

//Generic token handlers
//------------------------------------------------------------------
function ignoreToken() {
    //NOTE: do nothing =)
}

function misplacedDoctype(p) {
    p._err(ERR.misplacedDoctype);
}

function appendComment(p, token) {
    p._appendCommentNode(token, p.openElements.currentTmplContent || p.openElements.current);
}

function appendCommentToRootHtmlElement(p, token) {
    p._appendCommentNode(token, p.openElements.items[0]);
}

function appendCommentToDocument(p, token) {
    p._appendCommentNode(token, p.document);
}

function insertCharacters(p, token) {
    p._insertCharacters(token);
}

function stopParsing(p) {
    p.stopped = true;
}

// The "initial" insertion mode
//------------------------------------------------------------------
function doctypeInInitialMode(p, token) {
    p._setDocumentType(token);

    const mode = token.forceQuirks ? HTML.DOCUMENT_MODE.QUIRKS : doctype.getDocumentMode(token);

    if (!doctype.isConforming(token)) {
        p._err(ERR.nonConformingDoctype);
    }

    p.treeAdapter.setDocumentMode(p.document, mode);

    p.insertionMode = BEFORE_HTML_MODE;
}

function tokenInInitialMode(p, token) {
    p._err(ERR.missingDoctype, { beforeToken: true });
    p.treeAdapter.setDocumentMode(p.document, HTML.DOCUMENT_MODE.QUIRKS);
    p.insertionMode = BEFORE_HTML_MODE;
    p._processToken(token);
}

// The "before html" insertion mode
//------------------------------------------------------------------
function startTagBeforeHtml(p, token) {
    if (token.tagName === $.HTML) {
        p._insertElement(token, NS.HTML);
        p.insertionMode = BEFORE_HEAD_MODE;
    } else {
        tokenBeforeHtml(p, token);
    }
}

function endTagBeforeHtml(p, token) {
    const tn = token.tagName;

    if (tn === $.HTML || tn === $.HEAD || tn === $.BODY || tn === $.BR) {
        tokenBeforeHtml(p, token);
    }
}

function tokenBeforeHtml(p, token) {
    p._insertFakeRootElement();
    p.insertionMode = BEFORE_HEAD_MODE;
    p._processToken(token);
}

// The "before head" insertion mode
//------------------------------------------------------------------
function startTagBeforeHead(p, token) {
    const tn = token.tagName;

    if (tn === $.HTML) {
        startTagInBody(p, token);
    } else if (tn === $.HEAD) {
        p._insertElement(token, NS.HTML);
        p.headElement = p.openElements.current;
        p.insertionMode = IN_HEAD_MODE;
    } else {
        tokenBeforeHead(p, token);
    }
}

function endTagBeforeHead(p, token) {
    const tn = token.tagName;

    if (tn === $.HEAD || tn === $.BODY || tn === $.HTML || tn === $.BR) {
        tokenBeforeHead(p, token);
    } else {
        p._err(ERR.endTagWithoutMatchingOpenElement);
    }
}

function tokenBeforeHead(p, token) {
    p._insertFakeElement($.HEAD);
    p.headElement = p.openElements.current;
    p.insertionMode = IN_HEAD_MODE;
    p._processToken(token);
}

// The "in head" insertion mode
//------------------------------------------------------------------
function startTagInHead(p, token) {
    const tn = token.tagName;

    if (tn === $.HTML) {
        startTagInBody(p, token);
    } else if (tn === $.BASE || tn === $.BASEFONT || tn === $.BGSOUND || tn === $.LINK || tn === $.META) {
        p._appendElement(token, NS.HTML);
        token.ackSelfClosing = true;
    } else if (tn === $.TITLE) {
        p._switchToTextParsing(token, Tokenizer.MODE.RCDATA);
    } else if (tn === $.NOSCRIPT) {
        if (p.options.scriptingEnabled) {
            p._switchToTextParsing(token, Tokenizer.MODE.RAWTEXT);
        } else {
            p._insertElement(token, NS.HTML);
            p.insertionMode = IN_HEAD_NO_SCRIPT_MODE;
        }
    } else if (tn === $.NOFRAMES || tn === $.STYLE) {
        p._switchToTextParsing(token, Tokenizer.MODE.RAWTEXT);
    } else if (tn === $.SCRIPT) {
        p._switchToTextParsing(token, Tokenizer.MODE.SCRIPT_DATA);
    } else if (tn === $.TEMPLATE) {
        p._insertTemplate(token, NS.HTML);
        p.activeFormattingElements.insertMarker();
        p.framesetOk = false;
        p.insertionMode = IN_TEMPLATE_MODE;
        p._pushTmplInsertionMode(IN_TEMPLATE_MODE);
    } else if (tn === $.HEAD) {
        p._err(ERR.misplacedStartTagForHeadElement);
    } else {
        tokenInHead(p, token);
    }
}

function endTagInHead(p, token) {
    const tn = token.tagName;

    if (tn === $.HEAD) {
        p.openElements.pop();
        p.insertionMode = AFTER_HEAD_MODE;
    } else if (tn === $.BODY || tn === $.BR || tn === $.HTML) {
        tokenInHead(p, token);
    } else if (tn === $.TEMPLATE) {
        if (p.openElements.tmplCount > 0) {
            p.openElements.generateImpliedEndTagsThoroughly();

            if (p.openElements.currentTagName !== $.TEMPLATE) {
                p._err(ERR.closingOfElementWithOpenChildElements);
            }

            p.openElements.popUntilTagNamePopped($.TEMPLATE);
            p.activeFormattingElements.clearToLastMarker();
            p._popTmplInsertionMode();
            p._resetInsertionMode();
        } else {
            p._err(ERR.endTagWithoutMatchingOpenElement);
        }
    } else {
        p._err(ERR.endTagWithoutMatchingOpenElement);
    }
}

function tokenInHead(p, token) {
    p.openElements.pop();
    p.insertionMode = AFTER_HEAD_MODE;
    p._processToken(token);
}

// The "in head no script" insertion mode
//------------------------------------------------------------------
function startTagInHeadNoScript(p, token) {
    const tn = token.tagName;

    if (tn === $.HTML) {
        startTagInBody(p, token);
    } else if (
        tn === $.BASEFONT ||
        tn === $.BGSOUND ||
        tn === $.HEAD ||
        tn === $.LINK ||
        tn === $.META ||
        tn === $.NOFRAMES ||
        tn === $.STYLE
    ) {
        startTagInHead(p, token);
    } else if (tn === $.NOSCRIPT) {
        p._err(ERR.nestedNoscriptInHead);
    } else {
        tokenInHeadNoScript(p, token);
    }
}

function endTagInHeadNoScript(p, token) {
    const tn = token.tagName;

    if (tn === $.NOSCRIPT) {
        p.openElements.pop();
        p.insertionMode = IN_HEAD_MODE;
    } else if (tn === $.BR) {
        tokenInHeadNoScript(p, token);
    } else {
        p._err(ERR.endTagWithoutMatchingOpenElement);
    }
}

function tokenInHeadNoScript(p, token) {
    const errCode =
        token.type === Tokenizer.EOF_TOKEN ? ERR.openElementsLeftAfterEof : ERR.disallowedContentInNoscriptInHead;

    p._err(errCode);
    p.openElements.pop();
    p.insertionMode = IN_HEAD_MODE;
    p._processToken(token);
}

// The "after head" insertion mode
//------------------------------------------------------------------
function startTagAfterHead(p, token) {
    const tn = token.tagName;

    if (tn === $.HTML) {
        startTagInBody(p, token);
    } else if (tn === $.BODY) {
        p._insertElement(token, NS.HTML);
        p.framesetOk = false;
        p.insertionMode = IN_BODY_MODE;
    } else if (tn === $.FRAMESET) {
        p._insertElement(token, NS.HTML);
        p.insertionMode = IN_FRAMESET_MODE;
    } else if (
        tn === $.BASE ||
        tn === $.BASEFONT ||
        tn === $.BGSOUND ||
        tn === $.LINK ||
        tn === $.META ||
        tn === $.NOFRAMES ||
        tn === $.SCRIPT ||
        tn === $.STYLE ||
        tn === $.TEMPLATE ||
        tn === $.TITLE
    ) {
        p._err(ERR.abandonedHeadElementChild);
        p.openElements.push(p.headElement);
        startTagInHead(p, token);
        p.openElements.remove(p.headElement);
    } else if (tn === $.HEAD) {
        p._err(ERR.misplacedStartTagForHeadElement);
    } else {
        tokenAfterHead(p, token);
    }
}

function endTagAfterHead(p, token) {
    const tn = token.tagName;

    if (tn === $.BODY || tn === $.HTML || tn === $.BR) {
        tokenAfterHead(p, token);
    } else if (tn === $.TEMPLATE) {
        endTagInHead(p, token);
    } else {
        p._err(ERR.endTagWithoutMatchingOpenElement);
    }
}

function tokenAfterHead(p, token) {
    p._insertFakeElement($.BODY);
    p.insertionMode = IN_BODY_MODE;
    p._processToken(token);
}

// The "in body" insertion mode
//------------------------------------------------------------------
function whitespaceCharacterInBody(p, token) {
    p._reconstructActiveFormattingElements();
    p._insertCharacters(token);
}

function characterInBody(p, token) {
    p._reconstructActiveFormattingElements();
    p._insertCharacters(token);
    p.framesetOk = false;
}

function htmlStartTagInBody(p, token) {
    if (p.openElements.tmplCount === 0) {
        p.treeAdapter.adoptAttributes(p.openElements.items[0], token.attrs);
    }
}

function bodyStartTagInBody(p, token) {
    const bodyElement = p.openElements.tryPeekProperlyNestedBodyElement();

    if (bodyElement && p.openElements.tmplCount === 0) {
        p.framesetOk = false;
        p.treeAdapter.adoptAttributes(bodyElement, token.attrs);
    }
}

function framesetStartTagInBody(p, token) {
    const bodyElement = p.openElements.tryPeekProperlyNestedBodyElement();

    if (p.framesetOk && bodyElement) {
        p.treeAdapter.detachNode(bodyElement);
        p.openElements.popAllUpToHtmlElement();
        p._insertElement(token, NS.HTML);
        p.insertionMode = IN_FRAMESET_MODE;
    }
}

function addressStartTagInBody(p, token) {
    if (p.openElements.hasInButtonScope($.P)) {
        p._closePElement();
    }

    p._insertElement(token, NS.HTML);
}

function numberedHeaderStartTagInBody(p, token) {
    if (p.openElements.hasInButtonScope($.P)) {
        p._closePElement();
    }

    const tn = p.openElements.currentTagName;

    if (tn === $.H1 || tn === $.H2 || tn === $.H3 || tn === $.H4 || tn === $.H5 || tn === $.H6) {
        p.openElements.pop();
    }

    p._insertElement(token, NS.HTML);
}

function preStartTagInBody(p, token) {
    if (p.openElements.hasInButtonScope($.P)) {
        p._closePElement();
    }

    p._insertElement(token, NS.HTML);
    //NOTE: If the next token is a U+000A LINE FEED (LF) character token, then ignore that token and move
    //on to the next one. (Newlines at the start of pre blocks are ignored as an authoring convenience.)
    p.skipNextNewLine = true;
    p.framesetOk = false;
}

function formStartTagInBody(p, token) {
    const inTemplate = p.openElements.tmplCount > 0;

    if (!p.formElement || inTemplate) {
        if (p.openElements.hasInButtonScope($.P)) {
            p._closePElement();
        }

        p._insertElement(token, NS.HTML);

        if (!inTemplate) {
            p.formElement = p.openElements.current;
        }
    }
}

function listItemStartTagInBody(p, token) {
    p.framesetOk = false;

    const tn = token.tagName;

    for (let i = p.openElements.stackTop; i >= 0; i--) {
        const element = p.openElements.items[i];
        const elementTn = p.treeAdapter.getTagName(element);
        let closeTn = null;

        if (tn === $.LI && elementTn === $.LI) {
            closeTn = $.LI;
        } else if ((tn === $.DD || tn === $.DT) && (elementTn === $.DD || elementTn === $.DT)) {
            closeTn = elementTn;
        }

        if (closeTn) {
            p.openElements.generateImpliedEndTagsWithExclusion(closeTn);
            p.openElements.popUntilTagNamePopped(closeTn);
            break;
        }

        if (elementTn !== $.ADDRESS && elementTn !== $.DIV && elementTn !== $.P && p._isSpecialElement(element)) {
            break;
        }
    }

    if (p.openElements.hasInButtonScope($.P)) {
        p._closePElement();
    }

    p._insertElement(token, NS.HTML);
}

function plaintextStartTagInBody(p, token) {
    if (p.openElements.hasInButtonScope($.P)) {
        p._closePElement();
    }

    p._insertElement(token, NS.HTML);
    p.tokenizer.state = Tokenizer.MODE.PLAINTEXT;
}

function buttonStartTagInBody(p, token) {
    if (p.openElements.hasInScope($.BUTTON)) {
        p.openElements.generateImpliedEndTags();
        p.openElements.popUntilTagNamePopped($.BUTTON);
    }

    p._reconstructActiveFormattingElements();
    p._insertElement(token, NS.HTML);
    p.framesetOk = false;
}

function aStartTagInBody(p, token) {
    const activeElementEntry = p.activeFormattingElements.getElementEntryInScopeWithTagName($.A);

    if (activeElementEntry) {
        callAdoptionAgency(p, token);
        p.openElements.remove(activeElementEntry.element);
        p.activeFormattingElements.removeEntry(activeElementEntry);
    }

    p._reconstructActiveFormattingElements();
    p._insertElement(token, NS.HTML);
    p.activeFormattingElements.pushElement(p.openElements.current, token);
}

function bStartTagInBody(p, token) {
    p._reconstructActiveFormattingElements();
    p._insertElement(token, NS.HTML);
    p.activeFormattingElements.pushElement(p.openElements.current, token);
}

function nobrStartTagInBody(p, token) {
    p._reconstructActiveFormattingElements();

    if (p.openElements.hasInScope($.NOBR)) {
        callAdoptionAgency(p, token);
        p._reconstructActiveFormattingElements();
    }

    p._insertElement(token, NS.HTML);
    p.activeFormattingElements.pushElement(p.openElements.current, token);
}

function appletStartTagInBody(p, token) {
    p._reconstructActiveFormattingElements();
    p._insertElement(token, NS.HTML);
    p.activeFormattingElements.insertMarker();
    p.framesetOk = false;
}

function tableStartTagInBody(p, token) {
    if (
        p.treeAdapter.getDocumentMode(p.document) !== HTML.DOCUMENT_MODE.QUIRKS &&
        p.openElements.hasInButtonScope($.P)
    ) {
        p._closePElement();
    }

    p._insertElement(token, NS.HTML);
    p.framesetOk = false;
    p.insertionMode = IN_TABLE_MODE;
}

function areaStartTagInBody(p, token) {
    p._reconstructActiveFormattingElements();
    p._appendElement(token, NS.HTML);
    p.framesetOk = false;
    token.ackSelfClosing = true;
}

function inputStartTagInBody(p, token) {
    p._reconstructActiveFormattingElements();
    p._appendElement(token, NS.HTML);

    const inputType = Tokenizer.getTokenAttr(token, ATTRS.TYPE);

    if (!inputType || inputType.toLowerCase() !== HIDDEN_INPUT_TYPE) {
        p.framesetOk = false;
    }

    token.ackSelfClosing = true;
}

function paramStartTagInBody(p, token) {
    p._appendElement(token, NS.HTML);
    token.ackSelfClosing = true;
}

function hrStartTagInBody(p, token) {
    if (p.openElements.hasInButtonScope($.P)) {
        p._closePElement();
    }

    p._appendElement(token, NS.HTML);
    p.framesetOk = false;
    p.ackSelfClosing = true;
}

function imageStartTagInBody(p, token) {
    token.tagName = $.IMG;
    areaStartTagInBody(p, token);
}

function textareaStartTagInBody(p, token) {
    p._insertElement(token, NS.HTML);
    //NOTE: If the next token is a U+000A LINE FEED (LF) character token, then ignore that token and move
    //on to the next one. (Newlines at the start of textarea elements are ignored as an authoring convenience.)
    p.skipNextNewLine = true;
    p.tokenizer.state = Tokenizer.MODE.RCDATA;
    p.originalInsertionMode = p.insertionMode;
    p.framesetOk = false;
    p.insertionMode = TEXT_MODE;
}

function xmpStartTagInBody(p, token) {
    if (p.openElements.hasInButtonScope($.P)) {
        p._closePElement();
    }

    p._reconstructActiveFormattingElements();
    p.framesetOk = false;
    p._switchToTextParsing(token, Tokenizer.MODE.RAWTEXT);
}

function iframeStartTagInBody(p, token) {
    p.framesetOk = false;
    p._switchToTextParsing(token, Tokenizer.MODE.RAWTEXT);
}

//NOTE: here we assume that we always act as an user agent with enabled plugins, so we parse
//<noembed> as a rawtext.
function noembedStartTagInBody(p, token) {
    p._switchToTextParsing(token, Tokenizer.MODE.RAWTEXT);
}

function selectStartTagInBody(p, token) {
    p._reconstructActiveFormattingElements();
    p._insertElement(token, NS.HTML);
    p.framesetOk = false;

    if (
        p.insertionMode === IN_TABLE_MODE ||
        p.insertionMode === IN_CAPTION_MODE ||
        p.insertionMode === IN_TABLE_BODY_MODE ||
        p.insertionMode === IN_ROW_MODE ||
        p.insertionMode === IN_CELL_MODE
    ) {
        p.insertionMode = IN_SELECT_IN_TABLE_MODE;
    } else {
        p.insertionMode = IN_SELECT_MODE;
    }
}

function optgroupStartTagInBody(p, token) {
    if (p.openElements.currentTagName === $.OPTION) {
        p.openElements.pop();
    }

    p._reconstructActiveFormattingElements();
    p._insertElement(token, NS.HTML);
}

function rbStartTagInBody(p, token) {
    if (p.openElements.hasInScope($.RUBY)) {
        p.openElements.generateImpliedEndTags();
    }

    p._insertElement(token, NS.HTML);
}

function rtStartTagInBody(p, token) {
    if (p.openElements.hasInScope($.RUBY)) {
        p.openElements.generateImpliedEndTagsWithExclusion($.RTC);
    }

    p._insertElement(token, NS.HTML);
}

function menuStartTagInBody(p, token) {
    if (p.openElements.hasInButtonScope($.P)) {
        p._closePElement();
    }

    p._insertElement(token, NS.HTML);
}

function mathStartTagInBody(p, token) {
    p._reconstructActiveFormattingElements();

    foreignContent.adjustTokenMathMLAttrs(token);
    foreignContent.adjustTokenXMLAttrs(token);

    if (token.selfClosing) {
        p._appendElement(token, NS.MATHML);
    } else {
        p._insertElement(token, NS.MATHML);
    }

    token.ackSelfClosing = true;
}

function svgStartTagInBody(p, token) {
    p._reconstructActiveFormattingElements();

    foreignContent.adjustTokenSVGAttrs(token);
    foreignContent.adjustTokenXMLAttrs(token);

    if (token.selfClosing) {
        p._appendElement(token, NS.SVG);
    } else {
        p._insertElement(token, NS.SVG);
    }

    token.ackSelfClosing = true;
}

function genericStartTagInBody(p, token) {
    p._reconstructActiveFormattingElements();
    p._insertElement(token, NS.HTML);
}

//OPTIMIZATION: Integer comparisons are low-cost, so we can use very fast tag name length filters here.
//It's faster than using dictionary.
function startTagInBody(p, token) {
    const tn = token.tagName;

    switch (tn.length) {
        case 1:
            if (tn === $.I || tn === $.S || tn === $.B || tn === $.U) {
                bStartTagInBody(p, token);
            } else if (tn === $.P) {
                addressStartTagInBody(p, token);
            } else if (tn === $.A) {
                aStartTagInBody(p, token);
            } else {
                genericStartTagInBody(p, token);
            }

            break;

        case 2:
            if (tn === $.DL || tn === $.OL || tn === $.UL) {
                addressStartTagInBody(p, token);
            } else if (tn === $.H1 || tn === $.H2 || tn === $.H3 || tn === $.H4 || tn === $.H5 || tn === $.H6) {
                numberedHeaderStartTagInBody(p, token);
            } else if (tn === $.LI || tn === $.DD || tn === $.DT) {
                listItemStartTagInBody(p, token);
            } else if (tn === $.EM || tn === $.TT) {
                bStartTagInBody(p, token);
            } else if (tn === $.BR) {
                areaStartTagInBody(p, token);
            } else if (tn === $.HR) {
                hrStartTagInBody(p, token);
            } else if (tn === $.RB) {
                rbStartTagInBody(p, token);
            } else if (tn === $.RT || tn === $.RP) {
                rtStartTagInBody(p, token);
            } else if (tn !== $.TH && tn !== $.TD && tn !== $.TR) {
                genericStartTagInBody(p, token);
            }

            break;

        case 3:
            if (tn === $.DIV || tn === $.DIR || tn === $.NAV) {
                addressStartTagInBody(p, token);
            } else if (tn === $.PRE) {
                preStartTagInBody(p, token);
            } else if (tn === $.BIG) {
                bStartTagInBody(p, token);
            } else if (tn === $.IMG || tn === $.WBR) {
                areaStartTagInBody(p, token);
            } else if (tn === $.XMP) {
                xmpStartTagInBody(p, token);
            } else if (tn === $.SVG) {
                svgStartTagInBody(p, token);
            } else if (tn === $.RTC) {
                rbStartTagInBody(p, token);
            } else if (tn !== $.COL) {
                genericStartTagInBody(p, token);
            }

            break;

        case 4:
            if (tn === $.HTML) {
                htmlStartTagInBody(p, token);
            } else if (tn === $.BASE || tn === $.LINK || tn === $.META) {
                startTagInHead(p, token);
            } else if (tn === $.BODY) {
                bodyStartTagInBody(p, token);
            } else if (tn === $.MAIN || tn === $.MENU) {
                addressStartTagInBody(p, token);
            } else if (tn === $.FORM) {
                formStartTagInBody(p, token);
            } else if (tn === $.CODE || tn === $.FONT) {
                bStartTagInBody(p, token);
            } else if (tn === $.NOBR) {
                nobrStartTagInBody(p, token);
            } else if (tn === $.AREA) {
                areaStartTagInBody(p, token);
            } else if (tn === $.MATH) {
                mathStartTagInBody(p, token);
            } else if (tn === $.MENU) {
                menuStartTagInBody(p, token);
            } else if (tn !== $.HEAD) {
                genericStartTagInBody(p, token);
            }

            break;

        case 5:
            if (tn === $.STYLE || tn === $.TITLE) {
                startTagInHead(p, token);
            } else if (tn === $.ASIDE) {
                addressStartTagInBody(p, token);
            } else if (tn === $.SMALL) {
                bStartTagInBody(p, token);
            } else if (tn === $.TABLE) {
                tableStartTagInBody(p, token);
            } else if (tn === $.EMBED) {
                areaStartTagInBody(p, token);
            } else if (tn === $.INPUT) {
                inputStartTagInBody(p, token);
            } else if (tn === $.PARAM || tn === $.TRACK) {
                paramStartTagInBody(p, token);
            } else if (tn === $.IMAGE) {
                imageStartTagInBody(p, token);
            } else if (tn !== $.FRAME && tn !== $.TBODY && tn !== $.TFOOT && tn !== $.THEAD) {
                genericStartTagInBody(p, token);
            }

            break;

        case 6:
            if (tn === $.SCRIPT) {
                startTagInHead(p, token);
            } else if (
                tn === $.CENTER ||
                tn === $.FIGURE ||
                tn === $.FOOTER ||
                tn === $.HEADER ||
                tn === $.HGROUP ||
                tn === $.DIALOG
            ) {
                addressStartTagInBody(p, token);
            } else if (tn === $.BUTTON) {
                buttonStartTagInBody(p, token);
            } else if (tn === $.STRIKE || tn === $.STRONG) {
                bStartTagInBody(p, token);
            } else if (tn === $.APPLET || tn === $.OBJECT) {
                appletStartTagInBody(p, token);
            } else if (tn === $.KEYGEN) {
                areaStartTagInBody(p, token);
            } else if (tn === $.SOURCE) {
                paramStartTagInBody(p, token);
            } else if (tn === $.IFRAME) {
                iframeStartTagInBody(p, token);
            } else if (tn === $.SELECT) {
                selectStartTagInBody(p, token);
            } else if (tn === $.OPTION) {
                optgroupStartTagInBody(p, token);
            } else {
                genericStartTagInBody(p, token);
            }

            break;

        case 7:
            if (tn === $.BGSOUND) {
                startTagInHead(p, token);
            } else if (
                tn === $.DETAILS ||
                tn === $.ADDRESS ||
                tn === $.ARTICLE ||
                tn === $.SECTION ||
                tn === $.SUMMARY
            ) {
                addressStartTagInBody(p, token);
            } else if (tn === $.LISTING) {
                preStartTagInBody(p, token);
            } else if (tn === $.MARQUEE) {
                appletStartTagInBody(p, token);
            } else if (tn === $.NOEMBED) {
                noembedStartTagInBody(p, token);
            } else if (tn !== $.CAPTION) {
                genericStartTagInBody(p, token);
            }

            break;

        case 8:
            if (tn === $.BASEFONT) {
                startTagInHead(p, token);
            } else if (tn === $.FRAMESET) {
                framesetStartTagInBody(p, token);
            } else if (tn === $.FIELDSET) {
                addressStartTagInBody(p, token);
            } else if (tn === $.TEXTAREA) {
                textareaStartTagInBody(p, token);
            } else if (tn === $.TEMPLATE) {
                startTagInHead(p, token);
            } else if (tn === $.NOSCRIPT) {
                if (p.options.scriptingEnabled) {
                    noembedStartTagInBody(p, token);
                } else {
                    genericStartTagInBody(p, token);
                }
            } else if (tn === $.OPTGROUP) {
                optgroupStartTagInBody(p, token);
            } else if (tn !== $.COLGROUP) {
                genericStartTagInBody(p, token);
            }

            break;

        case 9:
            if (tn === $.PLAINTEXT) {
                plaintextStartTagInBody(p, token);
            } else {
                genericStartTagInBody(p, token);
            }

            break;

        case 10:
            if (tn === $.BLOCKQUOTE || tn === $.FIGCAPTION) {
                addressStartTagInBody(p, token);
            } else {
                genericStartTagInBody(p, token);
            }

            break;

        default:
            genericStartTagInBody(p, token);
    }
}

function bodyEndTagInBody(p) {
    if (p.openElements.hasInScope($.BODY)) {
        p.insertionMode = AFTER_BODY_MODE;
    }
}

function htmlEndTagInBody(p, token) {
    if (p.openElements.hasInScope($.BODY)) {
        p.insertionMode = AFTER_BODY_MODE;
        p._processToken(token);
    }
}

function addressEndTagInBody(p, token) {
    const tn = token.tagName;

    if (p.openElements.hasInScope(tn)) {
        p.openElements.generateImpliedEndTags();
        p.openElements.popUntilTagNamePopped(tn);
    }
}

function formEndTagInBody(p) {
    const inTemplate = p.openElements.tmplCount > 0;
    const formElement = p.formElement;

    if (!inTemplate) {
        p.formElement = null;
    }

    if ((formElement || inTemplate) && p.openElements.hasInScope($.FORM)) {
        p.openElements.generateImpliedEndTags();

        if (inTemplate) {
            p.openElements.popUntilTagNamePopped($.FORM);
        } else {
            p.openElements.remove(formElement);
        }
    }
}

function pEndTagInBody(p) {
    if (!p.openElements.hasInButtonScope($.P)) {
        p._insertFakeElement($.P);
    }

    p._closePElement();
}

function liEndTagInBody(p) {
    if (p.openElements.hasInListItemScope($.LI)) {
        p.openElements.generateImpliedEndTagsWithExclusion($.LI);
        p.openElements.popUntilTagNamePopped($.LI);
    }
}

function ddEndTagInBody(p, token) {
    const tn = token.tagName;

    if (p.openElements.hasInScope(tn)) {
        p.openElements.generateImpliedEndTagsWithExclusion(tn);
        p.openElements.popUntilTagNamePopped(tn);
    }
}

function numberedHeaderEndTagInBody(p) {
    if (p.openElements.hasNumberedHeaderInScope()) {
        p.openElements.generateImpliedEndTags();
        p.openElements.popUntilNumberedHeaderPopped();
    }
}

function appletEndTagInBody(p, token) {
    const tn = token.tagName;

    if (p.openElements.hasInScope(tn)) {
        p.openElements.generateImpliedEndTags();
        p.openElements.popUntilTagNamePopped(tn);
        p.activeFormattingElements.clearToLastMarker();
    }
}

function brEndTagInBody(p) {
    p._reconstructActiveFormattingElements();
    p._insertFakeElement($.BR);
    p.openElements.pop();
    p.framesetOk = false;
}

function genericEndTagInBody(p, token) {
    const tn = token.tagName;

    for (let i = p.openElements.stackTop; i > 0; i--) {
        const element = p.openElements.items[i];

        if (p.treeAdapter.getTagName(element) === tn) {
            p.openElements.generateImpliedEndTagsWithExclusion(tn);
            p.openElements.popUntilElementPopped(element);
            break;
        }

        if (p._isSpecialElement(element)) {
            break;
        }
    }
}

//OPTIMIZATION: Integer comparisons are low-cost, so we can use very fast tag name length filters here.
//It's faster than using dictionary.
function endTagInBody(p, token) {
    const tn = token.tagName;

    switch (tn.length) {
        case 1:
            if (tn === $.A || tn === $.B || tn === $.I || tn === $.S || tn === $.U) {
                callAdoptionAgency(p, token);
            } else if (tn === $.P) {
                pEndTagInBody(p, token);
            } else {
                genericEndTagInBody(p, token);
            }

            break;

        case 2:
            if (tn === $.DL || tn === $.UL || tn === $.OL) {
                addressEndTagInBody(p, token);
            } else if (tn === $.LI) {
                liEndTagInBody(p, token);
            } else if (tn === $.DD || tn === $.DT) {
                ddEndTagInBody(p, token);
            } else if (tn === $.H1 || tn === $.H2 || tn === $.H3 || tn === $.H4 || tn === $.H5 || tn === $.H6) {
                numberedHeaderEndTagInBody(p, token);
            } else if (tn === $.BR) {
                brEndTagInBody(p, token);
            } else if (tn === $.EM || tn === $.TT) {
                callAdoptionAgency(p, token);
            } else {
                genericEndTagInBody(p, token);
            }

            break;

        case 3:
            if (tn === $.BIG) {
                callAdoptionAgency(p, token);
            } else if (tn === $.DIR || tn === $.DIV || tn === $.NAV || tn === $.PRE) {
                addressEndTagInBody(p, token);
            } else {
                genericEndTagInBody(p, token);
            }

            break;

        case 4:
            if (tn === $.BODY) {
                bodyEndTagInBody(p, token);
            } else if (tn === $.HTML) {
                htmlEndTagInBody(p, token);
            } else if (tn === $.FORM) {
                formEndTagInBody(p, token);
            } else if (tn === $.CODE || tn === $.FONT || tn === $.NOBR) {
                callAdoptionAgency(p, token);
            } else if (tn === $.MAIN || tn === $.MENU) {
                addressEndTagInBody(p, token);
            } else {
                genericEndTagInBody(p, token);
            }

            break;

        case 5:
            if (tn === $.ASIDE) {
                addressEndTagInBody(p, token);
            } else if (tn === $.SMALL) {
                callAdoptionAgency(p, token);
            } else {
                genericEndTagInBody(p, token);
            }

            break;

        case 6:
            if (
                tn === $.CENTER ||
                tn === $.FIGURE ||
                tn === $.FOOTER ||
                tn === $.HEADER ||
                tn === $.HGROUP ||
                tn === $.DIALOG
            ) {
                addressEndTagInBody(p, token);
            } else if (tn === $.APPLET || tn === $.OBJECT) {
                appletEndTagInBody(p, token);
            } else if (tn === $.STRIKE || tn === $.STRONG) {
                callAdoptionAgency(p, token);
            } else {
                genericEndTagInBody(p, token);
            }

            break;

        case 7:
            if (
                tn === $.ADDRESS ||
                tn === $.ARTICLE ||
                tn === $.DETAILS ||
                tn === $.SECTION ||
                tn === $.SUMMARY ||
                tn === $.LISTING
            ) {
                addressEndTagInBody(p, token);
            } else if (tn === $.MARQUEE) {
                appletEndTagInBody(p, token);
            } else {
                genericEndTagInBody(p, token);
            }

            break;

        case 8:
            if (tn === $.FIELDSET) {
                addressEndTagInBody(p, token);
            } else if (tn === $.TEMPLATE) {
                endTagInHead(p, token);
            } else {
                genericEndTagInBody(p, token);
            }

            break;

        case 10:
            if (tn === $.BLOCKQUOTE || tn === $.FIGCAPTION) {
                addressEndTagInBody(p, token);
            } else {
                genericEndTagInBody(p, token);
            }

            break;

        default:
            genericEndTagInBody(p, token);
    }
}

function eofInBody(p, token) {
    if (p.tmplInsertionModeStackTop > -1) {
        eofInTemplate(p, token);
    } else {
        p.stopped = true;
    }
}

// The "text" insertion mode
//------------------------------------------------------------------
function endTagInText(p, token) {
    if (token.tagName === $.SCRIPT) {
        p.pendingScript = p.openElements.current;
    }

    p.openElements.pop();
    p.insertionMode = p.originalInsertionMode;
}

function eofInText(p, token) {
    p._err(ERR.eofInElementThatCanContainOnlyText);
    p.openElements.pop();
    p.insertionMode = p.originalInsertionMode;
    p._processToken(token);
}

// The "in table" insertion mode
//------------------------------------------------------------------
function characterInTable(p, token) {
    const curTn = p.openElements.currentTagName;

    if (curTn === $.TABLE || curTn === $.TBODY || curTn === $.TFOOT || curTn === $.THEAD || curTn === $.TR) {
        p.pendingCharacterTokens = [];
        p.hasNonWhitespacePendingCharacterToken = false;
        p.originalInsertionMode = p.insertionMode;
        p.insertionMode = IN_TABLE_TEXT_MODE;
        p._processToken(token);
    } else {
        tokenInTable(p, token);
    }
}

function captionStartTagInTable(p, token) {
    p.openElements.clearBackToTableContext();
    p.activeFormattingElements.insertMarker();
    p._insertElement(token, NS.HTML);
    p.insertionMode = IN_CAPTION_MODE;
}

function colgroupStartTagInTable(p, token) {
    p.openElements.clearBackToTableContext();
    p._insertElement(token, NS.HTML);
    p.insertionMode = IN_COLUMN_GROUP_MODE;
}

function colStartTagInTable(p, token) {
    p.openElements.clearBackToTableContext();
    p._insertFakeElement($.COLGROUP);
    p.insertionMode = IN_COLUMN_GROUP_MODE;
    p._processToken(token);
}

function tbodyStartTagInTable(p, token) {
    p.openElements.clearBackToTableContext();
    p._insertElement(token, NS.HTML);
    p.insertionMode = IN_TABLE_BODY_MODE;
}

function tdStartTagInTable(p, token) {
    p.openElements.clearBackToTableContext();
    p._insertFakeElement($.TBODY);
    p.insertionMode = IN_TABLE_BODY_MODE;
    p._processToken(token);
}

function tableStartTagInTable(p, token) {
    if (p.openElements.hasInTableScope($.TABLE)) {
        p.openElements.popUntilTagNamePopped($.TABLE);
        p._resetInsertionMode();
        p._processToken(token);
    }
}

function inputStartTagInTable(p, token) {
    const inputType = Tokenizer.getTokenAttr(token, ATTRS.TYPE);

    if (inputType && inputType.toLowerCase() === HIDDEN_INPUT_TYPE) {
        p._appendElement(token, NS.HTML);
    } else {
        tokenInTable(p, token);
    }

    token.ackSelfClosing = true;
}

function formStartTagInTable(p, token) {
    if (!p.formElement && p.openElements.tmplCount === 0) {
        p._insertElement(token, NS.HTML);
        p.formElement = p.openElements.current;
        p.openElements.pop();
    }
}

function startTagInTable(p, token) {
    const tn = token.tagName;

    switch (tn.length) {
        case 2:
            if (tn === $.TD || tn === $.TH || tn === $.TR) {
                tdStartTagInTable(p, token);
            } else {
                tokenInTable(p, token);
            }

            break;

        case 3:
            if (tn === $.COL) {
                colStartTagInTable(p, token);
            } else {
                tokenInTable(p, token);
            }

            break;

        case 4:
            if (tn === $.FORM) {
                formStartTagInTable(p, token);
            } else {
                tokenInTable(p, token);
            }

            break;

        case 5:
            if (tn === $.TABLE) {
                tableStartTagInTable(p, token);
            } else if (tn === $.STYLE) {
                startTagInHead(p, token);
            } else if (tn === $.TBODY || tn === $.TFOOT || tn === $.THEAD) {
                tbodyStartTagInTable(p, token);
            } else if (tn === $.INPUT) {
                inputStartTagInTable(p, token);
            } else {
                tokenInTable(p, token);
            }

            break;

        case 6:
            if (tn === $.SCRIPT) {
                startTagInHead(p, token);
            } else {
                tokenInTable(p, token);
            }

            break;

        case 7:
            if (tn === $.CAPTION) {
                captionStartTagInTable(p, token);
            } else {
                tokenInTable(p, token);
            }

            break;

        case 8:
            if (tn === $.COLGROUP) {
                colgroupStartTagInTable(p, token);
            } else if (tn === $.TEMPLATE) {
                startTagInHead(p, token);
            } else {
                tokenInTable(p, token);
            }

            break;

        default:
            tokenInTable(p, token);
    }
}

function endTagInTable(p, token) {
    const tn = token.tagName;

    if (tn === $.TABLE) {
        if (p.openElements.hasInTableScope($.TABLE)) {
            p.openElements.popUntilTagNamePopped($.TABLE);
            p._resetInsertionMode();
        }
    } else if (tn === $.TEMPLATE) {
        endTagInHead(p, token);
    } else if (
        tn !== $.BODY &&
        tn !== $.CAPTION &&
        tn !== $.COL &&
        tn !== $.COLGROUP &&
        tn !== $.HTML &&
        tn !== $.TBODY &&
        tn !== $.TD &&
        tn !== $.TFOOT &&
        tn !== $.TH &&
        tn !== $.THEAD &&
        tn !== $.TR
    ) {
        tokenInTable(p, token);
    }
}

function tokenInTable(p, token) {
    const savedFosterParentingState = p.fosterParentingEnabled;

    p.fosterParentingEnabled = true;
    p._processTokenInBodyMode(token);
    p.fosterParentingEnabled = savedFosterParentingState;
}

// The "in table text" insertion mode
//------------------------------------------------------------------
function whitespaceCharacterInTableText(p, token) {
    p.pendingCharacterTokens.push(token);
}

function characterInTableText(p, token) {
    p.pendingCharacterTokens.push(token);
    p.hasNonWhitespacePendingCharacterToken = true;
}

function tokenInTableText(p, token) {
    let i = 0;

    if (p.hasNonWhitespacePendingCharacterToken) {
        for (; i < p.pendingCharacterTokens.length; i++) {
            tokenInTable(p, p.pendingCharacterTokens[i]);
        }
    } else {
        for (; i < p.pendingCharacterTokens.length; i++) {
            p._insertCharacters(p.pendingCharacterTokens[i]);
        }
    }

    p.insertionMode = p.originalInsertionMode;
    p._processToken(token);
}

// The "in caption" insertion mode
//------------------------------------------------------------------
function startTagInCaption(p, token) {
    const tn = token.tagName;

    if (
        tn === $.CAPTION ||
        tn === $.COL ||
        tn === $.COLGROUP ||
        tn === $.TBODY ||
        tn === $.TD ||
        tn === $.TFOOT ||
        tn === $.TH ||
        tn === $.THEAD ||
        tn === $.TR
    ) {
        if (p.openElements.hasInTableScope($.CAPTION)) {
            p.openElements.generateImpliedEndTags();
            p.openElements.popUntilTagNamePopped($.CAPTION);
            p.activeFormattingElements.clearToLastMarker();
            p.insertionMode = IN_TABLE_MODE;
            p._processToken(token);
        }
    } else {
        startTagInBody(p, token);
    }
}

function endTagInCaption(p, token) {
    const tn = token.tagName;

    if (tn === $.CAPTION || tn === $.TABLE) {
        if (p.openElements.hasInTableScope($.CAPTION)) {
            p.openElements.generateImpliedEndTags();
            p.openElements.popUntilTagNamePopped($.CAPTION);
            p.activeFormattingElements.clearToLastMarker();
            p.insertionMode = IN_TABLE_MODE;

            if (tn === $.TABLE) {
                p._processToken(token);
            }
        }
    } else if (
        tn !== $.BODY &&
        tn !== $.COL &&
        tn !== $.COLGROUP &&
        tn !== $.HTML &&
        tn !== $.TBODY &&
        tn !== $.TD &&
        tn !== $.TFOOT &&
        tn !== $.TH &&
        tn !== $.THEAD &&
        tn !== $.TR
    ) {
        endTagInBody(p, token);
    }
}

// The "in column group" insertion mode
//------------------------------------------------------------------
function startTagInColumnGroup(p, token) {
    const tn = token.tagName;

    if (tn === $.HTML) {
        startTagInBody(p, token);
    } else if (tn === $.COL) {
        p._appendElement(token, NS.HTML);
        token.ackSelfClosing = true;
    } else if (tn === $.TEMPLATE) {
        startTagInHead(p, token);
    } else {
        tokenInColumnGroup(p, token);
    }
}

function endTagInColumnGroup(p, token) {
    const tn = token.tagName;

    if (tn === $.COLGROUP) {
        if (p.openElements.currentTagName === $.COLGROUP) {
            p.openElements.pop();
            p.insertionMode = IN_TABLE_MODE;
        }
    } else if (tn === $.TEMPLATE) {
        endTagInHead(p, token);
    } else if (tn !== $.COL) {
        tokenInColumnGroup(p, token);
    }
}

function tokenInColumnGroup(p, token) {
    if (p.openElements.currentTagName === $.COLGROUP) {
        p.openElements.pop();
        p.insertionMode = IN_TABLE_MODE;
        p._processToken(token);
    }
}

// The "in table body" insertion mode
//------------------------------------------------------------------
function startTagInTableBody(p, token) {
    const tn = token.tagName;

    if (tn === $.TR) {
        p.openElements.clearBackToTableBodyContext();
        p._insertElement(token, NS.HTML);
        p.insertionMode = IN_ROW_MODE;
    } else if (tn === $.TH || tn === $.TD) {
        p.openElements.clearBackToTableBodyContext();
        p._insertFakeElement($.TR);
        p.insertionMode = IN_ROW_MODE;
        p._processToken(token);
    } else if (
        tn === $.CAPTION ||
        tn === $.COL ||
        tn === $.COLGROUP ||
        tn === $.TBODY ||
        tn === $.TFOOT ||
        tn === $.THEAD
    ) {
        if (p.openElements.hasTableBodyContextInTableScope()) {
            p.openElements.clearBackToTableBodyContext();
            p.openElements.pop();
            p.insertionMode = IN_TABLE_MODE;
            p._processToken(token);
        }
    } else {
        startTagInTable(p, token);
    }
}

function endTagInTableBody(p, token) {
    const tn = token.tagName;

    if (tn === $.TBODY || tn === $.TFOOT || tn === $.THEAD) {
        if (p.openElements.hasInTableScope(tn)) {
            p.openElements.clearBackToTableBodyContext();
            p.openElements.pop();
            p.insertionMode = IN_TABLE_MODE;
        }
    } else if (tn === $.TABLE) {
        if (p.openElements.hasTableBodyContextInTableScope()) {
            p.openElements.clearBackToTableBodyContext();
            p.openElements.pop();
            p.insertionMode = IN_TABLE_MODE;
            p._processToken(token);
        }
    } else if (
        (tn !== $.BODY && tn !== $.CAPTION && tn !== $.COL && tn !== $.COLGROUP) ||
        (tn !== $.HTML && tn !== $.TD && tn !== $.TH && tn !== $.TR)
    ) {
        endTagInTable(p, token);
    }
}

// The "in row" insertion mode
//------------------------------------------------------------------
function startTagInRow(p, token) {
    const tn = token.tagName;

    if (tn === $.TH || tn === $.TD) {
        p.openElements.clearBackToTableRowContext();
        p._insertElement(token, NS.HTML);
        p.insertionMode = IN_CELL_MODE;
        p.activeFormattingElements.insertMarker();
    } else if (
        tn === $.CAPTION ||
        tn === $.COL ||
        tn === $.COLGROUP ||
        tn === $.TBODY ||
        tn === $.TFOOT ||
        tn === $.THEAD ||
        tn === $.TR
    ) {
        if (p.openElements.hasInTableScope($.TR)) {
            p.openElements.clearBackToTableRowContext();
            p.openElements.pop();
            p.insertionMode = IN_TABLE_BODY_MODE;
            p._processToken(token);
        }
    } else {
        startTagInTable(p, token);
    }
}

function endTagInRow(p, token) {
    const tn = token.tagName;

    if (tn === $.TR) {
        if (p.openElements.hasInTableScope($.TR)) {
            p.openElements.clearBackToTableRowContext();
            p.openElements.pop();
            p.insertionMode = IN_TABLE_BODY_MODE;
        }
    } else if (tn === $.TABLE) {
        if (p.openElements.hasInTableScope($.TR)) {
            p.openElements.clearBackToTableRowContext();
            p.openElements.pop();
            p.insertionMode = IN_TABLE_BODY_MODE;
            p._processToken(token);
        }
    } else if (tn === $.TBODY || tn === $.TFOOT || tn === $.THEAD) {
        if (p.openElements.hasInTableScope(tn) || p.openElements.hasInTableScope($.TR)) {
            p.openElements.clearBackToTableRowContext();
            p.openElements.pop();
            p.insertionMode = IN_TABLE_BODY_MODE;
            p._processToken(token);
        }
    } else if (
        (tn !== $.BODY && tn !== $.CAPTION && tn !== $.COL && tn !== $.COLGROUP) ||
        (tn !== $.HTML && tn !== $.TD && tn !== $.TH)
    ) {
        endTagInTable(p, token);
    }
}

// The "in cell" insertion mode
//------------------------------------------------------------------
function startTagInCell(p, token) {
    const tn = token.tagName;

    if (
        tn === $.CAPTION ||
        tn === $.COL ||
        tn === $.COLGROUP ||
        tn === $.TBODY ||
        tn === $.TD ||
        tn === $.TFOOT ||
        tn === $.TH ||
        tn === $.THEAD ||
        tn === $.TR
    ) {
        if (p.openElements.hasInTableScope($.TD) || p.openElements.hasInTableScope($.TH)) {
            p._closeTableCell();
            p._processToken(token);
        }
    } else {
        startTagInBody(p, token);
    }
}

function endTagInCell(p, token) {
    const tn = token.tagName;

    if (tn === $.TD || tn === $.TH) {
        if (p.openElements.hasInTableScope(tn)) {
            p.openElements.generateImpliedEndTags();
            p.openElements.popUntilTagNamePopped(tn);
            p.activeFormattingElements.clearToLastMarker();
            p.insertionMode = IN_ROW_MODE;
        }
    } else if (tn === $.TABLE || tn === $.TBODY || tn === $.TFOOT || tn === $.THEAD || tn === $.TR) {
        if (p.openElements.hasInTableScope(tn)) {
            p._closeTableCell();
            p._processToken(token);
        }
    } else if (tn !== $.BODY && tn !== $.CAPTION && tn !== $.COL && tn !== $.COLGROUP && tn !== $.HTML) {
        endTagInBody(p, token);
    }
}

// The "in select" insertion mode
//------------------------------------------------------------------
function startTagInSelect(p, token) {
    const tn = token.tagName;

    if (tn === $.HTML) {
        startTagInBody(p, token);
    } else if (tn === $.OPTION) {
        if (p.openElements.currentTagName === $.OPTION) {
            p.openElements.pop();
        }

        p._insertElement(token, NS.HTML);
    } else if (tn === $.OPTGROUP) {
        if (p.openElements.currentTagName === $.OPTION) {
            p.openElements.pop();
        }

        if (p.openElements.currentTagName === $.OPTGROUP) {
            p.openElements.pop();
        }

        p._insertElement(token, NS.HTML);
    } else if (tn === $.INPUT || tn === $.KEYGEN || tn === $.TEXTAREA || tn === $.SELECT) {
        if (p.openElements.hasInSelectScope($.SELECT)) {
            p.openElements.popUntilTagNamePopped($.SELECT);
            p._resetInsertionMode();

            if (tn !== $.SELECT) {
                p._processToken(token);
            }
        }
    } else if (tn === $.SCRIPT || tn === $.TEMPLATE) {
        startTagInHead(p, token);
    }
}

function endTagInSelect(p, token) {
    const tn = token.tagName;

    if (tn === $.OPTGROUP) {
        const prevOpenElement = p.openElements.items[p.openElements.stackTop - 1];
        const prevOpenElementTn = prevOpenElement && p.treeAdapter.getTagName(prevOpenElement);

        if (p.openElements.currentTagName === $.OPTION && prevOpenElementTn === $.OPTGROUP) {
            p.openElements.pop();
        }

        if (p.openElements.currentTagName === $.OPTGROUP) {
            p.openElements.pop();
        }
    } else if (tn === $.OPTION) {
        if (p.openElements.currentTagName === $.OPTION) {
            p.openElements.pop();
        }
    } else if (tn === $.SELECT && p.openElements.hasInSelectScope($.SELECT)) {
        p.openElements.popUntilTagNamePopped($.SELECT);
        p._resetInsertionMode();
    } else if (tn === $.TEMPLATE) {
        endTagInHead(p, token);
    }
}

//12.2.5.4.17 The "in select in table" insertion mode
//------------------------------------------------------------------
function startTagInSelectInTable(p, token) {
    const tn = token.tagName;

    if (
        tn === $.CAPTION ||
        tn === $.TABLE ||
        tn === $.TBODY ||
        tn === $.TFOOT ||
        tn === $.THEAD ||
        tn === $.TR ||
        tn === $.TD ||
        tn === $.TH
    ) {
        p.openElements.popUntilTagNamePopped($.SELECT);
        p._resetInsertionMode();
        p._processToken(token);
    } else {
        startTagInSelect(p, token);
    }
}

function endTagInSelectInTable(p, token) {
    const tn = token.tagName;

    if (
        tn === $.CAPTION ||
        tn === $.TABLE ||
        tn === $.TBODY ||
        tn === $.TFOOT ||
        tn === $.THEAD ||
        tn === $.TR ||
        tn === $.TD ||
        tn === $.TH
    ) {
        if (p.openElements.hasInTableScope(tn)) {
            p.openElements.popUntilTagNamePopped($.SELECT);
            p._resetInsertionMode();
            p._processToken(token);
        }
    } else {
        endTagInSelect(p, token);
    }
}

// The "in template" insertion mode
//------------------------------------------------------------------
function startTagInTemplate(p, token) {
    const tn = token.tagName;

    if (
        tn === $.BASE ||
        tn === $.BASEFONT ||
        tn === $.BGSOUND ||
        tn === $.LINK ||
        tn === $.META ||
        tn === $.NOFRAMES ||
        tn === $.SCRIPT ||
        tn === $.STYLE ||
        tn === $.TEMPLATE ||
        tn === $.TITLE
    ) {
        startTagInHead(p, token);
    } else {
        const newInsertionMode = TEMPLATE_INSERTION_MODE_SWITCH_MAP[tn] || IN_BODY_MODE;

        p._popTmplInsertionMode();
        p._pushTmplInsertionMode(newInsertionMode);
        p.insertionMode = newInsertionMode;
        p._processToken(token);
    }
}

function endTagInTemplate(p, token) {
    if (token.tagName === $.TEMPLATE) {
        endTagInHead(p, token);
    }
}

function eofInTemplate(p, token) {
    if (p.openElements.tmplCount > 0) {
        p.openElements.popUntilTagNamePopped($.TEMPLATE);
        p.activeFormattingElements.clearToLastMarker();
        p._popTmplInsertionMode();
        p._resetInsertionMode();
        p._processToken(token);
    } else {
        p.stopped = true;
    }
}

// The "after body" insertion mode
//------------------------------------------------------------------
function startTagAfterBody(p, token) {
    if (token.tagName === $.HTML) {
        startTagInBody(p, token);
    } else {
        tokenAfterBody(p, token);
    }
}

function endTagAfterBody(p, token) {
    if (token.tagName === $.HTML) {
        if (!p.fragmentContext) {
            p.insertionMode = AFTER_AFTER_BODY_MODE;
        }
    } else {
        tokenAfterBody(p, token);
    }
}

function tokenAfterBody(p, token) {
    p.insertionMode = IN_BODY_MODE;
    p._processToken(token);
}

// The "in frameset" insertion mode
//------------------------------------------------------------------
function startTagInFrameset(p, token) {
    const tn = token.tagName;

    if (tn === $.HTML) {
        startTagInBody(p, token);
    } else if (tn === $.FRAMESET) {
        p._insertElement(token, NS.HTML);
    } else if (tn === $.FRAME) {
        p._appendElement(token, NS.HTML);
        token.ackSelfClosing = true;
    } else if (tn === $.NOFRAMES) {
        startTagInHead(p, token);
    }
}

function endTagInFrameset(p, token) {
    if (token.tagName === $.FRAMESET && !p.openElements.isRootHtmlElementCurrent()) {
        p.openElements.pop();

        if (!p.fragmentContext && p.openElements.currentTagName !== $.FRAMESET) {
            p.insertionMode = AFTER_FRAMESET_MODE;
        }
    }
}

// The "after frameset" insertion mode
//------------------------------------------------------------------
function startTagAfterFrameset(p, token) {
    const tn = token.tagName;

    if (tn === $.HTML) {
        startTagInBody(p, token);
    } else if (tn === $.NOFRAMES) {
        startTagInHead(p, token);
    }
}

function endTagAfterFrameset(p, token) {
    if (token.tagName === $.HTML) {
        p.insertionMode = AFTER_AFTER_FRAMESET_MODE;
    }
}

// The "after after body" insertion mode
//------------------------------------------------------------------
function startTagAfterAfterBody(p, token) {
    if (token.tagName === $.HTML) {
        startTagInBody(p, token);
    } else {
        tokenAfterAfterBody(p, token);
    }
}

function tokenAfterAfterBody(p, token) {
    p.insertionMode = IN_BODY_MODE;
    p._processToken(token);
}

// The "after after frameset" insertion mode
//------------------------------------------------------------------
function startTagAfterAfterFrameset(p, token) {
    const tn = token.tagName;

    if (tn === $.HTML) {
        startTagInBody(p, token);
    } else if (tn === $.NOFRAMES) {
        startTagInHead(p, token);
    }
}

// The rules for parsing tokens in foreign content
//------------------------------------------------------------------
function nullCharacterInForeignContent(p, token) {
    token.chars = unicode.REPLACEMENT_CHARACTER;
    p._insertCharacters(token);
}

function characterInForeignContent(p, token) {
    p._insertCharacters(token);
    p.framesetOk = false;
}

function startTagInForeignContent(p, token) {
    if (foreignContent.causesExit(token) && !p.fragmentContext) {
        while (
            p.treeAdapter.getNamespaceURI(p.openElements.current) !== NS.HTML &&
            !p._isIntegrationPoint(p.openElements.current)
        ) {
            p.openElements.pop();
        }

        p._processToken(token);
    } else {
        const current = p._getAdjustedCurrentElement();
        const currentNs = p.treeAdapter.getNamespaceURI(current);

        if (currentNs === NS.MATHML) {
            foreignContent.adjustTokenMathMLAttrs(token);
        } else if (currentNs === NS.SVG) {
            foreignContent.adjustTokenSVGTagName(token);
            foreignContent.adjustTokenSVGAttrs(token);
        }

        foreignContent.adjustTokenXMLAttrs(token);

        if (token.selfClosing) {
            p._appendElement(token, currentNs);
        } else {
            p._insertElement(token, currentNs);
        }

        token.ackSelfClosing = true;
    }
}

function endTagInForeignContent(p, token) {
    for (let i = p.openElements.stackTop; i > 0; i--) {
        const element = p.openElements.items[i];

        if (p.treeAdapter.getNamespaceURI(element) === NS.HTML) {
            p._processToken(token);
            break;
        }

        if (p.treeAdapter.getTagName(element).toLowerCase() === token.tagName) {
            p.openElements.popUntilElementPopped(element);
            break;
        }
    }
}

},{"../common/doctype":135,"../common/error-codes":136,"../common/foreign-content":137,"../common/html":138,"../common/unicode":139,"../extensions/error-reporting/parser-mixin":141,"../extensions/location-info/parser-mixin":145,"../tokenizer":151,"../tree-adapters/default":154,"../utils/merge-options":155,"../utils/mixin":156,"./formatting-element-list":148,"./open-element-stack":150}],150:[function(require,module,exports){
'use strict';

const HTML = require('../common/html');

//Aliases
const $ = HTML.TAG_NAMES;
const NS = HTML.NAMESPACES;

//Element utils

//OPTIMIZATION: Integer comparisons are low-cost, so we can use very fast tag name length filters here.
//It's faster than using dictionary.
function isImpliedEndTagRequired(tn) {
    switch (tn.length) {
        case 1:
            return tn === $.P;

        case 2:
            return tn === $.RB || tn === $.RP || tn === $.RT || tn === $.DD || tn === $.DT || tn === $.LI;

        case 3:
            return tn === $.RTC;

        case 6:
            return tn === $.OPTION;

        case 8:
            return tn === $.OPTGROUP;
    }

    return false;
}

function isImpliedEndTagRequiredThoroughly(tn) {
    switch (tn.length) {
        case 1:
            return tn === $.P;

        case 2:
            return (
                tn === $.RB ||
                tn === $.RP ||
                tn === $.RT ||
                tn === $.DD ||
                tn === $.DT ||
                tn === $.LI ||
                tn === $.TD ||
                tn === $.TH ||
                tn === $.TR
            );

        case 3:
            return tn === $.RTC;

        case 5:
            return tn === $.TBODY || tn === $.TFOOT || tn === $.THEAD;

        case 6:
            return tn === $.OPTION;

        case 7:
            return tn === $.CAPTION;

        case 8:
            return tn === $.OPTGROUP || tn === $.COLGROUP;
    }

    return false;
}

function isScopingElement(tn, ns) {
    switch (tn.length) {
        case 2:
            if (tn === $.TD || tn === $.TH) {
                return ns === NS.HTML;
            } else if (tn === $.MI || tn === $.MO || tn === $.MN || tn === $.MS) {
                return ns === NS.MATHML;
            }

            break;

        case 4:
            if (tn === $.HTML) {
                return ns === NS.HTML;
            } else if (tn === $.DESC) {
                return ns === NS.SVG;
            }

            break;

        case 5:
            if (tn === $.TABLE) {
                return ns === NS.HTML;
            } else if (tn === $.MTEXT) {
                return ns === NS.MATHML;
            } else if (tn === $.TITLE) {
                return ns === NS.SVG;
            }

            break;

        case 6:
            return (tn === $.APPLET || tn === $.OBJECT) && ns === NS.HTML;

        case 7:
            return (tn === $.CAPTION || tn === $.MARQUEE) && ns === NS.HTML;

        case 8:
            return tn === $.TEMPLATE && ns === NS.HTML;

        case 13:
            return tn === $.FOREIGN_OBJECT && ns === NS.SVG;

        case 14:
            return tn === $.ANNOTATION_XML && ns === NS.MATHML;
    }

    return false;
}

//Stack of open elements
class OpenElementStack {
    constructor(document, treeAdapter) {
        this.stackTop = -1;
        this.items = [];
        this.current = document;
        this.currentTagName = null;
        this.currentTmplContent = null;
        this.tmplCount = 0;
        this.treeAdapter = treeAdapter;
    }

    //Index of element
    _indexOf(element) {
        let idx = -1;

        for (let i = this.stackTop; i >= 0; i--) {
            if (this.items[i] === element) {
                idx = i;
                break;
            }
        }
        return idx;
    }

    //Update current element
    _isInTemplate() {
        return this.currentTagName === $.TEMPLATE && this.treeAdapter.getNamespaceURI(this.current) === NS.HTML;
    }

    _updateCurrentElement() {
        this.current = this.items[this.stackTop];
        this.currentTagName = this.current && this.treeAdapter.getTagName(this.current);

        this.currentTmplContent = this._isInTemplate() ? this.treeAdapter.getTemplateContent(this.current) : null;
    }

    //Mutations
    push(element) {
        this.items[++this.stackTop] = element;
        this._updateCurrentElement();

        if (this._isInTemplate()) {
            this.tmplCount++;
        }
    }

    pop() {
        this.stackTop--;

        if (this.tmplCount > 0 && this._isInTemplate()) {
            this.tmplCount--;
        }

        this._updateCurrentElement();
    }

    replace(oldElement, newElement) {
        const idx = this._indexOf(oldElement);

        this.items[idx] = newElement;

        if (idx === this.stackTop) {
            this._updateCurrentElement();
        }
    }

    insertAfter(referenceElement, newElement) {
        const insertionIdx = this._indexOf(referenceElement) + 1;

        this.items.splice(insertionIdx, 0, newElement);

        if (insertionIdx === ++this.stackTop) {
            this._updateCurrentElement();
        }
    }

    popUntilTagNamePopped(tagName) {
        while (this.stackTop > -1) {
            const tn = this.currentTagName;
            const ns = this.treeAdapter.getNamespaceURI(this.current);

            this.pop();

            if (tn === tagName && ns === NS.HTML) {
                break;
            }
        }
    }

    popUntilElementPopped(element) {
        while (this.stackTop > -1) {
            const poppedElement = this.current;

            this.pop();

            if (poppedElement === element) {
                break;
            }
        }
    }

    popUntilNumberedHeaderPopped() {
        while (this.stackTop > -1) {
            const tn = this.currentTagName;
            const ns = this.treeAdapter.getNamespaceURI(this.current);

            this.pop();

            if (
                tn === $.H1 ||
                tn === $.H2 ||
                tn === $.H3 ||
                tn === $.H4 ||
                tn === $.H5 ||
                (tn === $.H6 && ns === NS.HTML)
            ) {
                break;
            }
        }
    }

    popUntilTableCellPopped() {
        while (this.stackTop > -1) {
            const tn = this.currentTagName;
            const ns = this.treeAdapter.getNamespaceURI(this.current);

            this.pop();

            if (tn === $.TD || (tn === $.TH && ns === NS.HTML)) {
                break;
            }
        }
    }

    popAllUpToHtmlElement() {
        //NOTE: here we assume that root <html> element is always first in the open element stack, so
        //we perform this fast stack clean up.
        this.stackTop = 0;
        this._updateCurrentElement();
    }

    clearBackToTableContext() {
        while (
            (this.currentTagName !== $.TABLE && this.currentTagName !== $.TEMPLATE && this.currentTagName !== $.HTML) ||
            this.treeAdapter.getNamespaceURI(this.current) !== NS.HTML
        ) {
            this.pop();
        }
    }

    clearBackToTableBodyContext() {
        while (
            (this.currentTagName !== $.TBODY &&
                this.currentTagName !== $.TFOOT &&
                this.currentTagName !== $.THEAD &&
                this.currentTagName !== $.TEMPLATE &&
                this.currentTagName !== $.HTML) ||
            this.treeAdapter.getNamespaceURI(this.current) !== NS.HTML
        ) {
            this.pop();
        }
    }

    clearBackToTableRowContext() {
        while (
            (this.currentTagName !== $.TR && this.currentTagName !== $.TEMPLATE && this.currentTagName !== $.HTML) ||
            this.treeAdapter.getNamespaceURI(this.current) !== NS.HTML
        ) {
            this.pop();
        }
    }

    remove(element) {
        for (let i = this.stackTop; i >= 0; i--) {
            if (this.items[i] === element) {
                this.items.splice(i, 1);
                this.stackTop--;
                this._updateCurrentElement();
                break;
            }
        }
    }

    //Search
    tryPeekProperlyNestedBodyElement() {
        //Properly nested <body> element (should be second element in stack).
        const element = this.items[1];

        return element && this.treeAdapter.getTagName(element) === $.BODY ? element : null;
    }

    contains(element) {
        return this._indexOf(element) > -1;
    }

    getCommonAncestor(element) {
        let elementIdx = this._indexOf(element);

        return --elementIdx >= 0 ? this.items[elementIdx] : null;
    }

    isRootHtmlElementCurrent() {
        return this.stackTop === 0 && this.currentTagName === $.HTML;
    }

    //Element in scope
    hasInScope(tagName) {
        for (let i = this.stackTop; i >= 0; i--) {
            const tn = this.treeAdapter.getTagName(this.items[i]);
            const ns = this.treeAdapter.getNamespaceURI(this.items[i]);

            if (tn === tagName && ns === NS.HTML) {
                return true;
            }

            if (isScopingElement(tn, ns)) {
                return false;
            }
        }

        return true;
    }

    hasNumberedHeaderInScope() {
        for (let i = this.stackTop; i >= 0; i--) {
            const tn = this.treeAdapter.getTagName(this.items[i]);
            const ns = this.treeAdapter.getNamespaceURI(this.items[i]);

            if (
                (tn === $.H1 || tn === $.H2 || tn === $.H3 || tn === $.H4 || tn === $.H5 || tn === $.H6) &&
                ns === NS.HTML
            ) {
                return true;
            }

            if (isScopingElement(tn, ns)) {
                return false;
            }
        }

        return true;
    }

    hasInListItemScope(tagName) {
        for (let i = this.stackTop; i >= 0; i--) {
            const tn = this.treeAdapter.getTagName(this.items[i]);
            const ns = this.treeAdapter.getNamespaceURI(this.items[i]);

            if (tn === tagName && ns === NS.HTML) {
                return true;
            }

            if (((tn === $.UL || tn === $.OL) && ns === NS.HTML) || isScopingElement(tn, ns)) {
                return false;
            }
        }

        return true;
    }

    hasInButtonScope(tagName) {
        for (let i = this.stackTop; i >= 0; i--) {
            const tn = this.treeAdapter.getTagName(this.items[i]);
            const ns = this.treeAdapter.getNamespaceURI(this.items[i]);

            if (tn === tagName && ns === NS.HTML) {
                return true;
            }

            if ((tn === $.BUTTON && ns === NS.HTML) || isScopingElement(tn, ns)) {
                return false;
            }
        }

        return true;
    }

    hasInTableScope(tagName) {
        for (let i = this.stackTop; i >= 0; i--) {
            const tn = this.treeAdapter.getTagName(this.items[i]);
            const ns = this.treeAdapter.getNamespaceURI(this.items[i]);

            if (ns !== NS.HTML) {
                continue;
            }

            if (tn === tagName) {
                return true;
            }

            if (tn === $.TABLE || tn === $.TEMPLATE || tn === $.HTML) {
                return false;
            }
        }

        return true;
    }

    hasTableBodyContextInTableScope() {
        for (let i = this.stackTop; i >= 0; i--) {
            const tn = this.treeAdapter.getTagName(this.items[i]);
            const ns = this.treeAdapter.getNamespaceURI(this.items[i]);

            if (ns !== NS.HTML) {
                continue;
            }

            if (tn === $.TBODY || tn === $.THEAD || tn === $.TFOOT) {
                return true;
            }

            if (tn === $.TABLE || tn === $.HTML) {
                return false;
            }
        }

        return true;
    }

    hasInSelectScope(tagName) {
        for (let i = this.stackTop; i >= 0; i--) {
            const tn = this.treeAdapter.getTagName(this.items[i]);
            const ns = this.treeAdapter.getNamespaceURI(this.items[i]);

            if (ns !== NS.HTML) {
                continue;
            }

            if (tn === tagName) {
                return true;
            }

            if (tn !== $.OPTION && tn !== $.OPTGROUP) {
                return false;
            }
        }

        return true;
    }

    //Implied end tags
    generateImpliedEndTags() {
        while (isImpliedEndTagRequired(this.currentTagName)) {
            this.pop();
        }
    }

    generateImpliedEndTagsThoroughly() {
        while (isImpliedEndTagRequiredThoroughly(this.currentTagName)) {
            this.pop();
        }
    }

    generateImpliedEndTagsWithExclusion(exclusionTagName) {
        while (isImpliedEndTagRequired(this.currentTagName) && this.currentTagName !== exclusionTagName) {
            this.pop();
        }
    }
}

module.exports = OpenElementStack;

},{"../common/html":138}],151:[function(require,module,exports){
'use strict';

const Preprocessor = require('./preprocessor');
const unicode = require('../common/unicode');
const neTree = require('./named-entity-data');
const ERR = require('../common/error-codes');

//Aliases
const $ = unicode.CODE_POINTS;
const $$ = unicode.CODE_POINT_SEQUENCES;

//C1 Unicode control character reference replacements
const C1_CONTROLS_REFERENCE_REPLACEMENTS = {
    0x80: 0x20ac,
    0x82: 0x201a,
    0x83: 0x0192,
    0x84: 0x201e,
    0x85: 0x2026,
    0x86: 0x2020,
    0x87: 0x2021,
    0x88: 0x02c6,
    0x89: 0x2030,
    0x8a: 0x0160,
    0x8b: 0x2039,
    0x8c: 0x0152,
    0x8e: 0x017d,
    0x91: 0x2018,
    0x92: 0x2019,
    0x93: 0x201c,
    0x94: 0x201d,
    0x95: 0x2022,
    0x96: 0x2013,
    0x97: 0x2014,
    0x98: 0x02dc,
    0x99: 0x2122,
    0x9a: 0x0161,
    0x9b: 0x203a,
    0x9c: 0x0153,
    0x9e: 0x017e,
    0x9f: 0x0178
};

// Named entity tree flags
const HAS_DATA_FLAG = 1 << 0;
const DATA_DUPLET_FLAG = 1 << 1;
const HAS_BRANCHES_FLAG = 1 << 2;
const MAX_BRANCH_MARKER_VALUE = HAS_DATA_FLAG | DATA_DUPLET_FLAG | HAS_BRANCHES_FLAG;

//States
const DATA_STATE = 'DATA_STATE';
const RCDATA_STATE = 'RCDATA_STATE';
const RAWTEXT_STATE = 'RAWTEXT_STATE';
const SCRIPT_DATA_STATE = 'SCRIPT_DATA_STATE';
const PLAINTEXT_STATE = 'PLAINTEXT_STATE';
const TAG_OPEN_STATE = 'TAG_OPEN_STATE';
const END_TAG_OPEN_STATE = 'END_TAG_OPEN_STATE';
const TAG_NAME_STATE = 'TAG_NAME_STATE';
const RCDATA_LESS_THAN_SIGN_STATE = 'RCDATA_LESS_THAN_SIGN_STATE';
const RCDATA_END_TAG_OPEN_STATE = 'RCDATA_END_TAG_OPEN_STATE';
const RCDATA_END_TAG_NAME_STATE = 'RCDATA_END_TAG_NAME_STATE';
const RAWTEXT_LESS_THAN_SIGN_STATE = 'RAWTEXT_LESS_THAN_SIGN_STATE';
const RAWTEXT_END_TAG_OPEN_STATE = 'RAWTEXT_END_TAG_OPEN_STATE';
const RAWTEXT_END_TAG_NAME_STATE = 'RAWTEXT_END_TAG_NAME_STATE';
const SCRIPT_DATA_LESS_THAN_SIGN_STATE = 'SCRIPT_DATA_LESS_THAN_SIGN_STATE';
const SCRIPT_DATA_END_TAG_OPEN_STATE = 'SCRIPT_DATA_END_TAG_OPEN_STATE';
const SCRIPT_DATA_END_TAG_NAME_STATE = 'SCRIPT_DATA_END_TAG_NAME_STATE';
const SCRIPT_DATA_ESCAPE_START_STATE = 'SCRIPT_DATA_ESCAPE_START_STATE';
const SCRIPT_DATA_ESCAPE_START_DASH_STATE = 'SCRIPT_DATA_ESCAPE_START_DASH_STATE';
const SCRIPT_DATA_ESCAPED_STATE = 'SCRIPT_DATA_ESCAPED_STATE';
const SCRIPT_DATA_ESCAPED_DASH_STATE = 'SCRIPT_DATA_ESCAPED_DASH_STATE';
const SCRIPT_DATA_ESCAPED_DASH_DASH_STATE = 'SCRIPT_DATA_ESCAPED_DASH_DASH_STATE';
const SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN_STATE = 'SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN_STATE';
const SCRIPT_DATA_ESCAPED_END_TAG_OPEN_STATE = 'SCRIPT_DATA_ESCAPED_END_TAG_OPEN_STATE';
const SCRIPT_DATA_ESCAPED_END_TAG_NAME_STATE = 'SCRIPT_DATA_ESCAPED_END_TAG_NAME_STATE';
const SCRIPT_DATA_DOUBLE_ESCAPE_START_STATE = 'SCRIPT_DATA_DOUBLE_ESCAPE_START_STATE';
const SCRIPT_DATA_DOUBLE_ESCAPED_STATE = 'SCRIPT_DATA_DOUBLE_ESCAPED_STATE';
const SCRIPT_DATA_DOUBLE_ESCAPED_DASH_STATE = 'SCRIPT_DATA_DOUBLE_ESCAPED_DASH_STATE';
const SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH_STATE = 'SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH_STATE';
const SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN_STATE = 'SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN_STATE';
const SCRIPT_DATA_DOUBLE_ESCAPE_END_STATE = 'SCRIPT_DATA_DOUBLE_ESCAPE_END_STATE';
const BEFORE_ATTRIBUTE_NAME_STATE = 'BEFORE_ATTRIBUTE_NAME_STATE';
const ATTRIBUTE_NAME_STATE = 'ATTRIBUTE_NAME_STATE';
const AFTER_ATTRIBUTE_NAME_STATE = 'AFTER_ATTRIBUTE_NAME_STATE';
const BEFORE_ATTRIBUTE_VALUE_STATE = 'BEFORE_ATTRIBUTE_VALUE_STATE';
const ATTRIBUTE_VALUE_DOUBLE_QUOTED_STATE = 'ATTRIBUTE_VALUE_DOUBLE_QUOTED_STATE';
const ATTRIBUTE_VALUE_SINGLE_QUOTED_STATE = 'ATTRIBUTE_VALUE_SINGLE_QUOTED_STATE';
const ATTRIBUTE_VALUE_UNQUOTED_STATE = 'ATTRIBUTE_VALUE_UNQUOTED_STATE';
const AFTER_ATTRIBUTE_VALUE_QUOTED_STATE = 'AFTER_ATTRIBUTE_VALUE_QUOTED_STATE';
const SELF_CLOSING_START_TAG_STATE = 'SELF_CLOSING_START_TAG_STATE';
const BOGUS_COMMENT_STATE = 'BOGUS_COMMENT_STATE';
const MARKUP_DECLARATION_OPEN_STATE = 'MARKUP_DECLARATION_OPEN_STATE';
const COMMENT_START_STATE = 'COMMENT_START_STATE';
const COMMENT_START_DASH_STATE = 'COMMENT_START_DASH_STATE';
const COMMENT_STATE = 'COMMENT_STATE';
const COMMENT_LESS_THAN_SIGN_STATE = 'COMMENT_LESS_THAN_SIGN_STATE';
const COMMENT_LESS_THAN_SIGN_BANG_STATE = 'COMMENT_LESS_THAN_SIGN_BANG_STATE';
const COMMENT_LESS_THAN_SIGN_BANG_DASH_STATE = 'COMMENT_LESS_THAN_SIGN_BANG_DASH_STATE';
const COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH_STATE = 'COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH_STATE';
const COMMENT_END_DASH_STATE = 'COMMENT_END_DASH_STATE';
const COMMENT_END_STATE = 'COMMENT_END_STATE';
const COMMENT_END_BANG_STATE = 'COMMENT_END_BANG_STATE';
const DOCTYPE_STATE = 'DOCTYPE_STATE';
const BEFORE_DOCTYPE_NAME_STATE = 'BEFORE_DOCTYPE_NAME_STATE';
const DOCTYPE_NAME_STATE = 'DOCTYPE_NAME_STATE';
const AFTER_DOCTYPE_NAME_STATE = 'AFTER_DOCTYPE_NAME_STATE';
const AFTER_DOCTYPE_PUBLIC_KEYWORD_STATE = 'AFTER_DOCTYPE_PUBLIC_KEYWORD_STATE';
const BEFORE_DOCTYPE_PUBLIC_IDENTIFIER_STATE = 'BEFORE_DOCTYPE_PUBLIC_IDENTIFIER_STATE';
const DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED_STATE = 'DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED_STATE';
const DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED_STATE = 'DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED_STATE';
const AFTER_DOCTYPE_PUBLIC_IDENTIFIER_STATE = 'AFTER_DOCTYPE_PUBLIC_IDENTIFIER_STATE';
const BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS_STATE = 'BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS_STATE';
const AFTER_DOCTYPE_SYSTEM_KEYWORD_STATE = 'AFTER_DOCTYPE_SYSTEM_KEYWORD_STATE';
const BEFORE_DOCTYPE_SYSTEM_IDENTIFIER_STATE = 'BEFORE_DOCTYPE_SYSTEM_IDENTIFIER_STATE';
const DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED_STATE = 'DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED_STATE';
const DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED_STATE = 'DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED_STATE';
const AFTER_DOCTYPE_SYSTEM_IDENTIFIER_STATE = 'AFTER_DOCTYPE_SYSTEM_IDENTIFIER_STATE';
const BOGUS_DOCTYPE_STATE = 'BOGUS_DOCTYPE_STATE';
const CDATA_SECTION_STATE = 'CDATA_SECTION_STATE';
const CDATA_SECTION_BRACKET_STATE = 'CDATA_SECTION_BRACKET_STATE';
const CDATA_SECTION_END_STATE = 'CDATA_SECTION_END_STATE';
const CHARACTER_REFERENCE_STATE = 'CHARACTER_REFERENCE_STATE';
const NAMED_CHARACTER_REFERENCE_STATE = 'NAMED_CHARACTER_REFERENCE_STATE';
const AMBIGUOUS_AMPERSAND_STATE = 'AMBIGUOS_AMPERSAND_STATE';
const NUMERIC_CHARACTER_REFERENCE_STATE = 'NUMERIC_CHARACTER_REFERENCE_STATE';
const HEXADEMICAL_CHARACTER_REFERENCE_START_STATE = 'HEXADEMICAL_CHARACTER_REFERENCE_START_STATE';
const DECIMAL_CHARACTER_REFERENCE_START_STATE = 'DECIMAL_CHARACTER_REFERENCE_START_STATE';
const HEXADEMICAL_CHARACTER_REFERENCE_STATE = 'HEXADEMICAL_CHARACTER_REFERENCE_STATE';
const DECIMAL_CHARACTER_REFERENCE_STATE = 'DECIMAL_CHARACTER_REFERENCE_STATE';
const NUMERIC_CHARACTER_REFERENCE_END_STATE = 'NUMERIC_CHARACTER_REFERENCE_END_STATE';

//Utils

//OPTIMIZATION: these utility functions should not be moved out of this module. V8 Crankshaft will not inline
//this functions if they will be situated in another module due to context switch.
//Always perform inlining check before modifying this functions ('node --trace-inlining').
function isWhitespace(cp) {
    return cp === $.SPACE || cp === $.LINE_FEED || cp === $.TABULATION || cp === $.FORM_FEED;
}

function isAsciiDigit(cp) {
    return cp >= $.DIGIT_0 && cp <= $.DIGIT_9;
}

function isAsciiUpper(cp) {
    return cp >= $.LATIN_CAPITAL_A && cp <= $.LATIN_CAPITAL_Z;
}

function isAsciiLower(cp) {
    return cp >= $.LATIN_SMALL_A && cp <= $.LATIN_SMALL_Z;
}

function isAsciiLetter(cp) {
    return isAsciiLower(cp) || isAsciiUpper(cp);
}

function isAsciiAlphaNumeric(cp) {
    return isAsciiLetter(cp) || isAsciiDigit(cp);
}

function isAsciiUpperHexDigit(cp) {
    return cp >= $.LATIN_CAPITAL_A && cp <= $.LATIN_CAPITAL_F;
}

function isAsciiLowerHexDigit(cp) {
    return cp >= $.LATIN_SMALL_A && cp <= $.LATIN_SMALL_F;
}

function isAsciiHexDigit(cp) {
    return isAsciiDigit(cp) || isAsciiUpperHexDigit(cp) || isAsciiLowerHexDigit(cp);
}

function toAsciiLowerCodePoint(cp) {
    return cp + 0x0020;
}

//NOTE: String.fromCharCode() function can handle only characters from BMP subset.
//So, we need to workaround this manually.
//(see: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/String/fromCharCode#Getting_it_to_work_with_higher_values)
function toChar(cp) {
    if (cp <= 0xffff) {
        return String.fromCharCode(cp);
    }

    cp -= 0x10000;
    return String.fromCharCode(((cp >>> 10) & 0x3ff) | 0xd800) + String.fromCharCode(0xdc00 | (cp & 0x3ff));
}

function toAsciiLowerChar(cp) {
    return String.fromCharCode(toAsciiLowerCodePoint(cp));
}

function findNamedEntityTreeBranch(nodeIx, cp) {
    const branchCount = neTree[++nodeIx];
    let lo = ++nodeIx;
    let hi = lo + branchCount - 1;

    while (lo <= hi) {
        const mid = (lo + hi) >>> 1;
        const midCp = neTree[mid];

        if (midCp < cp) {
            lo = mid + 1;
        } else if (midCp > cp) {
            hi = mid - 1;
        } else {
            return neTree[mid + branchCount];
        }
    }

    return -1;
}

//Tokenizer
class Tokenizer {
    constructor() {
        this.preprocessor = new Preprocessor();

        this.tokenQueue = [];

        this.allowCDATA = false;

        this.state = DATA_STATE;
        this.returnState = '';

        this.charRefCode = -1;
        this.tempBuff = [];
        this.lastStartTagName = '';

        this.consumedAfterSnapshot = -1;
        this.active = false;

        this.currentCharacterToken = null;
        this.currentToken = null;
        this.currentAttr = null;
    }

    //Errors
    _err() {
        // NOTE: err reporting is noop by default. Enabled by mixin.
    }

    _errOnNextCodePoint(err) {
        this._consume();
        this._err(err);
        this._unconsume();
    }

    //API
    getNextToken() {
        while (!this.tokenQueue.length && this.active) {
            this.consumedAfterSnapshot = 0;

            const cp = this._consume();

            if (!this._ensureHibernation()) {
                this[this.state](cp);
            }
        }

        return this.tokenQueue.shift();
    }

    write(chunk, isLastChunk) {
        this.active = true;
        this.preprocessor.write(chunk, isLastChunk);
    }

    insertHtmlAtCurrentPos(chunk) {
        this.active = true;
        this.preprocessor.insertHtmlAtCurrentPos(chunk);
    }

    //Hibernation
    _ensureHibernation() {
        if (this.preprocessor.endOfChunkHit) {
            for (; this.consumedAfterSnapshot > 0; this.consumedAfterSnapshot--) {
                this.preprocessor.retreat();
            }

            this.active = false;
            this.tokenQueue.push({ type: Tokenizer.HIBERNATION_TOKEN });

            return true;
        }

        return false;
    }

    //Consumption
    _consume() {
        this.consumedAfterSnapshot++;
        return this.preprocessor.advance();
    }

    _unconsume() {
        this.consumedAfterSnapshot--;
        this.preprocessor.retreat();
    }

    _reconsumeInState(state) {
        this.state = state;
        this._unconsume();
    }

    _consumeSequenceIfMatch(pattern, startCp, caseSensitive) {
        let consumedCount = 0;
        let isMatch = true;
        const patternLength = pattern.length;
        let patternPos = 0;
        let cp = startCp;
        let patternCp = void 0;

        for (; patternPos < patternLength; patternPos++) {
            if (patternPos > 0) {
                cp = this._consume();
                consumedCount++;
            }

            if (cp === $.EOF) {
                isMatch = false;
                break;
            }

            patternCp = pattern[patternPos];

            if (cp !== patternCp && (caseSensitive || cp !== toAsciiLowerCodePoint(patternCp))) {
                isMatch = false;
                break;
            }
        }

        if (!isMatch) {
            while (consumedCount--) {
                this._unconsume();
            }
        }

        return isMatch;
    }

    //Temp buffer
    _isTempBufferEqualToScriptString() {
        if (this.tempBuff.length !== $$.SCRIPT_STRING.length) {
            return false;
        }

        for (let i = 0; i < this.tempBuff.length; i++) {
            if (this.tempBuff[i] !== $$.SCRIPT_STRING[i]) {
                return false;
            }
        }

        return true;
    }

    //Token creation
    _createStartTagToken() {
        this.currentToken = {
            type: Tokenizer.START_TAG_TOKEN,
            tagName: '',
            selfClosing: false,
            ackSelfClosing: false,
            attrs: []
        };
    }

    _createEndTagToken() {
        this.currentToken = {
            type: Tokenizer.END_TAG_TOKEN,
            tagName: '',
            selfClosing: false,
            attrs: []
        };
    }

    _createCommentToken() {
        this.currentToken = {
            type: Tokenizer.COMMENT_TOKEN,
            data: ''
        };
    }

    _createDoctypeToken(initialName) {
        this.currentToken = {
            type: Tokenizer.DOCTYPE_TOKEN,
            name: initialName,
            forceQuirks: false,
            publicId: null,
            systemId: null
        };
    }

    _createCharacterToken(type, ch) {
        this.currentCharacterToken = {
            type: type,
            chars: ch
        };
    }

    _createEOFToken() {
        this.currentToken = { type: Tokenizer.EOF_TOKEN };
    }

    //Tag attributes
    _createAttr(attrNameFirstCh) {
        this.currentAttr = {
            name: attrNameFirstCh,
            value: ''
        };
    }

    _leaveAttrName(toState) {
        if (Tokenizer.getTokenAttr(this.currentToken, this.currentAttr.name) === null) {
            this.currentToken.attrs.push(this.currentAttr);
        } else {
            this._err(ERR.duplicateAttribute);
        }

        this.state = toState;
    }

    _leaveAttrValue(toState) {
        this.state = toState;
    }

    //Token emission
    _emitCurrentToken() {
        this._emitCurrentCharacterToken();

        const ct = this.currentToken;

        this.currentToken = null;

        //NOTE: store emited start tag's tagName to determine is the following end tag token is appropriate.
        if (ct.type === Tokenizer.START_TAG_TOKEN) {
            this.lastStartTagName = ct.tagName;
        } else if (ct.type === Tokenizer.END_TAG_TOKEN) {
            if (ct.attrs.length > 0) {
                this._err(ERR.endTagWithAttributes);
            }

            if (ct.selfClosing) {
                this._err(ERR.endTagWithTrailingSolidus);
            }
        }

        this.tokenQueue.push(ct);
    }

    _emitCurrentCharacterToken() {
        if (this.currentCharacterToken) {
            this.tokenQueue.push(this.currentCharacterToken);
            this.currentCharacterToken = null;
        }
    }

    _emitEOFToken() {
        this._createEOFToken();
        this._emitCurrentToken();
    }

    //Characters emission

    //OPTIMIZATION: specification uses only one type of character tokens (one token per character).
    //This causes a huge memory overhead and a lot of unnecessary parser loops. parse5 uses 3 groups of characters.
    //If we have a sequence of characters that belong to the same group, parser can process it
    //as a single solid character token.
    //So, there are 3 types of character tokens in parse5:
    //1)NULL_CHARACTER_TOKEN - \u0000-character sequences (e.g. '\u0000\u0000\u0000')
    //2)WHITESPACE_CHARACTER_TOKEN - any whitespace/new-line character sequences (e.g. '\n  \r\t   \f')
    //3)CHARACTER_TOKEN - any character sequence which don't belong to groups 1 and 2 (e.g. 'abcdef1234@@#$%^')
    _appendCharToCurrentCharacterToken(type, ch) {
        if (this.currentCharacterToken && this.currentCharacterToken.type !== type) {
            this._emitCurrentCharacterToken();
        }

        if (this.currentCharacterToken) {
            this.currentCharacterToken.chars += ch;
        } else {
            this._createCharacterToken(type, ch);
        }
    }

    _emitCodePoint(cp) {
        let type = Tokenizer.CHARACTER_TOKEN;

        if (isWhitespace(cp)) {
            type = Tokenizer.WHITESPACE_CHARACTER_TOKEN;
        } else if (cp === $.NULL) {
            type = Tokenizer.NULL_CHARACTER_TOKEN;
        }

        this._appendCharToCurrentCharacterToken(type, toChar(cp));
    }

    _emitSeveralCodePoints(codePoints) {
        for (let i = 0; i < codePoints.length; i++) {
            this._emitCodePoint(codePoints[i]);
        }
    }

    //NOTE: used then we emit character explicitly. This is always a non-whitespace and a non-null character.
    //So we can avoid additional checks here.
    _emitChars(ch) {
        this._appendCharToCurrentCharacterToken(Tokenizer.CHARACTER_TOKEN, ch);
    }

    // Character reference helpers
    _matchNamedCharacterReference(startCp) {
        let result = null;
        let excess = 1;
        let i = findNamedEntityTreeBranch(0, startCp);

        this.tempBuff.push(startCp);

        while (i > -1) {
            const current = neTree[i];
            const inNode = current < MAX_BRANCH_MARKER_VALUE;
            const nodeWithData = inNode && current & HAS_DATA_FLAG;

            if (nodeWithData) {
                //NOTE: we use greedy search, so we continue lookup at this point
                result = current & DATA_DUPLET_FLAG ? [neTree[++i], neTree[++i]] : [neTree[++i]];
                excess = 0;
            }

            const cp = this._consume();

            this.tempBuff.push(cp);
            excess++;

            if (cp === $.EOF) {
                break;
            }

            if (inNode) {
                i = current & HAS_BRANCHES_FLAG ? findNamedEntityTreeBranch(i, cp) : -1;
            } else {
                i = cp === current ? ++i : -1;
            }
        }

        while (excess--) {
            this.tempBuff.pop();
            this._unconsume();
        }

        return result;
    }

    _isCharacterReferenceInAttribute() {
        return (
            this.returnState === ATTRIBUTE_VALUE_DOUBLE_QUOTED_STATE ||
            this.returnState === ATTRIBUTE_VALUE_SINGLE_QUOTED_STATE ||
            this.returnState === ATTRIBUTE_VALUE_UNQUOTED_STATE
        );
    }

    _isCharacterReferenceAttributeQuirk(withSemicolon) {
        if (!withSemicolon && this._isCharacterReferenceInAttribute()) {
            const nextCp = this._consume();

            this._unconsume();

            return nextCp === $.EQUALS_SIGN || isAsciiAlphaNumeric(nextCp);
        }

        return false;
    }

    _flushCodePointsConsumedAsCharacterReference() {
        if (this._isCharacterReferenceInAttribute()) {
            for (let i = 0; i < this.tempBuff.length; i++) {
                this.currentAttr.value += toChar(this.tempBuff[i]);
            }
        } else {
            this._emitSeveralCodePoints(this.tempBuff);
        }

        this.tempBuff = [];
    }

    // State machine

    // Data state
    //------------------------------------------------------------------
    [DATA_STATE](cp) {
        this.preprocessor.dropParsedChunk();

        if (cp === $.LESS_THAN_SIGN) {
            this.state = TAG_OPEN_STATE;
        } else if (cp === $.AMPERSAND) {
            this.returnState = DATA_STATE;
            this.state = CHARACTER_REFERENCE_STATE;
        } else if (cp === $.NULL) {
            this._err(ERR.unexpectedNullCharacter);
            this._emitCodePoint(cp);
        } else if (cp === $.EOF) {
            this._emitEOFToken();
        } else {
            this._emitCodePoint(cp);
        }
    }

    //  RCDATA state
    //------------------------------------------------------------------
    [RCDATA_STATE](cp) {
        this.preprocessor.dropParsedChunk();

        if (cp === $.AMPERSAND) {
            this.returnState = RCDATA_STATE;
            this.state = CHARACTER_REFERENCE_STATE;
        } else if (cp === $.LESS_THAN_SIGN) {
            this.state = RCDATA_LESS_THAN_SIGN_STATE;
        } else if (cp === $.NULL) {
            this._err(ERR.unexpectedNullCharacter);
            this._emitChars(unicode.REPLACEMENT_CHARACTER);
        } else if (cp === $.EOF) {
            this._emitEOFToken();
        } else {
            this._emitCodePoint(cp);
        }
    }

    // RAWTEXT state
    //------------------------------------------------------------------
    [RAWTEXT_STATE](cp) {
        this.preprocessor.dropParsedChunk();

        if (cp === $.LESS_THAN_SIGN) {
            this.state = RAWTEXT_LESS_THAN_SIGN_STATE;
        } else if (cp === $.NULL) {
            this._err(ERR.unexpectedNullCharacter);
            this._emitChars(unicode.REPLACEMENT_CHARACTER);
        } else if (cp === $.EOF) {
            this._emitEOFToken();
        } else {
            this._emitCodePoint(cp);
        }
    }

    // Script data state
    //------------------------------------------------------------------
    [SCRIPT_DATA_STATE](cp) {
        this.preprocessor.dropParsedChunk();

        if (cp === $.LESS_THAN_SIGN) {
            this.state = SCRIPT_DATA_LESS_THAN_SIGN_STATE;
        } else if (cp === $.NULL) {
            this._err(ERR.unexpectedNullCharacter);
            this._emitChars(unicode.REPLACEMENT_CHARACTER);
        } else if (cp === $.EOF) {
            this._emitEOFToken();
        } else {
            this._emitCodePoint(cp);
        }
    }

    // PLAINTEXT state
    //------------------------------------------------------------------
    [PLAINTEXT_STATE](cp) {
        this.preprocessor.dropParsedChunk();

        if (cp === $.NULL) {
            this._err(ERR.unexpectedNullCharacter);
            this._emitChars(unicode.REPLACEMENT_CHARACTER);
        } else if (cp === $.EOF) {
            this._emitEOFToken();
        } else {
            this._emitCodePoint(cp);
        }
    }

    // Tag open state
    //------------------------------------------------------------------
    [TAG_OPEN_STATE](cp) {
        if (cp === $.EXCLAMATION_MARK) {
            this.state = MARKUP_DECLARATION_OPEN_STATE;
        } else if (cp === $.SOLIDUS) {
            this.state = END_TAG_OPEN_STATE;
        } else if (isAsciiLetter(cp)) {
            this._createStartTagToken();
            this._reconsumeInState(TAG_NAME_STATE);
        } else if (cp === $.QUESTION_MARK) {
            this._err(ERR.unexpectedQuestionMarkInsteadOfTagName);
            this._createCommentToken();
            this._reconsumeInState(BOGUS_COMMENT_STATE);
        } else if (cp === $.EOF) {
            this._err(ERR.eofBeforeTagName);
            this._emitChars('<');
            this._emitEOFToken();
        } else {
            this._err(ERR.invalidFirstCharacterOfTagName);
            this._emitChars('<');
            this._reconsumeInState(DATA_STATE);
        }
    }

    // End tag open state
    //------------------------------------------------------------------
    [END_TAG_OPEN_STATE](cp) {
        if (isAsciiLetter(cp)) {
            this._createEndTagToken();
            this._reconsumeInState(TAG_NAME_STATE);
        } else if (cp === $.GREATER_THAN_SIGN) {
            this._err(ERR.missingEndTagName);
            this.state = DATA_STATE;
        } else if (cp === $.EOF) {
            this._err(ERR.eofBeforeTagName);
            this._emitChars('</');
            this._emitEOFToken();
        } else {
            this._err(ERR.invalidFirstCharacterOfTagName);
            this._createCommentToken();
            this._reconsumeInState(BOGUS_COMMENT_STATE);
        }
    }

    // Tag name state
    //------------------------------------------------------------------
    [TAG_NAME_STATE](cp) {
        if (isWhitespace(cp)) {
            this.state = BEFORE_ATTRIBUTE_NAME_STATE;
        } else if (cp === $.SOLIDUS) {
            this.state = SELF_CLOSING_START_TAG_STATE;
        } else if (cp === $.GREATER_THAN_SIGN) {
            this.state = DATA_STATE;
            this._emitCurrentToken();
        } else if (isAsciiUpper(cp)) {
            this.currentToken.tagName += toAsciiLowerChar(cp);
        } else if (cp === $.NULL) {
            this._err(ERR.unexpectedNullCharacter);
            this.currentToken.tagName += unicode.REPLACEMENT_CHARACTER;
        } else if (cp === $.EOF) {
            this._err(ERR.eofInTag);
            this._emitEOFToken();
        } else {
            this.currentToken.tagName += toChar(cp);
        }
    }

    // RCDATA less-than sign state
    //------------------------------------------------------------------
    [RCDATA_LESS_THAN_SIGN_STATE](cp) {
        if (cp === $.SOLIDUS) {
            this.tempBuff = [];
            this.state = RCDATA_END_TAG_OPEN_STATE;
        } else {
            this._emitChars('<');
            this._reconsumeInState(RCDATA_STATE);
        }
    }

    // RCDATA end tag open state
    //------------------------------------------------------------------
    [RCDATA_END_TAG_OPEN_STATE](cp) {
        if (isAsciiLetter(cp)) {
            this._createEndTagToken();
            this._reconsumeInState(RCDATA_END_TAG_NAME_STATE);
        } else {
            this._emitChars('</');
            this._reconsumeInState(RCDATA_STATE);
        }
    }

    // RCDATA end tag name state
    //------------------------------------------------------------------
    [RCDATA_END_TAG_NAME_STATE](cp) {
        if (isAsciiUpper(cp)) {
            this.currentToken.tagName += toAsciiLowerChar(cp);
            this.tempBuff.push(cp);
        } else if (isAsciiLower(cp)) {
            this.currentToken.tagName += toChar(cp);
            this.tempBuff.push(cp);
        } else {
            if (this.lastStartTagName === this.currentToken.tagName) {
                if (isWhitespace(cp)) {
                    this.state = BEFORE_ATTRIBUTE_NAME_STATE;
                    return;
                }

                if (cp === $.SOLIDUS) {
                    this.state = SELF_CLOSING_START_TAG_STATE;
                    return;
                }

                if (cp === $.GREATER_THAN_SIGN) {
                    this.state = DATA_STATE;
                    this._emitCurrentToken();
                    return;
                }
            }

            this._emitChars('</');
            this._emitSeveralCodePoints(this.tempBuff);
            this._reconsumeInState(RCDATA_STATE);
        }
    }

    // RAWTEXT less-than sign state
    //------------------------------------------------------------------
    [RAWTEXT_LESS_THAN_SIGN_STATE](cp) {
        if (cp === $.SOLIDUS) {
            this.tempBuff = [];
            this.state = RAWTEXT_END_TAG_OPEN_STATE;
        } else {
            this._emitChars('<');
            this._reconsumeInState(RAWTEXT_STATE);
        }
    }

    // RAWTEXT end tag open state
    //------------------------------------------------------------------
    [RAWTEXT_END_TAG_OPEN_STATE](cp) {
        if (isAsciiLetter(cp)) {
            this._createEndTagToken();
            this._reconsumeInState(RAWTEXT_END_TAG_NAME_STATE);
        } else {
            this._emitChars('</');
            this._reconsumeInState(RAWTEXT_STATE);
        }
    }

    // RAWTEXT end tag name state
    //------------------------------------------------------------------
    [RAWTEXT_END_TAG_NAME_STATE](cp) {
        if (isAsciiUpper(cp)) {
            this.currentToken.tagName += toAsciiLowerChar(cp);
            this.tempBuff.push(cp);
        } else if (isAsciiLower(cp)) {
            this.currentToken.tagName += toChar(cp);
            this.tempBuff.push(cp);
        } else {
            if (this.lastStartTagName === this.currentToken.tagName) {
                if (isWhitespace(cp)) {
                    this.state = BEFORE_ATTRIBUTE_NAME_STATE;
                    return;
                }

                if (cp === $.SOLIDUS) {
                    this.state = SELF_CLOSING_START_TAG_STATE;
                    return;
                }

                if (cp === $.GREATER_THAN_SIGN) {
                    this._emitCurrentToken();
                    this.state = DATA_STATE;
                    return;
                }
            }

            this._emitChars('</');
            this._emitSeveralCodePoints(this.tempBuff);
            this._reconsumeInState(RAWTEXT_STATE);
        }
    }

    // Script data less-than sign state
    //------------------------------------------------------------------
    [SCRIPT_DATA_LESS_THAN_SIGN_STATE](cp) {
        if (cp === $.SOLIDUS) {
            this.tempBuff = [];
            this.state = SCRIPT_DATA_END_TAG_OPEN_STATE;
        } else if (cp === $.EXCLAMATION_MARK) {
            this.state = SCRIPT_DATA_ESCAPE_START_STATE;
            this._emitChars('<!');
        } else {
            this._emitChars('<');
            this._reconsumeInState(SCRIPT_DATA_STATE);
        }
    }

    // Script data end tag open state
    //------------------------------------------------------------------
    [SCRIPT_DATA_END_TAG_OPEN_STATE](cp) {
        if (isAsciiLetter(cp)) {
            this._createEndTagToken();
            this._reconsumeInState(SCRIPT_DATA_END_TAG_NAME_STATE);
        } else {
            this._emitChars('</');
            this._reconsumeInState(SCRIPT_DATA_STATE);
        }
    }

    // Script data end tag name state
    //------------------------------------------------------------------
    [SCRIPT_DATA_END_TAG_NAME_STATE](cp) {
        if (isAsciiUpper(cp)) {
            this.currentToken.tagName += toAsciiLowerChar(cp);
            this.tempBuff.push(cp);
        } else if (isAsciiLower(cp)) {
            this.currentToken.tagName += toChar(cp);
            this.tempBuff.push(cp);
        } else {
            if (this.lastStartTagName === this.currentToken.tagName) {
                if (isWhitespace(cp)) {
                    this.state = BEFORE_ATTRIBUTE_NAME_STATE;
                    return;
                } else if (cp === $.SOLIDUS) {
                    this.state = SELF_CLOSING_START_TAG_STATE;
                    return;
                } else if (cp === $.GREATER_THAN_SIGN) {
                    this._emitCurrentToken();
                    this.state = DATA_STATE;
                    return;
                }
            }

            this._emitChars('</');
            this._emitSeveralCodePoints(this.tempBuff);
            this._reconsumeInState(SCRIPT_DATA_STATE);
        }
    }

    // Script data escape start state
    //------------------------------------------------------------------
    [SCRIPT_DATA_ESCAPE_START_STATE](cp) {
        if (cp === $.HYPHEN_MINUS) {
            this.state = SCRIPT_DATA_ESCAPE_START_DASH_STATE;
            this._emitChars('-');
        } else {
            this._reconsumeInState(SCRIPT_DATA_STATE);
        }
    }

    // Script data escape start dash state
    //------------------------------------------------------------------
    [SCRIPT_DATA_ESCAPE_START_DASH_STATE](cp) {
        if (cp === $.HYPHEN_MINUS) {
            this.state = SCRIPT_DATA_ESCAPED_DASH_DASH_STATE;
            this._emitChars('-');
        } else {
            this._reconsumeInState(SCRIPT_DATA_STATE);
        }
    }

    // Script data escaped state
    //------------------------------------------------------------------
    [SCRIPT_DATA_ESCAPED_STATE](cp) {
        if (cp === $.HYPHEN_MINUS) {
            this.state = SCRIPT_DATA_ESCAPED_DASH_STATE;
            this._emitChars('-');
        } else if (cp === $.LESS_THAN_SIGN) {
            this.state = SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN_STATE;
        } else if (cp === $.NULL) {
            this._err(ERR.unexpectedNullCharacter);
            this._emitChars(unicode.REPLACEMENT_CHARACTER);
        } else if (cp === $.EOF) {
            this._err(ERR.eofInScriptHtmlCommentLikeText);
            this._emitEOFToken();
        } else {
            this._emitCodePoint(cp);
        }
    }

    // Script data escaped dash state
    //------------------------------------------------------------------
    [SCRIPT_DATA_ESCAPED_DASH_STATE](cp) {
        if (cp === $.HYPHEN_MINUS) {
            this.state = SCRIPT_DATA_ESCAPED_DASH_DASH_STATE;
            this._emitChars('-');
        } else if (cp === $.LESS_THAN_SIGN) {
            this.state = SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN_STATE;
        } else if (cp === $.NULL) {
            this._err(ERR.unexpectedNullCharacter);
            this.state = SCRIPT_DATA_ESCAPED_STATE;
            this._emitChars(unicode.REPLACEMENT_CHARACTER);
        } else if (cp === $.EOF) {
            this._err(ERR.eofInScriptHtmlCommentLikeText);
            this._emitEOFToken();
        } else {
            this.state = SCRIPT_DATA_ESCAPED_STATE;
            this._emitCodePoint(cp);
        }
    }

    // Script data escaped dash dash state
    //------------------------------------------------------------------
    [SCRIPT_DATA_ESCAPED_DASH_DASH_STATE](cp) {
        if (cp === $.HYPHEN_MINUS) {
            this._emitChars('-');
        } else if (cp === $.LESS_THAN_SIGN) {
            this.state = SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN_STATE;
        } else if (cp === $.GREATER_THAN_SIGN) {
            this.state = SCRIPT_DATA_STATE;
            this._emitChars('>');
        } else if (cp === $.NULL) {
            this._err(ERR.unexpectedNullCharacter);
            this.state = SCRIPT_DATA_ESCAPED_STATE;
            this._emitChars(unicode.REPLACEMENT_CHARACTER);
        } else if (cp === $.EOF) {
            this._err(ERR.eofInScriptHtmlCommentLikeText);
            this._emitEOFToken();
        } else {
            this.state = SCRIPT_DATA_ESCAPED_STATE;
            this._emitCodePoint(cp);
        }
    }

    // Script data escaped less-than sign state
    //------------------------------------------------------------------
    [SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN_STATE](cp) {
        if (cp === $.SOLIDUS) {
            this.tempBuff = [];
            this.state = SCRIPT_DATA_ESCAPED_END_TAG_OPEN_STATE;
        } else if (isAsciiLetter(cp)) {
            this.tempBuff = [];
            this._emitChars('<');
            this._reconsumeInState(SCRIPT_DATA_DOUBLE_ESCAPE_START_STATE);
        } else {
            this._emitChars('<');
            this._reconsumeInState(SCRIPT_DATA_ESCAPED_STATE);
        }
    }

    // Script data escaped end tag open state
    //------------------------------------------------------------------
    [SCRIPT_DATA_ESCAPED_END_TAG_OPEN_STATE](cp) {
        if (isAsciiLetter(cp)) {
            this._createEndTagToken();
            this._reconsumeInState(SCRIPT_DATA_ESCAPED_END_TAG_NAME_STATE);
        } else {
            this._emitChars('</');
            this._reconsumeInState(SCRIPT_DATA_ESCAPED_STATE);
        }
    }

    // Script data escaped end tag name state
    //------------------------------------------------------------------
    [SCRIPT_DATA_ESCAPED_END_TAG_NAME_STATE](cp) {
        if (isAsciiUpper(cp)) {
            this.currentToken.tagName += toAsciiLowerChar(cp);
            this.tempBuff.push(cp);
        } else if (isAsciiLower(cp)) {
            this.currentToken.tagName += toChar(cp);
            this.tempBuff.push(cp);
        } else {
            if (this.lastStartTagName === this.currentToken.tagName) {
                if (isWhitespace(cp)) {
                    this.state = BEFORE_ATTRIBUTE_NAME_STATE;
                    return;
                }

                if (cp === $.SOLIDUS) {
                    this.state = SELF_CLOSING_START_TAG_STATE;
                    return;
                }

                if (cp === $.GREATER_THAN_SIGN) {
                    this._emitCurrentToken();
                    this.state = DATA_STATE;
                    return;
                }
            }

            this._emitChars('</');
            this._emitSeveralCodePoints(this.tempBuff);
            this._reconsumeInState(SCRIPT_DATA_ESCAPED_STATE);
        }
    }

    // Script data double escape start state
    //------------------------------------------------------------------
    [SCRIPT_DATA_DOUBLE_ESCAPE_START_STATE](cp) {
        if (isWhitespace(cp) || cp === $.SOLIDUS || cp === $.GREATER_THAN_SIGN) {
            this.state = this._isTempBufferEqualToScriptString()
                ? SCRIPT_DATA_DOUBLE_ESCAPED_STATE
                : SCRIPT_DATA_ESCAPED_STATE;
            this._emitCodePoint(cp);
        } else if (isAsciiUpper(cp)) {
            this.tempBuff.push(toAsciiLowerCodePoint(cp));
            this._emitCodePoint(cp);
        } else if (isAsciiLower(cp)) {
            this.tempBuff.push(cp);
            this._emitCodePoint(cp);
        } else {
            this._reconsumeInState(SCRIPT_DATA_ESCAPED_STATE);
        }
    }

    // Script data double escaped state
    //------------------------------------------------------------------
    [SCRIPT_DATA_DOUBLE_ESCAPED_STATE](cp) {
        if (cp === $.HYPHEN_MINUS) {
            this.state = SCRIPT_DATA_DOUBLE_ESCAPED_DASH_STATE;
            this._emitChars('-');
        } else if (cp === $.LESS_THAN_SIGN) {
            this.state = SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN_STATE;
            this._emitChars('<');
        } else if (cp === $.NULL) {
            this._err(ERR.unexpectedNullCharacter);
            this._emitChars(unicode.REPLACEMENT_CHARACTER);
        } else if (cp === $.EOF) {
            this._err(ERR.eofInScriptHtmlCommentLikeText);
            this._emitEOFToken();
        } else {
            this._emitCodePoint(cp);
        }
    }

    // Script data double escaped dash state
    //------------------------------------------------------------------
    [SCRIPT_DATA_DOUBLE_ESCAPED_DASH_STATE](cp) {
        if (cp === $.HYPHEN_MINUS) {
            this.state = SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH_STATE;
            this._emitChars('-');
        } else if (cp === $.LESS_THAN_SIGN) {
            this.state = SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN_STATE;
            this._emitChars('<');
        } else if (cp === $.NULL) {
            this._err(ERR.unexpectedNullCharacter);
            this.state = SCRIPT_DATA_DOUBLE_ESCAPED_STATE;
            this._emitChars(unicode.REPLACEMENT_CHARACTER);
        } else if (cp === $.EOF) {
            this._err(ERR.eofInScriptHtmlCommentLikeText);
            this._emitEOFToken();
        } else {
            this.state = SCRIPT_DATA_DOUBLE_ESCAPED_STATE;
            this._emitCodePoint(cp);
        }
    }

    // Script data double escaped dash dash state
    //------------------------------------------------------------------
    [SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH_STATE](cp) {
        if (cp === $.HYPHEN_MINUS) {
            this._emitChars('-');
        } else if (cp === $.LESS_THAN_SIGN) {
            this.state = SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN_STATE;
            this._emitChars('<');
        } else if (cp === $.GREATER_THAN_SIGN) {
            this.state = SCRIPT_DATA_STATE;
            this._emitChars('>');
        } else if (cp === $.NULL) {
            this._err(ERR.unexpectedNullCharacter);
            this.state = SCRIPT_DATA_DOUBLE_ESCAPED_STATE;
            this._emitChars(unicode.REPLACEMENT_CHARACTER);
        } else if (cp === $.EOF) {
            this._err(ERR.eofInScriptHtmlCommentLikeText);
            this._emitEOFToken();
        } else {
            this.state = SCRIPT_DATA_DOUBLE_ESCAPED_STATE;
            this._emitCodePoint(cp);
        }
    }

    // Script data double escaped less-than sign state
    //------------------------------------------------------------------
    [SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN_STATE](cp) {
        if (cp === $.SOLIDUS) {
            this.tempBuff = [];
            this.state = SCRIPT_DATA_DOUBLE_ESCAPE_END_STATE;
            this._emitChars('/');
        } else {
            this._reconsumeInState(SCRIPT_DATA_DOUBLE_ESCAPED_STATE);
        }
    }

    // Script data double escape end state
    //------------------------------------------------------------------
    [SCRIPT_DATA_DOUBLE_ESCAPE_END_STATE](cp) {
        if (isWhitespace(cp) || cp === $.SOLIDUS || cp === $.GREATER_THAN_SIGN) {
            this.state = this._isTempBufferEqualToScriptString()
                ? SCRIPT_DATA_ESCAPED_STATE
                : SCRIPT_DATA_DOUBLE_ESCAPED_STATE;

            this._emitCodePoint(cp);
        } else if (isAsciiUpper(cp)) {
            this.tempBuff.push(toAsciiLowerCodePoint(cp));
            this._emitCodePoint(cp);
        } else if (isAsciiLower(cp)) {
            this.tempBuff.push(cp);
            this._emitCodePoint(cp);
        } else {
            this._reconsumeInState(SCRIPT_DATA_DOUBLE_ESCAPED_STATE);
        }
    }

    // Before attribute name state
    //------------------------------------------------------------------
    [BEFORE_ATTRIBUTE_NAME_STATE](cp) {
        if (isWhitespace(cp)) {
            return;
        }

        if (cp === $.SOLIDUS || cp === $.GREATER_THAN_SIGN || cp === $.EOF) {
            this._reconsumeInState(AFTER_ATTRIBUTE_NAME_STATE);
        } else if (cp === $.EQUALS_SIGN) {
            this._err(ERR.unexpectedEqualsSignBeforeAttributeName);
            this._createAttr('=');
            this.state = ATTRIBUTE_NAME_STATE;
        } else {
            this._createAttr('');
            this._reconsumeInState(ATTRIBUTE_NAME_STATE);
        }
    }

    // Attribute name state
    //------------------------------------------------------------------
    [ATTRIBUTE_NAME_STATE](cp) {
        if (isWhitespace(cp) || cp === $.SOLIDUS || cp === $.GREATER_THAN_SIGN || cp === $.EOF) {
            this._leaveAttrName(AFTER_ATTRIBUTE_NAME_STATE);
            this._unconsume();
        } else if (cp === $.EQUALS_SIGN) {
            this._leaveAttrName(BEFORE_ATTRIBUTE_VALUE_STATE);
        } else if (isAsciiUpper(cp)) {
            this.currentAttr.name += toAsciiLowerChar(cp);
        } else if (cp === $.QUOTATION_MARK || cp === $.APOSTROPHE || cp === $.LESS_THAN_SIGN) {
            this._err(ERR.unexpectedCharacterInAttributeName);
            this.currentAttr.name += toChar(cp);
        } else if (cp === $.NULL) {
            this._err(ERR.unexpectedNullCharacter);
            this.currentAttr.name += unicode.REPLACEMENT_CHARACTER;
        } else {
            this.currentAttr.name += toChar(cp);
        }
    }

    // After attribute name state
    //------------------------------------------------------------------
    [AFTER_ATTRIBUTE_NAME_STATE](cp) {
        if (isWhitespace(cp)) {
            return;
        }

        if (cp === $.SOLIDUS) {
            this.state = SELF_CLOSING_START_TAG_STATE;
        } else if (cp === $.EQUALS_SIGN) {
            this.state = BEFORE_ATTRIBUTE_VALUE_STATE;
        } else if (cp === $.GREATER_THAN_SIGN) {
            this.state = DATA_STATE;
            this._emitCurrentToken();
        } else if (cp === $.EOF) {
            this._err(ERR.eofInTag);
            this._emitEOFToken();
        } else {
            this._createAttr('');
            this._reconsumeInState(ATTRIBUTE_NAME_STATE);
        }
    }

    // Before attribute value state
    //------------------------------------------------------------------
    [BEFORE_ATTRIBUTE_VALUE_STATE](cp) {
        if (isWhitespace(cp)) {
            return;
        }

        if (cp === $.QUOTATION_MARK) {
            this.state = ATTRIBUTE_VALUE_DOUBLE_QUOTED_STATE;
        } else if (cp === $.APOSTROPHE) {
            this.state = ATTRIBUTE_VALUE_SINGLE_QUOTED_STATE;
        } else if (cp === $.GREATER_THAN_SIGN) {
            this._err(ERR.missingAttributeValue);
            this.state = DATA_STATE;
            this._emitCurrentToken();
        } else {
            this._reconsumeInState(ATTRIBUTE_VALUE_UNQUOTED_STATE);
        }
    }

    // Attribute value (double-quoted) state
    //------------------------------------------------------------------
    [ATTRIBUTE_VALUE_DOUBLE_QUOTED_STATE](cp) {
        if (cp === $.QUOTATION_MARK) {
            this.state = AFTER_ATTRIBUTE_VALUE_QUOTED_STATE;
        } else if (cp === $.AMPERSAND) {
            this.returnState = ATTRIBUTE_VALUE_DOUBLE_QUOTED_STATE;
            this.state = CHARACTER_REFERENCE_STATE;
        } else if (cp === $.NULL) {
            this._err(ERR.unexpectedNullCharacter);
            this.currentAttr.value += unicode.REPLACEMENT_CHARACTER;
        } else if (cp === $.EOF) {
            this._err(ERR.eofInTag);
            this._emitEOFToken();
        } else {
            this.currentAttr.value += toChar(cp);
        }
    }

    // Attribute value (single-quoted) state
    //------------------------------------------------------------------
    [ATTRIBUTE_VALUE_SINGLE_QUOTED_STATE](cp) {
        if (cp === $.APOSTROPHE) {
            this.state = AFTER_ATTRIBUTE_VALUE_QUOTED_STATE;
        } else if (cp === $.AMPERSAND) {
            this.returnState = ATTRIBUTE_VALUE_SINGLE_QUOTED_STATE;
            this.state = CHARACTER_REFERENCE_STATE;
        } else if (cp === $.NULL) {
            this._err(ERR.unexpectedNullCharacter);
            this.currentAttr.value += unicode.REPLACEMENT_CHARACTER;
        } else if (cp === $.EOF) {
            this._err(ERR.eofInTag);
            this._emitEOFToken();
        } else {
            this.currentAttr.value += toChar(cp);
        }
    }

    // Attribute value (unquoted) state
    //------------------------------------------------------------------
    [ATTRIBUTE_VALUE_UNQUOTED_STATE](cp) {
        if (isWhitespace(cp)) {
            this._leaveAttrValue(BEFORE_ATTRIBUTE_NAME_STATE);
        } else if (cp === $.AMPERSAND) {
            this.returnState = ATTRIBUTE_VALUE_UNQUOTED_STATE;
            this.state = CHARACTER_REFERENCE_STATE;
        } else if (cp === $.GREATER_THAN_SIGN) {
            this._leaveAttrValue(DATA_STATE);
            this._emitCurrentToken();
        } else if (cp === $.NULL) {
            this._err(ERR.unexpectedNullCharacter);
            this.currentAttr.value += unicode.REPLACEMENT_CHARACTER;
        } else if (
            cp === $.QUOTATION_MARK ||
            cp === $.APOSTROPHE ||
            cp === $.LESS_THAN_SIGN ||
            cp === $.EQUALS_SIGN ||
            cp === $.GRAVE_ACCENT
        ) {
            this._err(ERR.unexpectedCharacterInUnquotedAttributeValue);
            this.currentAttr.value += toChar(cp);
        } else if (cp === $.EOF) {
            this._err(ERR.eofInTag);
            this._emitEOFToken();
        } else {
            this.currentAttr.value += toChar(cp);
        }
    }

    // After attribute value (quoted) state
    //------------------------------------------------------------------
    [AFTER_ATTRIBUTE_VALUE_QUOTED_STATE](cp) {
        if (isWhitespace(cp)) {
            this._leaveAttrValue(BEFORE_ATTRIBUTE_NAME_STATE);
        } else if (cp === $.SOLIDUS) {
            this._leaveAttrValue(SELF_CLOSING_START_TAG_STATE);
        } else if (cp === $.GREATER_THAN_SIGN) {
            this._leaveAttrValue(DATA_STATE);
            this._emitCurrentToken();
        } else if (cp === $.EOF) {
            this._err(ERR.eofInTag);
            this._emitEOFToken();
        } else {
            this._err(ERR.missingWhitespaceBetweenAttributes);
            this._reconsumeInState(BEFORE_ATTRIBUTE_NAME_STATE);
        }
    }

    // Self-closing start tag state
    //------------------------------------------------------------------
    [SELF_CLOSING_START_TAG_STATE](cp) {
        if (cp === $.GREATER_THAN_SIGN) {
            this.currentToken.selfClosing = true;
            this.state = DATA_STATE;
            this._emitCurrentToken();
        } else if (cp === $.EOF) {
            this._err(ERR.eofInTag);
            this._emitEOFToken();
        } else {
            this._err(ERR.unexpectedSolidusInTag);
            this._reconsumeInState(BEFORE_ATTRIBUTE_NAME_STATE);
        }
    }

    // Bogus comment state
    //------------------------------------------------------------------
    [BOGUS_COMMENT_STATE](cp) {
        if (cp === $.GREATER_THAN_SIGN) {
            this.state = DATA_STATE;
            this._emitCurrentToken();
        } else if (cp === $.EOF) {
            this._emitCurrentToken();
            this._emitEOFToken();
        } else if (cp === $.NULL) {
            this._err(ERR.unexpectedNullCharacter);
            this.currentToken.data += unicode.REPLACEMENT_CHARACTER;
        } else {
            this.currentToken.data += toChar(cp);
        }
    }

    // Markup declaration open state
    //------------------------------------------------------------------
    [MARKUP_DECLARATION_OPEN_STATE](cp) {
        if (this._consumeSequenceIfMatch($$.DASH_DASH_STRING, cp, true)) {
            this._createCommentToken();
            this.state = COMMENT_START_STATE;
        } else if (this._consumeSequenceIfMatch($$.DOCTYPE_STRING, cp, false)) {
            this.state = DOCTYPE_STATE;
        } else if (this._consumeSequenceIfMatch($$.CDATA_START_STRING, cp, true)) {
            if (this.allowCDATA) {
                this.state = CDATA_SECTION_STATE;
            } else {
                this._err(ERR.cdataInHtmlContent);
                this._createCommentToken();
                this.currentToken.data = '[CDATA[';
                this.state = BOGUS_COMMENT_STATE;
            }
        }

        //NOTE: sequence lookup can be abrupted by hibernation. In that case lookup
        //results are no longer valid and we will need to start over.
        else if (!this._ensureHibernation()) {
            this._err(ERR.incorrectlyOpenedComment);
            this._createCommentToken();
            this._reconsumeInState(BOGUS_COMMENT_STATE);
        }
    }

    // Comment start state
    //------------------------------------------------------------------
    [COMMENT_START_STATE](cp) {
        if (cp === $.HYPHEN_MINUS) {
            this.state = COMMENT_START_DASH_STATE;
        } else if (cp === $.GREATER_THAN_SIGN) {
            this._err(ERR.abruptClosingOfEmptyComment);
            this.state = DATA_STATE;
            this._emitCurrentToken();
        } else {
            this._reconsumeInState(COMMENT_STATE);
        }
    }

    // Comment start dash state
    //------------------------------------------------------------------
    [COMMENT_START_DASH_STATE](cp) {
        if (cp === $.HYPHEN_MINUS) {
            this.state = COMMENT_END_STATE;
        } else if (cp === $.GREATER_THAN_SIGN) {
            this._err(ERR.abruptClosingOfEmptyComment);
            this.state = DATA_STATE;
            this._emitCurrentToken();
        } else if (cp === $.EOF) {
            this._err(ERR.eofInComment);
            this._emitCurrentToken();
            this._emitEOFToken();
        } else {
            this.currentToken.data += '-';
            this._reconsumeInState(COMMENT_STATE);
        }
    }

    // Comment state
    //------------------------------------------------------------------
    [COMMENT_STATE](cp) {
        if (cp === $.HYPHEN_MINUS) {
            this.state = COMMENT_END_DASH_STATE;
        } else if (cp === $.LESS_THAN_SIGN) {
            this.currentToken.data += '<';
            this.state = COMMENT_LESS_THAN_SIGN_STATE;
        } else if (cp === $.NULL) {
            this._err(ERR.unexpectedNullCharacter);
            this.currentToken.data += unicode.REPLACEMENT_CHARACTER;
        } else if (cp === $.EOF) {
            this._err(ERR.eofInComment);
            this._emitCurrentToken();
            this._emitEOFToken();
        } else {
            this.currentToken.data += toChar(cp);
        }
    }

    // Comment less-than sign state
    //------------------------------------------------------------------
    [COMMENT_LESS_THAN_SIGN_STATE](cp) {
        if (cp === $.EXCLAMATION_MARK) {
            this.currentToken.data += '!';
            this.state = COMMENT_LESS_THAN_SIGN_BANG_STATE;
        } else if (cp === $.LESS_THAN_SIGN) {
            this.currentToken.data += '!';
        } else {
            this._reconsumeInState(COMMENT_STATE);
        }
    }

    // Comment less-than sign bang state
    //------------------------------------------------------------------
    [COMMENT_LESS_THAN_SIGN_BANG_STATE](cp) {
        if (cp === $.HYPHEN_MINUS) {
            this.state = COMMENT_LESS_THAN_SIGN_BANG_DASH_STATE;
        } else {
            this._reconsumeInState(COMMENT_STATE);
        }
    }

    // Comment less-than sign bang dash state
    //------------------------------------------------------------------
    [COMMENT_LESS_THAN_SIGN_BANG_DASH_STATE](cp) {
        if (cp === $.HYPHEN_MINUS) {
            this.state = COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH_STATE;
        } else {
            this._reconsumeInState(COMMENT_END_DASH_STATE);
        }
    }

    // Comment less-than sign bang dash dash state
    //------------------------------------------------------------------
    [COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH_STATE](cp) {
        if (cp !== $.GREATER_THAN_SIGN && cp !== $.EOF) {
            this._err(ERR.nestedComment);
        }

        this._reconsumeInState(COMMENT_END_STATE);
    }

    // Comment end dash state
    //------------------------------------------------------------------
    [COMMENT_END_DASH_STATE](cp) {
        if (cp === $.HYPHEN_MINUS) {
            this.state = COMMENT_END_STATE;
        } else if (cp === $.EOF) {
            this._err(ERR.eofInComment);
            this._emitCurrentToken();
            this._emitEOFToken();
        } else {
            this.currentToken.data += '-';
            this._reconsumeInState(COMMENT_STATE);
        }
    }

    // Comment end state
    //------------------------------------------------------------------
    [COMMENT_END_STATE](cp) {
        if (cp === $.GREATER_THAN_SIGN) {
            this.state = DATA_STATE;
            this._emitCurrentToken();
        } else if (cp === $.EXCLAMATION_MARK) {
            this.state = COMMENT_END_BANG_STATE;
        } else if (cp === $.HYPHEN_MINUS) {
            this.currentToken.data += '-';
        } else if (cp === $.EOF) {
            this._err(ERR.eofInComment);
            this._emitCurrentToken();
            this._emitEOFToken();
        } else {
            this.currentToken.data += '--';
            this._reconsumeInState(COMMENT_STATE);
        }
    }

    // Comment end bang state
    //------------------------------------------------------------------
    [COMMENT_END_BANG_STATE](cp) {
        if (cp === $.HYPHEN_MINUS) {
            this.currentToken.data += '--!';
            this.state = COMMENT_END_DASH_STATE;
        } else if (cp === $.GREATER_THAN_SIGN) {
            this._err(ERR.incorrectlyClosedComment);
            this.state = DATA_STATE;
            this._emitCurrentToken();
        } else if (cp === $.EOF) {
            this._err(ERR.eofInComment);
            this._emitCurrentToken();
            this._emitEOFToken();
        } else {
            this.currentToken.data += '--!';
            this._reconsumeInState(COMMENT_STATE);
        }
    }

    // DOCTYPE state
    //------------------------------------------------------------------
    [DOCTYPE_STATE](cp) {
        if (isWhitespace(cp)) {
            this.state = BEFORE_DOCTYPE_NAME_STATE;
        } else if (cp === $.GREATER_THAN_SIGN) {
            this._reconsumeInState(BEFORE_DOCTYPE_NAME_STATE);
        } else if (cp === $.EOF) {
            this._err(ERR.eofInDoctype);
            this._createDoctypeToken(null);
            this.currentToken.forceQuirks = true;
            this._emitCurrentToken();
            this._emitEOFToken();
        } else {
            this._err(ERR.missingWhitespaceBeforeDoctypeName);
            this._reconsumeInState(BEFORE_DOCTYPE_NAME_STATE);
        }
    }

    // Before DOCTYPE name state
    //------------------------------------------------------------------
    [BEFORE_DOCTYPE_NAME_STATE](cp) {
        if (isWhitespace(cp)) {
            return;
        }

        if (isAsciiUpper(cp)) {
            this._createDoctypeToken(toAsciiLowerChar(cp));
            this.state = DOCTYPE_NAME_STATE;
        } else if (cp === $.NULL) {
            this._err(ERR.unexpectedNullCharacter);
            this._createDoctypeToken(unicode.REPLACEMENT_CHARACTER);
            this.state = DOCTYPE_NAME_STATE;
        } else if (cp === $.GREATER_THAN_SIGN) {
            this._err(ERR.missingDoctypeName);
            this._createDoctypeToken(null);
            this.currentToken.forceQuirks = true;
            this._emitCurrentToken();
            this.state = DATA_STATE;
        } else if (cp === $.EOF) {
            this._err(ERR.eofInDoctype);
            this._createDoctypeToken(null);
            this.currentToken.forceQuirks = true;
            this._emitCurrentToken();
            this._emitEOFToken();
        } else {
            this._createDoctypeToken(toChar(cp));
            this.state = DOCTYPE_NAME_STATE;
        }
    }

    // DOCTYPE name state
    //------------------------------------------------------------------
    [DOCTYPE_NAME_STATE](cp) {
        if (isWhitespace(cp)) {
            this.state = AFTER_DOCTYPE_NAME_STATE;
        } else if (cp === $.GREATER_THAN_SIGN) {
            this.state = DATA_STATE;
            this._emitCurrentToken();
        } else if (isAsciiUpper(cp)) {
            this.currentToken.name += toAsciiLowerChar(cp);
        } else if (cp === $.NULL) {
            this._err(ERR.unexpectedNullCharacter);
            this.currentToken.name += unicode.REPLACEMENT_CHARACTER;
        } else if (cp === $.EOF) {
            this._err(ERR.eofInDoctype);
            this.currentToken.forceQuirks = true;
            this._emitCurrentToken();
            this._emitEOFToken();
        } else {
            this.currentToken.name += toChar(cp);
        }
    }

    // After DOCTYPE name state
    //------------------------------------------------------------------
    [AFTER_DOCTYPE_NAME_STATE](cp) {
        if (isWhitespace(cp)) {
            return;
        }

        if (cp === $.GREATER_THAN_SIGN) {
            this.state = DATA_STATE;
            this._emitCurrentToken();
        } else if (cp === $.EOF) {
            this._err(ERR.eofInDoctype);
            this.currentToken.forceQuirks = true;
            this._emitCurrentToken();
            this._emitEOFToken();
        } else if (this._consumeSequenceIfMatch($$.PUBLIC_STRING, cp, false)) {
            this.state = AFTER_DOCTYPE_PUBLIC_KEYWORD_STATE;
        } else if (this._consumeSequenceIfMatch($$.SYSTEM_STRING, cp, false)) {
            this.state = AFTER_DOCTYPE_SYSTEM_KEYWORD_STATE;
        }
        //NOTE: sequence lookup can be abrupted by hibernation. In that case lookup
        //results are no longer valid and we will need to start over.
        else if (!this._ensureHibernation()) {
            this._err(ERR.invalidCharacterSequenceAfterDoctypeName);
            this.currentToken.forceQuirks = true;
            this._reconsumeInState(BOGUS_DOCTYPE_STATE);
        }
    }

    // After DOCTYPE public keyword state
    //------------------------------------------------------------------
    [AFTER_DOCTYPE_PUBLIC_KEYWORD_STATE](cp) {
        if (isWhitespace(cp)) {
            this.state = BEFORE_DOCTYPE_PUBLIC_IDENTIFIER_STATE;
        } else if (cp === $.QUOTATION_MARK) {
            this._err(ERR.missingWhitespaceAfterDoctypePublicKeyword);
            this.currentToken.publicId = '';
            this.state = DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED_STATE;
        } else if (cp === $.APOSTROPHE) {
            this._err(ERR.missingWhitespaceAfterDoctypePublicKeyword);
            this.currentToken.publicId = '';
            this.state = DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED_STATE;
        } else if (cp === $.GREATER_THAN_SIGN) {
            this._err(ERR.missingDoctypePublicIdentifier);
            this.currentToken.forceQuirks = true;
            this.state = DATA_STATE;
            this._emitCurrentToken();
        } else if (cp === $.EOF) {
            this._err(ERR.eofInDoctype);
            this.currentToken.forceQuirks = true;
            this._emitCurrentToken();
            this._emitEOFToken();
        } else {
            this._err(ERR.missingQuoteBeforeDoctypePublicIdentifier);
            this.currentToken.forceQuirks = true;
            this._reconsumeInState(BOGUS_DOCTYPE_STATE);
        }
    }

    // Before DOCTYPE public identifier state
    //------------------------------------------------------------------
    [BEFORE_DOCTYPE_PUBLIC_IDENTIFIER_STATE](cp) {
        if (isWhitespace(cp)) {
            return;
        }

        if (cp === $.QUOTATION_MARK) {
            this.currentToken.publicId = '';
            this.state = DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED_STATE;
        } else if (cp === $.APOSTROPHE) {
            this.currentToken.publicId = '';
            this.state = DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED_STATE;
        } else if (cp === $.GREATER_THAN_SIGN) {
            this._err(ERR.missingDoctypePublicIdentifier);
            this.currentToken.forceQuirks = true;
            this.state = DATA_STATE;
            this._emitCurrentToken();
        } else if (cp === $.EOF) {
            this._err(ERR.eofInDoctype);
            this.currentToken.forceQuirks = true;
            this._emitCurrentToken();
            this._emitEOFToken();
        } else {
            this._err(ERR.missingQuoteBeforeDoctypePublicIdentifier);
            this.currentToken.forceQuirks = true;
            this._reconsumeInState(BOGUS_DOCTYPE_STATE);
        }
    }

    // DOCTYPE public identifier (double-quoted) state
    //------------------------------------------------------------------
    [DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED_STATE](cp) {
        if (cp === $.QUOTATION_MARK) {
            this.state = AFTER_DOCTYPE_PUBLIC_IDENTIFIER_STATE;
        } else if (cp === $.NULL) {
            this._err(ERR.unexpectedNullCharacter);
            this.currentToken.publicId += unicode.REPLACEMENT_CHARACTER;
        } else if (cp === $.GREATER_THAN_SIGN) {
            this._err(ERR.abruptDoctypePublicIdentifier);
            this.currentToken.forceQuirks = true;
            this._emitCurrentToken();
            this.state = DATA_STATE;
        } else if (cp === $.EOF) {
            this._err(ERR.eofInDoctype);
            this.currentToken.forceQuirks = true;
            this._emitCurrentToken();
            this._emitEOFToken();
        } else {
            this.currentToken.publicId += toChar(cp);
        }
    }

    // DOCTYPE public identifier (single-quoted) state
    //------------------------------------------------------------------
    [DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED_STATE](cp) {
        if (cp === $.APOSTROPHE) {
            this.state = AFTER_DOCTYPE_PUBLIC_IDENTIFIER_STATE;
        } else if (cp === $.NULL) {
            this._err(ERR.unexpectedNullCharacter);
            this.currentToken.publicId += unicode.REPLACEMENT_CHARACTER;
        } else if (cp === $.GREATER_THAN_SIGN) {
            this._err(ERR.abruptDoctypePublicIdentifier);
            this.currentToken.forceQuirks = true;
            this._emitCurrentToken();
            this.state = DATA_STATE;
        } else if (cp === $.EOF) {
            this._err(ERR.eofInDoctype);
            this.currentToken.forceQuirks = true;
            this._emitCurrentToken();
            this._emitEOFToken();
        } else {
            this.currentToken.publicId += toChar(cp);
        }
    }

    // After DOCTYPE public identifier state
    //------------------------------------------------------------------
    [AFTER_DOCTYPE_PUBLIC_IDENTIFIER_STATE](cp) {
        if (isWhitespace(cp)) {
            this.state = BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS_STATE;
        } else if (cp === $.GREATER_THAN_SIGN) {
            this.state = DATA_STATE;
            this._emitCurrentToken();
        } else if (cp === $.QUOTATION_MARK) {
            this._err(ERR.missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers);
            this.currentToken.systemId = '';
            this.state = DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED_STATE;
        } else if (cp === $.APOSTROPHE) {
            this._err(ERR.missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers);
            this.currentToken.systemId = '';
            this.state = DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED_STATE;
        } else if (cp === $.EOF) {
            this._err(ERR.eofInDoctype);
            this.currentToken.forceQuirks = true;
            this._emitCurrentToken();
            this._emitEOFToken();
        } else {
            this._err(ERR.missingQuoteBeforeDoctypeSystemIdentifier);
            this.currentToken.forceQuirks = true;
            this._reconsumeInState(BOGUS_DOCTYPE_STATE);
        }
    }

    // Between DOCTYPE public and system identifiers state
    //------------------------------------------------------------------
    [BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS_STATE](cp) {
        if (isWhitespace(cp)) {
            return;
        }

        if (cp === $.GREATER_THAN_SIGN) {
            this._emitCurrentToken();
            this.state = DATA_STATE;
        } else if (cp === $.QUOTATION_MARK) {
            this.currentToken.systemId = '';
            this.state = DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED_STATE;
        } else if (cp === $.APOSTROPHE) {
            this.currentToken.systemId = '';
            this.state = DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED_STATE;
        } else if (cp === $.EOF) {
            this._err(ERR.eofInDoctype);
            this.currentToken.forceQuirks = true;
            this._emitCurrentToken();
            this._emitEOFToken();
        } else {
            this._err(ERR.missingQuoteBeforeDoctypeSystemIdentifier);
            this.currentToken.forceQuirks = true;
            this._reconsumeInState(BOGUS_DOCTYPE_STATE);
        }
    }

    // After DOCTYPE system keyword state
    //------------------------------------------------------------------
    [AFTER_DOCTYPE_SYSTEM_KEYWORD_STATE](cp) {
        if (isWhitespace(cp)) {
            this.state = BEFORE_DOCTYPE_SYSTEM_IDENTIFIER_STATE;
        } else if (cp === $.QUOTATION_MARK) {
            this._err(ERR.missingWhitespaceAfterDoctypeSystemKeyword);
            this.currentToken.systemId = '';
            this.state = DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED_STATE;
        } else if (cp === $.APOSTROPHE) {
            this._err(ERR.missingWhitespaceAfterDoctypeSystemKeyword);
            this.currentToken.systemId = '';
            this.state = DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED_STATE;
        } else if (cp === $.GREATER_THAN_SIGN) {
            this._err(ERR.missingDoctypeSystemIdentifier);
            this.currentToken.forceQuirks = true;
            this.state = DATA_STATE;
            this._emitCurrentToken();
        } else if (cp === $.EOF) {
            this._err(ERR.eofInDoctype);
            this.currentToken.forceQuirks = true;
            this._emitCurrentToken();
            this._emitEOFToken();
        } else {
            this._err(ERR.missingQuoteBeforeDoctypeSystemIdentifier);
            this.currentToken.forceQuirks = true;
            this._reconsumeInState(BOGUS_DOCTYPE_STATE);
        }
    }

    // Before DOCTYPE system identifier state
    //------------------------------------------------------------------
    [BEFORE_DOCTYPE_SYSTEM_IDENTIFIER_STATE](cp) {
        if (isWhitespace(cp)) {
            return;
        }

        if (cp === $.QUOTATION_MARK) {
            this.currentToken.systemId = '';
            this.state = DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED_STATE;
        } else if (cp === $.APOSTROPHE) {
            this.currentToken.systemId = '';
            this.state = DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED_STATE;
        } else if (cp === $.GREATER_THAN_SIGN) {
            this._err(ERR.missingDoctypeSystemIdentifier);
            this.currentToken.forceQuirks = true;
            this.state = DATA_STATE;
            this._emitCurrentToken();
        } else if (cp === $.EOF) {
            this._err(ERR.eofInDoctype);
            this.currentToken.forceQuirks = true;
            this._emitCurrentToken();
            this._emitEOFToken();
        } else {
            this._err(ERR.missingQuoteBeforeDoctypeSystemIdentifier);
            this.currentToken.forceQuirks = true;
            this._reconsumeInState(BOGUS_DOCTYPE_STATE);
        }
    }

    // DOCTYPE system identifier (double-quoted) state
    //------------------------------------------------------------------
    [DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED_STATE](cp) {
        if (cp === $.QUOTATION_MARK) {
            this.state = AFTER_DOCTYPE_SYSTEM_IDENTIFIER_STATE;
        } else if (cp === $.NULL) {
            this._err(ERR.unexpectedNullCharacter);
            this.currentToken.systemId += unicode.REPLACEMENT_CHARACTER;
        } else if (cp === $.GREATER_THAN_SIGN) {
            this._err(ERR.abruptDoctypeSystemIdentifier);
            this.currentToken.forceQuirks = true;
            this._emitCurrentToken();
            this.state = DATA_STATE;
        } else if (cp === $.EOF) {
            this._err(ERR.eofInDoctype);
            this.currentToken.forceQuirks = true;
            this._emitCurrentToken();
            this._emitEOFToken();
        } else {
            this.currentToken.systemId += toChar(cp);
        }
    }

    // DOCTYPE system identifier (single-quoted) state
    //------------------------------------------------------------------
    [DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED_STATE](cp) {
        if (cp === $.APOSTROPHE) {
            this.state = AFTER_DOCTYPE_SYSTEM_IDENTIFIER_STATE;
        } else if (cp === $.NULL) {
            this._err(ERR.unexpectedNullCharacter);
            this.currentToken.systemId += unicode.REPLACEMENT_CHARACTER;
        } else if (cp === $.GREATER_THAN_SIGN) {
            this._err(ERR.abruptDoctypeSystemIdentifier);
            this.currentToken.forceQuirks = true;
            this._emitCurrentToken();
            this.state = DATA_STATE;
        } else if (cp === $.EOF) {
            this._err(ERR.eofInDoctype);
            this.currentToken.forceQuirks = true;
            this._emitCurrentToken();
            this._emitEOFToken();
        } else {
            this.currentToken.systemId += toChar(cp);
        }
    }

    // After DOCTYPE system identifier state
    //------------------------------------------------------------------
    [AFTER_DOCTYPE_SYSTEM_IDENTIFIER_STATE](cp) {
        if (isWhitespace(cp)) {
            return;
        }

        if (cp === $.GREATER_THAN_SIGN) {
            this._emitCurrentToken();
            this.state = DATA_STATE;
        } else if (cp === $.EOF) {
            this._err(ERR.eofInDoctype);
            this.currentToken.forceQuirks = true;
            this._emitCurrentToken();
            this._emitEOFToken();
        } else {
            this._err(ERR.unexpectedCharacterAfterDoctypeSystemIdentifier);
            this._reconsumeInState(BOGUS_DOCTYPE_STATE);
        }
    }

    // Bogus DOCTYPE state
    //------------------------------------------------------------------
    [BOGUS_DOCTYPE_STATE](cp) {
        if (cp === $.GREATER_THAN_SIGN) {
            this._emitCurrentToken();
            this.state = DATA_STATE;
        } else if (cp === $.NULL) {
            this._err(ERR.unexpectedNullCharacter);
        } else if (cp === $.EOF) {
            this._emitCurrentToken();
            this._emitEOFToken();
        }
    }

    // CDATA section state
    //------------------------------------------------------------------
    [CDATA_SECTION_STATE](cp) {
        if (cp === $.RIGHT_SQUARE_BRACKET) {
            this.state = CDATA_SECTION_BRACKET_STATE;
        } else if (cp === $.EOF) {
            this._err(ERR.eofInCdata);
            this._emitEOFToken();
        } else {
            this._emitCodePoint(cp);
        }
    }

    // CDATA section bracket state
    //------------------------------------------------------------------
    [CDATA_SECTION_BRACKET_STATE](cp) {
        if (cp === $.RIGHT_SQUARE_BRACKET) {
            this.state = CDATA_SECTION_END_STATE;
        } else {
            this._emitChars(']');
            this._reconsumeInState(CDATA_SECTION_STATE);
        }
    }

    // CDATA section end state
    //------------------------------------------------------------------
    [CDATA_SECTION_END_STATE](cp) {
        if (cp === $.GREATER_THAN_SIGN) {
            this.state = DATA_STATE;
        } else if (cp === $.RIGHT_SQUARE_BRACKET) {
            this._emitChars(']');
        } else {
            this._emitChars(']]');
            this._reconsumeInState(CDATA_SECTION_STATE);
        }
    }

    // Character reference state
    //------------------------------------------------------------------
    [CHARACTER_REFERENCE_STATE](cp) {
        this.tempBuff = [$.AMPERSAND];

        if (cp === $.NUMBER_SIGN) {
            this.tempBuff.push(cp);
            this.state = NUMERIC_CHARACTER_REFERENCE_STATE;
        } else if (isAsciiAlphaNumeric(cp)) {
            this._reconsumeInState(NAMED_CHARACTER_REFERENCE_STATE);
        } else {
            this._flushCodePointsConsumedAsCharacterReference();
            this._reconsumeInState(this.returnState);
        }
    }

    // Named character reference state
    //------------------------------------------------------------------
    [NAMED_CHARACTER_REFERENCE_STATE](cp) {
        const matchResult = this._matchNamedCharacterReference(cp);

        //NOTE: matching can be abrupted by hibernation. In that case match
        //results are no longer valid and we will need to start over.
        if (this._ensureHibernation()) {
            this.tempBuff = [$.AMPERSAND];
        } else if (matchResult) {
            const withSemicolon = this.tempBuff[this.tempBuff.length - 1] === $.SEMICOLON;

            if (!this._isCharacterReferenceAttributeQuirk(withSemicolon)) {
                if (!withSemicolon) {
                    this._errOnNextCodePoint(ERR.missingSemicolonAfterCharacterReference);
                }

                this.tempBuff = matchResult;
            }

            this._flushCodePointsConsumedAsCharacterReference();
            this.state = this.returnState;
        } else {
            this._flushCodePointsConsumedAsCharacterReference();
            this.state = AMBIGUOUS_AMPERSAND_STATE;
        }
    }

    // Ambiguos ampersand state
    //------------------------------------------------------------------
    [AMBIGUOUS_AMPERSAND_STATE](cp) {
        if (isAsciiAlphaNumeric(cp)) {
            if (this._isCharacterReferenceInAttribute()) {
                this.currentAttr.value += toChar(cp);
            } else {
                this._emitCodePoint(cp);
            }
        } else {
            if (cp === $.SEMICOLON) {
                this._err(ERR.unknownNamedCharacterReference);
            }

            this._reconsumeInState(this.returnState);
        }
    }

    // Numeric character reference state
    //------------------------------------------------------------------
    [NUMERIC_CHARACTER_REFERENCE_STATE](cp) {
        this.charRefCode = 0;

        if (cp === $.LATIN_SMALL_X || cp === $.LATIN_CAPITAL_X) {
            this.tempBuff.push(cp);
            this.state = HEXADEMICAL_CHARACTER_REFERENCE_START_STATE;
        } else {
            this._reconsumeInState(DECIMAL_CHARACTER_REFERENCE_START_STATE);
        }
    }

    // Hexademical character reference start state
    //------------------------------------------------------------------
    [HEXADEMICAL_CHARACTER_REFERENCE_START_STATE](cp) {
        if (isAsciiHexDigit(cp)) {
            this._reconsumeInState(HEXADEMICAL_CHARACTER_REFERENCE_STATE);
        } else {
            this._err(ERR.absenceOfDigitsInNumericCharacterReference);
            this._flushCodePointsConsumedAsCharacterReference();
            this._reconsumeInState(this.returnState);
        }
    }

    // Decimal character reference start state
    //------------------------------------------------------------------
    [DECIMAL_CHARACTER_REFERENCE_START_STATE](cp) {
        if (isAsciiDigit(cp)) {
            this._reconsumeInState(DECIMAL_CHARACTER_REFERENCE_STATE);
        } else {
            this._err(ERR.absenceOfDigitsInNumericCharacterReference);
            this._flushCodePointsConsumedAsCharacterReference();
            this._reconsumeInState(this.returnState);
        }
    }

    // Hexademical character reference state
    //------------------------------------------------------------------
    [HEXADEMICAL_CHARACTER_REFERENCE_STATE](cp) {
        if (isAsciiUpperHexDigit(cp)) {
            this.charRefCode = this.charRefCode * 16 + cp - 0x37;
        } else if (isAsciiLowerHexDigit(cp)) {
            this.charRefCode = this.charRefCode * 16 + cp - 0x57;
        } else if (isAsciiDigit(cp)) {
            this.charRefCode = this.charRefCode * 16 + cp - 0x30;
        } else if (cp === $.SEMICOLON) {
            this.state = NUMERIC_CHARACTER_REFERENCE_END_STATE;
        } else {
            this._err(ERR.missingSemicolonAfterCharacterReference);
            this._reconsumeInState(NUMERIC_CHARACTER_REFERENCE_END_STATE);
        }
    }

    // Decimal character reference state
    //------------------------------------------------------------------
    [DECIMAL_CHARACTER_REFERENCE_STATE](cp) {
        if (isAsciiDigit(cp)) {
            this.charRefCode = this.charRefCode * 10 + cp - 0x30;
        } else if (cp === $.SEMICOLON) {
            this.state = NUMERIC_CHARACTER_REFERENCE_END_STATE;
        } else {
            this._err(ERR.missingSemicolonAfterCharacterReference);
            this._reconsumeInState(NUMERIC_CHARACTER_REFERENCE_END_STATE);
        }
    }

    // Numeric character reference end state
    //------------------------------------------------------------------
    [NUMERIC_CHARACTER_REFERENCE_END_STATE]() {
        if (this.charRefCode === $.NULL) {
            this._err(ERR.nullCharacterReference);
            this.charRefCode = $.REPLACEMENT_CHARACTER;
        } else if (this.charRefCode > 0x10ffff) {
            this._err(ERR.characterReferenceOutsideUnicodeRange);
            this.charRefCode = $.REPLACEMENT_CHARACTER;
        } else if (unicode.isSurrogate(this.charRefCode)) {
            this._err(ERR.surrogateCharacterReference);
            this.charRefCode = $.REPLACEMENT_CHARACTER;
        } else if (unicode.isUndefinedCodePoint(this.charRefCode)) {
            this._err(ERR.noncharacterCharacterReference);
        } else if (unicode.isControlCodePoint(this.charRefCode) || this.charRefCode === $.CARRIAGE_RETURN) {
            this._err(ERR.controlCharacterReference);

            const replacement = C1_CONTROLS_REFERENCE_REPLACEMENTS[this.charRefCode];

            if (replacement) {
                this.charRefCode = replacement;
            }
        }

        this.tempBuff = [this.charRefCode];

        this._flushCodePointsConsumedAsCharacterReference();
        this._reconsumeInState(this.returnState);
    }
}

//Token types
Tokenizer.CHARACTER_TOKEN = 'CHARACTER_TOKEN';
Tokenizer.NULL_CHARACTER_TOKEN = 'NULL_CHARACTER_TOKEN';
Tokenizer.WHITESPACE_CHARACTER_TOKEN = 'WHITESPACE_CHARACTER_TOKEN';
Tokenizer.START_TAG_TOKEN = 'START_TAG_TOKEN';
Tokenizer.END_TAG_TOKEN = 'END_TAG_TOKEN';
Tokenizer.COMMENT_TOKEN = 'COMMENT_TOKEN';
Tokenizer.DOCTYPE_TOKEN = 'DOCTYPE_TOKEN';
Tokenizer.EOF_TOKEN = 'EOF_TOKEN';
Tokenizer.HIBERNATION_TOKEN = 'HIBERNATION_TOKEN';

//Tokenizer initial states for different modes
Tokenizer.MODE = {
    DATA: DATA_STATE,
    RCDATA: RCDATA_STATE,
    RAWTEXT: RAWTEXT_STATE,
    SCRIPT_DATA: SCRIPT_DATA_STATE,
    PLAINTEXT: PLAINTEXT_STATE
};

//Static
Tokenizer.getTokenAttr = function(token, attrName) {
    for (let i = token.attrs.length - 1; i >= 0; i--) {
        if (token.attrs[i].name === attrName) {
            return token.attrs[i].value;
        }
    }

    return null;
};

module.exports = Tokenizer;

},{"../common/error-codes":136,"../common/unicode":139,"./named-entity-data":152,"./preprocessor":153}],152:[function(require,module,exports){
'use strict';

//NOTE: this file contains auto-generated array mapped radix tree that is used for the named entity references consumption
//(details: https://github.com/inikulin/parse5/tree/master/scripts/generate-named-entity-data/README.md)
module.exports = new Uint16Array([4,52,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,106,303,412,810,1432,1701,1796,1987,2114,2360,2420,2484,3170,3251,4140,4393,4575,4610,5106,5512,5728,6117,6274,6315,6345,6427,6516,7002,7910,8733,9323,9870,10170,10631,10893,11318,11386,11467,12773,13092,14474,14922,15448,15542,16419,17666,18166,18611,19004,19095,19298,19397,4,16,69,77,97,98,99,102,103,108,109,110,111,112,114,115,116,117,140,150,158,169,176,194,199,210,216,222,226,242,256,266,283,294,108,105,103,5,198,1,59,148,1,198,80,5,38,1,59,156,1,38,99,117,116,101,5,193,1,59,167,1,193,114,101,118,101,59,1,258,4,2,105,121,182,191,114,99,5,194,1,59,189,1,194,59,1,1040,114,59,3,55349,56580,114,97,118,101,5,192,1,59,208,1,192,112,104,97,59,1,913,97,99,114,59,1,256,100,59,1,10835,4,2,103,112,232,237,111,110,59,1,260,102,59,3,55349,56632,112,108,121,70,117,110,99,116,105,111,110,59,1,8289,105,110,103,5,197,1,59,264,1,197,4,2,99,115,272,277,114,59,3,55349,56476,105,103,110,59,1,8788,105,108,100,101,5,195,1,59,292,1,195,109,108,5,196,1,59,301,1,196,4,8,97,99,101,102,111,114,115,117,321,350,354,383,388,394,400,405,4,2,99,114,327,336,107,115,108,97,115,104,59,1,8726,4,2,118,119,342,345,59,1,10983,101,100,59,1,8966,121,59,1,1041,4,3,99,114,116,362,369,379,97,117,115,101,59,1,8757,110,111,117,108,108,105,115,59,1,8492,97,59,1,914,114,59,3,55349,56581,112,102,59,3,55349,56633,101,118,101,59,1,728,99,114,59,1,8492,109,112,101,113,59,1,8782,4,14,72,79,97,99,100,101,102,104,105,108,111,114,115,117,442,447,456,504,542,547,569,573,577,616,678,784,790,796,99,121,59,1,1063,80,89,5,169,1,59,454,1,169,4,3,99,112,121,464,470,497,117,116,101,59,1,262,4,2,59,105,476,478,1,8914,116,97,108,68,105,102,102,101,114,101,110,116,105,97,108,68,59,1,8517,108,101,121,115,59,1,8493,4,4,97,101,105,111,514,520,530,535,114,111,110,59,1,268,100,105,108,5,199,1,59,528,1,199,114,99,59,1,264,110,105,110,116,59,1,8752,111,116,59,1,266,4,2,100,110,553,560,105,108,108,97,59,1,184,116,101,114,68,111,116,59,1,183,114,59,1,8493,105,59,1,935,114,99,108,101,4,4,68,77,80,84,591,596,603,609,111,116,59,1,8857,105,110,117,115,59,1,8854,108,117,115,59,1,8853,105,109,101,115,59,1,8855,111,4,2,99,115,623,646,107,119,105,115,101,67,111,110,116,111,117,114,73,110,116,101,103,114,97,108,59,1,8754,101,67,117,114,108,121,4,2,68,81,658,671,111,117,98,108,101,81,117,111,116,101,59,1,8221,117,111,116,101,59,1,8217,4,4,108,110,112,117,688,701,736,753,111,110,4,2,59,101,696,698,1,8759,59,1,10868,4,3,103,105,116,709,717,722,114,117,101,110,116,59,1,8801,110,116,59,1,8751,111,117,114,73,110,116,101,103,114,97,108,59,1,8750,4,2,102,114,742,745,59,1,8450,111,100,117,99,116,59,1,8720,110,116,101,114,67,108,111,99,107,119,105,115,101,67,111,110,116,111,117,114,73,110,116,101,103,114,97,108,59,1,8755,111,115,115,59,1,10799,99,114,59,3,55349,56478,112,4,2,59,67,803,805,1,8915,97,112,59,1,8781,4,11,68,74,83,90,97,99,101,102,105,111,115,834,850,855,860,865,888,903,916,921,1011,1415,4,2,59,111,840,842,1,8517,116,114,97,104,100,59,1,10513,99,121,59,1,1026,99,121,59,1,1029,99,121,59,1,1039,4,3,103,114,115,873,879,883,103,101,114,59,1,8225,114,59,1,8609,104,118,59,1,10980,4,2,97,121,894,900,114,111,110,59,1,270,59,1,1044,108,4,2,59,116,910,912,1,8711,97,59,1,916,114,59,3,55349,56583,4,2,97,102,927,998,4,2,99,109,933,992,114,105,116,105,99,97,108,4,4,65,68,71,84,950,957,978,985,99,117,116,101,59,1,180,111,4,2,116,117,964,967,59,1,729,98,108,101,65,99,117,116,101,59,1,733,114,97,118,101,59,1,96,105,108,100,101,59,1,732,111,110,100,59,1,8900,102,101,114,101,110,116,105,97,108,68,59,1,8518,4,4,112,116,117,119,1021,1026,1048,1249,102,59,3,55349,56635,4,3,59,68,69,1034,1036,1041,1,168,111,116,59,1,8412,113,117,97,108,59,1,8784,98,108,101,4,6,67,68,76,82,85,86,1065,1082,1101,1189,1211,1236,111,110,116,111,117,114,73,110,116,101,103,114,97,108,59,1,8751,111,4,2,116,119,1089,1092,59,1,168,110,65,114,114,111,119,59,1,8659,4,2,101,111,1107,1141,102,116,4,3,65,82,84,1117,1124,1136,114,114,111,119,59,1,8656,105,103,104,116,65,114,114,111,119,59,1,8660,101,101,59,1,10980,110,103,4,2,76,82,1149,1177,101,102,116,4,2,65,82,1158,1165,114,114,111,119,59,1,10232,105,103,104,116,65,114,114,111,119,59,1,10234,105,103,104,116,65,114,114,111,119,59,1,10233,105,103,104,116,4,2,65,84,1199,1206,114,114,111,119,59,1,8658,101,101,59,1,8872,112,4,2,65,68,1218,1225,114,114,111,119,59,1,8657,111,119,110,65,114,114,111,119,59,1,8661,101,114,116,105,99,97,108,66,97,114,59,1,8741,110,4,6,65,66,76,82,84,97,1264,1292,1299,1352,1391,1408,114,114,111,119,4,3,59,66,85,1276,1278,1283,1,8595,97,114,59,1,10515,112,65,114,114,111,119,59,1,8693,114,101,118,101,59,1,785,101,102,116,4,3,82,84,86,1310,1323,1334,105,103,104,116,86,101,99,116,111,114,59,1,10576,101,101,86,101,99,116,111,114,59,1,10590,101,99,116,111,114,4,2,59,66,1345,1347,1,8637,97,114,59,1,10582,105,103,104,116,4,2,84,86,1362,1373,101,101,86,101,99,116,111,114,59,1,10591,101,99,116,111,114,4,2,59,66,1384,1386,1,8641,97,114,59,1,10583,101,101,4,2,59,65,1399,1401,1,8868,114,114,111,119,59,1,8615,114,114,111,119,59,1,8659,4,2,99,116,1421,1426,114,59,3,55349,56479,114,111,107,59,1,272,4,16,78,84,97,99,100,102,103,108,109,111,112,113,115,116,117,120,1466,1470,1478,1489,1515,1520,1525,1536,1544,1593,1609,1617,1650,1664,1668,1677,71,59,1,330,72,5,208,1,59,1476,1,208,99,117,116,101,5,201,1,59,1487,1,201,4,3,97,105,121,1497,1503,1512,114,111,110,59,1,282,114,99,5,202,1,59,1510,1,202,59,1,1069,111,116,59,1,278,114,59,3,55349,56584,114,97,118,101,5,200,1,59,1534,1,200,101,109,101,110,116,59,1,8712,4,2,97,112,1550,1555,99,114,59,1,274,116,121,4,2,83,86,1563,1576,109,97,108,108,83,113,117,97,114,101,59,1,9723,101,114,121,83,109,97,108,108,83,113,117,97,114,101,59,1,9643,4,2,103,112,1599,1604,111,110,59,1,280,102,59,3,55349,56636,115,105,108,111,110,59,1,917,117,4,2,97,105,1624,1640,108,4,2,59,84,1631,1633,1,10869,105,108,100,101,59,1,8770,108,105,98,114,105,117,109,59,1,8652,4,2,99,105,1656,1660,114,59,1,8496,109,59,1,10867,97,59,1,919,109,108,5,203,1,59,1675,1,203,4,2,105,112,1683,1689,115,116,115,59,1,8707,111,110,101,110,116,105,97,108,69,59,1,8519,4,5,99,102,105,111,115,1713,1717,1722,1762,1791,121,59,1,1060,114,59,3,55349,56585,108,108,101,100,4,2,83,86,1732,1745,109,97,108,108,83,113,117,97,114,101,59,1,9724,101,114,121,83,109,97,108,108,83,113,117,97,114,101,59,1,9642,4,3,112,114,117,1770,1775,1781,102,59,3,55349,56637,65,108,108,59,1,8704,114,105,101,114,116,114,102,59,1,8497,99,114,59,1,8497,4,12,74,84,97,98,99,100,102,103,111,114,115,116,1822,1827,1834,1848,1855,1877,1882,1887,1890,1896,1978,1984,99,121,59,1,1027,5,62,1,59,1832,1,62,109,109,97,4,2,59,100,1843,1845,1,915,59,1,988,114,101,118,101,59,1,286,4,3,101,105,121,1863,1869,1874,100,105,108,59,1,290,114,99,59,1,284,59,1,1043,111,116,59,1,288,114,59,3,55349,56586,59,1,8921,112,102,59,3,55349,56638,101,97,116,101,114,4,6,69,70,71,76,83,84,1915,1933,1944,1953,1959,1971,113,117,97,108,4,2,59,76,1925,1927,1,8805,101,115,115,59,1,8923,117,108,108,69,113,117,97,108,59,1,8807,114,101,97,116,101,114,59,1,10914,101,115,115,59,1,8823,108,97,110,116,69,113,117,97,108,59,1,10878,105,108,100,101,59,1,8819,99,114,59,3,55349,56482,59,1,8811,4,8,65,97,99,102,105,111,115,117,2005,2012,2026,2032,2036,2049,2073,2089,82,68,99,121,59,1,1066,4,2,99,116,2018,2023,101,107,59,1,711,59,1,94,105,114,99,59,1,292,114,59,1,8460,108,98,101,114,116,83,112,97,99,101,59,1,8459,4,2,112,114,2055,2059,102,59,1,8461,105,122,111,110,116,97,108,76,105,110,101,59,1,9472,4,2,99,116,2079,2083,114,59,1,8459,114,111,107,59,1,294,109,112,4,2,68,69,2097,2107,111,119,110,72,117,109,112,59,1,8782,113,117,97,108,59,1,8783,4,14,69,74,79,97,99,100,102,103,109,110,111,115,116,117,2144,2149,2155,2160,2171,2189,2194,2198,2209,2245,2307,2329,2334,2341,99,121,59,1,1045,108,105,103,59,1,306,99,121,59,1,1025,99,117,116,101,5,205,1,59,2169,1,205,4,2,105,121,2177,2186,114,99,5,206,1,59,2184,1,206,59,1,1048,111,116,59,1,304,114,59,1,8465,114,97,118,101,5,204,1,59,2207,1,204,4,3,59,97,112,2217,2219,2238,1,8465,4,2,99,103,2225,2229,114,59,1,298,105,110,97,114,121,73,59,1,8520,108,105,101,115,59,1,8658,4,2,116,118,2251,2281,4,2,59,101,2257,2259,1,8748,4,2,103,114,2265,2271,114,97,108,59,1,8747,115,101,99,116,105,111,110,59,1,8898,105,115,105,98,108,101,4,2,67,84,2293,2300,111,109,109,97,59,1,8291,105,109,101,115,59,1,8290,4,3,103,112,116,2315,2320,2325,111,110,59,1,302,102,59,3,55349,56640,97,59,1,921,99,114,59,1,8464,105,108,100,101,59,1,296,4,2,107,109,2347,2352,99,121,59,1,1030,108,5,207,1,59,2358,1,207,4,5,99,102,111,115,117,2372,2386,2391,2397,2414,4,2,105,121,2378,2383,114,99,59,1,308,59,1,1049,114,59,3,55349,56589,112,102,59,3,55349,56641,4,2,99,101,2403,2408,114,59,3,55349,56485,114,99,121,59,1,1032,107,99,121,59,1,1028,4,7,72,74,97,99,102,111,115,2436,2441,2446,2452,2467,2472,2478,99,121,59,1,1061,99,121,59,1,1036,112,112,97,59,1,922,4,2,101,121,2458,2464,100,105,108,59,1,310,59,1,1050,114,59,3,55349,56590,112,102,59,3,55349,56642,99,114,59,3,55349,56486,4,11,74,84,97,99,101,102,108,109,111,115,116,2508,2513,2520,2562,2585,2981,2986,3004,3011,3146,3167,99,121,59,1,1033,5,60,1,59,2518,1,60,4,5,99,109,110,112,114,2532,2538,2544,2548,2558,117,116,101,59,1,313,98,100,97,59,1,923,103,59,1,10218,108,97,99,101,116,114,102,59,1,8466,114,59,1,8606,4,3,97,101,121,2570,2576,2582,114,111,110,59,1,317,100,105,108,59,1,315,59,1,1051,4,2,102,115,2591,2907,116,4,10,65,67,68,70,82,84,85,86,97,114,2614,2663,2672,2728,2735,2760,2820,2870,2888,2895,4,2,110,114,2620,2633,103,108,101,66,114,97,99,107,101,116,59,1,10216,114,111,119,4,3,59,66,82,2644,2646,2651,1,8592,97,114,59,1,8676,105,103,104,116,65,114,114,111,119,59,1,8646,101,105,108,105,110,103,59,1,8968,111,4,2,117,119,2679,2692,98,108,101,66,114,97,99,107,101,116,59,1,10214,110,4,2,84,86,2699,2710,101,101,86,101,99,116,111,114,59,1,10593,101,99,116,111,114,4,2,59,66,2721,2723,1,8643,97,114,59,1,10585,108,111,111,114,59,1,8970,105,103,104,116,4,2,65,86,2745,2752,114,114,111,119,59,1,8596,101,99,116,111,114,59,1,10574,4,2,101,114,2766,2792,101,4,3,59,65,86,2775,2777,2784,1,8867,114,114,111,119,59,1,8612,101,99,116,111,114,59,1,10586,105,97,110,103,108,101,4,3,59,66,69,2806,2808,2813,1,8882,97,114,59,1,10703,113,117,97,108,59,1,8884,112,4,3,68,84,86,2829,2841,2852,111,119,110,86,101,99,116,111,114,59,1,10577,101,101,86,101,99,116,111,114,59,1,10592,101,99,116,111,114,4,2,59,66,2863,2865,1,8639,97,114,59,1,10584,101,99,116,111,114,4,2,59,66,2881,2883,1,8636,97,114,59,1,10578,114,114,111,119,59,1,8656,105,103,104,116,97,114,114,111,119,59,1,8660,115,4,6,69,70,71,76,83,84,2922,2936,2947,2956,2962,2974,113,117,97,108,71,114,101,97,116,101,114,59,1,8922,117,108,108,69,113,117,97,108,59,1,8806,114,101,97,116,101,114,59,1,8822,101,115,115,59,1,10913,108,97,110,116,69,113,117,97,108,59,1,10877,105,108,100,101,59,1,8818,114,59,3,55349,56591,4,2,59,101,2992,2994,1,8920,102,116,97,114,114,111,119,59,1,8666,105,100,111,116,59,1,319,4,3,110,112,119,3019,3110,3115,103,4,4,76,82,108,114,3030,3058,3070,3098,101,102,116,4,2,65,82,3039,3046,114,114,111,119,59,1,10229,105,103,104,116,65,114,114,111,119,59,1,10231,105,103,104,116,65,114,114,111,119,59,1,10230,101,102,116,4,2,97,114,3079,3086,114,114,111,119,59,1,10232,105,103,104,116,97,114,114,111,119,59,1,10234,105,103,104,116,97,114,114,111,119,59,1,10233,102,59,3,55349,56643,101,114,4,2,76,82,3123,3134,101,102,116,65,114,114,111,119,59,1,8601,105,103,104,116,65,114,114,111,119,59,1,8600,4,3,99,104,116,3154,3158,3161,114,59,1,8466,59,1,8624,114,111,107,59,1,321,59,1,8810,4,8,97,99,101,102,105,111,115,117,3188,3192,3196,3222,3227,3237,3243,3248,112,59,1,10501,121,59,1,1052,4,2,100,108,3202,3213,105,117,109,83,112,97,99,101,59,1,8287,108,105,110,116,114,102,59,1,8499,114,59,3,55349,56592,110,117,115,80,108,117,115,59,1,8723,112,102,59,3,55349,56644,99,114,59,1,8499,59,1,924,4,9,74,97,99,101,102,111,115,116,117,3271,3276,3283,3306,3422,3427,4120,4126,4137,99,121,59,1,1034,99,117,116,101,59,1,323,4,3,97,101,121,3291,3297,3303,114,111,110,59,1,327,100,105,108,59,1,325,59,1,1053,4,3,103,115,119,3314,3380,3415,97,116,105,118,101,4,3,77,84,86,3327,3340,3365,101,100,105,117,109,83,112,97,99,101,59,1,8203,104,105,4,2,99,110,3348,3357,107,83,112,97,99,101,59,1,8203,83,112,97,99,101,59,1,8203,101,114,121,84,104,105,110,83,112,97,99,101,59,1,8203,116,101,100,4,2,71,76,3389,3405,114,101,97,116,101,114,71,114,101,97,116,101,114,59,1,8811,101,115,115,76,101,115,115,59,1,8810,76,105,110,101,59,1,10,114,59,3,55349,56593,4,4,66,110,112,116,3437,3444,3460,3464,114,101,97,107,59,1,8288,66,114,101,97,107,105,110,103,83,112,97,99,101,59,1,160,102,59,1,8469,4,13,59,67,68,69,71,72,76,78,80,82,83,84,86,3492,3494,3517,3536,3578,3657,3685,3784,3823,3860,3915,4066,4107,1,10988,4,2,111,117,3500,3510,110,103,114,117,101,110,116,59,1,8802,112,67,97,112,59,1,8813,111,117,98,108,101,86,101,114,116,105,99,97,108,66,97,114,59,1,8742,4,3,108,113,120,3544,3552,3571,101,109,101,110,116,59,1,8713,117,97,108,4,2,59,84,3561,3563,1,8800,105,108,100,101,59,3,8770,824,105,115,116,115,59,1,8708,114,101,97,116,101,114,4,7,59,69,70,71,76,83,84,3600,3602,3609,3621,3631,3637,3650,1,8815,113,117,97,108,59,1,8817,117,108,108,69,113,117,97,108,59,3,8807,824,114,101,97,116,101,114,59,3,8811,824,101,115,115,59,1,8825,108,97,110,116,69,113,117,97,108,59,3,10878,824,105,108,100,101,59,1,8821,117,109,112,4,2,68,69,3666,3677,111,119,110,72,117,109,112,59,3,8782,824,113,117,97,108,59,3,8783,824,101,4,2,102,115,3692,3724,116,84,114,105,97,110,103,108,101,4,3,59,66,69,3709,3711,3717,1,8938,97,114,59,3,10703,824,113,117,97,108,59,1,8940,115,4,6,59,69,71,76,83,84,3739,3741,3748,3757,3764,3777,1,8814,113,117,97,108,59,1,8816,114,101,97,116,101,114,59,1,8824,101,115,115,59,3,8810,824,108,97,110,116,69,113,117,97,108,59,3,10877,824,105,108,100,101,59,1,8820,101,115,116,101,100,4,2,71,76,3795,3812,114,101,97,116,101,114,71,114,101,97,116,101,114,59,3,10914,824,101,115,115,76,101,115,115,59,3,10913,824,114,101,99,101,100,101,115,4,3,59,69,83,3838,3840,3848,1,8832,113,117,97,108,59,3,10927,824,108,97,110,116,69,113,117,97,108,59,1,8928,4,2,101,105,3866,3881,118,101,114,115,101,69,108,101,109,101,110,116,59,1,8716,103,104,116,84,114,105,97,110,103,108,101,4,3,59,66,69,3900,3902,3908,1,8939,97,114,59,3,10704,824,113,117,97,108,59,1,8941,4,2,113,117,3921,3973,117,97,114,101,83,117,4,2,98,112,3933,3952,115,101,116,4,2,59,69,3942,3945,3,8847,824,113,117,97,108,59,1,8930,101,114,115,101,116,4,2,59,69,3963,3966,3,8848,824,113,117,97,108,59,1,8931,4,3,98,99,112,3981,4000,4045,115,101,116,4,2,59,69,3990,3993,3,8834,8402,113,117,97,108,59,1,8840,99,101,101,100,115,4,4,59,69,83,84,4015,4017,4025,4037,1,8833,113,117,97,108,59,3,10928,824,108,97,110,116,69,113,117,97,108,59,1,8929,105,108,100,101,59,3,8831,824,101,114,115,101,116,4,2,59,69,4056,4059,3,8835,8402,113,117,97,108,59,1,8841,105,108,100,101,4,4,59,69,70,84,4080,4082,4089,4100,1,8769,113,117,97,108,59,1,8772,117,108,108,69,113,117,97,108,59,1,8775,105,108,100,101,59,1,8777,101,114,116,105,99,97,108,66,97,114,59,1,8740,99,114,59,3,55349,56489,105,108,100,101,5,209,1,59,4135,1,209,59,1,925,4,14,69,97,99,100,102,103,109,111,112,114,115,116,117,118,4170,4176,4187,4205,4212,4217,4228,4253,4259,4292,4295,4316,4337,4346,108,105,103,59,1,338,99,117,116,101,5,211,1,59,4185,1,211,4,2,105,121,4193,4202,114,99,5,212,1,59,4200,1,212,59,1,1054,98,108,97,99,59,1,336,114,59,3,55349,56594,114,97,118,101,5,210,1,59,4226,1,210,4,3,97,101,105,4236,4241,4246,99,114,59,1,332,103,97,59,1,937,99,114,111,110,59,1,927,112,102,59,3,55349,56646,101,110,67,117,114,108,121,4,2,68,81,4272,4285,111,117,98,108,101,81,117,111,116,101,59,1,8220,117,111,116,101,59,1,8216,59,1,10836,4,2,99,108,4301,4306,114,59,3,55349,56490,97,115,104,5,216,1,59,4314,1,216,105,4,2,108,109,4323,4332,100,101,5,213,1,59,4330,1,213,101,115,59,1,10807,109,108,5,214,1,59,4344,1,214,101,114,4,2,66,80,4354,4380,4,2,97,114,4360,4364,114,59,1,8254,97,99,4,2,101,107,4372,4375,59,1,9182,101,116,59,1,9140,97,114,101,110,116,104,101,115,105,115,59,1,9180,4,9,97,99,102,104,105,108,111,114,115,4413,4422,4426,4431,4435,4438,4448,4471,4561,114,116,105,97,108,68,59,1,8706,121,59,1,1055,114,59,3,55349,56595,105,59,1,934,59,1,928,117,115,77,105,110,117,115,59,1,177,4,2,105,112,4454,4467,110,99,97,114,101,112,108,97,110,101,59,1,8460,102,59,1,8473,4,4,59,101,105,111,4481,4483,4526,4531,1,10939,99,101,100,101,115,4,4,59,69,83,84,4498,4500,4507,4519,1,8826,113,117,97,108,59,1,10927,108,97,110,116,69,113,117,97,108,59,1,8828,105,108,100,101,59,1,8830,109,101,59,1,8243,4,2,100,112,4537,4543,117,99,116,59,1,8719,111,114,116,105,111,110,4,2,59,97,4555,4557,1,8759,108,59,1,8733,4,2,99,105,4567,4572,114,59,3,55349,56491,59,1,936,4,4,85,102,111,115,4585,4594,4599,4604,79,84,5,34,1,59,4592,1,34,114,59,3,55349,56596,112,102,59,1,8474,99,114,59,3,55349,56492,4,12,66,69,97,99,101,102,104,105,111,114,115,117,4636,4642,4650,4681,4704,4763,4767,4771,5047,5069,5081,5094,97,114,114,59,1,10512,71,5,174,1,59,4648,1,174,4,3,99,110,114,4658,4664,4668,117,116,101,59,1,340,103,59,1,10219,114,4,2,59,116,4675,4677,1,8608,108,59,1,10518,4,3,97,101,121,4689,4695,4701,114,111,110,59,1,344,100,105,108,59,1,342,59,1,1056,4,2,59,118,4710,4712,1,8476,101,114,115,101,4,2,69,85,4722,4748,4,2,108,113,4728,4736,101,109,101,110,116,59,1,8715,117,105,108,105,98,114,105,117,109,59,1,8651,112,69,113,117,105,108,105,98,114,105,117,109,59,1,10607,114,59,1,8476,111,59,1,929,103,104,116,4,8,65,67,68,70,84,85,86,97,4792,4840,4849,4905,4912,4972,5022,5040,4,2,110,114,4798,4811,103,108,101,66,114,97,99,107,101,116,59,1,10217,114,111,119,4,3,59,66,76,4822,4824,4829,1,8594,97,114,59,1,8677,101,102,116,65,114,114,111,119,59,1,8644,101,105,108,105,110,103,59,1,8969,111,4,2,117,119,4856,4869,98,108,101,66,114,97,99,107,101,116,59,1,10215,110,4,2,84,86,4876,4887,101,101,86,101,99,116,111,114,59,1,10589,101,99,116,111,114,4,2,59,66,4898,4900,1,8642,97,114,59,1,10581,108,111,111,114,59,1,8971,4,2,101,114,4918,4944,101,4,3,59,65,86,4927,4929,4936,1,8866,114,114,111,119,59,1,8614,101,99,116,111,114,59,1,10587,105,97,110,103,108,101,4,3,59,66,69,4958,4960,4965,1,8883,97,114,59,1,10704,113,117,97,108,59,1,8885,112,4,3,68,84,86,4981,4993,5004,111,119,110,86,101,99,116,111,114,59,1,10575,101,101,86,101,99,116,111,114,59,1,10588,101,99,116,111,114,4,2,59,66,5015,5017,1,8638,97,114,59,1,10580,101,99,116,111,114,4,2,59,66,5033,5035,1,8640,97,114,59,1,10579,114,114,111,119,59,1,8658,4,2,112,117,5053,5057,102,59,1,8477,110,100,73,109,112,108,105,101,115,59,1,10608,105,103,104,116,97,114,114,111,119,59,1,8667,4,2,99,104,5087,5091,114,59,1,8475,59,1,8625,108,101,68,101,108,97,121,101,100,59,1,10740,4,13,72,79,97,99,102,104,105,109,111,113,115,116,117,5134,5150,5157,5164,5198,5203,5259,5265,5277,5283,5374,5380,5385,4,2,67,99,5140,5146,72,99,121,59,1,1065,121,59,1,1064,70,84,99,121,59,1,1068,99,117,116,101,59,1,346,4,5,59,97,101,105,121,5176,5178,5184,5190,5195,1,10940,114,111,110,59,1,352,100,105,108,59,1,350,114,99,59,1,348,59,1,1057,114,59,3,55349,56598,111,114,116,4,4,68,76,82,85,5216,5227,5238,5250,111,119,110,65,114,114,111,119,59,1,8595,101,102,116,65,114,114,111,119,59,1,8592,105,103,104,116,65,114,114,111,119,59,1,8594,112,65,114,114,111,119,59,1,8593,103,109,97,59,1,931,97,108,108,67,105,114,99,108,101,59,1,8728,112,102,59,3,55349,56650,4,2,114,117,5289,5293,116,59,1,8730,97,114,101,4,4,59,73,83,85,5306,5308,5322,5367,1,9633,110,116,101,114,115,101,99,116,105,111,110,59,1,8851,117,4,2,98,112,5329,5347,115,101,116,4,2,59,69,5338,5340,1,8847,113,117,97,108,59,1,8849,101,114,115,101,116,4,2,59,69,5358,5360,1,8848,113,117,97,108,59,1,8850,110,105,111,110,59,1,8852,99,114,59,3,55349,56494,97,114,59,1,8902,4,4,98,99,109,112,5395,5420,5475,5478,4,2,59,115,5401,5403,1,8912,101,116,4,2,59,69,5411,5413,1,8912,113,117,97,108,59,1,8838,4,2,99,104,5426,5468,101,101,100,115,4,4,59,69,83,84,5440,5442,5449,5461,1,8827,113,117,97,108,59,1,10928,108,97,110,116,69,113,117,97,108,59,1,8829,105,108,100,101,59,1,8831,84,104,97,116,59,1,8715,59,1,8721,4,3,59,101,115,5486,5488,5507,1,8913,114,115,101,116,4,2,59,69,5498,5500,1,8835,113,117,97,108,59,1,8839,101,116,59,1,8913,4,11,72,82,83,97,99,102,104,105,111,114,115,5536,5546,5552,5567,5579,5602,5607,5655,5695,5701,5711,79,82,78,5,222,1,59,5544,1,222,65,68,69,59,1,8482,4,2,72,99,5558,5563,99,121,59,1,1035,121,59,1,1062,4,2,98,117,5573,5576,59,1,9,59,1,932,4,3,97,101,121,5587,5593,5599,114,111,110,59,1,356,100,105,108,59,1,354,59,1,1058,114,59,3,55349,56599,4,2,101,105,5613,5631,4,2,114,116,5619,5627,101,102,111,114,101,59,1,8756,97,59,1,920,4,2,99,110,5637,5647,107,83,112,97,99,101,59,3,8287,8202,83,112,97,99,101,59,1,8201,108,100,101,4,4,59,69,70,84,5668,5670,5677,5688,1,8764,113,117,97,108,59,1,8771,117,108,108,69,113,117,97,108,59,1,8773,105,108,100,101,59,1,8776,112,102,59,3,55349,56651,105,112,108,101,68,111,116,59,1,8411,4,2,99,116,5717,5722,114,59,3,55349,56495,114,111,107,59,1,358,4,14,97,98,99,100,102,103,109,110,111,112,114,115,116,117,5758,5789,5805,5823,5830,5835,5846,5852,5921,5937,6089,6095,6101,6108,4,2,99,114,5764,5774,117,116,101,5,218,1,59,5772,1,218,114,4,2,59,111,5781,5783,1,8607,99,105,114,59,1,10569,114,4,2,99,101,5796,5800,121,59,1,1038,118,101,59,1,364,4,2,105,121,5811,5820,114,99,5,219,1,59,5818,1,219,59,1,1059,98,108,97,99,59,1,368,114,59,3,55349,56600,114,97,118,101,5,217,1,59,5844,1,217,97,99,114,59,1,362,4,2,100,105,5858,5905,101,114,4,2,66,80,5866,5892,4,2,97,114,5872,5876,114,59,1,95,97,99,4,2,101,107,5884,5887,59,1,9183,101,116,59,1,9141,97,114,101,110,116,104,101,115,105,115,59,1,9181,111,110,4,2,59,80,5913,5915,1,8899,108,117,115,59,1,8846,4,2,103,112,5927,5932,111,110,59,1,370,102,59,3,55349,56652,4,8,65,68,69,84,97,100,112,115,5955,5985,5996,6009,6026,6033,6044,6075,114,114,111,119,4,3,59,66,68,5967,5969,5974,1,8593,97,114,59,1,10514,111,119,110,65,114,114,111,119,59,1,8645,111,119,110,65,114,114,111,119,59,1,8597,113,117,105,108,105,98,114,105,117,109,59,1,10606,101,101,4,2,59,65,6017,6019,1,8869,114,114,111,119,59,1,8613,114,114,111,119,59,1,8657,111,119,110,97,114,114,111,119,59,1,8661,101,114,4,2,76,82,6052,6063,101,102,116,65,114,114,111,119,59,1,8598,105,103,104,116,65,114,114,111,119,59,1,8599,105,4,2,59,108,6082,6084,1,978,111,110,59,1,933,105,110,103,59,1,366,99,114,59,3,55349,56496,105,108,100,101,59,1,360,109,108,5,220,1,59,6115,1,220,4,9,68,98,99,100,101,102,111,115,118,6137,6143,6148,6152,6166,6250,6255,6261,6267,97,115,104,59,1,8875,97,114,59,1,10987,121,59,1,1042,97,115,104,4,2,59,108,6161,6163,1,8873,59,1,10982,4,2,101,114,6172,6175,59,1,8897,4,3,98,116,121,6183,6188,6238,97,114,59,1,8214,4,2,59,105,6194,6196,1,8214,99,97,108,4,4,66,76,83,84,6209,6214,6220,6231,97,114,59,1,8739,105,110,101,59,1,124,101,112,97,114,97,116,111,114,59,1,10072,105,108,100,101,59,1,8768,84,104,105,110,83,112,97,99,101,59,1,8202,114,59,3,55349,56601,112,102,59,3,55349,56653,99,114,59,3,55349,56497,100,97,115,104,59,1,8874,4,5,99,101,102,111,115,6286,6292,6298,6303,6309,105,114,99,59,1,372,100,103,101,59,1,8896,114,59,3,55349,56602,112,102,59,3,55349,56654,99,114,59,3,55349,56498,4,4,102,105,111,115,6325,6330,6333,6339,114,59,3,55349,56603,59,1,926,112,102,59,3,55349,56655,99,114,59,3,55349,56499,4,9,65,73,85,97,99,102,111,115,117,6365,6370,6375,6380,6391,6405,6410,6416,6422,99,121,59,1,1071,99,121,59,1,1031,99,121,59,1,1070,99,117,116,101,5,221,1,59,6389,1,221,4,2,105,121,6397,6402,114,99,59,1,374,59,1,1067,114,59,3,55349,56604,112,102,59,3,55349,56656,99,114,59,3,55349,56500,109,108,59,1,376,4,8,72,97,99,100,101,102,111,115,6445,6450,6457,6472,6477,6501,6505,6510,99,121,59,1,1046,99,117,116,101,59,1,377,4,2,97,121,6463,6469,114,111,110,59,1,381,59,1,1047,111,116,59,1,379,4,2,114,116,6483,6497,111,87,105,100,116,104,83,112,97,99,101,59,1,8203,97,59,1,918,114,59,1,8488,112,102,59,1,8484,99,114,59,3,55349,56501,4,16,97,98,99,101,102,103,108,109,110,111,112,114,115,116,117,119,6550,6561,6568,6612,6622,6634,6645,6672,6699,6854,6870,6923,6933,6963,6974,6983,99,117,116,101,5,225,1,59,6559,1,225,114,101,118,101,59,1,259,4,6,59,69,100,105,117,121,6582,6584,6588,6591,6600,6609,1,8766,59,3,8766,819,59,1,8767,114,99,5,226,1,59,6598,1,226,116,101,5,180,1,59,6607,1,180,59,1,1072,108,105,103,5,230,1,59,6620,1,230,4,2,59,114,6628,6630,1,8289,59,3,55349,56606,114,97,118,101,5,224,1,59,6643,1,224,4,2,101,112,6651,6667,4,2,102,112,6657,6663,115,121,109,59,1,8501,104,59,1,8501,104,97,59,1,945,4,2,97,112,6678,6692,4,2,99,108,6684,6688,114,59,1,257,103,59,1,10815,5,38,1,59,6697,1,38,4,2,100,103,6705,6737,4,5,59,97,100,115,118,6717,6719,6724,6727,6734,1,8743,110,100,59,1,10837,59,1,10844,108,111,112,101,59,1,10840,59,1,10842,4,7,59,101,108,109,114,115,122,6753,6755,6758,6762,6814,6835,6848,1,8736,59,1,10660,101,59,1,8736,115,100,4,2,59,97,6770,6772,1,8737,4,8,97,98,99,100,101,102,103,104,6790,6793,6796,6799,6802,6805,6808,6811,59,1,10664,59,1,10665,59,1,10666,59,1,10667,59,1,10668,59,1,10669,59,1,10670,59,1,10671,116,4,2,59,118,6821,6823,1,8735,98,4,2,59,100,6830,6832,1,8894,59,1,10653,4,2,112,116,6841,6845,104,59,1,8738,59,1,197,97,114,114,59,1,9084,4,2,103,112,6860,6865,111,110,59,1,261,102,59,3,55349,56658,4,7,59,69,97,101,105,111,112,6886,6888,6891,6897,6900,6904,6908,1,8776,59,1,10864,99,105,114,59,1,10863,59,1,8778,100,59,1,8779,115,59,1,39,114,111,120,4,2,59,101,6917,6919,1,8776,113,59,1,8778,105,110,103,5,229,1,59,6931,1,229,4,3,99,116,121,6941,6946,6949,114,59,3,55349,56502,59,1,42,109,112,4,2,59,101,6957,6959,1,8776,113,59,1,8781,105,108,100,101,5,227,1,59,6972,1,227,109,108,5,228,1,59,6981,1,228,4,2,99,105,6989,6997,111,110,105,110,116,59,1,8755,110,116,59,1,10769,4,16,78,97,98,99,100,101,102,105,107,108,110,111,112,114,115,117,7036,7041,7119,7135,7149,7155,7219,7224,7347,7354,7463,7489,7786,7793,7814,7866,111,116,59,1,10989,4,2,99,114,7047,7094,107,4,4,99,101,112,115,7058,7064,7073,7080,111,110,103,59,1,8780,112,115,105,108,111,110,59,1,1014,114,105,109,101,59,1,8245,105,109,4,2,59,101,7088,7090,1,8765,113,59,1,8909,4,2,118,119,7100,7105,101,101,59,1,8893,101,100,4,2,59,103,7113,7115,1,8965,101,59,1,8965,114,107,4,2,59,116,7127,7129,1,9141,98,114,107,59,1,9142,4,2,111,121,7141,7146,110,103,59,1,8780,59,1,1073,113,117,111,59,1,8222,4,5,99,109,112,114,116,7167,7181,7188,7193,7199,97,117,115,4,2,59,101,7176,7178,1,8757,59,1,8757,112,116,121,118,59,1,10672,115,105,59,1,1014,110,111,117,59,1,8492,4,3,97,104,119,7207,7210,7213,59,1,946,59,1,8502,101,101,110,59,1,8812,114,59,3,55349,56607,103,4,7,99,111,115,116,117,118,119,7241,7262,7288,7305,7328,7335,7340,4,3,97,105,117,7249,7253,7258,112,59,1,8898,114,99,59,1,9711,112,59,1,8899,4,3,100,112,116,7270,7275,7281,111,116,59,1,10752,108,117,115,59,1,10753,105,109,101,115,59,1,10754,4,2,113,116,7294,7300,99,117,112,59,1,10758,97,114,59,1,9733,114,105,97,110,103,108,101,4,2,100,117,7318,7324,111,119,110,59,1,9661,112,59,1,9651,112,108,117,115,59,1,10756,101,101,59,1,8897,101,100,103,101,59,1,8896,97,114,111,119,59,1,10509,4,3,97,107,111,7362,7436,7458,4,2,99,110,7368,7432,107,4,3,108,115,116,7377,7386,7394,111,122,101,110,103,101,59,1,10731,113,117,97,114,101,59,1,9642,114,105,97,110,103,108,101,4,4,59,100,108,114,7411,7413,7419,7425,1,9652,111,119,110,59,1,9662,101,102,116,59,1,9666,105,103,104,116,59,1,9656,107,59,1,9251,4,2,49,51,7442,7454,4,2,50,52,7448,7451,59,1,9618,59,1,9617,52,59,1,9619,99,107,59,1,9608,4,2,101,111,7469,7485,4,2,59,113,7475,7478,3,61,8421,117,105,118,59,3,8801,8421,116,59,1,8976,4,4,112,116,119,120,7499,7504,7517,7523,102,59,3,55349,56659,4,2,59,116,7510,7512,1,8869,111,109,59,1,8869,116,105,101,59,1,8904,4,12,68,72,85,86,98,100,104,109,112,116,117,118,7549,7571,7597,7619,7655,7660,7682,7708,7715,7721,7728,7750,4,4,76,82,108,114,7559,7562,7565,7568,59,1,9559,59,1,9556,59,1,9558,59,1,9555,4,5,59,68,85,100,117,7583,7585,7588,7591,7594,1,9552,59,1,9574,59,1,9577,59,1,9572,59,1,9575,4,4,76,82,108,114,7607,7610,7613,7616,59,1,9565,59,1,9562,59,1,9564,59,1,9561,4,7,59,72,76,82,104,108,114,7635,7637,7640,7643,7646,7649,7652,1,9553,59,1,9580,59,1,9571,59,1,9568,59,1,9579,59,1,9570,59,1,9567,111,120,59,1,10697,4,4,76,82,108,114,7670,7673,7676,7679,59,1,9557,59,1,9554,59,1,9488,59,1,9484,4,5,59,68,85,100,117,7694,7696,7699,7702,7705,1,9472,59,1,9573,59,1,9576,59,1,9516,59,1,9524,105,110,117,115,59,1,8863,108,117,115,59,1,8862,105,109,101,115,59,1,8864,4,4,76,82,108,114,7738,7741,7744,7747,59,1,9563,59,1,9560,59,1,9496,59,1,9492,4,7,59,72,76,82,104,108,114,7766,7768,7771,7774,7777,7780,7783,1,9474,59,1,9578,59,1,9569,59,1,9566,59,1,9532,59,1,9508,59,1,9500,114,105,109,101,59,1,8245,4,2,101,118,7799,7804,118,101,59,1,728,98,97,114,5,166,1,59,7812,1,166,4,4,99,101,105,111,7824,7829,7834,7846,114,59,3,55349,56503,109,105,59,1,8271,109,4,2,59,101,7841,7843,1,8765,59,1,8909,108,4,3,59,98,104,7855,7857,7860,1,92,59,1,10693,115,117,98,59,1,10184,4,2,108,109,7872,7885,108,4,2,59,101,7879,7881,1,8226,116,59,1,8226,112,4,3,59,69,101,7894,7896,7899,1,8782,59,1,10926,4,2,59,113,7905,7907,1,8783,59,1,8783,4,15,97,99,100,101,102,104,105,108,111,114,115,116,117,119,121,7942,8021,8075,8080,8121,8126,8157,8279,8295,8430,8446,8485,8491,8707,8726,4,3,99,112,114,7950,7956,8007,117,116,101,59,1,263,4,6,59,97,98,99,100,115,7970,7972,7977,7984,7998,8003,1,8745,110,100,59,1,10820,114,99,117,112,59,1,10825,4,2,97,117,7990,7994,112,59,1,10827,112,59,1,10823,111,116,59,1,10816,59,3,8745,65024,4,2,101,111,8013,8017,116,59,1,8257,110,59,1,711,4,4,97,101,105,117,8031,8046,8056,8061,4,2,112,114,8037,8041,115,59,1,10829,111,110,59,1,269,100,105,108,5,231,1,59,8054,1,231,114,99,59,1,265,112,115,4,2,59,115,8069,8071,1,10828,109,59,1,10832,111,116,59,1,267,4,3,100,109,110,8088,8097,8104,105,108,5,184,1,59,8095,1,184,112,116,121,118,59,1,10674,116,5,162,2,59,101,8112,8114,1,162,114,100,111,116,59,1,183,114,59,3,55349,56608,4,3,99,101,105,8134,8138,8154,121,59,1,1095,99,107,4,2,59,109,8146,8148,1,10003,97,114,107,59,1,10003,59,1,967,114,4,7,59,69,99,101,102,109,115,8174,8176,8179,8258,8261,8268,8273,1,9675,59,1,10691,4,3,59,101,108,8187,8189,8193,1,710,113,59,1,8791,101,4,2,97,100,8200,8223,114,114,111,119,4,2,108,114,8210,8216,101,102,116,59,1,8634,105,103,104,116,59,1,8635,4,5,82,83,97,99,100,8235,8238,8241,8246,8252,59,1,174,59,1,9416,115,116,59,1,8859,105,114,99,59,1,8858,97,115,104,59,1,8861,59,1,8791,110,105,110,116,59,1,10768,105,100,59,1,10991,99,105,114,59,1,10690,117,98,115,4,2,59,117,8288,8290,1,9827,105,116,59,1,9827,4,4,108,109,110,112,8305,8326,8376,8400,111,110,4,2,59,101,8313,8315,1,58,4,2,59,113,8321,8323,1,8788,59,1,8788,4,2,109,112,8332,8344,97,4,2,59,116,8339,8341,1,44,59,1,64,4,3,59,102,108,8352,8354,8358,1,8705,110,59,1,8728,101,4,2,109,120,8365,8371,101,110,116,59,1,8705,101,115,59,1,8450,4,2,103,105,8382,8395,4,2,59,100,8388,8390,1,8773,111,116,59,1,10861,110,116,59,1,8750,4,3,102,114,121,8408,8412,8417,59,3,55349,56660,111,100,59,1,8720,5,169,2,59,115,8424,8426,1,169,114,59,1,8471,4,2,97,111,8436,8441,114,114,59,1,8629,115,115,59,1,10007,4,2,99,117,8452,8457,114,59,3,55349,56504,4,2,98,112,8463,8474,4,2,59,101,8469,8471,1,10959,59,1,10961,4,2,59,101,8480,8482,1,10960,59,1,10962,100,111,116,59,1,8943,4,7,100,101,108,112,114,118,119,8507,8522,8536,8550,8600,8697,8702,97,114,114,4,2,108,114,8516,8519,59,1,10552,59,1,10549,4,2,112,115,8528,8532,114,59,1,8926,99,59,1,8927,97,114,114,4,2,59,112,8545,8547,1,8630,59,1,10557,4,6,59,98,99,100,111,115,8564,8566,8573,8587,8592,8596,1,8746,114,99,97,112,59,1,10824,4,2,97,117,8579,8583,112,59,1,10822,112,59,1,10826,111,116,59,1,8845,114,59,1,10821,59,3,8746,65024,4,4,97,108,114,118,8610,8623,8663,8672,114,114,4,2,59,109,8618,8620,1,8631,59,1,10556,121,4,3,101,118,119,8632,8651,8656,113,4,2,112,115,8639,8645,114,101,99,59,1,8926,117,99,99,59,1,8927,101,101,59,1,8910,101,100,103,101,59,1,8911,101,110,5,164,1,59,8670,1,164,101,97,114,114,111,119,4,2,108,114,8684,8690,101,102,116,59,1,8630,105,103,104,116,59,1,8631,101,101,59,1,8910,101,100,59,1,8911,4,2,99,105,8713,8721,111,110,105,110,116,59,1,8754,110,116,59,1,8753,108,99,116,121,59,1,9005,4,19,65,72,97,98,99,100,101,102,104,105,106,108,111,114,115,116,117,119,122,8773,8778,8783,8821,8839,8854,8887,8914,8930,8944,9036,9041,9058,9197,9227,9258,9281,9297,9305,114,114,59,1,8659,97,114,59,1,10597,4,4,103,108,114,115,8793,8799,8805,8809,103,101,114,59,1,8224,101,116,104,59,1,8504,114,59,1,8595,104,4,2,59,118,8816,8818,1,8208,59,1,8867,4,2,107,108,8827,8834,97,114,111,119,59,1,10511,97,99,59,1,733,4,2,97,121,8845,8851,114,111,110,59,1,271,59,1,1076,4,3,59,97,111,8862,8864,8880,1,8518,4,2,103,114,8870,8876,103,101,114,59,1,8225,114,59,1,8650,116,115,101,113,59,1,10871,4,3,103,108,109,8895,8902,8907,5,176,1,59,8900,1,176,116,97,59,1,948,112,116,121,118,59,1,10673,4,2,105,114,8920,8926,115,104,116,59,1,10623,59,3,55349,56609,97,114,4,2,108,114,8938,8941,59,1,8643,59,1,8642,4,5,97,101,103,115,118,8956,8986,8989,8996,9001,109,4,3,59,111,115,8965,8967,8983,1,8900,110,100,4,2,59,115,8975,8977,1,8900,117,105,116,59,1,9830,59,1,9830,59,1,168,97,109,109,97,59,1,989,105,110,59,1,8946,4,3,59,105,111,9009,9011,9031,1,247,100,101,5,247,2,59,111,9020,9022,1,247,110,116,105,109,101,115,59,1,8903,110,120,59,1,8903,99,121,59,1,1106,99,4,2,111,114,9048,9053,114,110,59,1,8990,111,112,59,1,8973,4,5,108,112,116,117,119,9070,9076,9081,9130,9144,108,97,114,59,1,36,102,59,3,55349,56661,4,5,59,101,109,112,115,9093,9095,9109,9116,9122,1,729,113,4,2,59,100,9102,9104,1,8784,111,116,59,1,8785,105,110,117,115,59,1,8760,108,117,115,59,1,8724,113,117,97,114,101,59,1,8865,98,108,101,98,97,114,119,101,100,103,101,59,1,8966,110,4,3,97,100,104,9153,9160,9172,114,114,111,119,59,1,8595,111,119,110,97,114,114,111,119,115,59,1,8650,97,114,112,111,111,110,4,2,108,114,9184,9190,101,102,116,59,1,8643,105,103,104,116,59,1,8642,4,2,98,99,9203,9211,107,97,114,111,119,59,1,10512,4,2,111,114,9217,9222,114,110,59,1,8991,111,112,59,1,8972,4,3,99,111,116,9235,9248,9252,4,2,114,121,9241,9245,59,3,55349,56505,59,1,1109,108,59,1,10742,114,111,107,59,1,273,4,2,100,114,9264,9269,111,116,59,1,8945,105,4,2,59,102,9276,9278,1,9663,59,1,9662,4,2,97,104,9287,9292,114,114,59,1,8693,97,114,59,1,10607,97,110,103,108,101,59,1,10662,4,2,99,105,9311,9315,121,59,1,1119,103,114,97,114,114,59,1,10239,4,18,68,97,99,100,101,102,103,108,109,110,111,112,113,114,115,116,117,120,9361,9376,9398,9439,9444,9447,9462,9495,9531,9585,9598,9614,9659,9755,9771,9792,9808,9826,4,2,68,111,9367,9372,111,116,59,1,10871,116,59,1,8785,4,2,99,115,9382,9392,117,116,101,5,233,1,59,9390,1,233,116,101,114,59,1,10862,4,4,97,105,111,121,9408,9414,9430,9436,114,111,110,59,1,283,114,4,2,59,99,9421,9423,1,8790,5,234,1,59,9428,1,234,108,111,110,59,1,8789,59,1,1101,111,116,59,1,279,59,1,8519,4,2,68,114,9453,9458,111,116,59,1,8786,59,3,55349,56610,4,3,59,114,115,9470,9472,9482,1,10906,97,118,101,5,232,1,59,9480,1,232,4,2,59,100,9488,9490,1,10902,111,116,59,1,10904,4,4,59,105,108,115,9505,9507,9515,9518,1,10905,110,116,101,114,115,59,1,9191,59,1,8467,4,2,59,100,9524,9526,1,10901,111,116,59,1,10903,4,3,97,112,115,9539,9544,9564,99,114,59,1,275,116,121,4,3,59,115,118,9554,9556,9561,1,8709,101,116,59,1,8709,59,1,8709,112,4,2,49,59,9571,9583,4,2,51,52,9577,9580,59,1,8196,59,1,8197,1,8195,4,2,103,115,9591,9594,59,1,331,112,59,1,8194,4,2,103,112,9604,9609,111,110,59,1,281,102,59,3,55349,56662,4,3,97,108,115,9622,9635,9640,114,4,2,59,115,9629,9631,1,8917,108,59,1,10723,117,115,59,1,10865,105,4,3,59,108,118,9649,9651,9656,1,949,111,110,59,1,949,59,1,1013,4,4,99,115,117,118,9669,9686,9716,9747,4,2,105,111,9675,9680,114,99,59,1,8790,108,111,110,59,1,8789,4,2,105,108,9692,9696,109,59,1,8770,97,110,116,4,2,103,108,9705,9710,116,114,59,1,10902,101,115,115,59,1,10901,4,3,97,101,105,9724,9729,9734,108,115,59,1,61,115,116,59,1,8799,118,4,2,59,68,9741,9743,1,8801,68,59,1,10872,112,97,114,115,108,59,1,10725,4,2,68,97,9761,9766,111,116,59,1,8787,114,114,59,1,10609,4,3,99,100,105,9779,9783,9788,114,59,1,8495,111,116,59,1,8784,109,59,1,8770,4,2,97,104,9798,9801,59,1,951,5,240,1,59,9806,1,240,4,2,109,114,9814,9822,108,5,235,1,59,9820,1,235,111,59,1,8364,4,3,99,105,112,9834,9838,9843,108,59,1,33,115,116,59,1,8707,4,2,101,111,9849,9859,99,116,97,116,105,111,110,59,1,8496,110,101,110,116,105,97,108,101,59,1,8519,4,12,97,99,101,102,105,106,108,110,111,112,114,115,9896,9910,9914,9921,9954,9960,9967,9989,9994,10027,10036,10164,108,108,105,110,103,100,111,116,115,101,113,59,1,8786,121,59,1,1092,109,97,108,101,59,1,9792,4,3,105,108,114,9929,9935,9950,108,105,103,59,1,64259,4,2,105,108,9941,9945,103,59,1,64256,105,103,59,1,64260,59,3,55349,56611,108,105,103,59,1,64257,108,105,103,59,3,102,106,4,3,97,108,116,9975,9979,9984,116,59,1,9837,105,103,59,1,64258,110,115,59,1,9649,111,102,59,1,402,4,2,112,114,10000,10005,102,59,3,55349,56663,4,2,97,107,10011,10016,108,108,59,1,8704,4,2,59,118,10022,10024,1,8916,59,1,10969,97,114,116,105,110,116,59,1,10765,4,2,97,111,10042,10159,4,2,99,115,10048,10155,4,6,49,50,51,52,53,55,10062,10102,10114,10135,10139,10151,4,6,50,51,52,53,54,56,10076,10083,10086,10093,10096,10099,5,189,1,59,10081,1,189,59,1,8531,5,188,1,59,10091,1,188,59,1,8533,59,1,8537,59,1,8539,4,2,51,53,10108,10111,59,1,8532,59,1,8534,4,3,52,53,56,10122,10129,10132,5,190,1,59,10127,1,190,59,1,8535,59,1,8540,53,59,1,8536,4,2,54,56,10145,10148,59,1,8538,59,1,8541,56,59,1,8542,108,59,1,8260,119,110,59,1,8994,99,114,59,3,55349,56507,4,17,69,97,98,99,100,101,102,103,105,106,108,110,111,114,115,116,118,10206,10217,10247,10254,10268,10273,10358,10363,10374,10380,10385,10406,10458,10464,10470,10497,10610,4,2,59,108,10212,10214,1,8807,59,1,10892,4,3,99,109,112,10225,10231,10244,117,116,101,59,1,501,109,97,4,2,59,100,10239,10241,1,947,59,1,989,59,1,10886,114,101,118,101,59,1,287,4,2,105,121,10260,10265,114,99,59,1,285,59,1,1075,111,116,59,1,289,4,4,59,108,113,115,10283,10285,10288,10308,1,8805,59,1,8923,4,3,59,113,115,10296,10298,10301,1,8805,59,1,8807,108,97,110,116,59,1,10878,4,4,59,99,100,108,10318,10320,10324,10345,1,10878,99,59,1,10921,111,116,4,2,59,111,10332,10334,1,10880,4,2,59,108,10340,10342,1,10882,59,1,10884,4,2,59,101,10351,10354,3,8923,65024,115,59,1,10900,114,59,3,55349,56612,4,2,59,103,10369,10371,1,8811,59,1,8921,109,101,108,59,1,8503,99,121,59,1,1107,4,4,59,69,97,106,10395,10397,10400,10403,1,8823,59,1,10898,59,1,10917,59,1,10916,4,4,69,97,101,115,10416,10419,10434,10453,59,1,8809,112,4,2,59,112,10426,10428,1,10890,114,111,120,59,1,10890,4,2,59,113,10440,10442,1,10888,4,2,59,113,10448,10450,1,10888,59,1,8809,105,109,59,1,8935,112,102,59,3,55349,56664,97,118,101,59,1,96,4,2,99,105,10476,10480,114,59,1,8458,109,4,3,59,101,108,10489,10491,10494,1,8819,59,1,10894,59,1,10896,5,62,6,59,99,100,108,113,114,10512,10514,10527,10532,10538,10545,1,62,4,2,99,105,10520,10523,59,1,10919,114,59,1,10874,111,116,59,1,8919,80,97,114,59,1,10645,117,101,115,116,59,1,10876,4,5,97,100,101,108,115,10557,10574,10579,10599,10605,4,2,112,114,10563,10570,112,114,111,120,59,1,10886,114,59,1,10616,111,116,59,1,8919,113,4,2,108,113,10586,10592,101,115,115,59,1,8923,108,101,115,115,59,1,10892,101,115,115,59,1,8823,105,109,59,1,8819,4,2,101,110,10616,10626,114,116,110,101,113,113,59,3,8809,65024,69,59,3,8809,65024,4,10,65,97,98,99,101,102,107,111,115,121,10653,10658,10713,10718,10724,10760,10765,10786,10850,10875,114,114,59,1,8660,4,4,105,108,109,114,10668,10674,10678,10684,114,115,112,59,1,8202,102,59,1,189,105,108,116,59,1,8459,4,2,100,114,10690,10695,99,121,59,1,1098,4,3,59,99,119,10703,10705,10710,1,8596,105,114,59,1,10568,59,1,8621,97,114,59,1,8463,105,114,99,59,1,293,4,3,97,108,114,10732,10748,10754,114,116,115,4,2,59,117,10741,10743,1,9829,105,116,59,1,9829,108,105,112,59,1,8230,99,111,110,59,1,8889,114,59,3,55349,56613,115,4,2,101,119,10772,10779,97,114,111,119,59,1,10533,97,114,111,119,59,1,10534,4,5,97,109,111,112,114,10798,10803,10809,10839,10844,114,114,59,1,8703,116,104,116,59,1,8763,107,4,2,108,114,10816,10827,101,102,116,97,114,114,111,119,59,1,8617,105,103,104,116,97,114,114,111,119,59,1,8618,102,59,3,55349,56665,98,97,114,59,1,8213,4,3,99,108,116,10858,10863,10869,114,59,3,55349,56509,97,115,104,59,1,8463,114,111,107,59,1,295,4,2,98,112,10881,10887,117,108,108,59,1,8259,104,101,110,59,1,8208,4,15,97,99,101,102,103,105,106,109,110,111,112,113,115,116,117,10925,10936,10958,10977,10990,11001,11039,11045,11101,11192,11220,11226,11237,11285,11299,99,117,116,101,5,237,1,59,10934,1,237,4,3,59,105,121,10944,10946,10955,1,8291,114,99,5,238,1,59,10953,1,238,59,1,1080,4,2,99,120,10964,10968,121,59,1,1077,99,108,5,161,1,59,10975,1,161,4,2,102,114,10983,10986,59,1,8660,59,3,55349,56614,114,97,118,101,5,236,1,59,10999,1,236,4,4,59,105,110,111,11011,11013,11028,11034,1,8520,4,2,105,110,11019,11024,110,116,59,1,10764,116,59,1,8749,102,105,110,59,1,10716,116,97,59,1,8489,108,105,103,59,1,307,4,3,97,111,112,11053,11092,11096,4,3,99,103,116,11061,11065,11088,114,59,1,299,4,3,101,108,112,11073,11076,11082,59,1,8465,105,110,101,59,1,8464,97,114,116,59,1,8465,104,59,1,305,102,59,1,8887,101,100,59,1,437,4,5,59,99,102,111,116,11113,11115,11121,11136,11142,1,8712,97,114,101,59,1,8453,105,110,4,2,59,116,11129,11131,1,8734,105,101,59,1,10717,100,111,116,59,1,305,4,5,59,99,101,108,112,11154,11156,11161,11179,11186,1,8747,97,108,59,1,8890,4,2,103,114,11167,11173,101,114,115,59,1,8484,99,97,108,59,1,8890,97,114,104,107,59,1,10775,114,111,100,59,1,10812,4,4,99,103,112,116,11202,11206,11211,11216,121,59,1,1105,111,110,59,1,303,102,59,3,55349,56666,97,59,1,953,114,111,100,59,1,10812,117,101,115,116,5,191,1,59,11235,1,191,4,2,99,105,11243,11248,114,59,3,55349,56510,110,4,5,59,69,100,115,118,11261,11263,11266,11271,11282,1,8712,59,1,8953,111,116,59,1,8949,4,2,59,118,11277,11279,1,8948,59,1,8947,59,1,8712,4,2,59,105,11291,11293,1,8290,108,100,101,59,1,297,4,2,107,109,11305,11310,99,121,59,1,1110,108,5,239,1,59,11316,1,239,4,6,99,102,109,111,115,117,11332,11346,11351,11357,11363,11380,4,2,105,121,11338,11343,114,99,59,1,309,59,1,1081,114,59,3,55349,56615,97,116,104,59,1,567,112,102,59,3,55349,56667,4,2,99,101,11369,11374,114,59,3,55349,56511,114,99,121,59,1,1112,107,99,121,59,1,1108,4,8,97,99,102,103,104,106,111,115,11404,11418,11433,11438,11445,11450,11455,11461,112,112,97,4,2,59,118,11413,11415,1,954,59,1,1008,4,2,101,121,11424,11430,100,105,108,59,1,311,59,1,1082,114,59,3,55349,56616,114,101,101,110,59,1,312,99,121,59,1,1093,99,121,59,1,1116,112,102,59,3,55349,56668,99,114,59,3,55349,56512,4,23,65,66,69,72,97,98,99,100,101,102,103,104,106,108,109,110,111,112,114,115,116,117,118,11515,11538,11544,11555,11560,11721,11780,11818,11868,12136,12160,12171,12203,12208,12246,12275,12327,12509,12523,12569,12641,12732,12752,4,3,97,114,116,11523,11528,11532,114,114,59,1,8666,114,59,1,8656,97,105,108,59,1,10523,97,114,114,59,1,10510,4,2,59,103,11550,11552,1,8806,59,1,10891,97,114,59,1,10594,4,9,99,101,103,109,110,112,113,114,116,11580,11586,11594,11600,11606,11624,11627,11636,11694,117,116,101,59,1,314,109,112,116,121,118,59,1,10676,114,97,110,59,1,8466,98,100,97,59,1,955,103,4,3,59,100,108,11615,11617,11620,1,10216,59,1,10641,101,59,1,10216,59,1,10885,117,111,5,171,1,59,11634,1,171,114,4,8,59,98,102,104,108,112,115,116,11655,11657,11669,11673,11677,11681,11685,11690,1,8592,4,2,59,102,11663,11665,1,8676,115,59,1,10527,115,59,1,10525,107,59,1,8617,112,59,1,8619,108,59,1,10553,105,109,59,1,10611,108,59,1,8610,4,3,59,97,101,11702,11704,11709,1,10923,105,108,59,1,10521,4,2,59,115,11715,11717,1,10925,59,3,10925,65024,4,3,97,98,114,11729,11734,11739,114,114,59,1,10508,114,107,59,1,10098,4,2,97,107,11745,11758,99,4,2,101,107,11752,11755,59,1,123,59,1,91,4,2,101,115,11764,11767,59,1,10635,108,4,2,100,117,11774,11777,59,1,10639,59,1,10637,4,4,97,101,117,121,11790,11796,11811,11815,114,111,110,59,1,318,4,2,100,105,11802,11807,105,108,59,1,316,108,59,1,8968,98,59,1,123,59,1,1083,4,4,99,113,114,115,11828,11832,11845,11864,97,59,1,10550,117,111,4,2,59,114,11840,11842,1,8220,59,1,8222,4,2,100,117,11851,11857,104,97,114,59,1,10599,115,104,97,114,59,1,10571,104,59,1,8626,4,5,59,102,103,113,115,11880,11882,12008,12011,12031,1,8804,116,4,5,97,104,108,114,116,11895,11913,11935,11947,11996,114,114,111,119,4,2,59,116,11905,11907,1,8592,97,105,108,59,1,8610,97,114,112,111,111,110,4,2,100,117,11925,11931,111,119,110,59,1,8637,112,59,1,8636,101,102,116,97,114,114,111,119,115,59,1,8647,105,103,104,116,4,3,97,104,115,11959,11974,11984,114,114,111,119,4,2,59,115,11969,11971,1,8596,59,1,8646,97,114,112,111,111,110,115,59,1,8651,113,117,105,103,97,114,114,111,119,59,1,8621,104,114,101,101,116,105,109,101,115,59,1,8907,59,1,8922,4,3,59,113,115,12019,12021,12024,1,8804,59,1,8806,108,97,110,116,59,1,10877,4,5,59,99,100,103,115,12043,12045,12049,12070,12083,1,10877,99,59,1,10920,111,116,4,2,59,111,12057,12059,1,10879,4,2,59,114,12065,12067,1,10881,59,1,10883,4,2,59,101,12076,12079,3,8922,65024,115,59,1,10899,4,5,97,100,101,103,115,12095,12103,12108,12126,12131,112,112,114,111,120,59,1,10885,111,116,59,1,8918,113,4,2,103,113,12115,12120,116,114,59,1,8922,103,116,114,59,1,10891,116,114,59,1,8822,105,109,59,1,8818,4,3,105,108,114,12144,12150,12156,115,104,116,59,1,10620,111,111,114,59,1,8970,59,3,55349,56617,4,2,59,69,12166,12168,1,8822,59,1,10897,4,2,97,98,12177,12198,114,4,2,100,117,12184,12187,59,1,8637,4,2,59,108,12193,12195,1,8636,59,1,10602,108,107,59,1,9604,99,121,59,1,1113,4,5,59,97,99,104,116,12220,12222,12227,12235,12241,1,8810,114,114,59,1,8647,111,114,110,101,114,59,1,8990,97,114,100,59,1,10603,114,105,59,1,9722,4,2,105,111,12252,12258,100,111,116,59,1,320,117,115,116,4,2,59,97,12267,12269,1,9136,99,104,101,59,1,9136,4,4,69,97,101,115,12285,12288,12303,12322,59,1,8808,112,4,2,59,112,12295,12297,1,10889,114,111,120,59,1,10889,4,2,59,113,12309,12311,1,10887,4,2,59,113,12317,12319,1,10887,59,1,8808,105,109,59,1,8934,4,8,97,98,110,111,112,116,119,122,12345,12359,12364,12421,12446,12467,12474,12490,4,2,110,114,12351,12355,103,59,1,10220,114,59,1,8701,114,107,59,1,10214,103,4,3,108,109,114,12373,12401,12409,101,102,116,4,2,97,114,12382,12389,114,114,111,119,59,1,10229,105,103,104,116,97,114,114,111,119,59,1,10231,97,112,115,116,111,59,1,10236,105,103,104,116,97,114,114,111,119,59,1,10230,112,97,114,114,111,119,4,2,108,114,12433,12439,101,102,116,59,1,8619,105,103,104,116,59,1,8620,4,3,97,102,108,12454,12458,12462,114,59,1,10629,59,3,55349,56669,117,115,59,1,10797,105,109,101,115,59,1,10804,4,2,97,98,12480,12485,115,116,59,1,8727,97,114,59,1,95,4,3,59,101,102,12498,12500,12506,1,9674,110,103,101,59,1,9674,59,1,10731,97,114,4,2,59,108,12517,12519,1,40,116,59,1,10643,4,5,97,99,104,109,116,12535,12540,12548,12561,12564,114,114,59,1,8646,111,114,110,101,114,59,1,8991,97,114,4,2,59,100,12556,12558,1,8651,59,1,10605,59,1,8206,114,105,59,1,8895,4,6,97,99,104,105,113,116,12583,12589,12594,12597,12614,12635,113,117,111,59,1,8249,114,59,3,55349,56513,59,1,8624,109,4,3,59,101,103,12606,12608,12611,1,8818,59,1,10893,59,1,10895,4,2,98,117,12620,12623,59,1,91,111,4,2,59,114,12630,12632,1,8216,59,1,8218,114,111,107,59,1,322,5,60,8,59,99,100,104,105,108,113,114,12660,12662,12675,12680,12686,12692,12698,12705,1,60,4,2,99,105,12668,12671,59,1,10918,114,59,1,10873,111,116,59,1,8918,114,101,101,59,1,8907,109,101,115,59,1,8905,97,114,114,59,1,10614,117,101,115,116,59,1,10875,4,2,80,105,12711,12716,97,114,59,1,10646,4,3,59,101,102,12724,12726,12729,1,9667,59,1,8884,59,1,9666,114,4,2,100,117,12739,12746,115,104,97,114,59,1,10570,104,97,114,59,1,10598,4,2,101,110,12758,12768,114,116,110,101,113,113,59,3,8808,65024,69,59,3,8808,65024,4,14,68,97,99,100,101,102,104,105,108,110,111,112,115,117,12803,12809,12893,12908,12914,12928,12933,12937,13011,13025,13032,13049,13052,13069,68,111,116,59,1,8762,4,4,99,108,112,114,12819,12827,12849,12887,114,5,175,1,59,12825,1,175,4,2,101,116,12833,12836,59,1,9794,4,2,59,101,12842,12844,1,10016,115,101,59,1,10016,4,2,59,115,12855,12857,1,8614,116,111,4,4,59,100,108,117,12869,12871,12877,12883,1,8614,111,119,110,59,1,8615,101,102,116,59,1,8612,112,59,1,8613,107,101,114,59,1,9646,4,2,111,121,12899,12905,109,109,97,59,1,10793,59,1,1084,97,115,104,59,1,8212,97,115,117,114,101,100,97,110,103,108,101,59,1,8737,114,59,3,55349,56618,111,59,1,8487,4,3,99,100,110,12945,12954,12985,114,111,5,181,1,59,12952,1,181,4,4,59,97,99,100,12964,12966,12971,12976,1,8739,115,116,59,1,42,105,114,59,1,10992,111,116,5,183,1,59,12983,1,183,117,115,4,3,59,98,100,12995,12997,13000,1,8722,59,1,8863,4,2,59,117,13006,13008,1,8760,59,1,10794,4,2,99,100,13017,13021,112,59,1,10971,114,59,1,8230,112,108,117,115,59,1,8723,4,2,100,112,13038,13044,101,108,115,59,1,8871,102,59,3,55349,56670,59,1,8723,4,2,99,116,13058,13063,114,59,3,55349,56514,112,111,115,59,1,8766,4,3,59,108,109,13077,13079,13087,1,956,116,105,109,97,112,59,1,8888,97,112,59,1,8888,4,24,71,76,82,86,97,98,99,100,101,102,103,104,105,106,108,109,111,112,114,115,116,117,118,119,13142,13165,13217,13229,13247,13330,13359,13414,13420,13508,13513,13579,13602,13626,13631,13762,13767,13855,13936,13995,14214,14285,14312,14432,4,2,103,116,13148,13152,59,3,8921,824,4,2,59,118,13158,13161,3,8811,8402,59,3,8811,824,4,3,101,108,116,13173,13200,13204,102,116,4,2,97,114,13181,13188,114,114,111,119,59,1,8653,105,103,104,116,97,114,114,111,119,59,1,8654,59,3,8920,824,4,2,59,118,13210,13213,3,8810,8402,59,3,8810,824,105,103,104,116,97,114,114,111,119,59,1,8655,4,2,68,100,13235,13241,97,115,104,59,1,8879,97,115,104,59,1,8878,4,5,98,99,110,112,116,13259,13264,13270,13275,13308,108,97,59,1,8711,117,116,101,59,1,324,103,59,3,8736,8402,4,5,59,69,105,111,112,13287,13289,13293,13298,13302,1,8777,59,3,10864,824,100,59,3,8779,824,115,59,1,329,114,111,120,59,1,8777,117,114,4,2,59,97,13316,13318,1,9838,108,4,2,59,115,13325,13327,1,9838,59,1,8469,4,2,115,117,13336,13344,112,5,160,1,59,13342,1,160,109,112,4,2,59,101,13352,13355,3,8782,824,59,3,8783,824,4,5,97,101,111,117,121,13371,13385,13391,13407,13411,4,2,112,114,13377,13380,59,1,10819,111,110,59,1,328,100,105,108,59,1,326,110,103,4,2,59,100,13399,13401,1,8775,111,116,59,3,10861,824,112,59,1,10818,59,1,1085,97,115,104,59,1,8211,4,7,59,65,97,100,113,115,120,13436,13438,13443,13466,13472,13478,13494,1,8800,114,114,59,1,8663,114,4,2,104,114,13450,13454,107,59,1,10532,4,2,59,111,13460,13462,1,8599,119,59,1,8599,111,116,59,3,8784,824,117,105,118,59,1,8802,4,2,101,105,13484,13489,97,114,59,1,10536,109,59,3,8770,824,105,115,116,4,2,59,115,13503,13505,1,8708,59,1,8708,114,59,3,55349,56619,4,4,69,101,115,116,13523,13527,13563,13568,59,3,8807,824,4,3,59,113,115,13535,13537,13559,1,8817,4,3,59,113,115,13545,13547,13551,1,8817,59,3,8807,824,108,97,110,116,59,3,10878,824,59,3,10878,824,105,109,59,1,8821,4,2,59,114,13574,13576,1,8815,59,1,8815,4,3,65,97,112,13587,13592,13597,114,114,59,1,8654,114,114,59,1,8622,97,114,59,1,10994,4,3,59,115,118,13610,13612,13623,1,8715,4,2,59,100,13618,13620,1,8956,59,1,8954,59,1,8715,99,121,59,1,1114,4,7,65,69,97,100,101,115,116,13647,13652,13656,13661,13665,13737,13742,114,114,59,1,8653,59,3,8806,824,114,114,59,1,8602,114,59,1,8229,4,4,59,102,113,115,13675,13677,13703,13725,1,8816,116,4,2,97,114,13684,13691,114,114,111,119,59,1,8602,105,103,104,116,97,114,114,111,119,59,1,8622,4,3,59,113,115,13711,13713,13717,1,8816,59,3,8806,824,108,97,110,116,59,3,10877,824,4,2,59,115,13731,13734,3,10877,824,59,1,8814,105,109,59,1,8820,4,2,59,114,13748,13750,1,8814,105,4,2,59,101,13757,13759,1,8938,59,1,8940,105,100,59,1,8740,4,2,112,116,13773,13778,102,59,3,55349,56671,5,172,3,59,105,110,13787,13789,13829,1,172,110,4,4,59,69,100,118,13800,13802,13806,13812,1,8713,59,3,8953,824,111,116,59,3,8949,824,4,3,97,98,99,13820,13823,13826,59,1,8713,59,1,8951,59,1,8950,105,4,2,59,118,13836,13838,1,8716,4,3,97,98,99,13846,13849,13852,59,1,8716,59,1,8958,59,1,8957,4,3,97,111,114,13863,13892,13899,114,4,4,59,97,115,116,13874,13876,13883,13888,1,8742,108,108,101,108,59,1,8742,108,59,3,11005,8421,59,3,8706,824,108,105,110,116,59,1,10772,4,3,59,99,101,13907,13909,13914,1,8832,117,101,59,1,8928,4,2,59,99,13920,13923,3,10927,824,4,2,59,101,13929,13931,1,8832,113,59,3,10927,824,4,4,65,97,105,116,13946,13951,13971,13982,114,114,59,1,8655,114,114,4,3,59,99,119,13961,13963,13967,1,8603,59,3,10547,824,59,3,8605,824,103,104,116,97,114,114,111,119,59,1,8603,114,105,4,2,59,101,13990,13992,1,8939,59,1,8941,4,7,99,104,105,109,112,113,117,14011,14036,14060,14080,14085,14090,14106,4,4,59,99,101,114,14021,14023,14028,14032,1,8833,117,101,59,1,8929,59,3,10928,824,59,3,55349,56515,111,114,116,4,2,109,112,14045,14050,105,100,59,1,8740,97,114,97,108,108,101,108,59,1,8742,109,4,2,59,101,14067,14069,1,8769,4,2,59,113,14075,14077,1,8772,59,1,8772,105,100,59,1,8740,97,114,59,1,8742,115,117,4,2,98,112,14098,14102,101,59,1,8930,101,59,1,8931,4,3,98,99,112,14114,14157,14171,4,4,59,69,101,115,14124,14126,14130,14133,1,8836,59,3,10949,824,59,1,8840,101,116,4,2,59,101,14141,14144,3,8834,8402,113,4,2,59,113,14151,14153,1,8840,59,3,10949,824,99,4,2,59,101,14164,14166,1,8833,113,59,3,10928,824,4,4,59,69,101,115,14181,14183,14187,14190,1,8837,59,3,10950,824,59,1,8841,101,116,4,2,59,101,14198,14201,3,8835,8402,113,4,2,59,113,14208,14210,1,8841,59,3,10950,824,4,4,103,105,108,114,14224,14228,14238,14242,108,59,1,8825,108,100,101,5,241,1,59,14236,1,241,103,59,1,8824,105,97,110,103,108,101,4,2,108,114,14254,14269,101,102,116,4,2,59,101,14263,14265,1,8938,113,59,1,8940,105,103,104,116,4,2,59,101,14279,14281,1,8939,113,59,1,8941,4,2,59,109,14291,14293,1,957,4,3,59,101,115,14301,14303,14308,1,35,114,111,59,1,8470,112,59,1,8199,4,9,68,72,97,100,103,105,108,114,115,14332,14338,14344,14349,14355,14369,14376,14408,14426,97,115,104,59,1,8877,97,114,114,59,1,10500,112,59,3,8781,8402,97,115,104,59,1,8876,4,2,101,116,14361,14365,59,3,8805,8402,59,3,62,8402,110,102,105,110,59,1,10718,4,3,65,101,116,14384,14389,14393,114,114,59,1,10498,59,3,8804,8402,4,2,59,114,14399,14402,3,60,8402,105,101,59,3,8884,8402,4,2,65,116,14414,14419,114,114,59,1,10499,114,105,101,59,3,8885,8402,105,109,59,3,8764,8402,4,3,65,97,110,14440,14445,14468,114,114,59,1,8662,114,4,2,104,114,14452,14456,107,59,1,10531,4,2,59,111,14462,14464,1,8598,119,59,1,8598,101,97,114,59,1,10535,4,18,83,97,99,100,101,102,103,104,105,108,109,111,112,114,115,116,117,118,14512,14515,14535,14560,14597,14603,14618,14643,14657,14662,14701,14741,14747,14769,14851,14877,14907,14916,59,1,9416,4,2,99,115,14521,14531,117,116,101,5,243,1,59,14529,1,243,116,59,1,8859,4,2,105,121,14541,14557,114,4,2,59,99,14548,14550,1,8858,5,244,1,59,14555,1,244,59,1,1086,4,5,97,98,105,111,115,14572,14577,14583,14587,14591,115,104,59,1,8861,108,97,99,59,1,337,118,59,1,10808,116,59,1,8857,111,108,100,59,1,10684,108,105,103,59,1,339,4,2,99,114,14609,14614,105,114,59,1,10687,59,3,55349,56620,4,3,111,114,116,14626,14630,14640,110,59,1,731,97,118,101,5,242,1,59,14638,1,242,59,1,10689,4,2,98,109,14649,14654,97,114,59,1,10677,59,1,937,110,116,59,1,8750,4,4,97,99,105,116,14672,14677,14693,14698,114,114,59,1,8634,4,2,105,114,14683,14687,114,59,1,10686,111,115,115,59,1,10683,110,101,59,1,8254,59,1,10688,4,3,97,101,105,14709,14714,14719,99,114,59,1,333,103,97,59,1,969,4,3,99,100,110,14727,14733,14736,114,111,110,59,1,959,59,1,10678,117,115,59,1,8854,112,102,59,3,55349,56672,4,3,97,101,108,14755,14759,14764,114,59,1,10679,114,112,59,1,10681,117,115,59,1,8853,4,7,59,97,100,105,111,115,118,14785,14787,14792,14831,14837,14841,14848,1,8744,114,114,59,1,8635,4,4,59,101,102,109,14802,14804,14817,14824,1,10845,114,4,2,59,111,14811,14813,1,8500,102,59,1,8500,5,170,1,59,14822,1,170,5,186,1,59,14829,1,186,103,111,102,59,1,8886,114,59,1,10838,108,111,112,101,59,1,10839,59,1,10843,4,3,99,108,111,14859,14863,14873,114,59,1,8500,97,115,104,5,248,1,59,14871,1,248,108,59,1,8856,105,4,2,108,109,14884,14893,100,101,5,245,1,59,14891,1,245,101,115,4,2,59,97,14901,14903,1,8855,115,59,1,10806,109,108,5,246,1,59,14914,1,246,98,97,114,59,1,9021,4,12,97,99,101,102,104,105,108,109,111,114,115,117,14948,14992,14996,15033,15038,15068,15090,15189,15192,15222,15427,15441,114,4,4,59,97,115,116,14959,14961,14976,14989,1,8741,5,182,2,59,108,14968,14970,1,182,108,101,108,59,1,8741,4,2,105,108,14982,14986,109,59,1,10995,59,1,11005,59,1,8706,121,59,1,1087,114,4,5,99,105,109,112,116,15009,15014,15019,15024,15027,110,116,59,1,37,111,100,59,1,46,105,108,59,1,8240,59,1,8869,101,110,107,59,1,8241,114,59,3,55349,56621,4,3,105,109,111,15046,15057,15063,4,2,59,118,15052,15054,1,966,59,1,981,109,97,116,59,1,8499,110,101,59,1,9742,4,3,59,116,118,15076,15078,15087,1,960,99,104,102,111,114,107,59,1,8916,59,1,982,4,2,97,117,15096,15119,110,4,2,99,107,15103,15115,107,4,2,59,104,15110,15112,1,8463,59,1,8462,118,59,1,8463,115,4,9,59,97,98,99,100,101,109,115,116,15140,15142,15148,15151,15156,15168,15171,15179,15184,1,43,99,105,114,59,1,10787,59,1,8862,105,114,59,1,10786,4,2,111,117,15162,15165,59,1,8724,59,1,10789,59,1,10866,110,5,177,1,59,15177,1,177,105,109,59,1,10790,119,111,59,1,10791,59,1,177,4,3,105,112,117,15200,15208,15213,110,116,105,110,116,59,1,10773,102,59,3,55349,56673,110,100,5,163,1,59,15220,1,163,4,10,59,69,97,99,101,105,110,111,115,117,15244,15246,15249,15253,15258,15334,15347,15367,15416,15421,1,8826,59,1,10931,112,59,1,10935,117,101,59,1,8828,4,2,59,99,15264,15266,1,10927,4,6,59,97,99,101,110,115,15280,15282,15290,15299,15303,15329,1,8826,112,112,114,111,120,59,1,10935,117,114,108,121,101,113,59,1,8828,113,59,1,10927,4,3,97,101,115,15311,15319,15324,112,112,114,111,120,59,1,10937,113,113,59,1,10933,105,109,59,1,8936,105,109,59,1,8830,109,101,4,2,59,115,15342,15344,1,8242,59,1,8473,4,3,69,97,115,15355,15358,15362,59,1,10933,112,59,1,10937,105,109,59,1,8936,4,3,100,102,112,15375,15378,15404,59,1,8719,4,3,97,108,115,15386,15392,15398,108,97,114,59,1,9006,105,110,101,59,1,8978,117,114,102,59,1,8979,4,2,59,116,15410,15412,1,8733,111,59,1,8733,105,109,59,1,8830,114,101,108,59,1,8880,4,2,99,105,15433,15438,114,59,3,55349,56517,59,1,968,110,99,115,112,59,1,8200,4,6,102,105,111,112,115,117,15462,15467,15472,15478,15485,15491,114,59,3,55349,56622,110,116,59,1,10764,112,102,59,3,55349,56674,114,105,109,101,59,1,8279,99,114,59,3,55349,56518,4,3,97,101,111,15499,15520,15534,116,4,2,101,105,15506,15515,114,110,105,111,110,115,59,1,8461,110,116,59,1,10774,115,116,4,2,59,101,15528,15530,1,63,113,59,1,8799,116,5,34,1,59,15540,1,34,4,21,65,66,72,97,98,99,100,101,102,104,105,108,109,110,111,112,114,115,116,117,120,15586,15609,15615,15620,15796,15855,15893,15931,15977,16001,16039,16183,16204,16222,16228,16285,16312,16318,16363,16408,16416,4,3,97,114,116,15594,15599,15603,114,114,59,1,8667,114,59,1,8658,97,105,108,59,1,10524,97,114,114,59,1,10511,97,114,59,1,10596,4,7,99,100,101,110,113,114,116,15636,15651,15656,15664,15687,15696,15770,4,2,101,117,15642,15646,59,3,8765,817,116,101,59,1,341,105,99,59,1,8730,109,112,116,121,118,59,1,10675,103,4,4,59,100,101,108,15675,15677,15680,15683,1,10217,59,1,10642,59,1,10661,101,59,1,10217,117,111,5,187,1,59,15694,1,187,114,4,11,59,97,98,99,102,104,108,112,115,116,119,15721,15723,15727,15739,15742,15746,15750,15754,15758,15763,15767,1,8594,112,59,1,10613,4,2,59,102,15733,15735,1,8677,115,59,1,10528,59,1,10547,115,59,1,10526,107,59,1,8618,112,59,1,8620,108,59,1,10565,105,109,59,1,10612,108,59,1,8611,59,1,8605,4,2,97,105,15776,15781,105,108,59,1,10522,111,4,2,59,110,15788,15790,1,8758,97,108,115,59,1,8474,4,3,97,98,114,15804,15809,15814,114,114,59,1,10509,114,107,59,1,10099,4,2,97,107,15820,15833,99,4,2,101,107,15827,15830,59,1,125,59,1,93,4,2,101,115,15839,15842,59,1,10636,108,4,2,100,117,15849,15852,59,1,10638,59,1,10640,4,4,97,101,117,121,15865,15871,15886,15890,114,111,110,59,1,345,4,2,100,105,15877,15882,105,108,59,1,343,108,59,1,8969,98,59,1,125,59,1,1088,4,4,99,108,113,115,15903,15907,15914,15927,97,59,1,10551,100,104,97,114,59,1,10601,117,111,4,2,59,114,15922,15924,1,8221,59,1,8221,104,59,1,8627,4,3,97,99,103,15939,15966,15970,108,4,4,59,105,112,115,15950,15952,15957,15963,1,8476,110,101,59,1,8475,97,114,116,59,1,8476,59,1,8477,116,59,1,9645,5,174,1,59,15975,1,174,4,3,105,108,114,15985,15991,15997,115,104,116,59,1,10621,111,111,114,59,1,8971,59,3,55349,56623,4,2,97,111,16007,16028,114,4,2,100,117,16014,16017,59,1,8641,4,2,59,108,16023,16025,1,8640,59,1,10604,4,2,59,118,16034,16036,1,961,59,1,1009,4,3,103,110,115,16047,16167,16171,104,116,4,6,97,104,108,114,115,116,16063,16081,16103,16130,16143,16155,114,114,111,119,4,2,59,116,16073,16075,1,8594,97,105,108,59,1,8611,97,114,112,111,111,110,4,2,100,117,16093,16099,111,119,110,59,1,8641,112,59,1,8640,101,102,116,4,2,97,104,16112,16120,114,114,111,119,115,59,1,8644,97,114,112,111,111,110,115,59,1,8652,105,103,104,116,97,114,114,111,119,115,59,1,8649,113,117,105,103,97,114,114,111,119,59,1,8605,104,114,101,101,116,105,109,101,115,59,1,8908,103,59,1,730,105,110,103,100,111,116,115,101,113,59,1,8787,4,3,97,104,109,16191,16196,16201,114,114,59,1,8644,97,114,59,1,8652,59,1,8207,111,117,115,116,4,2,59,97,16214,16216,1,9137,99,104,101,59,1,9137,109,105,100,59,1,10990,4,4,97,98,112,116,16238,16252,16257,16278,4,2,110,114,16244,16248,103,59,1,10221,114,59,1,8702,114,107,59,1,10215,4,3,97,102,108,16265,16269,16273,114,59,1,10630,59,3,55349,56675,117,115,59,1,10798,105,109,101,115,59,1,10805,4,2,97,112,16291,16304,114,4,2,59,103,16298,16300,1,41,116,59,1,10644,111,108,105,110,116,59,1,10770,97,114,114,59,1,8649,4,4,97,99,104,113,16328,16334,16339,16342,113,117,111,59,1,8250,114,59,3,55349,56519,59,1,8625,4,2,98,117,16348,16351,59,1,93,111,4,2,59,114,16358,16360,1,8217,59,1,8217,4,3,104,105,114,16371,16377,16383,114,101,101,59,1,8908,109,101,115,59,1,8906,105,4,4,59,101,102,108,16394,16396,16399,16402,1,9657,59,1,8885,59,1,9656,116,114,105,59,1,10702,108,117,104,97,114,59,1,10600,59,1,8478,4,19,97,98,99,100,101,102,104,105,108,109,111,112,113,114,115,116,117,119,122,16459,16466,16472,16572,16590,16672,16687,16746,16844,16850,16924,16963,16988,17115,17121,17154,17206,17614,17656,99,117,116,101,59,1,347,113,117,111,59,1,8218,4,10,59,69,97,99,101,105,110,112,115,121,16494,16496,16499,16513,16518,16531,16536,16556,16564,16569,1,8827,59,1,10932,4,2,112,114,16505,16508,59,1,10936,111,110,59,1,353,117,101,59,1,8829,4,2,59,100,16524,16526,1,10928,105,108,59,1,351,114,99,59,1,349,4,3,69,97,115,16544,16547,16551,59,1,10934,112,59,1,10938,105,109,59,1,8937,111,108,105,110,116,59,1,10771,105,109,59,1,8831,59,1,1089,111,116,4,3,59,98,101,16582,16584,16587,1,8901,59,1,8865,59,1,10854,4,7,65,97,99,109,115,116,120,16606,16611,16634,16642,16646,16652,16668,114,114,59,1,8664,114,4,2,104,114,16618,16622,107,59,1,10533,4,2,59,111,16628,16630,1,8600,119,59,1,8600,116,5,167,1,59,16640,1,167,105,59,1,59,119,97,114,59,1,10537,109,4,2,105,110,16659,16665,110,117,115,59,1,8726,59,1,8726,116,59,1,10038,114,4,2,59,111,16679,16682,3,55349,56624,119,110,59,1,8994,4,4,97,99,111,121,16697,16702,16716,16739,114,112,59,1,9839,4,2,104,121,16708,16713,99,121,59,1,1097,59,1,1096,114,116,4,2,109,112,16724,16729,105,100,59,1,8739,97,114,97,108,108,101,108,59,1,8741,5,173,1,59,16744,1,173,4,2,103,109,16752,16770,109,97,4,3,59,102,118,16762,16764,16767,1,963,59,1,962,59,1,962,4,8,59,100,101,103,108,110,112,114,16788,16790,16795,16806,16817,16828,16832,16838,1,8764,111,116,59,1,10858,4,2,59,113,16801,16803,1,8771,59,1,8771,4,2,59,69,16812,16814,1,10910,59,1,10912,4,2,59,69,16823,16825,1,10909,59,1,10911,101,59,1,8774,108,117,115,59,1,10788,97,114,114,59,1,10610,97,114,114,59,1,8592,4,4,97,101,105,116,16860,16883,16891,16904,4,2,108,115,16866,16878,108,115,101,116,109,105,110,117,115,59,1,8726,104,112,59,1,10803,112,97,114,115,108,59,1,10724,4,2,100,108,16897,16900,59,1,8739,101,59,1,8995,4,2,59,101,16910,16912,1,10922,4,2,59,115,16918,16920,1,10924,59,3,10924,65024,4,3,102,108,112,16932,16938,16958,116,99,121,59,1,1100,4,2,59,98,16944,16946,1,47,4,2,59,97,16952,16954,1,10692,114,59,1,9023,102,59,3,55349,56676,97,4,2,100,114,16970,16985,101,115,4,2,59,117,16978,16980,1,9824,105,116,59,1,9824,59,1,8741,4,3,99,115,117,16996,17028,17089,4,2,97,117,17002,17015,112,4,2,59,115,17009,17011,1,8851,59,3,8851,65024,112,4,2,59,115,17022,17024,1,8852,59,3,8852,65024,117,4,2,98,112,17035,17062,4,3,59,101,115,17043,17045,17048,1,8847,59,1,8849,101,116,4,2,59,101,17056,17058,1,8847,113,59,1,8849,4,3,59,101,115,17070,17072,17075,1,8848,59,1,8850,101,116,4,2,59,101,17083,17085,1,8848,113,59,1,8850,4,3,59,97,102,17097,17099,17112,1,9633,114,4,2,101,102,17106,17109,59,1,9633,59,1,9642,59,1,9642,97,114,114,59,1,8594,4,4,99,101,109,116,17131,17136,17142,17148,114,59,3,55349,56520,116,109,110,59,1,8726,105,108,101,59,1,8995,97,114,102,59,1,8902,4,2,97,114,17160,17172,114,4,2,59,102,17167,17169,1,9734,59,1,9733,4,2,97,110,17178,17202,105,103,104,116,4,2,101,112,17188,17197,112,115,105,108,111,110,59,1,1013,104,105,59,1,981,115,59,1,175,4,5,98,99,109,110,112,17218,17351,17420,17423,17427,4,9,59,69,100,101,109,110,112,114,115,17238,17240,17243,17248,17261,17267,17279,17285,17291,1,8834,59,1,10949,111,116,59,1,10941,4,2,59,100,17254,17256,1,8838,111,116,59,1,10947,117,108,116,59,1,10945,4,2,69,101,17273,17276,59,1,10955,59,1,8842,108,117,115,59,1,10943,97,114,114,59,1,10617,4,3,101,105,117,17299,17335,17339,116,4,3,59,101,110,17308,17310,17322,1,8834,113,4,2,59,113,17317,17319,1,8838,59,1,10949,101,113,4,2,59,113,17330,17332,1,8842,59,1,10955,109,59,1,10951,4,2,98,112,17345,17348,59,1,10965,59,1,10963,99,4,6,59,97,99,101,110,115,17366,17368,17376,17385,17389,17415,1,8827,112,112,114,111,120,59,1,10936,117,114,108,121,101,113,59,1,8829,113,59,1,10928,4,3,97,101,115,17397,17405,17410,112,112,114,111,120,59,1,10938,113,113,59,1,10934,105,109,59,1,8937,105,109,59,1,8831,59,1,8721,103,59,1,9834,4,13,49,50,51,59,69,100,101,104,108,109,110,112,115,17455,17462,17469,17476,17478,17481,17496,17509,17524,17530,17536,17548,17554,5,185,1,59,17460,1,185,5,178,1,59,17467,1,178,5,179,1,59,17474,1,179,1,8835,59,1,10950,4,2,111,115,17487,17491,116,59,1,10942,117,98,59,1,10968,4,2,59,100,17502,17504,1,8839,111,116,59,1,10948,115,4,2,111,117,17516,17520,108,59,1,10185,98,59,1,10967,97,114,114,59,1,10619,117,108,116,59,1,10946,4,2,69,101,17542,17545,59,1,10956,59,1,8843,108,117,115,59,1,10944,4,3,101,105,117,17562,17598,17602,116,4,3,59,101,110,17571,17573,17585,1,8835,113,4,2,59,113,17580,17582,1,8839,59,1,10950,101,113,4,2,59,113,17593,17595,1,8843,59,1,10956,109,59,1,10952,4,2,98,112,17608,17611,59,1,10964,59,1,10966,4,3,65,97,110,17622,17627,17650,114,114,59,1,8665,114,4,2,104,114,17634,17638,107,59,1,10534,4,2,59,111,17644,17646,1,8601,119,59,1,8601,119,97,114,59,1,10538,108,105,103,5,223,1,59,17664,1,223,4,13,97,98,99,100,101,102,104,105,111,112,114,115,119,17694,17709,17714,17737,17742,17749,17754,17860,17905,17957,17964,18090,18122,4,2,114,117,17700,17706,103,101,116,59,1,8982,59,1,964,114,107,59,1,9140,4,3,97,101,121,17722,17728,17734,114,111,110,59,1,357,100,105,108,59,1,355,59,1,1090,111,116,59,1,8411,108,114,101,99,59,1,8981,114,59,3,55349,56625,4,4,101,105,107,111,17764,17805,17836,17851,4,2,114,116,17770,17786,101,4,2,52,102,17777,17780,59,1,8756,111,114,101,59,1,8756,97,4,3,59,115,118,17795,17797,17802,1,952,121,109,59,1,977,59,1,977,4,2,99,110,17811,17831,107,4,2,97,115,17818,17826,112,112,114,111,120,59,1,8776,105,109,59,1,8764,115,112,59,1,8201,4,2,97,115,17842,17846,112,59,1,8776,105,109,59,1,8764,114,110,5,254,1,59,17858,1,254,4,3,108,109,110,17868,17873,17901,100,101,59,1,732,101,115,5,215,3,59,98,100,17884,17886,17898,1,215,4,2,59,97,17892,17894,1,8864,114,59,1,10801,59,1,10800,116,59,1,8749,4,3,101,112,115,17913,17917,17953,97,59,1,10536,4,4,59,98,99,102,17927,17929,17934,17939,1,8868,111,116,59,1,9014,105,114,59,1,10993,4,2,59,111,17945,17948,3,55349,56677,114,107,59,1,10970,97,59,1,10537,114,105,109,101,59,1,8244,4,3,97,105,112,17972,17977,18082,100,101,59,1,8482,4,7,97,100,101,109,112,115,116,17993,18051,18056,18059,18066,18072,18076,110,103,108,101,4,5,59,100,108,113,114,18009,18011,18017,18032,18035,1,9653,111,119,110,59,1,9663,101,102,116,4,2,59,101,18026,18028,1,9667,113,59,1,8884,59,1,8796,105,103,104,116,4,2,59,101,18045,18047,1,9657,113,59,1,8885,111,116,59,1,9708,59,1,8796,105,110,117,115,59,1,10810,108,117,115,59,1,10809,98,59,1,10701,105,109,101,59,1,10811,101,122,105,117,109,59,1,9186,4,3,99,104,116,18098,18111,18116,4,2,114,121,18104,18108,59,3,55349,56521,59,1,1094,99,121,59,1,1115,114,111,107,59,1,359,4,2,105,111,18128,18133,120,116,59,1,8812,104,101,97,100,4,2,108,114,18143,18154,101,102,116,97,114,114,111,119,59,1,8606,105,103,104,116,97,114,114,111,119,59,1,8608,4,18,65,72,97,98,99,100,102,103,104,108,109,111,112,114,115,116,117,119,18204,18209,18214,18234,18250,18268,18292,18308,18319,18343,18379,18397,18413,18504,18547,18553,18584,18603,114,114,59,1,8657,97,114,59,1,10595,4,2,99,114,18220,18230,117,116,101,5,250,1,59,18228,1,250,114,59,1,8593,114,4,2,99,101,18241,18245,121,59,1,1118,118,101,59,1,365,4,2,105,121,18256,18265,114,99,5,251,1,59,18263,1,251,59,1,1091,4,3,97,98,104,18276,18281,18287,114,114,59,1,8645,108,97,99,59,1,369,97,114,59,1,10606,4,2,105,114,18298,18304,115,104,116,59,1,10622,59,3,55349,56626,114,97,118,101,5,249,1,59,18317,1,249,4,2,97,98,18325,18338,114,4,2,108,114,18332,18335,59,1,8639,59,1,8638,108,107,59,1,9600,4,2,99,116,18349,18374,4,2,111,114,18355,18369,114,110,4,2,59,101,18363,18365,1,8988,114,59,1,8988,111,112,59,1,8975,114,105,59,1,9720,4,2,97,108,18385,18390,99,114,59,1,363,5,168,1,59,18395,1,168,4,2,103,112,18403,18408,111,110,59,1,371,102,59,3,55349,56678,4,6,97,100,104,108,115,117,18427,18434,18445,18470,18475,18494,114,114,111,119,59,1,8593,111,119,110,97,114,114,111,119,59,1,8597,97,114,112,111,111,110,4,2,108,114,18457,18463,101,102,116,59,1,8639,105,103,104,116,59,1,8638,117,115,59,1,8846,105,4,3,59,104,108,18484,18486,18489,1,965,59,1,978,111,110,59,1,965,112,97,114,114,111,119,115,59,1,8648,4,3,99,105,116,18512,18537,18542,4,2,111,114,18518,18532,114,110,4,2,59,101,18526,18528,1,8989,114,59,1,8989,111,112,59,1,8974,110,103,59,1,367,114,105,59,1,9721,99,114,59,3,55349,56522,4,3,100,105,114,18561,18566,18572,111,116,59,1,8944,108,100,101,59,1,361,105,4,2,59,102,18579,18581,1,9653,59,1,9652,4,2,97,109,18590,18595,114,114,59,1,8648,108,5,252,1,59,18601,1,252,97,110,103,108,101,59,1,10663,4,15,65,66,68,97,99,100,101,102,108,110,111,112,114,115,122,18643,18648,18661,18667,18847,18851,18857,18904,18909,18915,18931,18937,18943,18949,18996,114,114,59,1,8661,97,114,4,2,59,118,18656,18658,1,10984,59,1,10985,97,115,104,59,1,8872,4,2,110,114,18673,18679,103,114,116,59,1,10652,4,7,101,107,110,112,114,115,116,18695,18704,18711,18720,18742,18754,18810,112,115,105,108,111,110,59,1,1013,97,112,112,97,59,1,1008,111,116,104,105,110,103,59,1,8709,4,3,104,105,114,18728,18732,18735,105,59,1,981,59,1,982,111,112,116,111,59,1,8733,4,2,59,104,18748,18750,1,8597,111,59,1,1009,4,2,105,117,18760,18766,103,109,97,59,1,962,4,2,98,112,18772,18791,115,101,116,110,101,113,4,2,59,113,18784,18787,3,8842,65024,59,3,10955,65024,115,101,116,110,101,113,4,2,59,113,18803,18806,3,8843,65024,59,3,10956,65024,4,2,104,114,18816,18822,101,116,97,59,1,977,105,97,110,103,108,101,4,2,108,114,18834,18840,101,102,116,59,1,8882,105,103,104,116,59,1,8883,121,59,1,1074,97,115,104,59,1,8866,4,3,101,108,114,18865,18884,18890,4,3,59,98,101,18873,18875,18880,1,8744,97,114,59,1,8891,113,59,1,8794,108,105,112,59,1,8942,4,2,98,116,18896,18901,97,114,59,1,124,59,1,124,114,59,3,55349,56627,116,114,105,59,1,8882,115,117,4,2,98,112,18923,18927,59,3,8834,8402,59,3,8835,8402,112,102,59,3,55349,56679,114,111,112,59,1,8733,116,114,105,59,1,8883,4,2,99,117,18955,18960,114,59,3,55349,56523,4,2,98,112,18966,18981,110,4,2,69,101,18973,18977,59,3,10955,65024,59,3,8842,65024,110,4,2,69,101,18988,18992,59,3,10956,65024,59,3,8843,65024,105,103,122,97,103,59,1,10650,4,7,99,101,102,111,112,114,115,19020,19026,19061,19066,19072,19075,19089,105,114,99,59,1,373,4,2,100,105,19032,19055,4,2,98,103,19038,19043,97,114,59,1,10847,101,4,2,59,113,19050,19052,1,8743,59,1,8793,101,114,112,59,1,8472,114,59,3,55349,56628,112,102,59,3,55349,56680,59,1,8472,4,2,59,101,19081,19083,1,8768,97,116,104,59,1,8768,99,114,59,3,55349,56524,4,14,99,100,102,104,105,108,109,110,111,114,115,117,118,119,19125,19146,19152,19157,19173,19176,19192,19197,19202,19236,19252,19269,19286,19291,4,3,97,105,117,19133,19137,19142,112,59,1,8898,114,99,59,1,9711,112,59,1,8899,116,114,105,59,1,9661,114,59,3,55349,56629,4,2,65,97,19163,19168,114,114,59,1,10234,114,114,59,1,10231,59,1,958,4,2,65,97,19182,19187,114,114,59,1,10232,114,114,59,1,10229,97,112,59,1,10236,105,115,59,1,8955,4,3,100,112,116,19210,19215,19230,111,116,59,1,10752,4,2,102,108,19221,19225,59,3,55349,56681,117,115,59,1,10753,105,109,101,59,1,10754,4,2,65,97,19242,19247,114,114,59,1,10233,114,114,59,1,10230,4,2,99,113,19258,19263,114,59,3,55349,56525,99,117,112,59,1,10758,4,2,112,116,19275,19281,108,117,115,59,1,10756,114,105,59,1,9651,101,101,59,1,8897,101,100,103,101,59,1,8896,4,8,97,99,101,102,105,111,115,117,19316,19335,19349,19357,19362,19367,19373,19379,99,4,2,117,121,19323,19332,116,101,5,253,1,59,19330,1,253,59,1,1103,4,2,105,121,19341,19346,114,99,59,1,375,59,1,1099,110,5,165,1,59,19355,1,165,114,59,3,55349,56630,99,121,59,1,1111,112,102,59,3,55349,56682,99,114,59,3,55349,56526,4,2,99,109,19385,19389,121,59,1,1102,108,5,255,1,59,19395,1,255,4,10,97,99,100,101,102,104,105,111,115,119,19419,19426,19441,19446,19462,19467,19472,19480,19486,19492,99,117,116,101,59,1,378,4,2,97,121,19432,19438,114,111,110,59,1,382,59,1,1079,111,116,59,1,380,4,2,101,116,19452,19458,116,114,102,59,1,8488,97,59,1,950,114,59,3,55349,56631,99,121,59,1,1078,103,114,97,114,114,59,1,8669,112,102,59,3,55349,56683,99,114,59,3,55349,56527,4,2,106,110,19498,19501,59,1,8205,106,59,1,8204]);
},{}],153:[function(require,module,exports){
'use strict';

const unicode = require('../common/unicode');
const ERR = require('../common/error-codes');

//Aliases
const $ = unicode.CODE_POINTS;

//Const
const DEFAULT_BUFFER_WATERLINE = 1 << 16;

//Preprocessor
//NOTE: HTML input preprocessing
//(see: http://www.whatwg.org/specs/web-apps/current-work/multipage/parsing.html#preprocessing-the-input-stream)
class Preprocessor {
    constructor() {
        this.html = null;

        this.pos = -1;
        this.lastGapPos = -1;
        this.lastCharPos = -1;

        this.gapStack = [];

        this.skipNextNewLine = false;

        this.lastChunkWritten = false;
        this.endOfChunkHit = false;
        this.bufferWaterline = DEFAULT_BUFFER_WATERLINE;
    }

    _err() {
        // NOTE: err reporting is noop by default. Enabled by mixin.
    }

    _addGap() {
        this.gapStack.push(this.lastGapPos);
        this.lastGapPos = this.pos;
    }

    _processSurrogate(cp) {
        //NOTE: try to peek a surrogate pair
        if (this.pos !== this.lastCharPos) {
            const nextCp = this.html.charCodeAt(this.pos + 1);

            if (unicode.isSurrogatePair(nextCp)) {
                //NOTE: we have a surrogate pair. Peek pair character and recalculate code point.
                this.pos++;

                //NOTE: add gap that should be avoided during retreat
                this._addGap();

                return unicode.getSurrogatePairCodePoint(cp, nextCp);
            }
        }

        //NOTE: we are at the end of a chunk, therefore we can't infer surrogate pair yet.
        else if (!this.lastChunkWritten) {
            this.endOfChunkHit = true;
            return $.EOF;
        }

        //NOTE: isolated surrogate
        this._err(ERR.surrogateInInputStream);

        return cp;
    }

    dropParsedChunk() {
        if (this.pos > this.bufferWaterline) {
            this.lastCharPos -= this.pos;
            this.html = this.html.substring(this.pos);
            this.pos = 0;
            this.lastGapPos = -1;
            this.gapStack = [];
        }
    }

    write(chunk, isLastChunk) {
        if (this.html) {
            this.html += chunk;
        } else {
            this.html = chunk;
        }

        this.lastCharPos = this.html.length - 1;
        this.endOfChunkHit = false;
        this.lastChunkWritten = isLastChunk;
    }

    insertHtmlAtCurrentPos(chunk) {
        this.html = this.html.substring(0, this.pos + 1) + chunk + this.html.substring(this.pos + 1, this.html.length);

        this.lastCharPos = this.html.length - 1;
        this.endOfChunkHit = false;
    }

    advance() {
        this.pos++;

        if (this.pos > this.lastCharPos) {
            this.endOfChunkHit = !this.lastChunkWritten;
            return $.EOF;
        }

        let cp = this.html.charCodeAt(this.pos);

        //NOTE: any U+000A LINE FEED (LF) characters that immediately follow a U+000D CARRIAGE RETURN (CR) character
        //must be ignored.
        if (this.skipNextNewLine && cp === $.LINE_FEED) {
            this.skipNextNewLine = false;
            this._addGap();
            return this.advance();
        }

        //NOTE: all U+000D CARRIAGE RETURN (CR) characters must be converted to U+000A LINE FEED (LF) characters
        if (cp === $.CARRIAGE_RETURN) {
            this.skipNextNewLine = true;
            return $.LINE_FEED;
        }

        this.skipNextNewLine = false;

        if (unicode.isSurrogate(cp)) {
            cp = this._processSurrogate(cp);
        }

        //OPTIMIZATION: first check if code point is in the common allowed
        //range (ASCII alphanumeric, whitespaces, big chunk of BMP)
        //before going into detailed performance cost validation.
        const isCommonValidRange =
            (cp > 0x1f && cp < 0x7f) || cp === $.LINE_FEED || cp === $.CARRIAGE_RETURN || (cp > 0x9f && cp < 0xfdd0);

        if (!isCommonValidRange) {
            this._checkForProblematicCharacters(cp);
        }

        return cp;
    }

    _checkForProblematicCharacters(cp) {
        if (unicode.isControlCodePoint(cp)) {
            this._err(ERR.controlCharacterInInputStream);
        } else if (unicode.isUndefinedCodePoint(cp)) {
            this._err(ERR.noncharacterInInputStream);
        }
    }

    retreat() {
        if (this.pos === this.lastGapPos) {
            this.lastGapPos = this.gapStack.pop();
            this.pos--;
        }

        this.pos--;
    }
}

module.exports = Preprocessor;

},{"../common/error-codes":136,"../common/unicode":139}],154:[function(require,module,exports){
'use strict';

const { DOCUMENT_MODE } = require('../common/html');

//Node construction
exports.createDocument = function() {
    return {
        nodeName: '#document',
        mode: DOCUMENT_MODE.NO_QUIRKS,
        childNodes: []
    };
};

exports.createDocumentFragment = function() {
    return {
        nodeName: '#document-fragment',
        childNodes: []
    };
};

exports.createElement = function(tagName, namespaceURI, attrs) {
    return {
        nodeName: tagName,
        tagName: tagName,
        attrs: attrs,
        namespaceURI: namespaceURI,
        childNodes: [],
        parentNode: null
    };
};

exports.createCommentNode = function(data) {
    return {
        nodeName: '#comment',
        data: data,
        parentNode: null
    };
};

const createTextNode = function(value) {
    return {
        nodeName: '#text',
        value: value,
        parentNode: null
    };
};

//Tree mutation
const appendChild = (exports.appendChild = function(parentNode, newNode) {
    parentNode.childNodes.push(newNode);
    newNode.parentNode = parentNode;
});

const insertBefore = (exports.insertBefore = function(parentNode, newNode, referenceNode) {
    const insertionIdx = parentNode.childNodes.indexOf(referenceNode);

    parentNode.childNodes.splice(insertionIdx, 0, newNode);
    newNode.parentNode = parentNode;
});

exports.setTemplateContent = function(templateElement, contentElement) {
    templateElement.content = contentElement;
};

exports.getTemplateContent = function(templateElement) {
    return templateElement.content;
};

exports.setDocumentType = function(document, name, publicId, systemId) {
    let doctypeNode = null;

    for (let i = 0; i < document.childNodes.length; i++) {
        if (document.childNodes[i].nodeName === '#documentType') {
            doctypeNode = document.childNodes[i];
            break;
        }
    }

    if (doctypeNode) {
        doctypeNode.name = name;
        doctypeNode.publicId = publicId;
        doctypeNode.systemId = systemId;
    } else {
        appendChild(document, {
            nodeName: '#documentType',
            name: name,
            publicId: publicId,
            systemId: systemId
        });
    }
};

exports.setDocumentMode = function(document, mode) {
    document.mode = mode;
};

exports.getDocumentMode = function(document) {
    return document.mode;
};

exports.detachNode = function(node) {
    if (node.parentNode) {
        const idx = node.parentNode.childNodes.indexOf(node);

        node.parentNode.childNodes.splice(idx, 1);
        node.parentNode = null;
    }
};

exports.insertText = function(parentNode, text) {
    if (parentNode.childNodes.length) {
        const prevNode = parentNode.childNodes[parentNode.childNodes.length - 1];

        if (prevNode.nodeName === '#text') {
            prevNode.value += text;
            return;
        }
    }

    appendChild(parentNode, createTextNode(text));
};

exports.insertTextBefore = function(parentNode, text, referenceNode) {
    const prevNode = parentNode.childNodes[parentNode.childNodes.indexOf(referenceNode) - 1];

    if (prevNode && prevNode.nodeName === '#text') {
        prevNode.value += text;
    } else {
        insertBefore(parentNode, createTextNode(text), referenceNode);
    }
};

exports.adoptAttributes = function(recipient, attrs) {
    const recipientAttrsMap = [];

    for (let i = 0; i < recipient.attrs.length; i++) {
        recipientAttrsMap.push(recipient.attrs[i].name);
    }

    for (let j = 0; j < attrs.length; j++) {
        if (recipientAttrsMap.indexOf(attrs[j].name) === -1) {
            recipient.attrs.push(attrs[j]);
        }
    }
};

//Tree traversing
exports.getFirstChild = function(node) {
    return node.childNodes[0];
};

exports.getChildNodes = function(node) {
    return node.childNodes;
};

exports.getParentNode = function(node) {
    return node.parentNode;
};

exports.getAttrList = function(element) {
    return element.attrs;
};

//Node data
exports.getTagName = function(element) {
    return element.tagName;
};

exports.getNamespaceURI = function(element) {
    return element.namespaceURI;
};

exports.getTextNodeContent = function(textNode) {
    return textNode.value;
};

exports.getCommentNodeContent = function(commentNode) {
    return commentNode.data;
};

exports.getDocumentTypeNodeName = function(doctypeNode) {
    return doctypeNode.name;
};

exports.getDocumentTypeNodePublicId = function(doctypeNode) {
    return doctypeNode.publicId;
};

exports.getDocumentTypeNodeSystemId = function(doctypeNode) {
    return doctypeNode.systemId;
};

//Node types
exports.isTextNode = function(node) {
    return node.nodeName === '#text';
};

exports.isCommentNode = function(node) {
    return node.nodeName === '#comment';
};

exports.isDocumentTypeNode = function(node) {
    return node.nodeName === '#documentType';
};

exports.isElementNode = function(node) {
    return !!node.tagName;
};

// Source code location
exports.setNodeSourceCodeLocation = function(node, location) {
    node.sourceCodeLocation = location;
};

exports.getNodeSourceCodeLocation = function(node) {
    return node.sourceCodeLocation;
};

},{"../common/html":138}],155:[function(require,module,exports){
'use strict';

module.exports = function mergeOptions(defaults, options) {
    options = options || Object.create(null);

    return [defaults, options].reduce((merged, optObj) => {
        Object.keys(optObj).forEach(key => {
            merged[key] = optObj[key];
        });

        return merged;
    }, Object.create(null));
};

},{}],156:[function(require,module,exports){
'use strict';

class Mixin {
    constructor(host) {
        const originalMethods = {};
        const overriddenMethods = this._getOverriddenMethods(this, originalMethods);

        for (const key of Object.keys(overriddenMethods)) {
            if (typeof overriddenMethods[key] === 'function') {
                originalMethods[key] = host[key];
                host[key] = overriddenMethods[key];
            }
        }
    }

    _getOverriddenMethods() {
        throw new Error('Not implemented');
    }
}

Mixin.install = function(host, Ctor, opts) {
    if (!host.__mixins) {
        host.__mixins = [];
    }

    for (let i = 0; i < host.__mixins.length; i++) {
        if (host.__mixins[i].constructor === Ctor) {
            return host.__mixins[i];
        }
    }

    const mixin = new Ctor(host, opts);

    host.__mixins.push(mixin);

    return mixin;
};

module.exports = Mixin;

},{}],157:[function(require,module,exports){
'use strict'

var normalize = require('./normalize')
var DefinedInfo = require('./lib/util/defined-info')
var Info = require('./lib/util/info')

var data = 'data'

module.exports = find

var valid = /^data[-a-z0-9.:_]+$/i
var dash = /-[a-z]/g
var cap = /[A-Z]/g

function find(schema, value) {
  var normal = normalize(value)
  var prop = value
  var Type = Info

  if (normal in schema.normal) {
    return schema.property[schema.normal[normal]]
  }

  if (normal.length > 4 && normal.slice(0, 4) === data && valid.test(value)) {
    // Attribute or property.
    if (value.charAt(4) === '-') {
      prop = datasetToProperty(value)
    } else {
      value = datasetToAttribute(value)
    }

    Type = DefinedInfo
  }

  return new Type(prop, value)
}

function datasetToProperty(attribute) {
  var value = attribute.slice(5).replace(dash, camelcase)
  return data + value.charAt(0).toUpperCase() + value.slice(1)
}

function datasetToAttribute(property) {
  var value = property.slice(4)

  if (dash.test(value)) {
    return property
  }

  value = value.replace(cap, kebab)

  if (value.charAt(0) !== '-') {
    value = '-' + value
  }

  return data + value
}

function kebab($0) {
  return '-' + $0.toLowerCase()
}

function camelcase($0) {
  return $0.charAt(1).toUpperCase()
}

},{"./lib/util/defined-info":165,"./lib/util/info":166,"./normalize":173}],158:[function(require,module,exports){
'use strict'

var merge = require('./lib/util/merge')
var xlink = require('./lib/xlink')
var xml = require('./lib/xml')
var xmlns = require('./lib/xmlns')
var aria = require('./lib/aria')
var html = require('./lib/html')

module.exports = merge([xml, xlink, xmlns, aria, html])

},{"./lib/aria":159,"./lib/html":160,"./lib/util/merge":167,"./lib/xlink":170,"./lib/xml":171,"./lib/xmlns":172}],159:[function(require,module,exports){
'use strict'

var types = require('./util/types')
var create = require('./util/create')

var booleanish = types.booleanish
var number = types.number
var spaceSeparated = types.spaceSeparated

module.exports = create({
  transform: ariaTransform,
  properties: {
    ariaActiveDescendant: null,
    ariaAtomic: booleanish,
    ariaAutoComplete: null,
    ariaBusy: booleanish,
    ariaChecked: booleanish,
    ariaColCount: number,
    ariaColIndex: number,
    ariaColSpan: number,
    ariaControls: spaceSeparated,
    ariaCurrent: null,
    ariaDescribedBy: spaceSeparated,
    ariaDetails: null,
    ariaDisabled: booleanish,
    ariaDropEffect: spaceSeparated,
    ariaErrorMessage: null,
    ariaExpanded: booleanish,
    ariaFlowTo: spaceSeparated,
    ariaGrabbed: booleanish,
    ariaHasPopup: null,
    ariaHidden: booleanish,
    ariaInvalid: null,
    ariaKeyShortcuts: null,
    ariaLabel: null,
    ariaLabelledBy: spaceSeparated,
    ariaLevel: number,
    ariaLive: null,
    ariaModal: booleanish,
    ariaMultiLine: booleanish,
    ariaMultiSelectable: booleanish,
    ariaOrientation: null,
    ariaOwns: spaceSeparated,
    ariaPlaceholder: null,
    ariaPosInSet: number,
    ariaPressed: booleanish,
    ariaReadOnly: booleanish,
    ariaRelevant: null,
    ariaRequired: booleanish,
    ariaRoleDescription: spaceSeparated,
    ariaRowCount: number,
    ariaRowIndex: number,
    ariaRowSpan: number,
    ariaSelected: booleanish,
    ariaSetSize: number,
    ariaSort: null,
    ariaValueMax: number,
    ariaValueMin: number,
    ariaValueNow: number,
    ariaValueText: null,
    role: null
  }
})

function ariaTransform(_, prop) {
  return prop === 'role' ? prop : 'aria-' + prop.slice(4).toLowerCase()
}

},{"./util/create":164,"./util/types":169}],160:[function(require,module,exports){
'use strict'

var types = require('./util/types')
var create = require('./util/create')
var caseInsensitiveTransform = require('./util/case-insensitive-transform')

var boolean = types.boolean
var overloadedBoolean = types.overloadedBoolean
var booleanish = types.booleanish
var number = types.number
var spaceSeparated = types.spaceSeparated
var commaSeparated = types.commaSeparated

module.exports = create({
  space: 'html',
  attributes: {
    acceptcharset: 'accept-charset',
    classname: 'class',
    htmlfor: 'for',
    httpequiv: 'http-equiv'
  },
  transform: caseInsensitiveTransform,
  mustUseProperty: ['checked', 'multiple', 'muted', 'selected'],
  properties: {
    // Standard Properties.
    abbr: null,
    accept: commaSeparated,
    acceptCharset: spaceSeparated,
    accessKey: spaceSeparated,
    action: null,
    allowFullScreen: boolean,
    allowPaymentRequest: boolean,
    allowUserMedia: boolean,
    alt: null,
    as: null,
    async: boolean,
    autoCapitalize: null,
    autoComplete: spaceSeparated,
    autoFocus: boolean,
    autoPlay: boolean,
    capture: boolean,
    charSet: null,
    checked: boolean,
    cite: null,
    className: spaceSeparated,
    cols: number,
    colSpan: null,
    content: null,
    contentEditable: booleanish,
    controls: boolean,
    controlsList: spaceSeparated,
    coords: number | commaSeparated,
    crossOrigin: null,
    data: null,
    dateTime: null,
    decoding: null,
    default: boolean,
    defer: boolean,
    dir: null,
    dirName: null,
    disabled: boolean,
    download: overloadedBoolean,
    draggable: booleanish,
    encType: null,
    form: null,
    formAction: null,
    formEncType: null,
    formMethod: null,
    formNoValidate: boolean,
    formTarget: null,
    headers: spaceSeparated,
    height: number,
    hidden: boolean,
    high: number,
    href: null,
    hrefLang: null,
    htmlFor: spaceSeparated,
    httpEquiv: spaceSeparated,
    id: null,
    inputMode: null,
    integrity: null,
    is: null,
    isMap: boolean,
    itemId: null,
    itemProp: spaceSeparated,
    itemRef: spaceSeparated,
    itemScope: boolean,
    itemType: spaceSeparated,
    kind: null,
    label: null,
    lang: null,
    language: null,
    list: null,
    loop: boolean,
    low: number,
    manifest: null,
    max: null,
    maxLength: number,
    media: null,
    method: null,
    min: null,
    minLength: number,
    multiple: boolean,
    muted: boolean,
    name: null,
    nonce: null,
    noModule: boolean,
    noValidate: boolean,
    open: boolean,
    optimum: number,
    pattern: null,
    ping: spaceSeparated,
    placeholder: null,
    playsInline: boolean,
    poster: null,
    preload: null,
    readOnly: boolean,
    referrerPolicy: null,
    rel: spaceSeparated,
    required: boolean,
    reversed: boolean,
    rows: number,
    rowSpan: number,
    sandbox: spaceSeparated,
    scope: null,
    scoped: boolean,
    seamless: boolean,
    selected: boolean,
    shape: null,
    size: number,
    sizes: null,
    slot: null,
    span: number,
    spellCheck: booleanish,
    src: null,
    srcDoc: null,
    srcLang: null,
    srcSet: commaSeparated,
    start: number,
    step: null,
    style: null,
    tabIndex: number,
    target: null,
    title: null,
    translate: null,
    type: null,
    typeMustMatch: boolean,
    useMap: null,
    value: booleanish,
    width: number,
    wrap: null,

    // Legacy.
    // See: https://html.spec.whatwg.org/#other-elements,-attributes-and-apis
    align: null, // Several. Use CSS `text-align` instead,
    aLink: null, // `<body>`. Use CSS `a:active {color}` instead
    archive: spaceSeparated, // `<object>`. List of URIs to archives
    axis: null, // `<td>` and `<th>`. Use `scope` on `<th>`
    background: null, // `<body>`. Use CSS `background-image` instead
    bgColor: null, // `<body>` and table elements. Use CSS `background-color` instead
    border: number, // `<table>`. Use CSS `border-width` instead,
    borderColor: null, // `<table>`. Use CSS `border-color` instead,
    bottomMargin: number, // `<body>`
    cellPadding: null, // `<table>`
    cellSpacing: null, // `<table>`
    char: null, // Several table elements. When `align=char`, sets the character to align on
    charOff: null, // Several table elements. When `char`, offsets the alignment
    classId: null, // `<object>`
    clear: null, // `<br>`. Use CSS `clear` instead
    code: null, // `<object>`
    codeBase: null, // `<object>`
    codeType: null, // `<object>`
    color: null, // `<font>` and `<hr>`. Use CSS instead
    compact: boolean, // Lists. Use CSS to reduce space between items instead
    declare: boolean, // `<object>`
    event: null, // `<script>`
    face: null, // `<font>`. Use CSS instead
    frame: null, // `<table>`
    frameBorder: null, // `<iframe>`. Use CSS `border` instead
    hSpace: number, // `<img>` and `<object>`
    leftMargin: number, // `<body>`
    link: null, // `<body>`. Use CSS `a:link {color: *}` instead
    longDesc: null, // `<frame>`, `<iframe>`, and `<img>`. Use an `<a>`
    lowSrc: null, // `<img>`. Use a `<picture>`
    marginHeight: number, // `<body>`
    marginWidth: number, // `<body>`
    noResize: boolean, // `<frame>`
    noHref: boolean, // `<area>`. Use no href instead of an explicit `nohref`
    noShade: boolean, // `<hr>`. Use background-color and height instead of borders
    noWrap: boolean, // `<td>` and `<th>`
    object: null, // `<applet>`
    profile: null, // `<head>`
    prompt: null, // `<isindex>`
    rev: null, // `<link>`
    rightMargin: number, // `<body>`
    rules: null, // `<table>`
    scheme: null, // `<meta>`
    scrolling: booleanish, // `<frame>`. Use overflow in the child context
    standby: null, // `<object>`
    summary: null, // `<table>`
    text: null, // `<body>`. Use CSS `color` instead
    topMargin: number, // `<body>`
    valueType: null, // `<param>`
    version: null, // `<html>`. Use a doctype.
    vAlign: null, // Several. Use CSS `vertical-align` instead
    vLink: null, // `<body>`. Use CSS `a:visited {color}` instead
    vSpace: number, // `<img>` and `<object>`

    // Non-standard Properties.
    allowTransparency: null,
    autoCorrect: null,
    autoSave: null,
    prefix: null,
    property: null,
    results: number,
    security: null,
    unselectable: null
  }
})

},{"./util/case-insensitive-transform":162,"./util/create":164,"./util/types":169}],161:[function(require,module,exports){
'use strict'

var types = require('./util/types')
var create = require('./util/create')
var caseSensitiveTransform = require('./util/case-sensitive-transform')

var boolean = types.boolean
var number = types.number
var spaceSeparated = types.spaceSeparated
var commaSeparated = types.commaSeparated
var commaOrSpaceSeparated = types.commaOrSpaceSeparated

module.exports = create({
  space: 'svg',
  attributes: {
    accentHeight: 'accent-height',
    alignmentBaseline: 'alignment-baseline',
    arabicForm: 'arabic-form',
    baselineShift: 'baseline-shift',
    capHeight: 'cap-height',
    className: 'class',
    clipPath: 'clip-path',
    clipRule: 'clip-rule',
    colorInterpolation: 'color-interpolation',
    colorInterpolationFilters: 'color-interpolation-filters',
    colorProfile: 'color-profile',
    colorRendering: 'color-rendering',
    crossOrigin: 'crossorigin',
    dataType: 'datatype',
    dominantBaseline: 'dominant-baseline',
    enableBackground: 'enable-background',
    fillOpacity: 'fill-opacity',
    fillRule: 'fill-rule',
    floodColor: 'flood-color',
    floodOpacity: 'flood-opacity',
    fontFamily: 'font-family',
    fontSize: 'font-size',
    fontSizeAdjust: 'font-size-adjust',
    fontStretch: 'font-stretch',
    fontStyle: 'font-style',
    fontVariant: 'font-variant',
    fontWeight: 'font-weight',
    glyphName: 'glyph-name',
    glyphOrientationHorizontal: 'glyph-orientation-horizontal',
    glyphOrientationVertical: 'glyph-orientation-vertical',
    hrefLang: 'hreflang',
    horizAdvX: 'horiz-adv-x',
    horizOriginX: 'horiz-origin-x',
    horizOriginY: 'horiz-origin-y',
    imageRendering: 'image-rendering',
    letterSpacing: 'letter-spacing',
    lightingColor: 'lighting-color',
    markerEnd: 'marker-end',
    markerMid: 'marker-mid',
    markerStart: 'marker-start',
    navDown: 'nav-down',
    navDownLeft: 'nav-down-left',
    navDownRight: 'nav-down-right',
    navLeft: 'nav-left',
    navNext: 'nav-next',
    navPrev: 'nav-prev',
    navRight: 'nav-right',
    navUp: 'nav-up',
    navUpLeft: 'nav-up-left',
    navUpRight: 'nav-up-right',
    overlinePosition: 'overline-position',
    overlineThickness: 'overline-thickness',
    paintOrder: 'paint-order',
    panose1: 'panose-1',
    pointerEvents: 'pointer-events',
    renderingIntent: 'rendering-intent',
    shapeRendering: 'shape-rendering',
    stopColor: 'stop-color',
    stopOpacity: 'stop-opacity',
    strikethroughPosition: 'strikethrough-position',
    strikethroughThickness: 'strikethrough-thickness',
    strokeDashArray: 'stroke-dasharray',
    strokeDashOffset: 'stroke-dashoffset',
    strokeLineCap: 'stroke-linecap',
    strokeLineJoin: 'stroke-linejoin',
    strokeMiterLimit: 'stroke-miterlimit',
    strokeOpacity: 'stroke-opacity',
    strokeWidth: 'stroke-width',
    tabIndex: 'tabindex',
    textAnchor: 'text-anchor',
    textDecoration: 'text-decoration',
    textRendering: 'text-rendering',
    typeOf: 'typeof',
    underlinePosition: 'underline-position',
    underlineThickness: 'underline-thickness',
    unicodeBidi: 'unicode-bidi',
    unicodeRange: 'unicode-range',
    unitsPerEm: 'units-per-em',
    vAlphabetic: 'v-alphabetic',
    vHanging: 'v-hanging',
    vIdeographic: 'v-ideographic',
    vMathematical: 'v-mathematical',
    vectorEffect: 'vector-effect',
    vertAdvY: 'vert-adv-y',
    vertOriginX: 'vert-origin-x',
    vertOriginY: 'vert-origin-y',
    wordSpacing: 'word-spacing',
    writingMode: 'writing-mode',
    xHeight: 'x-height',
    // These were camelcased in Tiny. Now lowercased in SVG 2
    playbackOrder: 'playbackorder',
    timelineBegin: 'timelinebegin'
  },
  transform: caseSensitiveTransform,
  properties: {
    about: commaOrSpaceSeparated,
    accentHeight: number,
    accumulate: null,
    additive: null,
    alignmentBaseline: null,
    alphabetic: number,
    amplitude: number,
    arabicForm: null,
    ascent: number,
    attributeName: null,
    attributeType: null,
    azimuth: number,
    bandwidth: null,
    baselineShift: null,
    baseFrequency: null,
    baseProfile: null,
    bbox: null,
    begin: null,
    bias: number,
    by: null,
    calcMode: null,
    capHeight: number,
    className: spaceSeparated,
    clip: null,
    clipPath: null,
    clipPathUnits: null,
    clipRule: null,
    color: null,
    colorInterpolation: null,
    colorInterpolationFilters: null,
    colorProfile: null,
    colorRendering: null,
    content: null,
    contentScriptType: null,
    contentStyleType: null,
    crossOrigin: null,
    cursor: null,
    cx: null,
    cy: null,
    d: null,
    dataType: null,
    defaultAction: null,
    descent: number,
    diffuseConstant: number,
    direction: null,
    display: null,
    dur: null,
    divisor: number,
    dominantBaseline: null,
    download: boolean,
    dx: null,
    dy: null,
    edgeMode: null,
    editable: null,
    elevation: number,
    enableBackground: null,
    end: null,
    event: null,
    exponent: number,
    externalResourcesRequired: null,
    fill: null,
    fillOpacity: number,
    fillRule: null,
    filter: null,
    filterRes: null,
    filterUnits: null,
    floodColor: null,
    floodOpacity: null,
    focusable: null,
    focusHighlight: null,
    fontFamily: null,
    fontSize: null,
    fontSizeAdjust: null,
    fontStretch: null,
    fontStyle: null,
    fontVariant: null,
    fontWeight: null,
    format: null,
    fr: null,
    from: null,
    fx: null,
    fy: null,
    g1: commaSeparated,
    g2: commaSeparated,
    glyphName: commaSeparated,
    glyphOrientationHorizontal: null,
    glyphOrientationVertical: null,
    glyphRef: null,
    gradientTransform: null,
    gradientUnits: null,
    handler: null,
    hanging: number,
    hatchContentUnits: null,
    hatchUnits: null,
    height: null,
    href: null,
    hrefLang: null,
    horizAdvX: number,
    horizOriginX: number,
    horizOriginY: number,
    id: null,
    ideographic: number,
    imageRendering: null,
    initialVisibility: null,
    in: null,
    in2: null,
    intercept: number,
    k: number,
    k1: number,
    k2: number,
    k3: number,
    k4: number,
    kernelMatrix: commaOrSpaceSeparated,
    kernelUnitLength: null,
    keyPoints: null, // SEMI_COLON_SEPARATED
    keySplines: null, // SEMI_COLON_SEPARATED
    keyTimes: null, // SEMI_COLON_SEPARATED
    kerning: null,
    lang: null,
    lengthAdjust: null,
    letterSpacing: null,
    lightingColor: null,
    limitingConeAngle: number,
    local: null,
    markerEnd: null,
    markerMid: null,
    markerStart: null,
    markerHeight: null,
    markerUnits: null,
    markerWidth: null,
    mask: null,
    maskContentUnits: null,
    maskUnits: null,
    mathematical: null,
    max: null,
    media: null,
    mediaCharacterEncoding: null,
    mediaContentEncodings: null,
    mediaSize: number,
    mediaTime: null,
    method: null,
    min: null,
    mode: null,
    name: null,
    navDown: null,
    navDownLeft: null,
    navDownRight: null,
    navLeft: null,
    navNext: null,
    navPrev: null,
    navRight: null,
    navUp: null,
    navUpLeft: null,
    navUpRight: null,
    numOctaves: null,
    observer: null,
    offset: null,
    opacity: null,
    operator: null,
    order: null,
    orient: null,
    orientation: null,
    origin: null,
    overflow: null,
    overlay: null,
    overlinePosition: number,
    overlineThickness: number,
    paintOrder: null,
    panose1: null,
    path: null,
    pathLength: number,
    patternContentUnits: null,
    patternTransform: null,
    patternUnits: null,
    phase: null,
    pitch: null,
    playbackOrder: null,
    pointerEvents: null,
    points: null,
    pointsAtX: number,
    pointsAtY: number,
    pointsAtZ: number,
    preserveAlpha: null,
    preserveAspectRatio: null,
    primitiveUnits: null,
    propagate: null,
    property: commaOrSpaceSeparated,
    r: null,
    radius: null,
    refX: null,
    refY: null,
    rel: commaOrSpaceSeparated,
    rev: commaOrSpaceSeparated,
    renderingIntent: null,
    repeatCount: null,
    repeatDur: null,
    requiredExtensions: commaOrSpaceSeparated,
    requiredFeatures: commaOrSpaceSeparated,
    requiredFonts: commaOrSpaceSeparated,
    requiredFormats: commaOrSpaceSeparated,
    resource: null,
    restart: null,
    result: null,
    rotate: null,
    rx: null,
    ry: null,
    scale: null,
    seed: null,
    shapeRendering: null,
    side: null,
    slope: null,
    snapshotTime: null,
    specularConstant: number,
    specularExponent: number,
    spreadMethod: null,
    spacing: null,
    startOffset: null,
    stdDeviation: null,
    stemh: null,
    stemv: null,
    stitchTiles: null,
    stopColor: null,
    stopOpacity: null,
    strikethroughPosition: number,
    strikethroughThickness: number,
    string: null,
    stroke: null,
    strokeDashArray: commaOrSpaceSeparated,
    strokeDashOffset: null,
    strokeLineCap: null,
    strokeLineJoin: null,
    strokeMiterLimit: number,
    strokeOpacity: number,
    strokeWidth: null,
    style: null,
    surfaceScale: number,
    syncBehavior: null,
    syncBehaviorDefault: null,
    syncMaster: null,
    syncTolerance: null,
    syncToleranceDefault: null,
    systemLanguage: commaOrSpaceSeparated,
    tabIndex: number,
    tableValues: null,
    target: null,
    targetX: number,
    targetY: number,
    textAnchor: null,
    textDecoration: null,
    textRendering: null,
    textLength: null,
    timelineBegin: null,
    title: null,
    transformBehavior: null,
    type: null,
    typeOf: commaOrSpaceSeparated,
    to: null,
    transform: null,
    u1: null,
    u2: null,
    underlinePosition: number,
    underlineThickness: number,
    unicode: null,
    unicodeBidi: null,
    unicodeRange: null,
    unitsPerEm: number,
    values: null,
    vAlphabetic: number,
    vMathematical: number,
    vectorEffect: null,
    vHanging: number,
    vIdeographic: number,
    version: null,
    vertAdvY: number,
    vertOriginX: number,
    vertOriginY: number,
    viewBox: null,
    viewTarget: null,
    visibility: null,
    width: null,
    widths: null,
    wordSpacing: null,
    writingMode: null,
    x: null,
    x1: null,
    x2: null,
    xChannelSelector: null,
    xHeight: number,
    y: null,
    y1: null,
    y2: null,
    yChannelSelector: null,
    z: null,
    zoomAndPan: null
  }
})

},{"./util/case-sensitive-transform":163,"./util/create":164,"./util/types":169}],162:[function(require,module,exports){
'use strict'

var caseSensitiveTransform = require('./case-sensitive-transform')

module.exports = caseInsensitiveTransform

function caseInsensitiveTransform(attributes, property) {
  return caseSensitiveTransform(attributes, property.toLowerCase())
}

},{"./case-sensitive-transform":163}],163:[function(require,module,exports){
'use strict'

module.exports = caseSensitiveTransform

function caseSensitiveTransform(attributes, attribute) {
  return attribute in attributes ? attributes[attribute] : attribute
}

},{}],164:[function(require,module,exports){
'use strict'

var normalize = require('../../normalize')
var Schema = require('./schema')
var DefinedInfo = require('./defined-info')

module.exports = create

function create(definition) {
  var space = definition.space
  var mustUseProperty = definition.mustUseProperty || []
  var attributes = definition.attributes || {}
  var props = definition.properties
  var transform = definition.transform
  var property = {}
  var normal = {}
  var prop
  var info

  for (prop in props) {
    info = new DefinedInfo(
      prop,
      transform(attributes, prop),
      props[prop],
      space
    )

    if (mustUseProperty.indexOf(prop) !== -1) {
      info.mustUseProperty = true
    }

    property[prop] = info

    normal[normalize(prop)] = prop
    normal[normalize(info.attribute)] = prop
  }

  return new Schema(property, normal, space)
}

},{"../../normalize":173,"./defined-info":165,"./schema":168}],165:[function(require,module,exports){
'use strict'

var Info = require('./info')
var types = require('./types')

module.exports = DefinedInfo

DefinedInfo.prototype = new Info()
DefinedInfo.prototype.defined = true

function DefinedInfo(property, attribute, mask, space) {
  mark(this, 'space', space)
  Info.call(this, property, attribute)
  mark(this, 'boolean', check(mask, types.boolean))
  mark(this, 'booleanish', check(mask, types.booleanish))
  mark(this, 'overloadedBoolean', check(mask, types.overloadedBoolean))
  mark(this, 'number', check(mask, types.number))
  mark(this, 'commaSeparated', check(mask, types.commaSeparated))
  mark(this, 'spaceSeparated', check(mask, types.spaceSeparated))
  mark(this, 'commaOrSpaceSeparated', check(mask, types.commaOrSpaceSeparated))
}

function mark(values, key, value) {
  if (value) {
    values[key] = value
  }
}

function check(value, mask) {
  return (value & mask) === mask
}

},{"./info":166,"./types":169}],166:[function(require,module,exports){
'use strict'

module.exports = Info

var proto = Info.prototype

proto.space = null
proto.attribute = null
proto.property = null
proto.boolean = false
proto.booleanish = false
proto.overloadedBoolean = false
proto.number = false
proto.commaSeparated = false
proto.spaceSeparated = false
proto.commaOrSpaceSeparated = false
proto.mustUseProperty = false
proto.defined = false

function Info(property, attribute) {
  this.property = property
  this.attribute = attribute
}

},{}],167:[function(require,module,exports){
'use strict'

var xtend = require('xtend')
var Schema = require('./schema')

module.exports = merge

function merge(definitions) {
  var length = definitions.length
  var property = []
  var normal = []
  var index = -1
  var info
  var space

  while (++index < length) {
    info = definitions[index]
    property.push(info.property)
    normal.push(info.normal)
    space = info.space
  }

  return new Schema(
    xtend.apply(null, property),
    xtend.apply(null, normal),
    space
  )
}

},{"./schema":168,"xtend":301}],168:[function(require,module,exports){
'use strict'

module.exports = Schema

var proto = Schema.prototype

proto.space = null
proto.normal = {}
proto.property = {}

function Schema(property, normal, space) {
  this.property = property
  this.normal = normal

  if (space) {
    this.space = space
  }
}

},{}],169:[function(require,module,exports){
'use strict'

var powers = 0

exports.boolean = increment()
exports.booleanish = increment()
exports.overloadedBoolean = increment()
exports.number = increment()
exports.spaceSeparated = increment()
exports.commaSeparated = increment()
exports.commaOrSpaceSeparated = increment()

function increment() {
  return Math.pow(2, ++powers)
}

},{}],170:[function(require,module,exports){
'use strict'

var create = require('./util/create')

module.exports = create({
  space: 'xlink',
  transform: xlinkTransform,
  properties: {
    xLinkActuate: null,
    xLinkArcRole: null,
    xLinkHref: null,
    xLinkRole: null,
    xLinkShow: null,
    xLinkTitle: null,
    xLinkType: null
  }
})

function xlinkTransform(_, prop) {
  return 'xlink:' + prop.slice(5).toLowerCase()
}

},{"./util/create":164}],171:[function(require,module,exports){
'use strict'

var create = require('./util/create')

module.exports = create({
  space: 'xml',
  transform: xmlTransform,
  properties: {
    xmlLang: null,
    xmlBase: null,
    xmlSpace: null
  }
})

function xmlTransform(_, prop) {
  return 'xml:' + prop.slice(3).toLowerCase()
}

},{"./util/create":164}],172:[function(require,module,exports){
'use strict'

var create = require('./util/create')
var caseInsensitiveTransform = require('./util/case-insensitive-transform')

module.exports = create({
  space: 'xmlns',
  attributes: {
    xmlnsxlink: 'xmlns:xlink'
  },
  transform: caseInsensitiveTransform,
  properties: {
    xmlns: null,
    xmlnsXLink: null
  }
})

},{"./util/case-insensitive-transform":162,"./util/create":164}],173:[function(require,module,exports){
'use strict'

module.exports = normalize

function normalize(value) {
  return value.toLowerCase()
}

},{}],174:[function(require,module,exports){
'use strict'

var merge = require('./lib/util/merge')
var xlink = require('./lib/xlink')
var xml = require('./lib/xml')
var xmlns = require('./lib/xmlns')
var aria = require('./lib/aria')
var svg = require('./lib/svg')

module.exports = merge([xml, xlink, xmlns, aria, svg])

},{"./lib/aria":159,"./lib/svg":161,"./lib/util/merge":167,"./lib/xlink":170,"./lib/xml":171,"./lib/xmlns":172}],175:[function(require,module,exports){
/**
 * @fileoverview
 *   Collapse whitespace.
 *
 *   Normally, collapses to a single space.  If `newlines: true`,
 *   collapses white-space containing newlines to `'\n'` instead
 *   of `' '`.
 * @example
 *   <h1>Heading</h1>
 *   <p><strong>This</strong> and <em>that</em></p>
 */

'use strict';

var collapseWhiteSpace = require('collapse-white-space');
var whitespaceSensitive = require('html-whitespace-sensitive-tag-names');
var is = require('unist-util-is');
var modify = require('unist-util-modify-children');
var element = require('hast-util-is-element');
var has = require('hast-util-has-property');
var embedded = require('hast-util-embedded');
var bodyOK = require('hast-util-is-body-ok-link');
var list = require('./list');

module.exports = collapse;

function collapse(options) {
  return transform;
  function transform(tree) {
    return minify(tree, options || {});
  }
}

function minify(tree, options) {
  var whitespace = options.newlines ? collapseToNewLines : collapseWhiteSpace;
  var modifier = modify(visitor);
  var inside = false;
  var seen = false;

  visitor(tree);

  return tree;

  function visitor(node, index, parent) {
    var head;
    var prev;
    var next;
    var value;
    var start;
    var end;

    if (is('text', node)) {
      prev = parent.children[index - 1];
      next = parent.children[index + 1];

      value = whitespace(node.value);
      end = value.length;
      start = 0;

      if (empty(value.charAt(0)) && viable(prev)) {
        start++;
      }

      if (empty(value.charAt(end - 1)) && viable(next)) {
        end--;
      }

      value = value.slice(start, end);

      /* Remove the node if it’s collapsed entirely. */
      if (!value) {
        parent.children.splice(index, 1);

        return index;
      }

      node.value = value;
    }

    if (!seen && !inside) {
      head = element(node, 'head');
      inside = head;
      seen = head;
    }

    if (node.children && !element(node, whitespaceSensitive)) {
      modifier(node);
    }

    if (head) {
      inside = false;
    }
  }

  function viable(node) {
    return !node || inside || !collapsable(node);
  }
}

/* Check if `node` is collapsable. */
function collapsable(node) {
  return is('text', node) ||
    element(node, list) ||
    embedded(node) ||
    bodyOK(node) ||
    (element(node, 'meta') && has(node, 'itemProp'));
}

/* Collapse to spaces, or newlines if they’re in a run. */
function collapseToNewLines(value) {
  var result = String(value).replace(/\s+/g, function ($0) {
    return $0.indexOf('\n') === -1 ? ' ' : '\n';
  });

  return result;
}

function empty(character) {
  return character === ' ' || character === '\n';
}

},{"./list":176,"collapse-white-space":11,"hast-util-embedded":15,"hast-util-has-property":17,"hast-util-is-body-ok-link":18,"hast-util-is-element":19,"html-whitespace-sensitive-tag-names":83,"unist-util-is":288,"unist-util-modify-children":289}],176:[function(require,module,exports){
module.exports=[
  "a",
  "abbr",
  "acronym",
  "b",
  "basefont",
  "big",
  "bdi",
  "bdo",
  "blink",
  "button",
  "cite",
  "code",
  "data",
  "del",
  "dfn",
  "em",
  "font",
  "i",
  "input",
  "ins",
  "kbd",
  "keygen",
  "label",
  "mark",
  "marquee",
  "meter",
  "nobr",
  "output",
  "progress",
  "q",
  "ruby",
  "s",
  "samp",
  "select",
  "small",
  "spacer",
  "span",
  "strong",
  "sub",
  "sup",
  "textarea",
  "time",
  "tt",
  "u",
  "var"
]

},{}],177:[function(require,module,exports){
module.exports={
  "abandonedHeadElementChild": {
    "reason": "Unexpected metadata element after head",
    "description": "Unexpected element after head. Expected the element before `</head>`",
    "url": false
  },
  "abruptClosingOfEmptyComment": {
    "reason": "Unexpected abruptly closed empty comment",
    "description": "Unexpected `>` or `->`. Expected `-->` to close comments"
  },
  "abruptDoctypePublicIdentifier": {
    "reason": "Unexpected abruptly closed public identifier",
    "description": "Unexpected `>`. Expected a closing `\"` or `'` after the public identifier"
  },
  "abruptDoctypeSystemIdentifier": {
    "reason": "Unexpected abruptly closed system identifier",
    "description": "Unexpected `>`. Expected a closing `\"` or `'` after the identifier identifier"
  },
  "absenceOfDigitsInNumericCharacterReference": {
    "reason": "Unexpected non-digit at start of numeric character reference",
    "description": "Unexpected `%c`. Expected `[0-9]` for decimal references or `[0-9a-fA-F]` for hexadecimal references"
  },
  "cdataInHtmlContent": {
    "reason": "Unexpected CDATA section in HTML",
    "description": "Unexpected `<![CDATA[` in HTML. Remove it, use a comment, or encode special characters instead"
  },
  "characterReferenceOutsideUnicodeRange": {
    "reason": "Unexpected too big numeric character reference",
    "description": "Unexpectedly high character reference. Expected character references to be at most hexadecimal 10ffff (or decimal 1114111)"
  },
  "closingOfElementWithOpenChildElements": {
    "reason": "Unexpected closing tag with open child elements",
    "description": "Unexpectedly closing tag. Expected other tags to be closed first",
    "url": false
  },
  "controlCharacterInInputStream": {
    "reason": "Unexpected control character",
    "description": "Unexpected control character `%x`. Expected a non-control code point, 0x00, or ASCII whitespace"
  },
  "controlCharacterReference": {
    "reason": "Unexpected control character reference",
    "description": "Unexpectedly control character in reference. Expected a non-control code point, 0x00, or ASCII whitespace"
  },
  "disallowedContentInNoscriptInHead": {
    "reason": "Disallowed content inside `<noscript>` in `<head>`",
    "description": "Unexpected text character `%c`. Only use text in `<noscript>`s in `<body>`",
    "url": false
  },
  "duplicateAttribute": {
    "reason": "Unexpected duplicate attribute",
    "description": "Unexpectedly double attribute. Expected attributes to occur only once"
  },
  "endTagWithAttributes": {
    "reason": "Unexpected attribute on closing tag",
    "description": "Unexpected attribute. Expected `>` instead"
  },
  "endTagWithTrailingSolidus": {
    "reason": "Unexpected slash at end of closing tag",
    "description": "Unexpected `%c-1`. Expected `>` instead"
  },
  "endTagWithoutMatchingOpenElement": {
    "reason": "Unexpected unopened end tag",
    "description": "Unexpected end tag. Expected no end tag or another end tag",
    "url": false
  },
  "eofBeforeTagName": {
    "reason": "Unexpected end of file",
    "description": "Unexpected end of file. Expected tag name instead"
  },
  "eofInCdata": {
    "reason": "Unexpected end of file in CDATA",
    "description": "Unexpected end of file. Expected `]]>` to close the CDATA"
  },
  "eofInComment": {
    "reason": "Unexpected end of file in comment",
    "description": "Unexpected end of file. Expected `-->` to close the comment"
  },
  "eofInDoctype": {
    "reason": "Unexpected end of file in doctype",
    "description": "Unexpected end of file. Expected a valid doctype (such as `<!doctype html>`)"
  },
  "eofInElementThatCanContainOnlyText": {
    "reason": "Unexpected end of file in element that can only contain text",
    "description": "Unexpected end of file. Expected text or a closing tag",
    "url": false
  },
  "eofInScriptHtmlCommentLikeText": {
    "reason": "Unexpected end of file in comment inside script",
    "description": "Unexpected end of file. Expected `-->` to close the comment"
  },
  "eofInTag": {
    "reason": "Unexpected end of file in tag",
    "description": "Unexpected end of file. Expected `>` to close the tag"
  },
  "incorrectlyClosedComment": {
    "reason": "Incorrectly closed comment",
    "description": "Unexpected `%c-1`. Expected `-->` to close the comment"
  },
  "incorrectlyOpenedComment": {
    "reason": "Incorrectly opened comment",
    "description": "Unexpected `%c`. Expected `<!--` to open the comment"
  },
  "invalidCharacterSequenceAfterDoctypeName": {
    "reason": "Invalid sequence after doctype name",
    "description": "Unexpected sequence at `%c`. Expected `public` or `system`"
  },
  "invalidFirstCharacterOfTagName": {
    "reason": "Invalid first character in tag name",
    "description": "Unexpected `%c`. Expected an ASCII letter instead"
  },
  "misplacedDoctype": {
    "reason": "Misplaced doctype",
    "description": "Unexpected doctype. Expected doctype before head",
    "url": false
  },
  "misplacedStartTagForHeadElement": {
    "reason": "Misplaced `<head>` start tag",
    "description": "Unexpected start tag `<head>`. Expected `<head>` directly after doctype",
    "url": false
  },
  "missingAttributeValue": {
    "reason": "Missing attribute value",
    "description": "Unexpected `%c-1`. Expected an attribute value or no `%c-1` instead"
  },
  "missingDoctype": {
    "reason": "Missing doctype before other content",
    "description": "Expected a `<!doctype html>` before anything else",
    "url": false
  },
  "missingDoctypeName": {
    "reason": "Missing doctype name",
    "description": "Unexpected doctype end at `%c`. Expected `html` instead"
  },
  "missingDoctypePublicIdentifier": {
    "reason": "Missing public identifier in doctype",
    "description": "Unexpected `%c`. Expected identifier for `public` instead"
  },
  "missingDoctypeSystemIdentifier": {
    "reason": "Missing system identifier in doctype",
    "description": "Unexpected `%c`. Expected identifier for `system` instead (suggested: `\"about:legacy-compat\"`)"
  },
  "missingEndTagName": {
    "reason": "Missing name in end tag",
    "description": "Unexpected `%c`. Expected an ASCII letter instead"
  },
  "missingQuoteBeforeDoctypePublicIdentifier": {
    "reason": "Missing quote before public identifier in doctype",
    "description": "Unexpected `%c`. Expected `\"` or `'` instead"
  },
  "missingQuoteBeforeDoctypeSystemIdentifier": {
    "reason": "Missing quote before system identifier in doctype",
    "description": "Unexpected `%c`. Expected `\"` or `'` instead"
  },
  "missingSemicolonAfterCharacterReference": {
    "reason": "Missing semicolon after character reference",
    "description": "Unexpected `%c`. Expected `;` instead"
  },
  "missingWhitespaceAfterDoctypePublicKeyword": {
    "reason": "Missing whitespace after public identifier in doctype",
    "description": "Unexpected `%c`. Expected ASCII whitespace instead"
  },
  "missingWhitespaceAfterDoctypeSystemKeyword": {
    "reason": "Missing whitespace after system identifier in doctype",
    "description": "Unexpected `%c`. Expected ASCII whitespace instead"
  },
  "missingWhitespaceBeforeDoctypeName": {
    "reason": "Missing whitespace before doctype name",
    "description": "Unexpected `%c`. Expected ASCII whitespace instead"
  },
  "missingWhitespaceBetweenAttributes": {
    "reason": "Missing whitespace between attributes",
    "description": "Unexpected `%c`. Expected ASCII whitespace instead"
  },
  "missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers": {
    "reason": "Missing whitespace between public and system identifiers in doctype",
    "description": "Unexpected `%c`. Expected ASCII whitespace instead"
  },
  "nestedComment": {
    "reason": "Unexpected nested comment",
    "description": "Unexpected `<!--`. Expected `-->`"
  },
  "nestedNoscriptInHead": {
    "reason": "Unexpected nested `<noscript>` in `<head>`",
    "description": "Unexpected `<noscript>`. Expected a closing tag or a meta element",
    "url": false
  },
  "nonConformingDoctype": {
    "reason": "Unexpected non-conforming doctype declaration",
    "description": "Expected `<!doctype html>` or `<!doctype html system \"about:legacy-compat\">`",
    "url": false
  },
  "nonVoidHtmlElementStartTagWithTrailingSolidus": {
    "reason": "Unexpected trailing slash on start tag of non-void element",
    "description": "Unexpected `/`. Expected `>` instead"
  },
  "noncharacterCharacterReference": {
    "reason": "Unexpected noncharacter code point referenced by character reference",
    "description": "Unexpected code point. Do not use noncharacters in HTML"
  },
  "noncharacterInInputStream": {
    "reason": "Unexpected noncharacter character",
    "description": "Unexpected code point `%x`. Do not use noncharacters in HTML"
  },
  "nullCharacterReference": {
    "reason": "Unexpected NULL character referenced by character reference",
    "description": "Unexpected code point. Do not use NULL characters in HTML"
  },
  "openElementsLeftAfterEof": {
    "reason": "Unexpected end of file",
    "description": "Unexpected end of file. Expected closing tag instead",
    "url": false
  },
  "surrogateCharacterReference": {
    "reason": "Unexpected surrogate character referenced by character reference",
    "description": "Unexpected code point. Do not use lone surrogate characters in HTML"
  },
  "surrogateInInputStream": {
    "reason": "Unexpected surrogate character",
    "description": "Unexpected code point `%x`. Do not use lone surrogate characters in HTML"
  },
  "unexpectedCharacterAfterDoctypeSystemIdentifier": {
    "reason": "Invalid character after system identifier in doctype",
    "description": "Unexpected character at `%c`. Expected `>`"
  },
  "unexpectedCharacterInAttributeName": {
    "reason": "Unexpected character in attribute name",
    "description": "Unexpected `%c`. Expected whitespace, `/`, `>`, `=`, or probably an ASCII letter"
  },
  "unexpectedCharacterInUnquotedAttributeValue": {
    "reason": "Unexpected character in unquoted attribute value",
    "description": "Unexpected `%c`. Quote the attribute value to include it"
  },
  "unexpectedEqualsSignBeforeAttributeName": {
    "reason": "Unexpected equals sign before attribute name ",
    "description": "Unexpected `%c`. Add an attribute name before it"
  },
  "unexpectedNullCharacter": {
    "reason": "Unexpected NULL character",
    "description": "Unexpected code point `%x`. Do not use NULL characters in HTML"
  },
  "unexpectedQuestionMarkInsteadOfTagName": {
    "reason": "Unexpected question mark instead of tag name",
    "description": "Unexpected `%c`. Expected an ASCII letter instead"
  },
  "unexpectedSolidusInTag": {
    "reason": "Unexpected slash in tag",
    "description": "Unexpected `%c-1`. Expected it followed by `>` or in a quoted attribute value"
  },
  "unknownNamedCharacterReference": {
    "reason": "Unexpected unknown named character reference",
    "description": "Unexpected character reference. Expected known named character references"
  }
}

},{}],178:[function(require,module,exports){
'use strict'

var fromParse5 = require('hast-util-from-parse5')
var Parser5 = require('parse5/lib/parser')
var xtend = require('xtend')
var errors = require('./errors.json')

var base = 'https://html.spec.whatwg.org/multipage/parsing.html#parse-error-'

var fatalities = {2: true, 1: false, 0: null}

module.exports = parse

function parse(options) {
  var settings = xtend(options, this.data('settings'))
  var position = settings.position

  position = typeof position === 'boolean' ? position : true

  this.Parser = parser

  function parser(doc, file) {
    var fn = settings.fragment ? 'parseFragment' : 'parse'
    var onParseError = settings.emitParseErrors ? onerror : null
    var parse5 = new Parser5({
      sourceCodeLocationInfo: position,
      onParseError: onParseError,
      scriptingEnabled: false
    })

    return fromParse5(parse5[fn](doc), {
      space: settings.space,
      file: file,
      verbose: settings.verbose
    })

    function onerror(err) {
      var code = err.code
      var name = camelcase(code)
      var setting = settings[name]
      var config = setting === undefined || setting === null ? true : setting
      var level = typeof config === 'number' ? config : config ? 1 : 0
      var start = {
        line: err.startLine,
        column: err.startCol,
        offset: err.startOffset
      }
      var end = {line: err.endLine, column: err.endCol, offset: err.endOffset}
      var info
      var message

      if (level) {
        info = errors[name] || /* istanbul ignore next */ {
          reason: '',
          description: ''
        }

        message = file.message(format(info.reason), {start: start, end: end})
        message.source = 'parse-error'
        message.ruleId = code
        message.fatal = fatalities[level]
        message.note = format(info.description)
        message.url = info.url === false ? null : base + code
      }

      function format(value) {
        return value.replace(/%c(?:-(\d+))?/g, char).replace(/%x/g, encodedChar)
      }

      function char($0, $1) {
        var offset = $1 ? -parseInt($1, 10) : 0
        var char = doc.charAt(err.startOffset + offset)
        return char === '`' ? '` ` `' : char
      }

      function encodedChar() {
        var char = doc
          .charCodeAt(err.startOffset)
          .toString(16)
          .toUpperCase()

        return '0x' + char
      }
    }
  }
}

function camelcase(value) {
  return value.replace(/-[a-z]/g, replacer)
}

function replacer($0) {
  return $0.charAt(1).toUpperCase()
}

},{"./errors.json":177,"hast-util-from-parse5":16,"parse5/lib/parser":149,"xtend":301}],179:[function(require,module,exports){
'use strict'

var hast2mdast = require('hast-util-to-mdast')

module.exports = attacher

// Attacher.
// If a destination is given, runs the destination with the new mdast tree
// (bridge-mode).
// Without destination, returns the mdast tree: further
// plug-ins run on that tree (mutate-mode). */
function attacher(destination, options) {
  var settings

  if (destination && !destination.process) {
    settings = destination
    destination = null
  }

  settings = settings || options || {}

  if (settings.document === undefined || settings.document === null) {
    settings.document = true
  }

  return destination ? bridge(destination, settings) : mutate(settings)
}

// Bridge-mode.  Runs the destination with the new mdast tree.
function bridge(destination, options) {
  return transformer
  function transformer(node, file, next) {
    destination.run(hast2mdast(node, options), file, done)
    function done(err) {
      next(err)
    }
  }
}

// Mutate-mode.  Further transformers run on the mdast tree.
function mutate(options) {
  return transformer
  function transformer(node) {
    return hast2mdast(node, options)
  }
}

},{"hast-util-to-mdast":42}],180:[function(require,module,exports){
'use strict'

var xtend = require('xtend')
var toHAST = require('mdast-util-to-hast')
var toHTML = require('hast-util-to-html')
var sanitize = require('hast-util-sanitize')

module.exports = plugin

function plugin(options) {
  var settings = options || {}
  var clean = settings.sanitize
  var schema = clean && typeof clean === 'object' ? clean : null
  var handlers = settings.handlers || {}

  this.Compiler = compiler

  function compiler(node, file) {
    var root = node && node.type && node.type === 'root'
    var hast = toHAST(node, {allowDangerousHTML: !clean, handlers: handlers})
    var result

    if (file.extname) {
      file.extname = '.html'
    }

    if (clean) {
      hast = sanitize(hast, schema)
    }

    result = toHTML(hast, xtend(settings, {allowDangerousHTML: !clean}))

    /* Add a final newline. */
    if (root && result.charAt(result.length - 1) !== '\n') {
      result += '\n'
    }

    return result
  }
}

},{"hast-util-sanitize":21,"hast-util-to-html":24,"mdast-util-to-hast":100,"xtend":301}],181:[function(require,module,exports){
'use strict'

var unherit = require('unherit')
var xtend = require('xtend')
var Parser = require('./lib/parser.js')

module.exports = parse
parse.Parser = Parser

function parse(options) {
  var settings = this.data('settings')
  var Local = unherit(Parser)

  Local.prototype.options = xtend(Local.prototype.options, settings, options)

  this.Parser = Local
}

},{"./lib/parser.js":195,"unherit":284,"xtend":301}],182:[function(require,module,exports){
'use strict'

module.exports = [
  'address',
  'article',
  'aside',
  'base',
  'basefont',
  'blockquote',
  'body',
  'caption',
  'center',
  'col',
  'colgroup',
  'dd',
  'details',
  'dialog',
  'dir',
  'div',
  'dl',
  'dt',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'frame',
  'frameset',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'head',
  'header',
  'hgroup',
  'hr',
  'html',
  'iframe',
  'legend',
  'li',
  'link',
  'main',
  'menu',
  'menuitem',
  'meta',
  'nav',
  'noframes',
  'ol',
  'optgroup',
  'option',
  'p',
  'param',
  'pre',
  'section',
  'source',
  'title',
  'summary',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'title',
  'tr',
  'track',
  'ul'
]

},{}],183:[function(require,module,exports){
'use strict'

var xtend = require('xtend')
var entities = require('parse-entities')

module.exports = factory

// Factory to create an entity decoder.
function factory(ctx) {
  decoder.raw = decodeRaw

  return decoder

  // Normalize `position` to add an `indent`.
  function normalize(position) {
    var offsets = ctx.offset
    var line = position.line
    var result = []

    while (++line) {
      if (!(line in offsets)) {
        break
      }

      result.push((offsets[line] || 0) + 1)
    }

    return {start: position, indent: result}
  }

  // Decode `value` (at `position`) into text-nodes.
  function decoder(value, position, handler) {
    entities(value, {
      position: normalize(position),
      warning: handleWarning,
      text: handler,
      reference: handler,
      textContext: ctx,
      referenceContext: ctx
    })
  }

  // Decode `value` (at `position`) into a string.
  function decodeRaw(value, position, options) {
    return entities(
      value,
      xtend(options, {position: normalize(position), warning: handleWarning})
    )
  }

  // Handle a warning.
  // See <https://github.com/wooorm/parse-entities> for the warnings.
  function handleWarning(reason, position, code) {
    if (code !== 3) {
      ctx.file.message(reason, position)
    }
  }
}

},{"parse-entities":134,"xtend":301}],184:[function(require,module,exports){
'use strict'

module.exports = {
  position: true,
  gfm: true,
  commonmark: false,
  footnotes: false,
  pedantic: false,
  blocks: require('./block-elements')
}

},{"./block-elements":182}],185:[function(require,module,exports){
'use strict'

module.exports = locate

function locate(value, fromIndex) {
  var index = value.indexOf('\n', fromIndex)

  while (index > fromIndex) {
    if (value.charAt(index - 1) !== ' ') {
      break
    }

    index--
  }

  return index
}

},{}],186:[function(require,module,exports){
'use strict'

module.exports = locate

function locate(value, fromIndex) {
  return value.indexOf('`', fromIndex)
}

},{}],187:[function(require,module,exports){
'use strict'

module.exports = locate

function locate(value, fromIndex) {
  return value.indexOf('~~', fromIndex)
}

},{}],188:[function(require,module,exports){
'use strict'

module.exports = locate

function locate(value, fromIndex) {
  var asterisk = value.indexOf('*', fromIndex)
  var underscore = value.indexOf('_', fromIndex)

  if (underscore === -1) {
    return asterisk
  }

  if (asterisk === -1) {
    return underscore
  }

  return underscore < asterisk ? underscore : asterisk
}

},{}],189:[function(require,module,exports){
'use strict'

module.exports = locate

function locate(value, fromIndex) {
  return value.indexOf('\\', fromIndex)
}

},{}],190:[function(require,module,exports){
'use strict'

module.exports = locate

function locate(value, fromIndex) {
  var link = value.indexOf('[', fromIndex)
  var image = value.indexOf('![', fromIndex)

  if (image === -1) {
    return link
  }

  // Link can never be `-1` if an image is found, so we don’t need to check
  // for that :)
  return link < image ? link : image
}

},{}],191:[function(require,module,exports){
'use strict'

module.exports = locate

function locate(value, fromIndex) {
  var asterisk = value.indexOf('**', fromIndex)
  var underscore = value.indexOf('__', fromIndex)

  if (underscore === -1) {
    return asterisk
  }

  if (asterisk === -1) {
    return underscore
  }

  return underscore < asterisk ? underscore : asterisk
}

},{}],192:[function(require,module,exports){
'use strict'

module.exports = locate

function locate(value, fromIndex) {
  return value.indexOf('<', fromIndex)
}

},{}],193:[function(require,module,exports){
'use strict'

module.exports = locate

var protocols = ['https://', 'http://', 'mailto:']

function locate(value, fromIndex) {
  var length = protocols.length
  var index = -1
  var min = -1
  var position

  if (!this.options.gfm) {
    return -1
  }

  while (++index < length) {
    position = value.indexOf(protocols[index], fromIndex)

    if (position !== -1 && (position < min || min === -1)) {
      min = position
    }
  }

  return min
}

},{}],194:[function(require,module,exports){
'use strict'

var xtend = require('xtend')
var removePosition = require('unist-util-remove-position')

module.exports = parse

var lineFeed = '\n'
var lineBreaksExpression = /\r\n|\r/g

// Parse the bound file.
function parse() {
  var self = this
  var value = String(self.file)
  var start = {line: 1, column: 1, offset: 0}
  var content = xtend(start)
  var node

  // Clean non-unix newlines: `\r\n` and `\r` are all changed to `\n`.
  // This should not affect positional information.
  value = value.replace(lineBreaksExpression, lineFeed)

  // BOM.
  if (value.charCodeAt(0) === 0xfeff) {
    value = value.slice(1)

    content.column++
    content.offset++
  }

  node = {
    type: 'root',
    children: self.tokenizeBlock(value, content),
    position: {start: start, end: self.eof || xtend(start)}
  }

  if (!self.options.position) {
    removePosition(node, true)
  }

  return node
}

},{"unist-util-remove-position":291,"xtend":301}],195:[function(require,module,exports){
'use strict'

var xtend = require('xtend')
var toggle = require('state-toggle')
var vfileLocation = require('vfile-location')
var unescape = require('./unescape')
var decode = require('./decode')
var tokenizer = require('./tokenizer')

module.exports = Parser

function Parser(doc, file) {
  this.file = file
  this.offset = {}
  this.options = xtend(this.options)
  this.setOptions({})

  this.inList = false
  this.inBlock = false
  this.inLink = false
  this.atStart = true

  this.toOffset = vfileLocation(file).toOffset
  this.unescape = unescape(this, 'escape')
  this.decode = decode(this)
}

var proto = Parser.prototype

// Expose core.
proto.setOptions = require('./set-options')
proto.parse = require('./parse')

// Expose `defaults`.
proto.options = require('./defaults')

// Enter and exit helpers.
proto.exitStart = toggle('atStart', true)
proto.enterList = toggle('inList', false)
proto.enterLink = toggle('inLink', false)
proto.enterBlock = toggle('inBlock', false)

// Nodes that can interupt a paragraph:
//
// ```markdown
// A paragraph, followed by a thematic break.
// ___
// ```
//
// In the above example, the thematic break “interupts” the paragraph.
proto.interruptParagraph = [
  ['thematicBreak'],
  ['atxHeading'],
  ['fencedCode'],
  ['blockquote'],
  ['html'],
  ['setextHeading', {commonmark: false}],
  ['definition', {commonmark: false}],
  ['footnote', {commonmark: false}]
]

// Nodes that can interupt a list:
//
// ```markdown
// - One
// ___
// ```
//
// In the above example, the thematic break “interupts” the list.
proto.interruptList = [
  ['atxHeading', {pedantic: false}],
  ['fencedCode', {pedantic: false}],
  ['thematicBreak', {pedantic: false}],
  ['definition', {commonmark: false}],
  ['footnote', {commonmark: false}]
]

// Nodes that can interupt a blockquote:
//
// ```markdown
// > A paragraph.
// ___
// ```
//
// In the above example, the thematic break “interupts” the blockquote.
proto.interruptBlockquote = [
  ['indentedCode', {commonmark: true}],
  ['fencedCode', {commonmark: true}],
  ['atxHeading', {commonmark: true}],
  ['setextHeading', {commonmark: true}],
  ['thematicBreak', {commonmark: true}],
  ['html', {commonmark: true}],
  ['list', {commonmark: true}],
  ['definition', {commonmark: false}],
  ['footnote', {commonmark: false}]
]

// Handlers.
proto.blockTokenizers = {
  newline: require('./tokenize/newline'),
  indentedCode: require('./tokenize/code-indented'),
  fencedCode: require('./tokenize/code-fenced'),
  blockquote: require('./tokenize/blockquote'),
  atxHeading: require('./tokenize/heading-atx'),
  thematicBreak: require('./tokenize/thematic-break'),
  list: require('./tokenize/list'),
  setextHeading: require('./tokenize/heading-setext'),
  html: require('./tokenize/html-block'),
  footnote: require('./tokenize/footnote-definition'),
  definition: require('./tokenize/definition'),
  table: require('./tokenize/table'),
  paragraph: require('./tokenize/paragraph')
}

proto.inlineTokenizers = {
  escape: require('./tokenize/escape'),
  autoLink: require('./tokenize/auto-link'),
  url: require('./tokenize/url'),
  html: require('./tokenize/html-inline'),
  link: require('./tokenize/link'),
  reference: require('./tokenize/reference'),
  strong: require('./tokenize/strong'),
  emphasis: require('./tokenize/emphasis'),
  deletion: require('./tokenize/delete'),
  code: require('./tokenize/code-inline'),
  break: require('./tokenize/break'),
  text: require('./tokenize/text')
}

// Expose precedence.
proto.blockMethods = keys(proto.blockTokenizers)
proto.inlineMethods = keys(proto.inlineTokenizers)

// Tokenizers.
proto.tokenizeBlock = tokenizer('block')
proto.tokenizeInline = tokenizer('inline')
proto.tokenizeFactory = tokenizer

// Get all keys in `value`.
function keys(value) {
  var result = []
  var key

  for (key in value) {
    result.push(key)
  }

  return result
}

},{"./decode":183,"./defaults":184,"./parse":194,"./set-options":196,"./tokenize/auto-link":197,"./tokenize/blockquote":198,"./tokenize/break":199,"./tokenize/code-fenced":200,"./tokenize/code-indented":201,"./tokenize/code-inline":202,"./tokenize/definition":203,"./tokenize/delete":204,"./tokenize/emphasis":205,"./tokenize/escape":206,"./tokenize/footnote-definition":207,"./tokenize/heading-atx":208,"./tokenize/heading-setext":209,"./tokenize/html-block":210,"./tokenize/html-inline":211,"./tokenize/link":212,"./tokenize/list":213,"./tokenize/newline":214,"./tokenize/paragraph":215,"./tokenize/reference":216,"./tokenize/strong":217,"./tokenize/table":218,"./tokenize/text":219,"./tokenize/thematic-break":220,"./tokenize/url":221,"./tokenizer":222,"./unescape":223,"state-toggle":276,"vfile-location":295,"xtend":301}],196:[function(require,module,exports){
'use strict'

var xtend = require('xtend')
var escapes = require('markdown-escapes')
var defaults = require('./defaults')

module.exports = setOptions

function setOptions(options) {
  var self = this
  var current = self.options
  var key
  var value

  if (options == null) {
    options = {}
  } else if (typeof options === 'object') {
    options = xtend(options)
  } else {
    throw new Error('Invalid value `' + options + '` for setting `options`')
  }

  for (key in defaults) {
    value = options[key]

    if (value == null) {
      value = current[key]
    }

    if (
      (key !== 'blocks' && typeof value !== 'boolean') ||
      (key === 'blocks' && typeof value !== 'object')
    ) {
      throw new Error(
        'Invalid value `' + value + '` for setting `options.' + key + '`'
      )
    }

    options[key] = value
  }

  self.options = options
  self.escape = escapes(options)

  return self
}

},{"./defaults":184,"markdown-escapes":95,"xtend":301}],197:[function(require,module,exports){
'use strict'

var whitespace = require('is-whitespace-character')
var decode = require('parse-entities')
var locate = require('../locate/tag')

module.exports = autoLink
autoLink.locator = locate
autoLink.notInLink = true

var lessThan = '<'
var greaterThan = '>'
var atSign = '@'
var slash = '/'
var mailto = 'mailto:'
var mailtoLength = mailto.length

function autoLink(eat, value, silent) {
  var self = this
  var subvalue = ''
  var length = value.length
  var index = 0
  var queue = ''
  var hasAtCharacter = false
  var link = ''
  var character
  var now
  var content
  var tokenizers
  var exit

  if (value.charAt(0) !== lessThan) {
    return
  }

  index++
  subvalue = lessThan

  while (index < length) {
    character = value.charAt(index)

    if (
      whitespace(character) ||
      character === greaterThan ||
      character === atSign ||
      (character === ':' && value.charAt(index + 1) === slash)
    ) {
      break
    }

    queue += character
    index++
  }

  if (!queue) {
    return
  }

  link += queue
  queue = ''

  character = value.charAt(index)
  link += character
  index++

  if (character === atSign) {
    hasAtCharacter = true
  } else {
    if (character !== ':' || value.charAt(index + 1) !== slash) {
      return
    }

    link += slash
    index++
  }

  while (index < length) {
    character = value.charAt(index)

    if (whitespace(character) || character === greaterThan) {
      break
    }

    queue += character
    index++
  }

  character = value.charAt(index)

  if (!queue || character !== greaterThan) {
    return
  }

  /* istanbul ignore if - never used (yet) */
  if (silent) {
    return true
  }

  link += queue
  content = link
  subvalue += link + character
  now = eat.now()
  now.column++
  now.offset++

  if (hasAtCharacter) {
    if (link.slice(0, mailtoLength).toLowerCase() === mailto) {
      content = content.substr(mailtoLength)
      now.column += mailtoLength
      now.offset += mailtoLength
    } else {
      link = mailto + link
    }
  }

  // Temporarily remove all tokenizers except text in autolinks.
  tokenizers = self.inlineTokenizers
  self.inlineTokenizers = {text: tokenizers.text}

  exit = self.enterLink()

  content = self.tokenizeInline(content, now)

  self.inlineTokenizers = tokenizers
  exit()

  return eat(subvalue)({
    type: 'link',
    title: null,
    url: decode(link, {nonTerminated: false}),
    children: content
  })
}

},{"../locate/tag":192,"is-whitespace-character":92,"parse-entities":134}],198:[function(require,module,exports){
'use strict'

var trim = require('trim')
var interrupt = require('../util/interrupt')

module.exports = blockquote

var lineFeed = '\n'
var tab = '\t'
var space = ' '
var greaterThan = '>'

function blockquote(eat, value, silent) {
  var self = this
  var offsets = self.offset
  var tokenizers = self.blockTokenizers
  var interruptors = self.interruptBlockquote
  var now = eat.now()
  var currentLine = now.line
  var length = value.length
  var values = []
  var contents = []
  var indents = []
  var add
  var index = 0
  var character
  var rest
  var nextIndex
  var content
  var line
  var startIndex
  var prefixed
  var exit

  while (index < length) {
    character = value.charAt(index)

    if (character !== space && character !== tab) {
      break
    }

    index++
  }

  if (value.charAt(index) !== greaterThan) {
    return
  }

  if (silent) {
    return true
  }

  index = 0

  while (index < length) {
    nextIndex = value.indexOf(lineFeed, index)
    startIndex = index
    prefixed = false

    if (nextIndex === -1) {
      nextIndex = length
    }

    while (index < length) {
      character = value.charAt(index)

      if (character !== space && character !== tab) {
        break
      }

      index++
    }

    if (value.charAt(index) === greaterThan) {
      index++
      prefixed = true

      if (value.charAt(index) === space) {
        index++
      }
    } else {
      index = startIndex
    }

    content = value.slice(index, nextIndex)

    if (!prefixed && !trim(content)) {
      index = startIndex
      break
    }

    if (!prefixed) {
      rest = value.slice(index)

      // Check if the following code contains a possible block.
      if (interrupt(interruptors, tokenizers, self, [eat, rest, true])) {
        break
      }
    }

    line = startIndex === index ? content : value.slice(startIndex, nextIndex)

    indents.push(index - startIndex)
    values.push(line)
    contents.push(content)

    index = nextIndex + 1
  }

  index = -1
  length = indents.length
  add = eat(values.join(lineFeed))

  while (++index < length) {
    offsets[currentLine] = (offsets[currentLine] || 0) + indents[index]
    currentLine++
  }

  exit = self.enterBlock()
  contents = self.tokenizeBlock(contents.join(lineFeed), now)
  exit()

  return add({type: 'blockquote', children: contents})
}

},{"../util/interrupt":226,"trim":281}],199:[function(require,module,exports){
'use strict'

var locate = require('../locate/break')

module.exports = hardBreak
hardBreak.locator = locate

var space = ' '
var lineFeed = '\n'
var minBreakLength = 2

function hardBreak(eat, value, silent) {
  var length = value.length
  var index = -1
  var queue = ''
  var character

  while (++index < length) {
    character = value.charAt(index)

    if (character === lineFeed) {
      if (index < minBreakLength) {
        return
      }

      /* istanbul ignore if - never used (yet) */
      if (silent) {
        return true
      }

      queue += character

      return eat(queue)({type: 'break'})
    }

    if (character !== space) {
      return
    }

    queue += character
  }
}

},{"../locate/break":185}],200:[function(require,module,exports){
'use strict'

var trim = require('trim-trailing-lines')

module.exports = fencedCode

var lineFeed = '\n'
var tab = '\t'
var space = ' '
var tilde = '~'
var graveAccent = '`'

var minFenceCount = 3
var tabSize = 4

function fencedCode(eat, value, silent) {
  var self = this
  var gfm = self.options.gfm
  var length = value.length + 1
  var index = 0
  var subvalue = ''
  var fenceCount
  var marker
  var character
  var flag
  var lang
  var meta
  var queue
  var content
  var exdentedContent
  var closing
  var exdentedClosing
  var indent
  var now

  if (!gfm) {
    return
  }

  // Eat initial spacing.
  while (index < length) {
    character = value.charAt(index)

    if (character !== space && character !== tab) {
      break
    }

    subvalue += character
    index++
  }

  indent = index

  // Eat the fence.
  character = value.charAt(index)

  if (character !== tilde && character !== graveAccent) {
    return
  }

  index++
  marker = character
  fenceCount = 1
  subvalue += character

  while (index < length) {
    character = value.charAt(index)

    if (character !== marker) {
      break
    }

    subvalue += character
    fenceCount++
    index++
  }

  if (fenceCount < minFenceCount) {
    return
  }

  // Eat spacing before flag.
  while (index < length) {
    character = value.charAt(index)

    if (character !== space && character !== tab) {
      break
    }

    subvalue += character
    index++
  }

  // Eat flag.
  flag = ''
  queue = ''

  while (index < length) {
    character = value.charAt(index)

    if (
      character === lineFeed ||
      character === tilde ||
      character === graveAccent
    ) {
      break
    }

    if (character === space || character === tab) {
      queue += character
    } else {
      flag += queue + character
      queue = ''
    }

    index++
  }

  character = value.charAt(index)

  if (character && character !== lineFeed) {
    return
  }

  if (silent) {
    return true
  }

  now = eat.now()
  now.column += subvalue.length
  now.offset += subvalue.length

  subvalue += flag
  flag = self.decode.raw(self.unescape(flag), now)

  if (queue) {
    subvalue += queue
  }

  queue = ''
  closing = ''
  exdentedClosing = ''
  content = ''
  exdentedContent = ''

  // Eat content.
  while (index < length) {
    character = value.charAt(index)
    content += closing
    exdentedContent += exdentedClosing
    closing = ''
    exdentedClosing = ''

    if (character !== lineFeed) {
      content += character
      exdentedClosing += character
      index++
      continue
    }

    // Add the newline to `subvalue` if its the first character.  Otherwise,
    // add it to the `closing` queue.
    if (content) {
      closing += character
      exdentedClosing += character
    } else {
      subvalue += character
    }

    queue = ''
    index++

    while (index < length) {
      character = value.charAt(index)

      if (character !== space) {
        break
      }

      queue += character
      index++
    }

    closing += queue
    exdentedClosing += queue.slice(indent)

    if (queue.length >= tabSize) {
      continue
    }

    queue = ''

    while (index < length) {
      character = value.charAt(index)

      if (character !== marker) {
        break
      }

      queue += character
      index++
    }

    closing += queue
    exdentedClosing += queue

    if (queue.length < fenceCount) {
      continue
    }

    queue = ''

    while (index < length) {
      character = value.charAt(index)

      if (character !== space && character !== tab) {
        break
      }

      closing += character
      exdentedClosing += character
      index++
    }

    if (!character || character === lineFeed) {
      break
    }
  }

  subvalue += content + closing

  // Get lang and meta from the flag.
  index = -1
  length = flag.length

  while (++index < length) {
    character = flag.charAt(index)

    if (character === space || character === tab) {
      if (!lang) {
        lang = flag.slice(0, index)
      }
    } else if (lang) {
      meta = flag.slice(index)
      break
    }
  }

  return eat(subvalue)({
    type: 'code',
    lang: lang || flag || null,
    meta: meta || null,
    value: trim(exdentedContent)
  })
}

},{"trim-trailing-lines":280}],201:[function(require,module,exports){
'use strict'

var repeat = require('repeat-string')
var trim = require('trim-trailing-lines')

module.exports = indentedCode

var lineFeed = '\n'
var tab = '\t'
var space = ' '

var tabSize = 4
var codeIndent = repeat(space, tabSize)

function indentedCode(eat, value, silent) {
  var index = -1
  var length = value.length
  var subvalue = ''
  var content = ''
  var subvalueQueue = ''
  var contentQueue = ''
  var character
  var blankQueue
  var indent

  while (++index < length) {
    character = value.charAt(index)

    if (indent) {
      indent = false

      subvalue += subvalueQueue
      content += contentQueue
      subvalueQueue = ''
      contentQueue = ''

      if (character === lineFeed) {
        subvalueQueue = character
        contentQueue = character
      } else {
        subvalue += character
        content += character

        while (++index < length) {
          character = value.charAt(index)

          if (!character || character === lineFeed) {
            contentQueue = character
            subvalueQueue = character
            break
          }

          subvalue += character
          content += character
        }
      }
    } else if (
      character === space &&
      value.charAt(index + 1) === character &&
      value.charAt(index + 2) === character &&
      value.charAt(index + 3) === character
    ) {
      subvalueQueue += codeIndent
      index += 3
      indent = true
    } else if (character === tab) {
      subvalueQueue += character
      indent = true
    } else {
      blankQueue = ''

      while (character === tab || character === space) {
        blankQueue += character
        character = value.charAt(++index)
      }

      if (character !== lineFeed) {
        break
      }

      subvalueQueue += blankQueue + character
      contentQueue += character
    }
  }

  if (content) {
    if (silent) {
      return true
    }

    return eat(subvalue)({
      type: 'code',
      lang: null,
      meta: null,
      value: trim(content)
    })
  }
}

},{"repeat-string":273,"trim-trailing-lines":280}],202:[function(require,module,exports){
'use strict'

var whitespace = require('is-whitespace-character')
var locate = require('../locate/code-inline')

module.exports = inlineCode
inlineCode.locator = locate

var graveAccent = '`'

function inlineCode(eat, value, silent) {
  var length = value.length
  var index = 0
  var queue = ''
  var tickQueue = ''
  var contentQueue
  var subqueue
  var count
  var openingCount
  var subvalue
  var character
  var found
  var next

  while (index < length) {
    if (value.charAt(index) !== graveAccent) {
      break
    }

    queue += graveAccent
    index++
  }

  if (!queue) {
    return
  }

  subvalue = queue
  openingCount = index
  queue = ''
  next = value.charAt(index)
  count = 0

  while (index < length) {
    character = next
    next = value.charAt(index + 1)

    if (character === graveAccent) {
      count++
      tickQueue += character
    } else {
      count = 0
      queue += character
    }

    if (count && next !== graveAccent) {
      if (count === openingCount) {
        subvalue += queue + tickQueue
        found = true
        break
      }

      queue += tickQueue
      tickQueue = ''
    }

    index++
  }

  if (!found) {
    if (openingCount % 2 !== 0) {
      return
    }

    queue = ''
  }

  /* istanbul ignore if - never used (yet) */
  if (silent) {
    return true
  }

  contentQueue = ''
  subqueue = ''
  length = queue.length
  index = -1

  while (++index < length) {
    character = queue.charAt(index)

    if (whitespace(character)) {
      subqueue += character
      continue
    }

    if (subqueue) {
      if (contentQueue) {
        contentQueue += subqueue
      }

      subqueue = ''
    }

    contentQueue += character
  }

  return eat(subvalue)({type: 'inlineCode', value: contentQueue})
}

},{"../locate/code-inline":186,"is-whitespace-character":92}],203:[function(require,module,exports){
'use strict'

var whitespace = require('is-whitespace-character')
var normalize = require('../util/normalize')

module.exports = definition
definition.notInList = true
definition.notInBlock = true

var quotationMark = '"'
var apostrophe = "'"
var backslash = '\\'
var lineFeed = '\n'
var tab = '\t'
var space = ' '
var leftSquareBracket = '['
var rightSquareBracket = ']'
var leftParenthesis = '('
var rightParenthesis = ')'
var colon = ':'
var lessThan = '<'
var greaterThan = '>'

function definition(eat, value, silent) {
  var self = this
  var commonmark = self.options.commonmark
  var index = 0
  var length = value.length
  var subvalue = ''
  var beforeURL
  var beforeTitle
  var queue
  var character
  var test
  var identifier
  var url
  var title

  while (index < length) {
    character = value.charAt(index)

    if (character !== space && character !== tab) {
      break
    }

    subvalue += character
    index++
  }

  character = value.charAt(index)

  if (character !== leftSquareBracket) {
    return
  }

  index++
  subvalue += character
  queue = ''

  while (index < length) {
    character = value.charAt(index)

    if (character === rightSquareBracket) {
      break
    } else if (character === backslash) {
      queue += character
      index++
      character = value.charAt(index)
    }

    queue += character
    index++
  }

  if (
    !queue ||
    value.charAt(index) !== rightSquareBracket ||
    value.charAt(index + 1) !== colon
  ) {
    return
  }

  identifier = queue
  subvalue += queue + rightSquareBracket + colon
  index = subvalue.length
  queue = ''

  while (index < length) {
    character = value.charAt(index)

    if (character !== tab && character !== space && character !== lineFeed) {
      break
    }

    subvalue += character
    index++
  }

  character = value.charAt(index)
  queue = ''
  beforeURL = subvalue

  if (character === lessThan) {
    index++

    while (index < length) {
      character = value.charAt(index)

      if (!isEnclosedURLCharacter(character)) {
        break
      }

      queue += character
      index++
    }

    character = value.charAt(index)

    if (character === isEnclosedURLCharacter.delimiter) {
      subvalue += lessThan + queue + character
      index++
    } else {
      if (commonmark) {
        return
      }

      index -= queue.length + 1
      queue = ''
    }
  }

  if (!queue) {
    while (index < length) {
      character = value.charAt(index)

      if (!isUnclosedURLCharacter(character)) {
        break
      }

      queue += character
      index++
    }

    subvalue += queue
  }

  if (!queue) {
    return
  }

  url = queue
  queue = ''

  while (index < length) {
    character = value.charAt(index)

    if (character !== tab && character !== space && character !== lineFeed) {
      break
    }

    queue += character
    index++
  }

  character = value.charAt(index)
  test = null

  if (character === quotationMark) {
    test = quotationMark
  } else if (character === apostrophe) {
    test = apostrophe
  } else if (character === leftParenthesis) {
    test = rightParenthesis
  }

  if (!test) {
    queue = ''
    index = subvalue.length
  } else if (queue) {
    subvalue += queue + character
    index = subvalue.length
    queue = ''

    while (index < length) {
      character = value.charAt(index)

      if (character === test) {
        break
      }

      if (character === lineFeed) {
        index++
        character = value.charAt(index)

        if (character === lineFeed || character === test) {
          return
        }

        queue += lineFeed
      }

      queue += character
      index++
    }

    character = value.charAt(index)

    if (character !== test) {
      return
    }

    beforeTitle = subvalue
    subvalue += queue + character
    index++
    title = queue
    queue = ''
  } else {
    return
  }

  while (index < length) {
    character = value.charAt(index)

    if (character !== tab && character !== space) {
      break
    }

    subvalue += character
    index++
  }

  character = value.charAt(index)

  if (!character || character === lineFeed) {
    if (silent) {
      return true
    }

    beforeURL = eat(beforeURL).test().end
    url = self.decode.raw(self.unescape(url), beforeURL, {nonTerminated: false})

    if (title) {
      beforeTitle = eat(beforeTitle).test().end
      title = self.decode.raw(self.unescape(title), beforeTitle)
    }

    return eat(subvalue)({
      type: 'definition',
      identifier: normalize(identifier),
      label: identifier,
      title: title || null,
      url: url
    })
  }
}

// Check if `character` can be inside an enclosed URI.
function isEnclosedURLCharacter(character) {
  return (
    character !== greaterThan &&
    character !== leftSquareBracket &&
    character !== rightSquareBracket
  )
}

isEnclosedURLCharacter.delimiter = greaterThan

// Check if `character` can be inside an unclosed URI.
function isUnclosedURLCharacter(character) {
  return (
    character !== leftSquareBracket &&
    character !== rightSquareBracket &&
    !whitespace(character)
  )
}

},{"../util/normalize":227,"is-whitespace-character":92}],204:[function(require,module,exports){
'use strict'

var whitespace = require('is-whitespace-character')
var locate = require('../locate/delete')

module.exports = strikethrough
strikethrough.locator = locate

var tilde = '~'
var fence = '~~'

function strikethrough(eat, value, silent) {
  var self = this
  var character = ''
  var previous = ''
  var preceding = ''
  var subvalue = ''
  var index
  var length
  var now

  if (
    !self.options.gfm ||
    value.charAt(0) !== tilde ||
    value.charAt(1) !== tilde ||
    whitespace(value.charAt(2))
  ) {
    return
  }

  index = 1
  length = value.length
  now = eat.now()
  now.column += 2
  now.offset += 2

  while (++index < length) {
    character = value.charAt(index)

    if (
      character === tilde &&
      previous === tilde &&
      (!preceding || !whitespace(preceding))
    ) {
      /* istanbul ignore if - never used (yet) */
      if (silent) {
        return true
      }

      return eat(fence + subvalue + fence)({
        type: 'delete',
        children: self.tokenizeInline(subvalue, now)
      })
    }

    subvalue += previous
    preceding = previous
    previous = character
  }
}

},{"../locate/delete":187,"is-whitespace-character":92}],205:[function(require,module,exports){
'use strict'

var trim = require('trim')
var word = require('is-word-character')
var whitespace = require('is-whitespace-character')
var locate = require('../locate/emphasis')

module.exports = emphasis
emphasis.locator = locate

var asterisk = '*'
var underscore = '_'
var backslash = '\\'

function emphasis(eat, value, silent) {
  var self = this
  var index = 0
  var character = value.charAt(index)
  var now
  var pedantic
  var marker
  var queue
  var subvalue
  var length
  var prev

  if (character !== asterisk && character !== underscore) {
    return
  }

  pedantic = self.options.pedantic
  subvalue = character
  marker = character
  length = value.length
  index++
  queue = ''
  character = ''

  if (pedantic && whitespace(value.charAt(index))) {
    return
  }

  while (index < length) {
    prev = character
    character = value.charAt(index)

    if (character === marker && (!pedantic || !whitespace(prev))) {
      character = value.charAt(++index)

      if (character !== marker) {
        if (!trim(queue) || prev === marker) {
          return
        }

        if (!pedantic && marker === underscore && word(character)) {
          queue += marker
          continue
        }

        /* istanbul ignore if - never used (yet) */
        if (silent) {
          return true
        }

        now = eat.now()
        now.column++
        now.offset++

        return eat(subvalue + queue + marker)({
          type: 'emphasis',
          children: self.tokenizeInline(queue, now)
        })
      }

      queue += marker
    }

    if (!pedantic && character === backslash) {
      queue += character
      character = value.charAt(++index)
    }

    queue += character
    index++
  }
}

},{"../locate/emphasis":188,"is-whitespace-character":92,"is-word-character":93,"trim":281}],206:[function(require,module,exports){
'use strict'

var locate = require('../locate/escape')

module.exports = escape
escape.locator = locate

var lineFeed = '\n'
var backslash = '\\'

function escape(eat, value, silent) {
  var self = this
  var character
  var node

  if (value.charAt(0) === backslash) {
    character = value.charAt(1)

    if (self.escape.indexOf(character) !== -1) {
      /* istanbul ignore if - never used (yet) */
      if (silent) {
        return true
      }

      if (character === lineFeed) {
        node = {type: 'break'}
      } else {
        node = {type: 'text', value: character}
      }

      return eat(backslash + character)(node)
    }
  }
}

},{"../locate/escape":189}],207:[function(require,module,exports){
'use strict'

var whitespace = require('is-whitespace-character')
var normalize = require('../util/normalize')

module.exports = footnoteDefinition
footnoteDefinition.notInList = true
footnoteDefinition.notInBlock = true

var backslash = '\\'
var lineFeed = '\n'
var tab = '\t'
var space = ' '
var leftSquareBracket = '['
var rightSquareBracket = ']'
var caret = '^'
var colon = ':'

var EXPRESSION_INITIAL_TAB = /^( {4}|\t)?/gm

function footnoteDefinition(eat, value, silent) {
  var self = this
  var offsets = self.offset
  var index
  var length
  var subvalue
  var now
  var currentLine
  var content
  var queue
  var subqueue
  var character
  var identifier
  var add
  var exit

  if (!self.options.footnotes) {
    return
  }

  index = 0
  length = value.length
  subvalue = ''
  now = eat.now()
  currentLine = now.line

  while (index < length) {
    character = value.charAt(index)

    if (!whitespace(character)) {
      break
    }

    subvalue += character
    index++
  }

  if (
    value.charAt(index) !== leftSquareBracket ||
    value.charAt(index + 1) !== caret
  ) {
    return
  }

  subvalue += leftSquareBracket + caret
  index = subvalue.length
  queue = ''

  while (index < length) {
    character = value.charAt(index)

    if (character === rightSquareBracket) {
      break
    } else if (character === backslash) {
      queue += character
      index++
      character = value.charAt(index)
    }

    queue += character
    index++
  }

  if (
    !queue ||
    value.charAt(index) !== rightSquareBracket ||
    value.charAt(index + 1) !== colon
  ) {
    return
  }

  if (silent) {
    return true
  }

  identifier = queue
  subvalue += queue + rightSquareBracket + colon
  index = subvalue.length

  while (index < length) {
    character = value.charAt(index)

    if (character !== tab && character !== space) {
      break
    }

    subvalue += character
    index++
  }

  now.column += subvalue.length
  now.offset += subvalue.length
  queue = ''
  content = ''
  subqueue = ''

  while (index < length) {
    character = value.charAt(index)

    if (character === lineFeed) {
      subqueue = character
      index++

      while (index < length) {
        character = value.charAt(index)

        if (character !== lineFeed) {
          break
        }

        subqueue += character
        index++
      }

      queue += subqueue
      subqueue = ''

      while (index < length) {
        character = value.charAt(index)

        if (character !== space) {
          break
        }

        subqueue += character
        index++
      }

      if (subqueue.length === 0) {
        break
      }

      queue += subqueue
    }

    if (queue) {
      content += queue
      queue = ''
    }

    content += character
    index++
  }

  subvalue += content

  content = content.replace(EXPRESSION_INITIAL_TAB, function(line) {
    offsets[currentLine] = (offsets[currentLine] || 0) + line.length
    currentLine++

    return ''
  })

  add = eat(subvalue)

  exit = self.enterBlock()
  content = self.tokenizeBlock(content, now)
  exit()

  return add({
    type: 'footnoteDefinition',
    identifier: normalize(identifier),
    label: identifier,
    children: content
  })
}

},{"../util/normalize":227,"is-whitespace-character":92}],208:[function(require,module,exports){
'use strict'

module.exports = atxHeading

var lineFeed = '\n'
var tab = '\t'
var space = ' '
var numberSign = '#'

var maxFenceCount = 6

function atxHeading(eat, value, silent) {
  var self = this
  var pedantic = self.options.pedantic
  var length = value.length + 1
  var index = -1
  var now = eat.now()
  var subvalue = ''
  var content = ''
  var character
  var queue
  var depth

  // Eat initial spacing.
  while (++index < length) {
    character = value.charAt(index)

    if (character !== space && character !== tab) {
      index--
      break
    }

    subvalue += character
  }

  // Eat hashes.
  depth = 0

  while (++index <= length) {
    character = value.charAt(index)

    if (character !== numberSign) {
      index--
      break
    }

    subvalue += character
    depth++
  }

  if (depth > maxFenceCount) {
    return
  }

  if (!depth || (!pedantic && value.charAt(index + 1) === numberSign)) {
    return
  }

  length = value.length + 1

  // Eat intermediate white-space.
  queue = ''

  while (++index < length) {
    character = value.charAt(index)

    if (character !== space && character !== tab) {
      index--
      break
    }

    queue += character
  }

  // Exit when not in pedantic mode without spacing.
  if (!pedantic && queue.length === 0 && character && character !== lineFeed) {
    return
  }

  if (silent) {
    return true
  }

  // Eat content.
  subvalue += queue
  queue = ''
  content = ''

  while (++index < length) {
    character = value.charAt(index)

    if (!character || character === lineFeed) {
      break
    }

    if (character !== space && character !== tab && character !== numberSign) {
      content += queue + character
      queue = ''
      continue
    }

    while (character === space || character === tab) {
      queue += character
      character = value.charAt(++index)
    }

    // `#` without a queue is part of the content.
    if (!pedantic && content && !queue && character === numberSign) {
      content += character
      continue
    }

    while (character === numberSign) {
      queue += character
      character = value.charAt(++index)
    }

    while (character === space || character === tab) {
      queue += character
      character = value.charAt(++index)
    }

    index--
  }

  now.column += subvalue.length
  now.offset += subvalue.length
  subvalue += content + queue

  return eat(subvalue)({
    type: 'heading',
    depth: depth,
    children: self.tokenizeInline(content, now)
  })
}

},{}],209:[function(require,module,exports){
'use strict'

module.exports = setextHeading

var lineFeed = '\n'
var tab = '\t'
var space = ' '
var equalsTo = '='
var dash = '-'

var maxIndent = 3

var equalsToDepth = 1
var dashDepth = 2

function setextHeading(eat, value, silent) {
  var self = this
  var now = eat.now()
  var length = value.length
  var index = -1
  var subvalue = ''
  var content
  var queue
  var character
  var marker
  var depth

  // Eat initial indentation.
  while (++index < length) {
    character = value.charAt(index)

    if (character !== space || index >= maxIndent) {
      index--
      break
    }

    subvalue += character
  }

  // Eat content.
  content = ''
  queue = ''

  while (++index < length) {
    character = value.charAt(index)

    if (character === lineFeed) {
      index--
      break
    }

    if (character === space || character === tab) {
      queue += character
    } else {
      content += queue + character
      queue = ''
    }
  }

  now.column += subvalue.length
  now.offset += subvalue.length
  subvalue += content + queue

  // Ensure the content is followed by a newline and a valid marker.
  character = value.charAt(++index)
  marker = value.charAt(++index)

  if (character !== lineFeed || (marker !== equalsTo && marker !== dash)) {
    return
  }

  subvalue += character

  // Eat Setext-line.
  queue = marker
  depth = marker === equalsTo ? equalsToDepth : dashDepth

  while (++index < length) {
    character = value.charAt(index)

    if (character !== marker) {
      if (character !== lineFeed) {
        return
      }

      index--
      break
    }

    queue += character
  }

  if (silent) {
    return true
  }

  return eat(subvalue + queue)({
    type: 'heading',
    depth: depth,
    children: self.tokenizeInline(content, now)
  })
}

},{}],210:[function(require,module,exports){
'use strict'

var openCloseTag = require('../util/html').openCloseTag

module.exports = blockHtml

var tab = '\t'
var space = ' '
var lineFeed = '\n'
var lessThan = '<'

var rawOpenExpression = /^<(script|pre|style)(?=(\s|>|$))/i
var rawCloseExpression = /<\/(script|pre|style)>/i
var commentOpenExpression = /^<!--/
var commentCloseExpression = /-->/
var instructionOpenExpression = /^<\?/
var instructionCloseExpression = /\?>/
var directiveOpenExpression = /^<![A-Za-z]/
var directiveCloseExpression = />/
var cdataOpenExpression = /^<!\[CDATA\[/
var cdataCloseExpression = /\]\]>/
var elementCloseExpression = /^$/
var otherElementOpenExpression = new RegExp(openCloseTag.source + '\\s*$')

function blockHtml(eat, value, silent) {
  var self = this
  var blocks = self.options.blocks.join('|')
  var elementOpenExpression = new RegExp(
    '^</?(' + blocks + ')(?=(\\s|/?>|$))',
    'i'
  )
  var length = value.length
  var index = 0
  var next
  var line
  var offset
  var character
  var count
  var sequence
  var subvalue

  var sequences = [
    [rawOpenExpression, rawCloseExpression, true],
    [commentOpenExpression, commentCloseExpression, true],
    [instructionOpenExpression, instructionCloseExpression, true],
    [directiveOpenExpression, directiveCloseExpression, true],
    [cdataOpenExpression, cdataCloseExpression, true],
    [elementOpenExpression, elementCloseExpression, true],
    [otherElementOpenExpression, elementCloseExpression, false]
  ]

  // Eat initial spacing.
  while (index < length) {
    character = value.charAt(index)

    if (character !== tab && character !== space) {
      break
    }

    index++
  }

  if (value.charAt(index) !== lessThan) {
    return
  }

  next = value.indexOf(lineFeed, index + 1)
  next = next === -1 ? length : next
  line = value.slice(index, next)
  offset = -1
  count = sequences.length

  while (++offset < count) {
    if (sequences[offset][0].test(line)) {
      sequence = sequences[offset]
      break
    }
  }

  if (!sequence) {
    return
  }

  if (silent) {
    return sequence[2]
  }

  index = next

  if (!sequence[1].test(line)) {
    while (index < length) {
      next = value.indexOf(lineFeed, index + 1)
      next = next === -1 ? length : next
      line = value.slice(index + 1, next)

      if (sequence[1].test(line)) {
        if (line) {
          index = next
        }

        break
      }

      index = next
    }
  }

  subvalue = value.slice(0, index)

  return eat(subvalue)({type: 'html', value: subvalue})
}

},{"../util/html":225}],211:[function(require,module,exports){
'use strict'

var alphabetical = require('is-alphabetical')
var locate = require('../locate/tag')
var tag = require('../util/html').tag

module.exports = inlineHTML
inlineHTML.locator = locate

var lessThan = '<'
var questionMark = '?'
var exclamationMark = '!'
var slash = '/'

var htmlLinkOpenExpression = /^<a /i
var htmlLinkCloseExpression = /^<\/a>/i

function inlineHTML(eat, value, silent) {
  var self = this
  var length = value.length
  var character
  var subvalue

  if (value.charAt(0) !== lessThan || length < 3) {
    return
  }

  character = value.charAt(1)

  if (
    !alphabetical(character) &&
    character !== questionMark &&
    character !== exclamationMark &&
    character !== slash
  ) {
    return
  }

  subvalue = value.match(tag)

  if (!subvalue) {
    return
  }

  /* istanbul ignore if - not used yet. */
  if (silent) {
    return true
  }

  subvalue = subvalue[0]

  if (!self.inLink && htmlLinkOpenExpression.test(subvalue)) {
    self.inLink = true
  } else if (self.inLink && htmlLinkCloseExpression.test(subvalue)) {
    self.inLink = false
  }

  return eat(subvalue)({type: 'html', value: subvalue})
}

},{"../locate/tag":192,"../util/html":225,"is-alphabetical":85}],212:[function(require,module,exports){
'use strict'

var whitespace = require('is-whitespace-character')
var locate = require('../locate/link')

module.exports = link
link.locator = locate

var lineFeed = '\n'
var exclamationMark = '!'
var quotationMark = '"'
var apostrophe = "'"
var leftParenthesis = '('
var rightParenthesis = ')'
var lessThan = '<'
var greaterThan = '>'
var leftSquareBracket = '['
var backslash = '\\'
var rightSquareBracket = ']'
var graveAccent = '`'

function link(eat, value, silent) {
  var self = this
  var subvalue = ''
  var index = 0
  var character = value.charAt(0)
  var pedantic = self.options.pedantic
  var commonmark = self.options.commonmark
  var gfm = self.options.gfm
  var closed
  var count
  var opening
  var beforeURL
  var beforeTitle
  var subqueue
  var hasMarker
  var isImage
  var content
  var marker
  var length
  var title
  var depth
  var queue
  var url
  var now
  var exit
  var node

  // Detect whether this is an image.
  if (character === exclamationMark) {
    isImage = true
    subvalue = character
    character = value.charAt(++index)
  }

  // Eat the opening.
  if (character !== leftSquareBracket) {
    return
  }

  // Exit when this is a link and we’re already inside a link.
  if (!isImage && self.inLink) {
    return
  }

  subvalue += character
  queue = ''
  index++

  // Eat the content.
  length = value.length
  now = eat.now()
  depth = 0

  now.column += index
  now.offset += index

  while (index < length) {
    character = value.charAt(index)
    subqueue = character

    if (character === graveAccent) {
      // Inline-code in link content.
      count = 1

      while (value.charAt(index + 1) === graveAccent) {
        subqueue += character
        index++
        count++
      }

      if (!opening) {
        opening = count
      } else if (count >= opening) {
        opening = 0
      }
    } else if (character === backslash) {
      // Allow brackets to be escaped.
      index++
      subqueue += value.charAt(index)
    } else if ((!opening || gfm) && character === leftSquareBracket) {
      // In GFM mode, brackets in code still count.  In all other modes,
      // they don’t.
      depth++
    } else if ((!opening || gfm) && character === rightSquareBracket) {
      if (depth) {
        depth--
      } else {
        // Allow white-space between content and url in GFM mode.
        if (!pedantic) {
          while (index < length) {
            character = value.charAt(index + 1)

            if (!whitespace(character)) {
              break
            }

            subqueue += character
            index++
          }
        }

        if (value.charAt(index + 1) !== leftParenthesis) {
          return
        }

        subqueue += leftParenthesis
        closed = true
        index++

        break
      }
    }

    queue += subqueue
    subqueue = ''
    index++
  }

  // Eat the content closing.
  if (!closed) {
    return
  }

  content = queue
  subvalue += queue + subqueue
  index++

  // Eat white-space.
  while (index < length) {
    character = value.charAt(index)

    if (!whitespace(character)) {
      break
    }

    subvalue += character
    index++
  }

  // Eat the URL.
  character = value.charAt(index)
  queue = ''
  beforeURL = subvalue

  if (character === lessThan) {
    index++
    beforeURL += lessThan

    while (index < length) {
      character = value.charAt(index)

      if (character === greaterThan) {
        break
      }

      if (commonmark && character === lineFeed) {
        return
      }

      queue += character
      index++
    }

    if (value.charAt(index) !== greaterThan) {
      return
    }

    subvalue += lessThan + queue + greaterThan
    url = queue
    index++
  } else {
    character = null
    subqueue = ''

    while (index < length) {
      character = value.charAt(index)

      if (
        subqueue &&
        (character === quotationMark ||
          character === apostrophe ||
          (commonmark && character === leftParenthesis))
      ) {
        break
      }

      if (whitespace(character)) {
        if (!pedantic) {
          break
        }

        subqueue += character
      } else {
        if (character === leftParenthesis) {
          depth++
        } else if (character === rightParenthesis) {
          if (depth === 0) {
            break
          }

          depth--
        }

        queue += subqueue
        subqueue = ''

        if (character === backslash) {
          queue += backslash
          character = value.charAt(++index)
        }

        queue += character
      }

      index++
    }

    subvalue += queue
    url = queue
    index = subvalue.length
  }

  // Eat white-space.
  queue = ''

  while (index < length) {
    character = value.charAt(index)

    if (!whitespace(character)) {
      break
    }

    queue += character
    index++
  }

  character = value.charAt(index)
  subvalue += queue

  // Eat the title.
  if (
    queue &&
    (character === quotationMark ||
      character === apostrophe ||
      (commonmark && character === leftParenthesis))
  ) {
    index++
    subvalue += character
    queue = ''
    marker = character === leftParenthesis ? rightParenthesis : character
    beforeTitle = subvalue

    // In commonmark-mode, things are pretty easy: the marker cannot occur
    // inside the title.  Non-commonmark does, however, support nested
    // delimiters.
    if (commonmark) {
      while (index < length) {
        character = value.charAt(index)

        if (character === marker) {
          break
        }

        if (character === backslash) {
          queue += backslash
          character = value.charAt(++index)
        }

        index++
        queue += character
      }

      character = value.charAt(index)

      if (character !== marker) {
        return
      }

      title = queue
      subvalue += queue + character
      index++

      while (index < length) {
        character = value.charAt(index)

        if (!whitespace(character)) {
          break
        }

        subvalue += character
        index++
      }
    } else {
      subqueue = ''

      while (index < length) {
        character = value.charAt(index)

        if (character === marker) {
          if (hasMarker) {
            queue += marker + subqueue
            subqueue = ''
          }

          hasMarker = true
        } else if (!hasMarker) {
          queue += character
        } else if (character === rightParenthesis) {
          subvalue += queue + marker + subqueue
          title = queue
          break
        } else if (whitespace(character)) {
          subqueue += character
        } else {
          queue += marker + subqueue + character
          subqueue = ''
          hasMarker = false
        }

        index++
      }
    }
  }

  if (value.charAt(index) !== rightParenthesis) {
    return
  }

  /* istanbul ignore if - never used (yet) */
  if (silent) {
    return true
  }

  subvalue += rightParenthesis

  url = self.decode.raw(self.unescape(url), eat(beforeURL).test().end, {
    nonTerminated: false
  })

  if (title) {
    beforeTitle = eat(beforeTitle).test().end
    title = self.decode.raw(self.unescape(title), beforeTitle)
  }

  node = {
    type: isImage ? 'image' : 'link',
    title: title || null,
    url: url
  }

  if (isImage) {
    node.alt = self.decode.raw(self.unescape(content), now) || null
  } else {
    exit = self.enterLink()
    node.children = self.tokenizeInline(content, now)
    exit()
  }

  return eat(subvalue)(node)
}

},{"../locate/link":190,"is-whitespace-character":92}],213:[function(require,module,exports){
'use strict'

/* eslint-disable max-params */

var trim = require('trim')
var repeat = require('repeat-string')
var decimal = require('is-decimal')
var getIndent = require('../util/get-indentation')
var removeIndent = require('../util/remove-indentation')
var interrupt = require('../util/interrupt')

module.exports = list

var asterisk = '*'
var underscore = '_'
var plusSign = '+'
var dash = '-'
var dot = '.'
var space = ' '
var lineFeed = '\n'
var tab = '\t'
var rightParenthesis = ')'
var lowercaseX = 'x'

var tabSize = 4
var looseListItemExpression = /\n\n(?!\s*$)/
var taskItemExpression = /^\[([ \t]|x|X)][ \t]/
var bulletExpression = /^([ \t]*)([*+-]|\d+[.)])( {1,4}(?! )| |\t|$|(?=\n))([^\n]*)/
var pedanticBulletExpression = /^([ \t]*)([*+-]|\d+[.)])([ \t]+)/
var initialIndentExpression = /^( {1,4}|\t)?/gm

function list(eat, value, silent) {
  var self = this
  var commonmark = self.options.commonmark
  var pedantic = self.options.pedantic
  var tokenizers = self.blockTokenizers
  var interuptors = self.interruptList
  var index = 0
  var length = value.length
  var start = null
  var size = 0
  var queue
  var ordered
  var character
  var marker
  var nextIndex
  var startIndex
  var prefixed
  var currentMarker
  var content
  var line
  var prevEmpty
  var empty
  var items
  var allLines
  var emptyLines
  var item
  var enterTop
  var exitBlockquote
  var spread = false
  var node
  var now
  var end
  var indented

  while (index < length) {
    character = value.charAt(index)

    if (character === tab) {
      size += tabSize - (size % tabSize)
    } else if (character === space) {
      size++
    } else {
      break
    }

    index++
  }

  if (size >= tabSize) {
    return
  }

  character = value.charAt(index)

  if (character === asterisk || character === plusSign || character === dash) {
    marker = character
    ordered = false
  } else {
    ordered = true
    queue = ''

    while (index < length) {
      character = value.charAt(index)

      if (!decimal(character)) {
        break
      }

      queue += character
      index++
    }

    character = value.charAt(index)

    if (
      !queue ||
      !(character === dot || (commonmark && character === rightParenthesis))
    ) {
      return
    }

    start = parseInt(queue, 10)
    marker = character
  }

  character = value.charAt(++index)

  if (
    character !== space &&
    character !== tab &&
    (pedantic || (character !== lineFeed && character !== ''))
  ) {
    return
  }

  if (silent) {
    return true
  }

  index = 0
  items = []
  allLines = []
  emptyLines = []

  while (index < length) {
    nextIndex = value.indexOf(lineFeed, index)
    startIndex = index
    prefixed = false
    indented = false

    if (nextIndex === -1) {
      nextIndex = length
    }

    end = index + tabSize
    size = 0

    while (index < length) {
      character = value.charAt(index)

      if (character === tab) {
        size += tabSize - (size % tabSize)
      } else if (character === space) {
        size++
      } else {
        break
      }

      index++
    }

    if (size >= tabSize) {
      indented = true
    }

    if (item && size >= item.indent) {
      indented = true
    }

    character = value.charAt(index)
    currentMarker = null

    if (!indented) {
      if (
        character === asterisk ||
        character === plusSign ||
        character === dash
      ) {
        currentMarker = character
        index++
        size++
      } else {
        queue = ''

        while (index < length) {
          character = value.charAt(index)

          if (!decimal(character)) {
            break
          }

          queue += character
          index++
        }

        character = value.charAt(index)
        index++

        if (
          queue &&
          (character === dot || (commonmark && character === rightParenthesis))
        ) {
          currentMarker = character
          size += queue.length + 1
        }
      }

      if (currentMarker) {
        character = value.charAt(index)

        if (character === tab) {
          size += tabSize - (size % tabSize)
          index++
        } else if (character === space) {
          end = index + tabSize

          while (index < end) {
            if (value.charAt(index) !== space) {
              break
            }

            index++
            size++
          }

          if (index === end && value.charAt(index) === space) {
            index -= tabSize - 1
            size -= tabSize - 1
          }
        } else if (character !== lineFeed && character !== '') {
          currentMarker = null
        }
      }
    }

    if (currentMarker) {
      if (!pedantic && marker !== currentMarker) {
        break
      }

      prefixed = true
    } else {
      if (!commonmark && !indented && value.charAt(startIndex) === space) {
        indented = true
      } else if (commonmark && item) {
        indented = size >= item.indent || size > tabSize
      }

      prefixed = false
      index = startIndex
    }

    line = value.slice(startIndex, nextIndex)
    content = startIndex === index ? line : value.slice(index, nextIndex)

    if (
      currentMarker === asterisk ||
      currentMarker === underscore ||
      currentMarker === dash
    ) {
      if (tokenizers.thematicBreak.call(self, eat, line, true)) {
        break
      }
    }

    prevEmpty = empty
    empty = !prefixed && !trim(content).length

    if (indented && item) {
      item.value = item.value.concat(emptyLines, line)
      allLines = allLines.concat(emptyLines, line)
      emptyLines = []
    } else if (prefixed) {
      if (emptyLines.length !== 0) {
        spread = true
        item.value.push('')
        item.trail = emptyLines.concat()
      }

      item = {
        value: [line],
        indent: size,
        trail: []
      }

      items.push(item)
      allLines = allLines.concat(emptyLines, line)
      emptyLines = []
    } else if (empty) {
      if (prevEmpty && !commonmark) {
        break
      }

      emptyLines.push(line)
    } else {
      if (prevEmpty) {
        break
      }

      if (interrupt(interuptors, tokenizers, self, [eat, line, true])) {
        break
      }

      item.value = item.value.concat(emptyLines, line)
      allLines = allLines.concat(emptyLines, line)
      emptyLines = []
    }

    index = nextIndex + 1
  }

  node = eat(allLines.join(lineFeed)).reset({
    type: 'list',
    ordered: ordered,
    start: start,
    spread: spread,
    children: []
  })

  enterTop = self.enterList()
  exitBlockquote = self.enterBlock()
  index = -1
  length = items.length

  while (++index < length) {
    item = items[index].value.join(lineFeed)
    now = eat.now()

    eat(item)(listItem(self, item, now), node)

    item = items[index].trail.join(lineFeed)

    if (index !== length - 1) {
      item += lineFeed
    }

    eat(item)
  }

  enterTop()
  exitBlockquote()

  return node
}

function listItem(ctx, value, position) {
  var offsets = ctx.offset
  var fn = ctx.options.pedantic ? pedanticListItem : normalListItem
  var checked = null
  var task
  var indent

  value = fn.apply(null, arguments)

  if (ctx.options.gfm) {
    task = value.match(taskItemExpression)

    if (task) {
      indent = task[0].length
      checked = task[1].toLowerCase() === lowercaseX
      offsets[position.line] += indent
      value = value.slice(indent)
    }
  }

  return {
    type: 'listItem',
    spread: looseListItemExpression.test(value),
    checked: checked,
    children: ctx.tokenizeBlock(value, position)
  }
}

// Create a list-item using overly simple mechanics.
function pedanticListItem(ctx, value, position) {
  var offsets = ctx.offset
  var line = position.line

  // Remove the list-item’s bullet.
  value = value.replace(pedanticBulletExpression, replacer)

  // The initial line was also matched by the below, so we reset the `line`.
  line = position.line

  return value.replace(initialIndentExpression, replacer)

  // A simple replacer which removed all matches, and adds their length to
  // `offset`.
  function replacer($0) {
    offsets[line] = (offsets[line] || 0) + $0.length
    line++

    return ''
  }
}

// Create a list-item using sane mechanics.
function normalListItem(ctx, value, position) {
  var offsets = ctx.offset
  var line = position.line
  var max
  var bullet
  var rest
  var lines
  var trimmedLines
  var index
  var length

  // Remove the list-item’s bullet.
  value = value.replace(bulletExpression, replacer)

  lines = value.split(lineFeed)

  trimmedLines = removeIndent(value, getIndent(max).indent).split(lineFeed)

  // We replaced the initial bullet with something else above, which was used
  // to trick `removeIndentation` into removing some more characters when
  // possible.  However, that could result in the initial line to be stripped
  // more than it should be.
  trimmedLines[0] = rest

  offsets[line] = (offsets[line] || 0) + bullet.length
  line++

  index = 0
  length = lines.length

  while (++index < length) {
    offsets[line] =
      (offsets[line] || 0) + lines[index].length - trimmedLines[index].length
    line++
  }

  return trimmedLines.join(lineFeed)

  function replacer($0, $1, $2, $3, $4) {
    bullet = $1 + $2 + $3
    rest = $4

    // Make sure that the first nine numbered list items can indent with an
    // extra space.  That is, when the bullet did not receive an extra final
    // space.
    if (Number($2) < 10 && bullet.length % 2 === 1) {
      $2 = space + $2
    }

    max = $1 + repeat(space, $2.length) + $3

    return max + rest
  }
}

},{"../util/get-indentation":224,"../util/interrupt":226,"../util/remove-indentation":228,"is-decimal":89,"repeat-string":273,"trim":281}],214:[function(require,module,exports){
'use strict'

var whitespace = require('is-whitespace-character')

module.exports = newline

var lineFeed = '\n'

function newline(eat, value, silent) {
  var character = value.charAt(0)
  var length
  var subvalue
  var queue
  var index

  if (character !== lineFeed) {
    return
  }

  /* istanbul ignore if - never used (yet) */
  if (silent) {
    return true
  }

  index = 1
  length = value.length
  subvalue = character
  queue = ''

  while (index < length) {
    character = value.charAt(index)

    if (!whitespace(character)) {
      break
    }

    queue += character

    if (character === lineFeed) {
      subvalue += queue
      queue = ''
    }

    index++
  }

  eat(subvalue)
}

},{"is-whitespace-character":92}],215:[function(require,module,exports){
'use strict'

var trim = require('trim')
var decimal = require('is-decimal')
var trimTrailingLines = require('trim-trailing-lines')
var interrupt = require('../util/interrupt')

module.exports = paragraph

var tab = '\t'
var lineFeed = '\n'
var space = ' '

var tabSize = 4

// Tokenise paragraph.
function paragraph(eat, value, silent) {
  var self = this
  var settings = self.options
  var commonmark = settings.commonmark
  var gfm = settings.gfm
  var tokenizers = self.blockTokenizers
  var interruptors = self.interruptParagraph
  var index = value.indexOf(lineFeed)
  var length = value.length
  var position
  var subvalue
  var character
  var size
  var now

  while (index < length) {
    // Eat everything if there’s no following newline.
    if (index === -1) {
      index = length
      break
    }

    // Stop if the next character is NEWLINE.
    if (value.charAt(index + 1) === lineFeed) {
      break
    }

    // In commonmark-mode, following indented lines are part of the paragraph.
    if (commonmark) {
      size = 0
      position = index + 1

      while (position < length) {
        character = value.charAt(position)

        if (character === tab) {
          size = tabSize
          break
        } else if (character === space) {
          size++
        } else {
          break
        }

        position++
      }

      if (size >= tabSize && character !== lineFeed) {
        index = value.indexOf(lineFeed, index + 1)
        continue
      }
    }

    subvalue = value.slice(index + 1)

    // Check if the following code contains a possible block.
    if (interrupt(interruptors, tokenizers, self, [eat, subvalue, true])) {
      break
    }

    // Break if the following line starts a list, when already in a list, or
    // when in commonmark, or when in gfm mode and the bullet is *not* numeric.
    if (
      tokenizers.list.call(self, eat, subvalue, true) &&
      (self.inList ||
        commonmark ||
        (gfm && !decimal(trim.left(subvalue).charAt(0))))
    ) {
      break
    }

    position = index
    index = value.indexOf(lineFeed, index + 1)

    if (index !== -1 && trim(value.slice(position, index)) === '') {
      index = position
      break
    }
  }

  subvalue = value.slice(0, index)

  if (trim(subvalue) === '') {
    eat(subvalue)

    return null
  }

  /* istanbul ignore if - never used (yet) */
  if (silent) {
    return true
  }

  now = eat.now()
  subvalue = trimTrailingLines(subvalue)

  return eat(subvalue)({
    type: 'paragraph',
    children: self.tokenizeInline(subvalue, now)
  })
}

},{"../util/interrupt":226,"is-decimal":89,"trim":281,"trim-trailing-lines":280}],216:[function(require,module,exports){
'use strict'

var whitespace = require('is-whitespace-character')
var locate = require('../locate/link')
var normalize = require('../util/normalize')

module.exports = reference
reference.locator = locate

var link = 'link'
var image = 'image'
var footnote = 'footnote'
var shortcut = 'shortcut'
var collapsed = 'collapsed'
var full = 'full'
var space = ' '
var exclamationMark = '!'
var leftSquareBracket = '['
var backslash = '\\'
var rightSquareBracket = ']'
var caret = '^'

function reference(eat, value, silent) {
  var self = this
  var commonmark = self.options.commonmark
  var character = value.charAt(0)
  var index = 0
  var length = value.length
  var subvalue = ''
  var intro = ''
  var type = link
  var referenceType = shortcut
  var content
  var identifier
  var now
  var node
  var exit
  var queue
  var bracketed
  var depth

  // Check whether we’re eating an image.
  if (character === exclamationMark) {
    type = image
    intro = character
    character = value.charAt(++index)
  }

  if (character !== leftSquareBracket) {
    return
  }

  index++
  intro += character
  queue = ''

  // Check whether we’re eating a footnote.
  if (self.options.footnotes && value.charAt(index) === caret) {
    // Exit if `![^` is found, so the `!` will be seen as text after this,
    // and we’ll enter this function again when `[^` is found.
    if (type === image) {
      return
    }

    intro += caret
    index++
    type = footnote
  }

  // Eat the text.
  depth = 0

  while (index < length) {
    character = value.charAt(index)

    if (character === leftSquareBracket) {
      bracketed = true
      depth++
    } else if (character === rightSquareBracket) {
      if (!depth) {
        break
      }

      depth--
    }

    if (character === backslash) {
      queue += backslash
      character = value.charAt(++index)
    }

    queue += character
    index++
  }

  subvalue = queue
  content = queue
  character = value.charAt(index)

  if (character !== rightSquareBracket) {
    return
  }

  index++
  subvalue += character
  queue = ''

  if (!commonmark) {
    // The original markdown syntax definition explicitly allows for whitespace
    // between the link text and link label; commonmark departs from this, in
    // part to improve support for shortcut reference links
    while (index < length) {
      character = value.charAt(index)

      if (!whitespace(character)) {
        break
      }

      queue += character
      index++
    }
  }

  character = value.charAt(index)

  // Inline footnotes cannot have an identifier.
  if (type !== footnote && character === leftSquareBracket) {
    identifier = ''
    queue += character
    index++

    while (index < length) {
      character = value.charAt(index)

      if (character === leftSquareBracket || character === rightSquareBracket) {
        break
      }

      if (character === backslash) {
        identifier += backslash
        character = value.charAt(++index)
      }

      identifier += character
      index++
    }

    character = value.charAt(index)

    if (character === rightSquareBracket) {
      referenceType = identifier ? full : collapsed
      queue += identifier + character
      index++
    } else {
      identifier = ''
    }

    subvalue += queue
    queue = ''
  } else {
    if (!content) {
      return
    }

    identifier = content
  }

  // Brackets cannot be inside the identifier.
  if (referenceType !== full && bracketed) {
    return
  }

  subvalue = intro + subvalue

  if (type === link && self.inLink) {
    return null
  }

  /* istanbul ignore if - never used (yet) */
  if (silent) {
    return true
  }

  if (type === footnote && content.indexOf(space) !== -1) {
    return eat(subvalue)({
      type: footnote,
      children: this.tokenizeInline(content, eat.now())
    })
  }

  now = eat.now()
  now.column += intro.length
  now.offset += intro.length
  identifier = referenceType === full ? identifier : content

  node = {
    type: type + 'Reference',
    identifier: normalize(identifier),
    label: identifier
  }

  if (type === link || type === image) {
    node.referenceType = referenceType
  }

  if (type === link) {
    exit = self.enterLink()
    node.children = self.tokenizeInline(content, now)
    exit()
  } else if (type === image) {
    node.alt = self.decode.raw(self.unescape(content), now) || null
  }

  return eat(subvalue)(node)
}

},{"../locate/link":190,"../util/normalize":227,"is-whitespace-character":92}],217:[function(require,module,exports){
'use strict'

var trim = require('trim')
var whitespace = require('is-whitespace-character')
var locate = require('../locate/strong')

module.exports = strong
strong.locator = locate

var backslash = '\\'
var asterisk = '*'
var underscore = '_'

function strong(eat, value, silent) {
  var self = this
  var index = 0
  var character = value.charAt(index)
  var now
  var pedantic
  var marker
  var queue
  var subvalue
  var length
  var prev

  if (
    (character !== asterisk && character !== underscore) ||
    value.charAt(++index) !== character
  ) {
    return
  }

  pedantic = self.options.pedantic
  marker = character
  subvalue = marker + marker
  length = value.length
  index++
  queue = ''
  character = ''

  if (pedantic && whitespace(value.charAt(index))) {
    return
  }

  while (index < length) {
    prev = character
    character = value.charAt(index)

    if (
      character === marker &&
      value.charAt(index + 1) === marker &&
      (!pedantic || !whitespace(prev))
    ) {
      character = value.charAt(index + 2)

      if (character !== marker) {
        if (!trim(queue)) {
          return
        }

        /* istanbul ignore if - never used (yet) */
        if (silent) {
          return true
        }

        now = eat.now()
        now.column += 2
        now.offset += 2

        return eat(subvalue + queue + subvalue)({
          type: 'strong',
          children: self.tokenizeInline(queue, now)
        })
      }
    }

    if (!pedantic && character === backslash) {
      queue += character
      character = value.charAt(++index)
    }

    queue += character
    index++
  }
}

},{"../locate/strong":191,"is-whitespace-character":92,"trim":281}],218:[function(require,module,exports){
'use strict'

var whitespace = require('is-whitespace-character')

module.exports = table

var tab = '\t'
var lineFeed = '\n'
var space = ' '
var dash = '-'
var colon = ':'
var backslash = '\\'
var graveAccent = '`'
var verticalBar = '|'

var minColumns = 1
var minRows = 2

var left = 'left'
var center = 'center'
var right = 'right'

function table(eat, value, silent) {
  var self = this
  var index
  var alignments
  var alignment
  var subvalue
  var row
  var length
  var lines
  var queue
  var character
  var hasDash
  var align
  var cell
  var preamble
  var count
  var opening
  var now
  var position
  var lineCount
  var line
  var rows
  var table
  var lineIndex
  var pipeIndex
  var first

  // Exit when not in gfm-mode.
  if (!self.options.gfm) {
    return
  }

  // Get the rows.
  // Detecting tables soon is hard, so there are some checks for performance
  // here, such as the minimum number of rows, and allowed characters in the
  // alignment row.
  index = 0
  lineCount = 0
  length = value.length + 1
  lines = []

  while (index < length) {
    lineIndex = value.indexOf(lineFeed, index)
    pipeIndex = value.indexOf(verticalBar, index + 1)

    if (lineIndex === -1) {
      lineIndex = value.length
    }

    if (pipeIndex === -1 || pipeIndex > lineIndex) {
      if (lineCount < minRows) {
        return
      }

      break
    }

    lines.push(value.slice(index, lineIndex))
    lineCount++
    index = lineIndex + 1
  }

  // Parse the alignment row.
  subvalue = lines.join(lineFeed)
  alignments = lines.splice(1, 1)[0] || []
  index = 0
  length = alignments.length
  lineCount--
  alignment = false
  align = []

  while (index < length) {
    character = alignments.charAt(index)

    if (character === verticalBar) {
      hasDash = null

      if (alignment === false) {
        if (first === false) {
          return
        }
      } else {
        align.push(alignment)
        alignment = false
      }

      first = false
    } else if (character === dash) {
      hasDash = true
      alignment = alignment || null
    } else if (character === colon) {
      if (alignment === left) {
        alignment = center
      } else if (hasDash && alignment === null) {
        alignment = right
      } else {
        alignment = left
      }
    } else if (!whitespace(character)) {
      return
    }

    index++
  }

  if (alignment !== false) {
    align.push(alignment)
  }

  // Exit when without enough columns.
  if (align.length < minColumns) {
    return
  }

  /* istanbul ignore if - never used (yet) */
  if (silent) {
    return true
  }

  // Parse the rows.
  position = -1
  rows = []

  table = eat(subvalue).reset({type: 'table', align: align, children: rows})

  while (++position < lineCount) {
    line = lines[position]
    row = {type: 'tableRow', children: []}

    // Eat a newline character when this is not the first row.
    if (position) {
      eat(lineFeed)
    }

    // Eat the row.
    eat(line).reset(row, table)

    length = line.length + 1
    index = 0
    queue = ''
    cell = ''
    preamble = true
    count = null
    opening = null

    while (index < length) {
      character = line.charAt(index)

      if (character === tab || character === space) {
        if (cell) {
          queue += character
        } else {
          eat(character)
        }

        index++
        continue
      }

      if (character === '' || character === verticalBar) {
        if (preamble) {
          eat(character)
        } else {
          if (character && opening) {
            queue += character
            index++
            continue
          }

          if ((cell || character) && !preamble) {
            subvalue = cell

            if (queue.length > 1) {
              if (character) {
                subvalue += queue.slice(0, queue.length - 1)
                queue = queue.charAt(queue.length - 1)
              } else {
                subvalue += queue
                queue = ''
              }
            }

            now = eat.now()

            eat(subvalue)(
              {type: 'tableCell', children: self.tokenizeInline(cell, now)},
              row
            )
          }

          eat(queue + character)

          queue = ''
          cell = ''
        }
      } else {
        if (queue) {
          cell += queue
          queue = ''
        }

        cell += character

        if (character === backslash && index !== length - 2) {
          cell += line.charAt(index + 1)
          index++
        }

        if (character === graveAccent) {
          count = 1

          while (line.charAt(index + 1) === character) {
            cell += character
            index++
            count++
          }

          if (!opening) {
            opening = count
          } else if (count >= opening) {
            opening = 0
          }
        }
      }

      preamble = false
      index++
    }

    // Eat the alignment row.
    if (!position) {
      eat(lineFeed + alignments)
    }
  }

  return table
}

},{"is-whitespace-character":92}],219:[function(require,module,exports){
'use strict'

module.exports = text

function text(eat, value, silent) {
  var self = this
  var methods
  var tokenizers
  var index
  var length
  var subvalue
  var position
  var tokenizer
  var name
  var min
  var now

  /* istanbul ignore if - never used (yet) */
  if (silent) {
    return true
  }

  methods = self.inlineMethods
  length = methods.length
  tokenizers = self.inlineTokenizers
  index = -1
  min = value.length

  while (++index < length) {
    name = methods[index]

    if (name === 'text' || !tokenizers[name]) {
      continue
    }

    tokenizer = tokenizers[name].locator

    if (!tokenizer) {
      eat.file.fail('Missing locator: `' + name + '`')
    }

    position = tokenizer.call(self, value, 1)

    if (position !== -1 && position < min) {
      min = position
    }
  }

  subvalue = value.slice(0, min)
  now = eat.now()

  self.decode(subvalue, now, handler)

  function handler(content, position, source) {
    eat(source || content)({type: 'text', value: content})
  }
}

},{}],220:[function(require,module,exports){
'use strict'

module.exports = thematicBreak

var tab = '\t'
var lineFeed = '\n'
var space = ' '
var asterisk = '*'
var dash = '-'
var underscore = '_'

var maxCount = 3

function thematicBreak(eat, value, silent) {
  var index = -1
  var length = value.length + 1
  var subvalue = ''
  var character
  var marker
  var markerCount
  var queue

  while (++index < length) {
    character = value.charAt(index)

    if (character !== tab && character !== space) {
      break
    }

    subvalue += character
  }

  if (
    character !== asterisk &&
    character !== dash &&
    character !== underscore
  ) {
    return
  }

  marker = character
  subvalue += character
  markerCount = 1
  queue = ''

  while (++index < length) {
    character = value.charAt(index)

    if (character === marker) {
      markerCount++
      subvalue += queue + marker
      queue = ''
    } else if (character === space) {
      queue += character
    } else if (
      markerCount >= maxCount &&
      (!character || character === lineFeed)
    ) {
      subvalue += queue

      if (silent) {
        return true
      }

      return eat(subvalue)({type: 'thematicBreak'})
    } else {
      return
    }
  }
}

},{}],221:[function(require,module,exports){
'use strict'

var decode = require('parse-entities')
var whitespace = require('is-whitespace-character')
var locate = require('../locate/url')

module.exports = url
url.locator = locate
url.notInLink = true

var quotationMark = '"'
var apostrophe = "'"
var leftParenthesis = '('
var rightParenthesis = ')'
var comma = ','
var dot = '.'
var colon = ':'
var semicolon = ';'
var lessThan = '<'
var atSign = '@'
var leftSquareBracket = '['
var rightSquareBracket = ']'

var http = 'http://'
var https = 'https://'
var mailto = 'mailto:'

var protocols = [http, https, mailto]

var protocolsLength = protocols.length

function url(eat, value, silent) {
  var self = this
  var subvalue
  var content
  var character
  var index
  var position
  var protocol
  var match
  var length
  var queue
  var parenCount
  var nextCharacter
  var tokenizers
  var exit

  if (!self.options.gfm) {
    return
  }

  subvalue = ''
  index = -1

  while (++index < protocolsLength) {
    protocol = protocols[index]
    match = value.slice(0, protocol.length)

    if (match.toLowerCase() === protocol) {
      subvalue = match
      break
    }
  }

  if (!subvalue) {
    return
  }

  index = subvalue.length
  length = value.length
  queue = ''
  parenCount = 0

  while (index < length) {
    character = value.charAt(index)

    if (whitespace(character) || character === lessThan) {
      break
    }

    if (
      character === dot ||
      character === comma ||
      character === colon ||
      character === semicolon ||
      character === quotationMark ||
      character === apostrophe ||
      character === rightParenthesis ||
      character === rightSquareBracket
    ) {
      nextCharacter = value.charAt(index + 1)

      if (!nextCharacter || whitespace(nextCharacter)) {
        break
      }
    }

    if (character === leftParenthesis || character === leftSquareBracket) {
      parenCount++
    }

    if (character === rightParenthesis || character === rightSquareBracket) {
      parenCount--

      if (parenCount < 0) {
        break
      }
    }

    queue += character
    index++
  }

  if (!queue) {
    return
  }

  subvalue += queue
  content = subvalue

  if (protocol === mailto) {
    position = queue.indexOf(atSign)

    if (position === -1 || position === length - 1) {
      return
    }

    content = content.substr(mailto.length)
  }

  /* istanbul ignore if - never used (yet) */
  if (silent) {
    return true
  }

  exit = self.enterLink()

  // Temporarily remove all tokenizers except text in url.
  tokenizers = self.inlineTokenizers
  self.inlineTokenizers = {text: tokenizers.text}

  content = self.tokenizeInline(content, eat.now())

  self.inlineTokenizers = tokenizers
  exit()

  return eat(subvalue)({
    type: 'link',
    title: null,
    url: decode(subvalue, {nonTerminated: false}),
    children: content
  })
}

},{"../locate/url":193,"is-whitespace-character":92,"parse-entities":134}],222:[function(require,module,exports){
'use strict'

module.exports = factory

// Construct a tokenizer.  This creates both `tokenizeInline` and `tokenizeBlock`.
function factory(type) {
  return tokenize

  // Tokenizer for a bound `type`.
  function tokenize(value, location) {
    var self = this
    var offset = self.offset
    var tokens = []
    var methods = self[type + 'Methods']
    var tokenizers = self[type + 'Tokenizers']
    var line = location.line
    var column = location.column
    var index
    var length
    var method
    var name
    var matched
    var valueLength

    // Trim white space only lines.
    if (!value) {
      return tokens
    }

    // Expose on `eat`.
    eat.now = now
    eat.file = self.file

    // Sync initial offset.
    updatePosition('')

    // Iterate over `value`, and iterate over all tokenizers.  When one eats
    // something, re-iterate with the remaining value.  If no tokenizer eats,
    // something failed (should not happen) and an exception is thrown.
    while (value) {
      index = -1
      length = methods.length
      matched = false

      while (++index < length) {
        name = methods[index]
        method = tokenizers[name]

        if (
          method &&
          /* istanbul ignore next */ (!method.onlyAtStart || self.atStart) &&
          (!method.notInList || !self.inList) &&
          (!method.notInBlock || !self.inBlock) &&
          (!method.notInLink || !self.inLink)
        ) {
          valueLength = value.length

          method.apply(self, [eat, value])

          matched = valueLength !== value.length

          if (matched) {
            break
          }
        }
      }

      /* istanbul ignore if */
      if (!matched) {
        self.file.fail(new Error('Infinite loop'), eat.now())
      }
    }

    self.eof = now()

    return tokens

    // Update line, column, and offset based on `value`.
    function updatePosition(subvalue) {
      var lastIndex = -1
      var index = subvalue.indexOf('\n')

      while (index !== -1) {
        line++
        lastIndex = index
        index = subvalue.indexOf('\n', index + 1)
      }

      if (lastIndex === -1) {
        column += subvalue.length
      } else {
        column = subvalue.length - lastIndex
      }

      if (line in offset) {
        if (lastIndex !== -1) {
          column += offset[line]
        } else if (column <= offset[line]) {
          column = offset[line] + 1
        }
      }
    }

    // Get offset.  Called before the first character is eaten to retrieve the
    // range’s offsets.
    function getOffset() {
      var indentation = []
      var pos = line + 1

      // Done.  Called when the last character is eaten to retrieve the range’s
      // offsets.
      return function() {
        var last = line + 1

        while (pos < last) {
          indentation.push((offset[pos] || 0) + 1)

          pos++
        }

        return indentation
      }
    }

    // Get the current position.
    function now() {
      var pos = {line: line, column: column}

      pos.offset = self.toOffset(pos)

      return pos
    }

    // Store position information for a node.
    function Position(start) {
      this.start = start
      this.end = now()
    }

    // Throw when a value is incorrectly eaten.  This shouldn’t happen but will
    // throw on new, incorrect rules.
    function validateEat(subvalue) {
      /* istanbul ignore if */
      if (value.substring(0, subvalue.length) !== subvalue) {
        // Capture stack-trace.
        self.file.fail(
          new Error(
            'Incorrectly eaten value: please report this warning on https://git.io/vg5Ft'
          ),
          now()
        )
      }
    }

    // Mark position and patch `node.position`.
    function position() {
      var before = now()

      return update

      // Add the position to a node.
      function update(node, indent) {
        var prev = node.position
        var start = prev ? prev.start : before
        var combined = []
        var n = prev && prev.end.line
        var l = before.line

        node.position = new Position(start)

        // If there was already a `position`, this node was merged.  Fixing
        // `start` wasn’t hard, but the indent is different.  Especially
        // because some information, the indent between `n` and `l` wasn’t
        // tracked.  Luckily, that space is (should be?) empty, so we can
        // safely check for it now.
        if (prev && indent && prev.indent) {
          combined = prev.indent

          if (n < l) {
            while (++n < l) {
              combined.push((offset[n] || 0) + 1)
            }

            combined.push(before.column)
          }

          indent = combined.concat(indent)
        }

        node.position.indent = indent || []

        return node
      }
    }

    // Add `node` to `parent`s children or to `tokens`.  Performs merges where
    // possible.
    function add(node, parent) {
      var children = parent ? parent.children : tokens
      var prev = children[children.length - 1]
      var fn

      if (
        prev &&
        node.type === prev.type &&
        (node.type === 'text' || node.type === 'blockquote') &&
        mergeable(prev) &&
        mergeable(node)
      ) {
        fn = node.type === 'text' ? mergeText : mergeBlockquote
        node = fn.call(self, prev, node)
      }

      if (node !== prev) {
        children.push(node)
      }

      if (self.atStart && tokens.length !== 0) {
        self.exitStart()
      }

      return node
    }

    // Remove `subvalue` from `value`.  `subvalue` must be at the start of
    // `value`.
    function eat(subvalue) {
      var indent = getOffset()
      var pos = position()
      var current = now()

      validateEat(subvalue)

      apply.reset = reset
      reset.test = test
      apply.test = test

      value = value.substring(subvalue.length)

      updatePosition(subvalue)

      indent = indent()

      return apply

      // Add the given arguments, add `position` to the returned node, and
      // return the node.
      function apply(node, parent) {
        return pos(add(pos(node), parent), indent)
      }

      // Functions just like apply, but resets the content: the line and
      // column are reversed, and the eaten value is re-added.   This is
      // useful for nodes with a single type of content, such as lists and
      // tables.  See `apply` above for what parameters are expected.
      function reset() {
        var node = apply.apply(null, arguments)

        line = current.line
        column = current.column
        value = subvalue + value

        return node
      }

      // Test the position, after eating, and reverse to a not-eaten state.
      function test() {
        var result = pos({})

        line = current.line
        column = current.column
        value = subvalue + value

        return result.position
      }
    }
  }
}

// Check whether a node is mergeable with adjacent nodes.
function mergeable(node) {
  var start
  var end

  if (node.type !== 'text' || !node.position) {
    return true
  }

  start = node.position.start
  end = node.position.end

  // Only merge nodes which occupy the same size as their `value`.
  return (
    start.line !== end.line || end.column - start.column === node.value.length
  )
}

// Merge two text nodes: `node` into `prev`.
function mergeText(prev, node) {
  prev.value += node.value

  return prev
}

// Merge two blockquotes: `node` into `prev`, unless in CommonMark mode.
function mergeBlockquote(prev, node) {
  if (this.options.commonmark) {
    return node
  }

  prev.children = prev.children.concat(node.children)

  return prev
}

},{}],223:[function(require,module,exports){
'use strict'

module.exports = factory

var backslash = '\\'

// Factory to de-escape a value, based on a list at `key` in `ctx`.
function factory(ctx, key) {
  return unescape

  // De-escape a string using the expression at `key` in `ctx`.
  function unescape(value) {
    var prev = 0
    var index = value.indexOf(backslash)
    var escape = ctx[key]
    var queue = []
    var character

    while (index !== -1) {
      queue.push(value.slice(prev, index))
      prev = index + 1
      character = value.charAt(prev)

      // If the following character is not a valid escape, add the slash.
      if (!character || escape.indexOf(character) === -1) {
        queue.push(backslash)
      }

      index = value.indexOf(backslash, prev + 1)
    }

    queue.push(value.slice(prev))

    return queue.join('')
  }
}

},{}],224:[function(require,module,exports){
'use strict'

module.exports = indentation

var tab = '\t'
var space = ' '

var spaceSize = 1
var tabSize = 4

// Gets indentation information for a line.
function indentation(value) {
  var index = 0
  var indent = 0
  var character = value.charAt(index)
  var stops = {}
  var size

  while (character === tab || character === space) {
    size = character === tab ? tabSize : spaceSize

    indent += size

    if (size > 1) {
      indent = Math.floor(indent / size) * size
    }

    stops[indent] = index
    character = value.charAt(++index)
  }

  return {indent: indent, stops: stops}
}

},{}],225:[function(require,module,exports){
'use strict'

var attributeName = '[a-zA-Z_:][a-zA-Z0-9:._-]*'
var unquoted = '[^"\'=<>`\\u0000-\\u0020]+'
var singleQuoted = "'[^']*'"
var doubleQuoted = '"[^"]*"'
var attributeValue =
  '(?:' + unquoted + '|' + singleQuoted + '|' + doubleQuoted + ')'
var attribute =
  '(?:\\s+' + attributeName + '(?:\\s*=\\s*' + attributeValue + ')?)'
var openTag = '<[A-Za-z][A-Za-z0-9\\-]*' + attribute + '*\\s*\\/?>'
var closeTag = '<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>'
var comment = '<!---->|<!--(?:-?[^>-])(?:-?[^-])*-->'
var processing = '<[?].*?[?]>'
var declaration = '<![A-Za-z]+\\s+[^>]*>'
var cdata = '<!\\[CDATA\\[[\\s\\S]*?\\]\\]>'

exports.openCloseTag = new RegExp('^(?:' + openTag + '|' + closeTag + ')')

exports.tag = new RegExp(
  '^(?:' +
    openTag +
    '|' +
    closeTag +
    '|' +
    comment +
    '|' +
    processing +
    '|' +
    declaration +
    '|' +
    cdata +
    ')'
)

},{}],226:[function(require,module,exports){
'use strict'

module.exports = interrupt

function interrupt(interruptors, tokenizers, ctx, params) {
  var length = interruptors.length
  var index = -1
  var interruptor
  var config

  while (++index < length) {
    interruptor = interruptors[index]
    config = interruptor[1] || {}

    if (
      config.pedantic !== undefined &&
      config.pedantic !== ctx.options.pedantic
    ) {
      continue
    }

    if (
      config.commonmark !== undefined &&
      config.commonmark !== ctx.options.commonmark
    ) {
      continue
    }

    if (tokenizers[interruptor[0]].apply(ctx, params)) {
      return true
    }
  }

  return false
}

},{}],227:[function(require,module,exports){
'use strict'

var collapseWhiteSpace = require('collapse-white-space')

module.exports = normalize

// Normalize an identifier.  Collapses multiple white space characters into a
// single space, and removes casing.
function normalize(value) {
  return collapseWhiteSpace(value).toLowerCase()
}

},{"collapse-white-space":11}],228:[function(require,module,exports){
'use strict'

var trim = require('trim')
var repeat = require('repeat-string')
var getIndent = require('./get-indentation')

module.exports = indentation

var tab = '\t'
var lineFeed = '\n'
var space = ' '
var exclamationMark = '!'

// Remove the minimum indent from every line in `value`.  Supports both tab,
// spaced, and mixed indentation (as well as possible).
function indentation(value, maximum) {
  var values = value.split(lineFeed)
  var position = values.length + 1
  var minIndent = Infinity
  var matrix = []
  var index
  var indentation
  var stops
  var padding

  values.unshift(repeat(space, maximum) + exclamationMark)

  while (position--) {
    indentation = getIndent(values[position])

    matrix[position] = indentation.stops

    if (trim(values[position]).length === 0) {
      continue
    }

    if (indentation.indent) {
      if (indentation.indent > 0 && indentation.indent < minIndent) {
        minIndent = indentation.indent
      }
    } else {
      minIndent = Infinity

      break
    }
  }

  if (minIndent !== Infinity) {
    position = values.length

    while (position--) {
      stops = matrix[position]
      index = minIndent

      while (index && !(index in stops)) {
        index--
      }

      if (
        trim(values[position]).length !== 0 &&
        minIndent &&
        index !== minIndent
      ) {
        padding = tab
      } else {
        padding = ''
      }

      values[position] =
        padding + values[position].slice(index in stops ? stops[index] + 1 : 0)
    }
  }

  values.shift()

  return values.join(lineFeed)
}

},{"./get-indentation":224,"repeat-string":273,"trim":281}],229:[function(require,module,exports){
'use strict'

var unherit = require('unherit')
var xtend = require('xtend')
var Compiler = require('./lib/compiler.js')

module.exports = stringify
stringify.Compiler = Compiler

function stringify(options) {
  var Local = unherit(Compiler)
  Local.prototype.options = xtend(
    Local.prototype.options,
    this.data('settings'),
    options
  )
  this.Compiler = Local
}

},{"./lib/compiler.js":230,"unherit":284,"xtend":301}],230:[function(require,module,exports){
'use strict'

var xtend = require('xtend')
var toggle = require('state-toggle')

module.exports = Compiler

// Construct a new compiler.
function Compiler(tree, file) {
  this.inLink = false
  this.inTable = false
  this.tree = tree
  this.file = file
  this.options = xtend(this.options)
  this.setOptions({})
}

var proto = Compiler.prototype

// Enter and exit helpers. */
proto.enterLink = toggle('inLink', false)
proto.enterTable = toggle('inTable', false)
proto.enterLinkReference = require('./util/enter-link-reference')

// Configuration.
proto.options = require('./defaults')
proto.setOptions = require('./set-options')

proto.compile = require('./macro/compile')
proto.visit = require('./macro/one')
proto.all = require('./macro/all')
proto.block = require('./macro/block')
proto.visitOrderedItems = require('./macro/ordered-items')
proto.visitUnorderedItems = require('./macro/unordered-items')

// Expose visitors.
proto.visitors = {
  root: require('./visitors/root'),
  text: require('./visitors/text'),
  heading: require('./visitors/heading'),
  paragraph: require('./visitors/paragraph'),
  blockquote: require('./visitors/blockquote'),
  list: require('./visitors/list'),
  listItem: require('./visitors/list-item'),
  inlineCode: require('./visitors/inline-code'),
  code: require('./visitors/code'),
  html: require('./visitors/html'),
  thematicBreak: require('./visitors/thematic-break'),
  strong: require('./visitors/strong'),
  emphasis: require('./visitors/emphasis'),
  break: require('./visitors/break'),
  delete: require('./visitors/delete'),
  link: require('./visitors/link'),
  linkReference: require('./visitors/link-reference'),
  imageReference: require('./visitors/image-reference'),
  definition: require('./visitors/definition'),
  image: require('./visitors/image'),
  footnote: require('./visitors/footnote'),
  footnoteReference: require('./visitors/footnote-reference'),
  footnoteDefinition: require('./visitors/footnote-definition'),
  table: require('./visitors/table'),
  tableCell: require('./visitors/table-cell')
}

},{"./defaults":231,"./macro/all":233,"./macro/block":234,"./macro/compile":235,"./macro/one":236,"./macro/ordered-items":237,"./macro/unordered-items":238,"./set-options":239,"./util/enter-link-reference":243,"./visitors/blockquote":248,"./visitors/break":249,"./visitors/code":250,"./visitors/definition":251,"./visitors/delete":252,"./visitors/emphasis":253,"./visitors/footnote":256,"./visitors/footnote-definition":254,"./visitors/footnote-reference":255,"./visitors/heading":257,"./visitors/html":258,"./visitors/image":260,"./visitors/image-reference":259,"./visitors/inline-code":261,"./visitors/link":263,"./visitors/link-reference":262,"./visitors/list":265,"./visitors/list-item":264,"./visitors/paragraph":266,"./visitors/root":267,"./visitors/strong":268,"./visitors/table":270,"./visitors/table-cell":269,"./visitors/text":271,"./visitors/thematic-break":272,"state-toggle":276,"xtend":301}],231:[function(require,module,exports){
'use strict'

module.exports = {
  gfm: true,
  commonmark: false,
  pedantic: false,
  entities: 'false',
  setext: false,
  closeAtx: false,
  looseTable: false,
  spacedTable: true,
  paddedTable: true,
  stringLength: stringLength,
  incrementListMarker: true,
  fences: false,
  fence: '`',
  bullet: '-',
  listItemIndent: 'tab',
  rule: '*',
  ruleSpaces: true,
  ruleRepetition: 3,
  strong: '*',
  emphasis: '_'
}

function stringLength(value) {
  return value.length
}

},{}],232:[function(require,module,exports){
'use strict'

var decimal = require('is-decimal')
var alphanumeric = require('is-alphanumeric')
var whitespace = require('is-whitespace-character')
var escapes = require('markdown-escapes')
var prefix = require('./util/entity-prefix-length')

module.exports = factory

var tab = '\t'
var lineFeed = '\n'
var space = ' '
var numberSign = '#'
var ampersand = '&'
var leftParenthesis = '('
var rightParenthesis = ')'
var asterisk = '*'
var plusSign = '+'
var dash = '-'
var dot = '.'
var colon = ':'
var lessThan = '<'
var greaterThan = '>'
var leftSquareBracket = '['
var backslash = '\\'
var rightSquareBracket = ']'
var underscore = '_'
var graveAccent = '`'
var verticalBar = '|'
var tilde = '~'
var exclamationMark = '!'

var entities = {
  '<': '&lt;',
  ':': '&#x3A;',
  '&': '&amp;',
  '|': '&#x7C;',
  '~': '&#x7E;'
}

var shortcut = 'shortcut'
var mailto = 'mailto'
var https = 'https'
var http = 'http'

var blankExpression = /\n\s*$/

// Factory to escape characters.
function factory(options) {
  return escape

  // Escape punctuation characters in a node’s value.
  function escape(value, node, parent) {
    var self = this
    var gfm = options.gfm
    var commonmark = options.commonmark
    var pedantic = options.pedantic
    var markers = commonmark ? [dot, rightParenthesis] : [dot]
    var siblings = parent && parent.children
    var index = siblings && siblings.indexOf(node)
    var prev = siblings && siblings[index - 1]
    var next = siblings && siblings[index + 1]
    var length = value.length
    var escapable = escapes(options)
    var position = -1
    var queue = []
    var escaped = queue
    var afterNewLine
    var character
    var wordCharBefore
    var wordCharAfter
    var offset
    var replace

    if (prev) {
      afterNewLine = text(prev) && blankExpression.test(prev.value)
    } else {
      afterNewLine =
        !parent || parent.type === 'root' || parent.type === 'paragraph'
    }

    while (++position < length) {
      character = value.charAt(position)
      replace = false

      if (character === '\n') {
        afterNewLine = true
      } else if (
        character === backslash ||
        character === graveAccent ||
        character === asterisk ||
        (character === exclamationMark &&
          value.charAt(position + 1) === leftSquareBracket) ||
        character === leftSquareBracket ||
        character === lessThan ||
        (character === ampersand && prefix(value.slice(position)) > 0) ||
        (character === rightSquareBracket && self.inLink) ||
        (gfm && character === tilde && value.charAt(position + 1) === tilde) ||
        (gfm &&
          character === verticalBar &&
          (self.inTable || alignment(value, position))) ||
        (character === underscore &&
          // Delegate leading/trailing underscores to the multinode version below.
          position > 0 &&
          position < length - 1 &&
          (pedantic ||
            !alphanumeric(value.charAt(position - 1)) ||
            !alphanumeric(value.charAt(position + 1)))) ||
        (gfm && !self.inLink && character === colon && protocol(queue.join('')))
      ) {
        replace = true
      } else if (afterNewLine) {
        if (
          character === greaterThan ||
          character === numberSign ||
          character === asterisk ||
          character === dash ||
          character === plusSign
        ) {
          replace = true
        } else if (decimal(character)) {
          offset = position + 1

          while (offset < length) {
            if (!decimal(value.charAt(offset))) {
              break
            }

            offset++
          }

          if (markers.indexOf(value.charAt(offset)) !== -1) {
            next = value.charAt(offset + 1)

            if (!next || next === space || next === tab || next === lineFeed) {
              queue.push(value.slice(position, offset))
              position = offset
              character = value.charAt(position)
              replace = true
            }
          }
        }
      }

      if (afterNewLine && !whitespace(character)) {
        afterNewLine = false
      }

      queue.push(replace ? one(character) : character)
    }

    // Multi-node versions.
    if (siblings && text(node)) {
      // Check for an opening parentheses after a link-reference (which can be
      // joined by white-space).
      if (prev && prev.referenceType === shortcut) {
        position = -1
        length = escaped.length

        while (++position < length) {
          character = escaped[position]

          if (character === space || character === tab) {
            continue
          }

          if (character === leftParenthesis || character === colon) {
            escaped[position] = one(character)
          }

          break
        }

        // If the current node is all spaces / tabs, preceded by a shortcut,
        // and followed by a text starting with `(`, escape it.
        if (
          text(next) &&
          position === length &&
          next.value.charAt(0) === leftParenthesis
        ) {
          escaped.push(backslash)
        }
      }

      // Ensure non-auto-links are not seen as links.  This pattern needs to
      // check the preceding nodes too.
      if (
        gfm &&
        !self.inLink &&
        text(prev) &&
        value.charAt(0) === colon &&
        protocol(prev.value.slice(-6))
      ) {
        escaped[0] = one(colon)
      }

      // Escape ampersand if it would otherwise start an entity.
      if (
        text(next) &&
        value.charAt(length - 1) === ampersand &&
        prefix(ampersand + next.value) !== 0
      ) {
        escaped[escaped.length - 1] = one(ampersand)
      }

      // Escape exclamation marks immediately followed by links.
      if (
        next &&
        next.type === 'link' &&
        value.charAt(length - 1) === exclamationMark
      ) {
        escaped[escaped.length - 1] = one(exclamationMark)
      }

      // Escape double tildes in GFM.
      if (
        gfm &&
        text(next) &&
        value.charAt(length - 1) === tilde &&
        next.value.charAt(0) === tilde
      ) {
        escaped.splice(escaped.length - 1, 0, backslash)
      }

      // Escape underscores, but not mid-word (unless in pedantic mode).
      wordCharBefore = text(prev) && alphanumeric(prev.value.slice(-1))
      wordCharAfter = text(next) && alphanumeric(next.value.charAt(0))

      if (length === 1) {
        if (
          value === underscore &&
          (pedantic || !wordCharBefore || !wordCharAfter)
        ) {
          escaped.unshift(backslash)
        }
      } else {
        if (
          value.charAt(0) === underscore &&
          (pedantic || !wordCharBefore || !alphanumeric(value.charAt(1)))
        ) {
          escaped.unshift(backslash)
        }

        if (
          value.charAt(length - 1) === underscore &&
          (pedantic ||
            !wordCharAfter ||
            !alphanumeric(value.charAt(length - 2)))
        ) {
          escaped.splice(escaped.length - 1, 0, backslash)
        }
      }
    }

    return escaped.join('')

    function one(character) {
      return escapable.indexOf(character) === -1
        ? entities[character]
        : backslash + character
    }
  }
}

// Check if `index` in `value` is inside an alignment row.
function alignment(value, index) {
  var start = value.lastIndexOf(lineFeed, index)
  var end = value.indexOf(lineFeed, index)
  var char

  end = end === -1 ? value.length : end

  while (++start < end) {
    char = value.charAt(start)

    if (
      char !== colon &&
      char !== dash &&
      char !== space &&
      char !== verticalBar
    ) {
      return false
    }
  }

  return true
}

// Check if `node` is a text node.
function text(node) {
  return node && node.type === 'text'
}

// Check if `value` ends in a protocol.
function protocol(value) {
  var val = value.slice(-6).toLowerCase()
  return val === mailto || val.slice(-5) === https || val.slice(-4) === http
}

},{"./util/entity-prefix-length":244,"is-alphanumeric":86,"is-decimal":89,"is-whitespace-character":92,"markdown-escapes":95}],233:[function(require,module,exports){
'use strict'

module.exports = all

// Visit all children of `parent`.
function all(parent) {
  var self = this
  var children = parent.children
  var length = children.length
  var results = []
  var index = -1

  while (++index < length) {
    results[index] = self.visit(children[index], parent)
  }

  return results
}

},{}],234:[function(require,module,exports){
'use strict'

module.exports = block

var lineFeed = '\n'

var blank = lineFeed + lineFeed
var triple = blank + lineFeed
var comment = blank + '<!---->' + blank

// Stringify a block node with block children (e.g., `root` or `blockquote`).
// Knows about code following a list, or adjacent lists with similar bullets,
// and places an extra line feed between them.
function block(node) {
  var self = this
  var options = self.options
  var fences = options.fences
  var gap = options.commonmark ? comment : triple
  var values = []
  var children = node.children
  var length = children.length
  var index = -1
  var prev
  var child

  while (++index < length) {
    prev = child
    child = children[index]

    if (prev) {
      // A list preceding another list that are equally ordered, or a
      // list preceding an indented code block, need a gap between them,
      // so as not to see them as one list, or content of the list,
      // respectively.
      //
      // In commonmark, only something that breaks both up can do that,
      // so we opt for an empty, invisible comment.  In other flavours,
      // two blank lines are fine.
      if (
        prev.type === 'list' &&
        ((child.type === 'list' && prev.ordered === child.ordered) ||
          (child.type === 'code' && (!child.lang && !fences)))
      ) {
        values.push(gap)
      } else {
        values.push(blank)
      }
    }

    values.push(self.visit(child, node))
  }

  return values.join('')
}

},{}],235:[function(require,module,exports){
'use strict'

var compact = require('mdast-util-compact')

module.exports = compile

// Stringify the given tree.
function compile() {
  return this.visit(compact(this.tree, this.options.commonmark))
}

},{"mdast-util-compact":97}],236:[function(require,module,exports){
'use strict'

module.exports = one

function one(node, parent) {
  var self = this
  var visitors = self.visitors

  // Fail on unknown nodes.
  if (typeof visitors[node.type] !== 'function') {
    self.file.fail(
      new Error(
        'Missing compiler for node of type `' + node.type + '`: `' + node + '`'
      ),
      node
    )
  }

  return visitors[node.type].call(self, node, parent)
}

},{}],237:[function(require,module,exports){
'use strict'

module.exports = orderedItems

var lineFeed = '\n'
var dot = '.'

var blank = lineFeed + lineFeed

// Visit ordered list items.
//
// Starts the list with
// `node.start` and increments each following list item
// bullet by one:
//
//     2. foo
//     3. bar
//
// In `incrementListMarker: false` mode, does not increment
// each marker and stays on `node.start`:
//
//     1. foo
//     1. bar
function orderedItems(node) {
  var self = this
  var fn = self.visitors.listItem
  var increment = self.options.incrementListMarker
  var values = []
  var start = node.start
  var children = node.children
  var length = children.length
  var index = -1
  var bullet

  start = start == null ? 1 : start

  while (++index < length) {
    bullet = (increment ? start + index : start) + dot
    values[index] = fn.call(self, children[index], node, index, bullet)
  }

  return values.join(node.spread ? blank : lineFeed)
}

},{}],238:[function(require,module,exports){
'use strict'

module.exports = unorderedItems

var lineFeed = '\n'

var blank = lineFeed + lineFeed

// Visit unordered list items.  Uses `options.bullet` as each item’s bullet.
function unorderedItems(node) {
  var self = this
  var bullet = self.options.bullet
  var fn = self.visitors.listItem
  var children = node.children
  var length = children.length
  var index = -1
  var values = []

  while (++index < length) {
    values[index] = fn.call(self, children[index], node, index, bullet)
  }

  return values.join(node.spread ? blank : lineFeed)
}

},{}],239:[function(require,module,exports){
'use strict'

var xtend = require('xtend')
var encode = require('stringify-entities')
var defaults = require('./defaults')
var escapeFactory = require('./escape')
var identity = require('./util/identity')

module.exports = setOptions

// Map of applicable enums.
var maps = {
  entities: {true: true, false: true, numbers: true, escape: true},
  bullet: {'*': true, '-': true, '+': true},
  rule: {'-': true, _: true, '*': true},
  listItemIndent: {tab: true, mixed: true, 1: true},
  emphasis: {_: true, '*': true},
  strong: {_: true, '*': true},
  fence: {'`': true, '~': true}
}

// Expose `validate`.
var validate = {
  boolean: validateBoolean,
  string: validateString,
  number: validateNumber,
  function: validateFunction
}

// Set options.  Does not overwrite previously set options.
function setOptions(options) {
  var self = this
  var current = self.options
  var ruleRepetition
  var key

  if (options == null) {
    options = {}
  } else if (typeof options === 'object') {
    options = xtend(options)
  } else {
    throw new Error('Invalid value `' + options + '` for setting `options`')
  }

  for (key in defaults) {
    validate[typeof defaults[key]](options, key, current[key], maps[key])
  }

  ruleRepetition = options.ruleRepetition

  if (ruleRepetition && ruleRepetition < 3) {
    raise(ruleRepetition, 'options.ruleRepetition')
  }

  self.encode = encodeFactory(String(options.entities))
  self.escape = escapeFactory(options)

  self.options = options

  return self
}

// Validate a value to be boolean. Defaults to `def`.  Raises an exception with
// `context[name]` when not a boolean.
function validateBoolean(context, name, def) {
  var value = context[name]

  if (value == null) {
    value = def
  }

  if (typeof value !== 'boolean') {
    raise(value, 'options.' + name)
  }

  context[name] = value
}

// Validate a value to be boolean. Defaults to `def`.  Raises an exception with
// `context[name]` when not a boolean.
function validateNumber(context, name, def) {
  var value = context[name]

  if (value == null) {
    value = def
  }

  if (isNaN(value)) {
    raise(value, 'options.' + name)
  }

  context[name] = value
}

// Validate a value to be in `map`. Defaults to `def`.  Raises an exception
// with `context[name]` when not in `map`.
function validateString(context, name, def, map) {
  var value = context[name]

  if (value == null) {
    value = def
  }

  value = String(value)

  if (!(value in map)) {
    raise(value, 'options.' + name)
  }

  context[name] = value
}

// Validate a value to be function. Defaults to `def`.  Raises an exception
// with `context[name]` when not a function.
function validateFunction(context, name, def) {
  var value = context[name]

  if (value == null) {
    value = def
  }

  if (typeof value !== 'function') {
    raise(value, 'options.' + name)
  }

  context[name] = value
}

// Factory to encode HTML entities.  Creates a no-operation function when
// `type` is `'false'`, a function which encodes using named references when
// `type` is `'true'`, and a function which encodes using numbered references
// when `type` is `'numbers'`.
function encodeFactory(type) {
  var options = {}

  if (type === 'false') {
    return identity
  }

  if (type === 'true') {
    options.useNamedReferences = true
  }

  if (type === 'escape') {
    options.escapeOnly = true
    options.useNamedReferences = true
  }

  return wrapped

  // Encode HTML entities using the bound options.
  function wrapped(value) {
    return encode(value, options)
  }
}

// Throw an exception with in its `message` `value` and `name`.
function raise(value, name) {
  throw new Error('Invalid value `' + value + '` for setting `' + name + '`')
}

},{"./defaults":231,"./escape":232,"./util/identity":245,"stringify-entities":278,"xtend":301}],240:[function(require,module,exports){
'use strict'

var entityPrefixLength = require('./entity-prefix-length')

module.exports = copy

var ampersand = '&'

var punctuationExppresion = /[-!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~_]/

// For shortcut and collapsed reference links, the contents is also an
// identifier, so we need to restore the original encoding and escaping
// that were present in the source string.
//
// This function takes the unescaped & unencoded value from shortcut’s
// child nodes and the identifier and encodes the former according to
// the latter.
function copy(value, identifier) {
  var length = value.length
  var count = identifier.length
  var result = []
  var position = 0
  var index = 0
  var start

  while (index < length) {
    // Take next non-punctuation characters from `value`.
    start = index

    while (index < length && !punctuationExppresion.test(value.charAt(index))) {
      index += 1
    }

    result.push(value.slice(start, index))

    // Advance `position` to the next punctuation character.
    while (
      position < count &&
      !punctuationExppresion.test(identifier.charAt(position))
    ) {
      position += 1
    }

    // Take next punctuation characters from `identifier`.
    start = position

    while (
      position < count &&
      punctuationExppresion.test(identifier.charAt(position))
    ) {
      if (identifier.charAt(position) === ampersand) {
        position += entityPrefixLength(identifier.slice(position))
      }

      position += 1
    }

    result.push(identifier.slice(start, position))

    // Advance `index` to the next non-punctuation character.
    while (index < length && punctuationExppresion.test(value.charAt(index))) {
      index += 1
    }
  }

  return result.join('')
}

},{"./entity-prefix-length":244}],241:[function(require,module,exports){
'use strict'

module.exports = enclose

var quotationMark = '"'
var apostrophe = "'"

// There is currently no way to support nested delimiters across Markdown.pl,
// CommonMark, and GitHub (RedCarpet).  The following code supports Markdown.pl
// and GitHub.
// CommonMark is not supported when mixing double- and single quotes inside a
// title.
function enclose(title) {
  var delimiter =
    title.indexOf(quotationMark) === -1 ? quotationMark : apostrophe
  return delimiter + title + delimiter
}

},{}],242:[function(require,module,exports){
'use strict'

var count = require('ccount')

module.exports = enclose

var leftParenthesis = '('
var rightParenthesis = ')'
var lessThan = '<'
var greaterThan = '>'

var expression = /\s/

// Wrap `url` in angle brackets when needed, or when
// forced.
// In links, images, and definitions, the URL part needs
// to be enclosed when it:
//
// - has a length of `0`
// - contains white-space
// - has more or less opening than closing parentheses
function enclose(uri, always) {
  if (
    always ||
    uri.length === 0 ||
    expression.test(uri) ||
    count(uri, leftParenthesis) !== count(uri, rightParenthesis)
  ) {
    return lessThan + uri + greaterThan
  }

  return uri
}

},{"ccount":7}],243:[function(require,module,exports){
'use strict'

var identity = require('./identity')

module.exports = enter

// Shortcut and collapsed link references need no escaping and encoding during
// the processing of child nodes (it must be implied from identifier).
//
// This toggler turns encoding and escaping off for shortcut and collapsed
// references.
//
// Implies `enterLink`.
function enter(compiler, node) {
  var encode = compiler.encode
  var escape = compiler.escape
  var exitLink = compiler.enterLink()

  if (node.referenceType !== 'shortcut' && node.referenceType !== 'collapsed') {
    return exitLink
  }

  compiler.escape = identity
  compiler.encode = identity

  return exit

  function exit() {
    compiler.encode = encode
    compiler.escape = escape
    exitLink()
  }
}

},{"./identity":245}],244:[function(require,module,exports){
'use strict'

var decode = require('parse-entities')

module.exports = length

var ampersand = '&'

// Returns the length of HTML entity that is a prefix of the given string
// (excluding the ampersand), 0 if it does not start with an entity.
function length(value) {
  var prefix

  /* istanbul ignore if - Currently also tested for at implemention, but we
   * keep it here because that’s proper. */
  if (value.charAt(0) !== ampersand) {
    return 0
  }

  prefix = value.split(ampersand, 2).join(ampersand)

  return prefix.length - decode(prefix).length
}

},{"parse-entities":134}],245:[function(require,module,exports){
'use strict'

module.exports = identity

function identity(value) {
  return value
}

},{}],246:[function(require,module,exports){
'use strict'

module.exports = label

var leftSquareBracket = '['
var rightSquareBracket = ']'

var shortcut = 'shortcut'
var collapsed = 'collapsed'

// Stringify a reference label.
// Because link references are easily, mistakingly, created (for example,
// `[foo]`), reference nodes have an extra property depicting how it looked in
// the original document, so stringification can cause minimal changes.
function label(node) {
  var type = node.referenceType

  if (type === shortcut) {
    return ''
  }

  return (
    leftSquareBracket +
    (type === collapsed ? '' : node.label || node.identifier) +
    rightSquareBracket
  )
}

},{}],247:[function(require,module,exports){
'use strict'

var repeat = require('repeat-string')

module.exports = pad

var lineFeed = '\n'
var space = ' '

var tabSize = 4

// Pad `value` with `level * tabSize` spaces.  Respects lines.  Ignores empty
// lines.
function pad(value, level) {
  var values = value.split(lineFeed)
  var index = values.length
  var padding = repeat(space, level * tabSize)

  while (index--) {
    if (values[index].length !== 0) {
      values[index] = padding + values[index]
    }
  }

  return values.join(lineFeed)
}

},{"repeat-string":273}],248:[function(require,module,exports){
'use strict'

module.exports = blockquote

var lineFeed = '\n'
var space = ' '
var greaterThan = '>'

function blockquote(node) {
  var values = this.block(node).split(lineFeed)
  var result = []
  var length = values.length
  var index = -1
  var value

  while (++index < length) {
    value = values[index]
    result[index] = (value ? space : '') + value
  }

  return greaterThan + result.join(lineFeed + greaterThan)
}

},{}],249:[function(require,module,exports){
'use strict'

module.exports = lineBreak

var backslash = '\\'
var lineFeed = '\n'
var space = ' '

var commonmark = backslash + lineFeed
var normal = space + space + lineFeed

function lineBreak() {
  return this.options.commonmark ? commonmark : normal
}

},{}],250:[function(require,module,exports){
'use strict'

var streak = require('longest-streak')
var repeat = require('repeat-string')
var pad = require('../util/pad')

module.exports = code

var lineFeed = '\n'
var space = ' '

// Stringify code.
// Creates indented code when:
//
// - No language tag exists
// - Not in `fences: true` mode
// - A non-empty value exists
//
// Otherwise, GFM fenced code is created:
//
// ````markdown
// ```js
// foo();
// ```
// ````
//
// When in ``fence: `~` `` mode, uses tildes as fences:
//
// ```markdown
// ~~~js
// foo();
// ~~~
// ```
//
// Knows about internal fences:
//
// `````markdown
// ````markdown
// ```javascript
// foo();
// ```
// ````
// `````
function code(node, parent) {
  var self = this
  var value = node.value
  var options = self.options
  var marker = options.fence
  var info = node.lang || ''
  var fence

  if (info && node.meta) {
    info += space + node.meta
  }

  info = self.encode(self.escape(info, node))

  // Without (needed) fences.
  if (!info && !options.fences && value) {
    // Throw when pedantic, in a list item which isn’t compiled using a tab.
    if (
      parent &&
      parent.type === 'listItem' &&
      options.listItemIndent !== 'tab' &&
      options.pedantic
    ) {
      self.file.fail(
        'Cannot indent code properly. See https://git.io/fxKR8',
        node.position
      )
    }

    return pad(value, 1)
  }

  fence = repeat(marker, Math.max(streak(value, marker) + 1, 3))

  return fence + info + lineFeed + value + lineFeed + fence
}

},{"../util/pad":247,"longest-streak":94,"repeat-string":273}],251:[function(require,module,exports){
'use strict'

var uri = require('../util/enclose-uri')
var title = require('../util/enclose-title')

module.exports = definition

var space = ' '
var colon = ':'
var leftSquareBracket = '['
var rightSquareBracket = ']'

// Stringify an URL definition.
//
// Is smart about enclosing `url` (see `encloseURI()`) and `title` (see
// `encloseTitle()`).
//
// ```markdown
// [foo]: <foo at bar dot com> 'An "example" e-mail'
// ```
function definition(node) {
  var content = uri(node.url)

  if (node.title) {
    content += space + title(node.title)
  }

  return (
    leftSquareBracket +
    (node.label || node.identifier) +
    rightSquareBracket +
    colon +
    space +
    content
  )
}

},{"../util/enclose-title":241,"../util/enclose-uri":242}],252:[function(require,module,exports){
'use strict'

module.exports = strikethrough

var tilde = '~'

var fence = tilde + tilde

function strikethrough(node) {
  return fence + this.all(node).join('') + fence
}

},{}],253:[function(require,module,exports){
'use strict'

module.exports = emphasis

var underscore = '_'
var asterisk = '*'

// Stringify an `emphasis`.
//
// The marker used is configurable through `emphasis`, which defaults to an
// underscore (`'_'`) but also accepts an asterisk (`'*'`):
//
// ```markdown
// *foo*
// ```
//
// In `pedantic` mode, text which itself contains an underscore will cause the
// marker to default to an asterisk instead:
//
// ```markdown
// *foo_bar*
// ```
function emphasis(node) {
  var marker = this.options.emphasis
  var content = this.all(node).join('')

  // When in pedantic mode, prevent using underscore as the marker when there
  // are underscores in the content.
  if (
    this.options.pedantic &&
    marker === underscore &&
    content.indexOf(marker) !== -1
  ) {
    marker = asterisk
  }

  return marker + content + marker
}

},{}],254:[function(require,module,exports){
'use strict'

var repeat = require('repeat-string')

var lineFeed = '\n'
var space = ' '
var colon = ':'
var leftSquareBracket = '['
var rightSquareBracket = ']'
var caret = '^'

var tabSize = 4
var blank = lineFeed + lineFeed
var indent = repeat(space, tabSize)

module.exports = footnoteDefinition

function footnoteDefinition(node) {
  var content = this.all(node).join(blank + indent)

  return (
    leftSquareBracket +
    caret +
    (node.label || node.identifier) +
    rightSquareBracket +
    colon +
    space +
    content
  )
}

},{"repeat-string":273}],255:[function(require,module,exports){
'use strict'

module.exports = footnoteReference

var leftSquareBracket = '['
var rightSquareBracket = ']'
var caret = '^'

function footnoteReference(node) {
  return (
    leftSquareBracket +
    caret +
    (node.label || node.identifier) +
    rightSquareBracket
  )
}

},{}],256:[function(require,module,exports){
'use strict'

module.exports = footnote

var leftSquareBracket = '['
var rightSquareBracket = ']'
var caret = '^'

function footnote(node) {
  return (
    leftSquareBracket + caret + this.all(node).join('') + rightSquareBracket
  )
}

},{}],257:[function(require,module,exports){
'use strict'

var repeat = require('repeat-string')

module.exports = heading

var lineFeed = '\n'
var space = ' '
var numberSign = '#'
var dash = '-'
var equalsTo = '='

// Stringify a heading.
//
// In `setext: true` mode and when `depth` is smaller than three, creates a
// setext header:
//
// ```markdown
// Foo
// ===
// ```
//
// Otherwise, an ATX header is generated:
//
// ```markdown
// ### Foo
// ```
//
// In `closeAtx: true` mode, the header is closed with hashes:
//
// ```markdown
// ### Foo ###
// ```
function heading(node) {
  var self = this
  var depth = node.depth
  var setext = self.options.setext
  var closeAtx = self.options.closeAtx
  var content = self.all(node).join('')
  var prefix

  if (setext && depth < 3) {
    return (
      content + lineFeed + repeat(depth === 1 ? equalsTo : dash, content.length)
    )
  }

  prefix = repeat(numberSign, node.depth)

  return prefix + space + content + (closeAtx ? space + prefix : '')
}

},{"repeat-string":273}],258:[function(require,module,exports){
'use strict'

module.exports = html

function html(node) {
  return node.value
}

},{}],259:[function(require,module,exports){
'use strict'

var label = require('../util/label')

module.exports = imageReference

var leftSquareBracket = '['
var rightSquareBracket = ']'
var exclamationMark = '!'

function imageReference(node) {
  return (
    exclamationMark +
    leftSquareBracket +
    (this.encode(node.alt, node) || '') +
    rightSquareBracket +
    label(node)
  )
}

},{"../util/label":246}],260:[function(require,module,exports){
'use strict'

var uri = require('../util/enclose-uri')
var title = require('../util/enclose-title')

module.exports = image

var space = ' '
var leftParenthesis = '('
var rightParenthesis = ')'
var leftSquareBracket = '['
var rightSquareBracket = ']'
var exclamationMark = '!'

// Stringify an image.
//
// Is smart about enclosing `url` (see `encloseURI()`) and `title` (see
// `encloseTitle()`).
//
// ```markdown
// ![foo](</fav icon.png> 'My "favourite" icon')
// ```
//
// Supports named entities in `url`, `alt`, and `title` when in
// `settings.encode` mode.
function image(node) {
  var self = this
  var content = uri(self.encode(node.url || '', node))
  var exit = self.enterLink()
  var alt = self.encode(self.escape(node.alt || '', node))

  exit()

  if (node.title) {
    content += space + title(self.encode(node.title, node))
  }

  return (
    exclamationMark +
    leftSquareBracket +
    alt +
    rightSquareBracket +
    leftParenthesis +
    content +
    rightParenthesis
  )
}

},{"../util/enclose-title":241,"../util/enclose-uri":242}],261:[function(require,module,exports){
'use strict'

var streak = require('longest-streak')
var repeat = require('repeat-string')

module.exports = inlineCode

var space = ' '
var graveAccent = '`'

// Stringify inline code.
//
// Knows about internal ticks (`\``), and ensures one more tick is used to
// enclose the inline code:
//
// ````markdown
// ```foo ``bar`` baz```
// ````
//
// Even knows about inital and final ticks:
//
// ``markdown
// `` `foo ``
// `` foo` ``
// ```
function inlineCode(node) {
  var value = node.value
  var ticks = repeat(graveAccent, streak(value, graveAccent) + 1)
  var start = ticks
  var end = ticks

  if (value.charAt(0) === graveAccent) {
    start += space
  }

  if (value.charAt(value.length - 1) === graveAccent) {
    end = space + end
  }

  return start + value + end
}

},{"longest-streak":94,"repeat-string":273}],262:[function(require,module,exports){
'use strict'

var copy = require('../util/copy-identifier-encoding')
var label = require('../util/label')

module.exports = linkReference

var leftSquareBracket = '['
var rightSquareBracket = ']'

var shortcut = 'shortcut'
var collapsed = 'collapsed'

function linkReference(node) {
  var self = this
  var type = node.referenceType
  var exit = self.enterLinkReference(self, node)
  var value = self.all(node).join('')

  exit()

  if (type === shortcut || type === collapsed) {
    value = copy(value, node.label || node.identifier)
  }

  return leftSquareBracket + value + rightSquareBracket + label(node)
}

},{"../util/copy-identifier-encoding":240,"../util/label":246}],263:[function(require,module,exports){
'use strict'

var uri = require('../util/enclose-uri')
var title = require('../util/enclose-title')

module.exports = link

var space = ' '
var leftSquareBracket = '['
var rightSquareBracket = ']'
var leftParenthesis = '('
var rightParenthesis = ')'

// Expression for a protocol:
// See <http://en.wikipedia.org/wiki/URI_scheme#Generic_syntax>.
var protocol = /^[a-z][a-z+.-]+:\/?/i

// Stringify a link.
//
// When no title exists, the compiled `children` equal `url`, and `url` starts
// with a protocol, an auto link is created:
//
// ```markdown
// <http://example.com>
// ```
//
// Otherwise, is smart about enclosing `url` (see `encloseURI()`) and `title`
// (see `encloseTitle()`).
// ```
//
// ```markdown
// [foo](<foo at bar dot com> 'An "example" e-mail')
// ```
//
// Supports named entities in the `url` and `title` when in `settings.encode`
// mode.
function link(node) {
  var self = this
  var content = self.encode(node.url || '', node)
  var exit = self.enterLink()
  var escaped = self.encode(self.escape(node.url || '', node))
  var value = self.all(node).join('')

  exit()

  if (node.title == null && protocol.test(content) && escaped === value) {
    // Backslash escapes do not work in autolinks, so we do not escape.
    return uri(self.encode(node.url), true)
  }

  content = uri(content)

  if (node.title) {
    content += space + title(self.encode(self.escape(node.title, node), node))
  }

  return (
    leftSquareBracket +
    value +
    rightSquareBracket +
    leftParenthesis +
    content +
    rightParenthesis
  )
}

},{"../util/enclose-title":241,"../util/enclose-uri":242}],264:[function(require,module,exports){
'use strict'

var repeat = require('repeat-string')
var pad = require('../util/pad')

module.exports = listItem

var lineFeed = '\n'
var space = ' '
var leftSquareBracket = '['
var rightSquareBracket = ']'
var lowercaseX = 'x'

var ceil = Math.ceil
var blank = lineFeed + lineFeed

var tabSize = 4

// Stringify a list item.
//
// Prefixes the content with a checked checkbox when `checked: true`:
//
// ```markdown
// [x] foo
// ```
//
// Prefixes the content with an unchecked checkbox when `checked: false`:
//
// ```markdown
// [ ] foo
// ```
function listItem(node, parent, position, bullet) {
  var self = this
  var style = self.options.listItemIndent
  var marker = bullet || self.options.bullet
  var spread = node.spread == null ? true : node.spread
  var checked = node.checked
  var children = node.children
  var length = children.length
  var values = []
  var index = -1
  var value
  var indent
  var spacing

  while (++index < length) {
    values[index] = self.visit(children[index], node)
  }

  value = values.join(spread ? blank : lineFeed)

  if (typeof checked === 'boolean') {
    // Note: I’d like to be able to only add the space between the check and
    // the value, but unfortunately github does not support empty list-items
    // with a checkbox :(
    value =
      leftSquareBracket +
      (checked ? lowercaseX : space) +
      rightSquareBracket +
      space +
      value
  }

  if (style === '1' || (style === 'mixed' && value.indexOf(lineFeed) === -1)) {
    indent = marker.length + 1
    spacing = space
  } else {
    indent = ceil((marker.length + 1) / tabSize) * tabSize
    spacing = repeat(space, indent - marker.length)
  }

  return value
    ? marker + spacing + pad(value, indent / tabSize).slice(indent)
    : marker
}

},{"../util/pad":247,"repeat-string":273}],265:[function(require,module,exports){
'use strict'

module.exports = list

function list(node) {
  var fn = node.ordered ? this.visitOrderedItems : this.visitUnorderedItems
  return fn.call(this, node)
}

},{}],266:[function(require,module,exports){
'use strict'

module.exports = paragraph

function paragraph(node) {
  return this.all(node).join('')
}

},{}],267:[function(require,module,exports){
'use strict'

module.exports = root

var lineFeed = '\n'

// Stringify a root.
// Adds a final newline to ensure valid POSIX files. */
function root(node) {
  return this.block(node) + lineFeed
}

},{}],268:[function(require,module,exports){
'use strict'

var repeat = require('repeat-string')

module.exports = strong

// Stringify a `strong`.
//
// The marker used is configurable by `strong`, which defaults to an asterisk
// (`'*'`) but also accepts an underscore (`'_'`):
//
// ```markdown
// __foo__
// ```
function strong(node) {
  var marker = repeat(this.options.strong, 2)
  return marker + this.all(node).join('') + marker
}

},{"repeat-string":273}],269:[function(require,module,exports){
'use strict'

module.exports = tableCell

function tableCell(node) {
  return this.all(node).join('')
}

},{}],270:[function(require,module,exports){
'use strict'

var markdownTable = require('markdown-table')

module.exports = table

var space = ' '
var verticalBar = '|'

// Stringify table.
//
// Creates a fenced table by default, but not in `looseTable: true` mode:
//
// ```markdown
//  Foo | Bar
// :-: | ---
// Baz | Qux
//
// NOTE: Be careful with `looseTable: true` mode, as a loose table inside an
// indented code block on GitHub renders as an actual table!
//
// Creates a spaced table by default, but not in `spacedTable: false`:
//
// ```markdown
// |Foo|Bar|
// |:-:|---|
// |Baz|Qux|
// ```
function table(node) {
  var self = this
  var options = self.options
  var loose = options.looseTable
  var spaced = options.spacedTable
  var pad = options.paddedTable
  var stringLength = options.stringLength
  var rows = node.children
  var index = rows.length
  var exit = self.enterTable()
  var result = []
  var start
  var end

  while (index--) {
    result[index] = self.all(rows[index])
  }

  exit()

  if (loose) {
    start = ''
    end = ''
  } else if (spaced) {
    start = verticalBar + space
    end = space + verticalBar
  } else {
    start = verticalBar
    end = verticalBar
  }

  return markdownTable(result, {
    align: node.align,
    pad: pad,
    start: start,
    end: end,
    stringLength: stringLength,
    delimiter: spaced ? space + verticalBar + space : verticalBar
  })
}

},{"markdown-table":96}],271:[function(require,module,exports){
'use strict'

module.exports = text

// Stringify text.
// Supports named entities in `settings.encode: true` mode:
//
// ```markdown
// AT&amp;T
// ```
//
// Supports numbered entities in `settings.encode: numbers` mode:
//
// ```markdown
// AT&#x26;T
// ```
function text(node, parent) {
  return this.encode(this.escape(node.value, node, parent), node)
}

},{}],272:[function(require,module,exports){
'use strict'

var repeat = require('repeat-string')

module.exports = thematic

var space = ' '

// Stringify a `thematic-break`.
// The character used is configurable through `rule`: (`'_'`):
//
// ```markdown
// ___
// ```
//
// The number of repititions is defined through `ruleRepetition` (`6`):
//
// ```markdown
// ******
// ```
//
// Whether spaces delimit each character, is configured through `ruleSpaces`
// (`true`):
// ```markdown
// * * *
// ```
function thematic() {
  var options = this.options
  var rule = repeat(options.rule, options.ruleRepetition)
  return options.ruleSpaces ? rule.split('').join(space) : rule
}

},{"repeat-string":273}],273:[function(require,module,exports){
/*!
 * repeat-string <https://github.com/jonschlinkert/repeat-string>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

/**
 * Results cache
 */

var res = '';
var cache;

/**
 * Expose `repeat`
 */

module.exports = repeat;

/**
 * Repeat the given `string` the specified `number`
 * of times.
 *
 * **Example:**
 *
 * ```js
 * var repeat = require('repeat-string');
 * repeat('A', 5);
 * //=> AAAAA
 * ```
 *
 * @param {String} `string` The string to repeat
 * @param {Number} `number` The number of times to repeat the string
 * @return {String} Repeated string
 * @api public
 */

function repeat(str, num) {
  if (typeof str !== 'string') {
    throw new TypeError('expected a string');
  }

  // cover common, quick use cases
  if (num === 1) return str;
  if (num === 2) return str + str;

  var max = str.length * num;
  if (cache !== str || typeof cache === 'undefined') {
    cache = str;
    res = '';
  } else if (res.length >= max) {
    return res.substr(0, max);
  }

  while (max > res.length && num > 1) {
    if (num & 1) {
      res += str;
    }

    num >>= 1;
    str += str;
  }

  res += str;
  res = res.substr(0, max);
  return res;
}

},{}],274:[function(require,module,exports){
'use strict';

var path = require('path');

function replaceExt(npath, ext) {
  if (typeof npath !== 'string') {
    return npath;
  }

  if (npath.length === 0) {
    return npath;
  }

  var nFileName = path.basename(npath, path.extname(npath)) + ext;
  return path.join(path.dirname(npath), nFileName);
}

module.exports = replaceExt;

},{"path":1}],275:[function(require,module,exports){
'use strict'

var trim = require('trim')

exports.parse = parse
exports.stringify = stringify

var empty = ''
var space = ' '
var whiteSpace = /[ \t\n\r\f]+/g

function parse(value) {
  var input = trim(String(value || empty))
  return input === empty ? [] : input.split(whiteSpace)
}

function stringify(values) {
  return trim(values.join(space))
}

},{"trim":281}],276:[function(require,module,exports){
'use strict'

module.exports = factory

/* Construct a state `toggler`: a function which inverses
 * `property` in context based on its current value.
 * The by `toggler` returned function restores that value. */
function factory(key, state, ctx) {
  return enter

  function enter() {
    var context = ctx || this
    var current = context[key]

    context[key] = !state

    return exit

    function exit() {
      context[key] = current
    }
  }
}

},{}],277:[function(require,module,exports){
module.exports=[
  "cent",
  "copy",
  "divide",
  "gt",
  "lt",
  "not",
  "para",
  "times"
]

},{}],278:[function(require,module,exports){
'use strict'

var entities = require('character-entities-html4')
var legacy = require('character-entities-legacy')
var hexadecimal = require('is-hexadecimal')
var alphanumerical = require('is-alphanumerical')
var dangerous = require('./dangerous.json')

/* Expose. */
module.exports = encode
encode.escape = escape

var own = {}.hasOwnProperty

/* List of enforced escapes. */
var escapes = ['"', "'", '<', '>', '&', '`']

/* Map of characters to names. */
var characters = construct()

/* Default escapes. */
var defaultEscapes = toExpression(escapes)

/* Surrogate pairs. */
var surrogatePair = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g

/* Non-ASCII characters. */
// eslint-disable-next-line no-control-regex, unicorn/no-hex-escape
var bmp = /[\x01-\t\x0B\f\x0E-\x1F\x7F\x81\x8D\x8F\x90\x9D\xA0-\uFFFF]/g

/* Encode special characters in `value`. */
function encode(value, options) {
  var settings = options || {}
  var subset = settings.subset
  var set = subset ? toExpression(subset) : defaultEscapes
  var escapeOnly = settings.escapeOnly
  var omit = settings.omitOptionalSemicolons

  value = value.replace(set, function(char, pos, val) {
    return one(char, val.charAt(pos + 1), settings)
  })

  if (subset || escapeOnly) {
    return value
  }

  return value
    .replace(surrogatePair, replaceSurrogatePair)
    .replace(bmp, replaceBmp)

  function replaceSurrogatePair(pair, pos, val) {
    return toHexReference(
      (pair.charCodeAt(0) - 0xd800) * 0x400 +
        pair.charCodeAt(1) -
        0xdc00 +
        0x10000,
      val.charAt(pos + 2),
      omit
    )
  }

  function replaceBmp(char, pos, val) {
    return one(char, val.charAt(pos + 1), settings)
  }
}

/* Shortcut to escape special characters in HTML. */
function escape(value) {
  return encode(value, {
    escapeOnly: true,
    useNamedReferences: true
  })
}

/* Encode `char` according to `options`. */
function one(char, next, options) {
  var shortest = options.useShortestReferences
  var omit = options.omitOptionalSemicolons
  var named
  var numeric

  if ((shortest || options.useNamedReferences) && own.call(characters, char)) {
    named = toNamed(characters[char], next, omit, options.attribute)
  }

  if (shortest || !named) {
    numeric = toHexReference(char.charCodeAt(0), next, omit)
  }

  if (named && (!shortest || named.length < numeric.length)) {
    return named
  }

  return numeric
}

/* Transform `code` into an entity. */
function toNamed(name, next, omit, attribute) {
  var value = '&' + name

  if (
    omit &&
    own.call(legacy, name) &&
    dangerous.indexOf(name) === -1 &&
    (!attribute || (next && next !== '=' && !alphanumerical(next)))
  ) {
    return value
  }

  return value + ';'
}

/* Transform `code` into a hexadecimal character reference. */
function toHexReference(code, next, omit) {
  var value = '&#x' + code.toString(16).toUpperCase()
  return omit && next && !hexadecimal(next) ? value : value + ';'
}

/* Create an expression for `characters`. */
function toExpression(characters) {
  return new RegExp('[' + characters.join('') + ']', 'g')
}

/* Construct the map. */
function construct() {
  var chars = {}
  var name

  for (name in entities) {
    chars[entities[name]] = name
  }

  return chars
}

},{"./dangerous.json":277,"character-entities-html4":8,"character-entities-legacy":9,"is-alphanumerical":87,"is-hexadecimal":90}],279:[function(require,module,exports){
'use strict'

module.exports = trimLines

var ws = /[ \t]*\n+[ \t]*/g
var newline = '\n'

function trimLines(value) {
  return String(value).replace(ws, newline)
}

},{}],280:[function(require,module,exports){
'use strict'

module.exports = trimTrailingLines

var line = '\n'

/* Remove final newline characters from `value`. */
function trimTrailingLines(value) {
  var val = String(value)
  var index = val.length

  while (val.charAt(--index) === line) {
    /* Empty */
  }

  return val.slice(0, index + 1)
}

},{}],281:[function(require,module,exports){

exports = module.exports = trim;

function trim(str){
  return str.replace(/^\s*|\s*$/g, '');
}

exports.left = function(str){
  return str.replace(/^\s*/, '');
};

exports.right = function(str){
  return str.replace(/\s*$/, '');
};

},{}],282:[function(require,module,exports){
'use strict'

var wrap = require('./wrap.js')

module.exports = trough

trough.wrap = wrap

var slice = [].slice

/* Create new middleware. */
function trough() {
  var fns = []
  var middleware = {}

  middleware.run = run
  middleware.use = use

  return middleware

  /* Run `fns`.  Last argument must be
   * a completion handler. */
  function run() {
    var index = -1
    var input = slice.call(arguments, 0, -1)
    var done = arguments[arguments.length - 1]

    if (typeof done !== 'function') {
      throw new Error('Expected function as last argument, not ' + done)
    }

    next.apply(null, [null].concat(input))

    /* Run the next `fn`, if any. */
    function next(err) {
      var fn = fns[++index]
      var params = slice.call(arguments, 0)
      var values = params.slice(1)
      var length = input.length
      var pos = -1

      if (err) {
        done(err)
        return
      }

      /* Copy non-nully input into values. */
      while (++pos < length) {
        if (values[pos] === null || values[pos] === undefined) {
          values[pos] = input[pos]
        }
      }

      input = values

      /* Next or done. */
      if (fn) {
        wrap(fn, next).apply(null, input)
      } else {
        done.apply(null, [null].concat(input))
      }
    }
  }

  /* Add `fn` to the list. */
  function use(fn) {
    if (typeof fn !== 'function') {
      throw new Error('Expected `fn` to be a function, not ' + fn)
    }

    fns.push(fn)

    return middleware
  }
}

},{"./wrap.js":283}],283:[function(require,module,exports){
'use strict'

var slice = [].slice

module.exports = wrap

/* Wrap `fn`.  Can be sync or async; return a promise,
 * receive a completion handler, return new values and
 * errors. */
function wrap(fn, callback) {
  var invoked

  return wrapped

  function wrapped() {
    var params = slice.call(arguments, 0)
    var callback = fn.length > params.length
    var result

    if (callback) {
      params.push(done)
    }

    try {
      result = fn.apply(null, params)
    } catch (err) {
      /* Well, this is quite the pickle.  `fn` received
       * a callback and invoked it (thus continuing the
       * pipeline), but later also threw an error.
       * We’re not about to restart the pipeline again,
       * so the only thing left to do is to throw the
       * thing instea. */
      if (callback && invoked) {
        throw err
      }

      return done(err)
    }

    if (!callback) {
      if (result && typeof result.then === 'function') {
        result.then(then, done)
      } else if (result instanceof Error) {
        done(result)
      } else {
        then(result)
      }
    }
  }

  /* Invoke `next`, only once. */
  function done() {
    if (!invoked) {
      invoked = true

      callback.apply(null, arguments)
    }
  }

  /* Invoke `done` with one value.
   * Tracks if an error is passed, too. */
  function then(value) {
    done(null, value)
  }
}

},{}],284:[function(require,module,exports){
'use strict'

var xtend = require('xtend')
var inherits = require('inherits')

module.exports = unherit

/* Create a custom constructor which can be modified
 * without affecting the original class. */
function unherit(Super) {
  var result
  var key
  var value

  inherits(Of, Super)
  inherits(From, Of)

  /* Clone values. */
  result = Of.prototype

  for (key in result) {
    value = result[key]

    if (value && typeof value === 'object') {
      result[key] = 'concat' in value ? value.concat() : xtend(value)
    }
  }

  return Of

  /* Constructor accepting a single argument,
   * which itself is an `arguments` object. */
  function From(parameters) {
    return Super.apply(this, parameters)
  }

  /* Constructor accepting variadic arguments. */
  function Of() {
    if (!(this instanceof Of)) {
      return new From(arguments)
    }

    return Super.apply(this, arguments)
  }
}

},{"inherits":84,"xtend":301}],285:[function(require,module,exports){
(function (process){
'use strict'

var extend = require('extend')
var bail = require('bail')
var vfile = require('vfile')
var trough = require('trough')
var string = require('x-is-string')
var plain = require('is-plain-obj')

// Expose a frozen processor.
module.exports = unified().freeze()

var slice = [].slice
var own = {}.hasOwnProperty

// Process pipeline.
var pipeline = trough()
  .use(pipelineParse)
  .use(pipelineRun)
  .use(pipelineStringify)

function pipelineParse(p, ctx) {
  ctx.tree = p.parse(ctx.file)
}

function pipelineRun(p, ctx, next) {
  p.run(ctx.tree, ctx.file, done)

  function done(err, tree, file) {
    if (err) {
      next(err)
    } else {
      ctx.tree = tree
      ctx.file = file
      next()
    }
  }
}

function pipelineStringify(p, ctx) {
  ctx.file.contents = p.stringify(ctx.tree, ctx.file)
}

// Function to create the first processor.
function unified() {
  var attachers = []
  var transformers = trough()
  var namespace = {}
  var frozen = false
  var freezeIndex = -1

  // Data management.
  processor.data = data

  // Lock.
  processor.freeze = freeze

  // Plugins.
  processor.attachers = attachers
  processor.use = use

  // API.
  processor.parse = parse
  processor.stringify = stringify
  processor.run = run
  processor.runSync = runSync
  processor.process = process
  processor.processSync = processSync

  // Expose.
  return processor

  // Create a new processor based on the processor in the current scope.
  function processor() {
    var destination = unified()
    var length = attachers.length
    var index = -1

    while (++index < length) {
      destination.use.apply(null, attachers[index])
    }

    destination.data(extend(true, {}, namespace))

    return destination
  }

  // Freeze: used to signal a processor that has finished configuration.
  //
  // For example, take unified itself.  It’s frozen.  Plugins should not be
  // added to it.  Rather, it should be extended, by invoking it, before
  // modifying it.
  //
  // In essence, always invoke this when exporting a processor.
  function freeze() {
    var values
    var plugin
    var options
    var transformer

    if (frozen) {
      return processor
    }

    while (++freezeIndex < attachers.length) {
      values = attachers[freezeIndex]
      plugin = values[0]
      options = values[1]
      transformer = null

      if (options === false) {
        continue
      }

      if (options === true) {
        values[1] = undefined
      }

      transformer = plugin.apply(processor, values.slice(1))

      if (typeof transformer === 'function') {
        transformers.use(transformer)
      }
    }

    frozen = true
    freezeIndex = Infinity

    return processor
  }

  // Data management.  Getter / setter for processor-specific informtion.
  function data(key, value) {
    if (string(key)) {
      // Set `key`.
      if (arguments.length === 2) {
        assertUnfrozen('data', frozen)

        namespace[key] = value

        return processor
      }

      // Get `key`.
      return (own.call(namespace, key) && namespace[key]) || null
    }

    // Set space.
    if (key) {
      assertUnfrozen('data', frozen)
      namespace = key
      return processor
    }

    // Get space.
    return namespace
  }

  // Plugin management.
  //
  // Pass it:
  // *   an attacher and options,
  // *   a preset,
  // *   a list of presets, attachers, and arguments (list of attachers and
  //     options).
  function use(value) {
    var settings

    assertUnfrozen('use', frozen)

    if (value === null || value === undefined) {
      // Empty.
    } else if (typeof value === 'function') {
      addPlugin.apply(null, arguments)
    } else if (typeof value === 'object') {
      if ('length' in value) {
        addList(value)
      } else {
        addPreset(value)
      }
    } else {
      throw new Error('Expected usable value, not `' + value + '`')
    }

    if (settings) {
      namespace.settings = extend(namespace.settings || {}, settings)
    }

    return processor

    function addPreset(result) {
      addList(result.plugins)

      if (result.settings) {
        settings = extend(settings || {}, result.settings)
      }
    }

    function add(value) {
      if (typeof value === 'function') {
        addPlugin(value)
      } else if (typeof value === 'object') {
        if ('length' in value) {
          addPlugin.apply(null, value)
        } else {
          addPreset(value)
        }
      } else {
        throw new Error('Expected usable value, not `' + value + '`')
      }
    }

    function addList(plugins) {
      var length
      var index

      if (plugins === null || plugins === undefined) {
        // Empty.
      } else if (typeof plugins === 'object' && 'length' in plugins) {
        length = plugins.length
        index = -1

        while (++index < length) {
          add(plugins[index])
        }
      } else {
        throw new Error('Expected a list of plugins, not `' + plugins + '`')
      }
    }

    function addPlugin(plugin, value) {
      var entry = find(plugin)

      if (entry) {
        if (plain(entry[1]) && plain(value)) {
          value = extend(entry[1], value)
        }

        entry[1] = value
      } else {
        attachers.push(slice.call(arguments))
      }
    }
  }

  function find(plugin) {
    var length = attachers.length
    var index = -1
    var entry

    while (++index < length) {
      entry = attachers[index]

      if (entry[0] === plugin) {
        return entry
      }
    }
  }

  // Parse a file (in string or vfile representation) into a unist node using
  // the `Parser` on the processor.
  function parse(doc) {
    var file = vfile(doc)
    var Parser

    freeze()
    Parser = processor.Parser
    assertParser('parse', Parser)

    if (newable(Parser)) {
      return new Parser(String(file), file).parse()
    }

    return Parser(String(file), file) // eslint-disable-line new-cap
  }

  // Run transforms on a unist node representation of a file (in string or
  // vfile representation), async.
  function run(node, file, cb) {
    assertNode(node)
    freeze()

    if (!cb && typeof file === 'function') {
      cb = file
      file = null
    }

    if (!cb) {
      return new Promise(executor)
    }

    executor(null, cb)

    function executor(resolve, reject) {
      transformers.run(node, vfile(file), done)

      function done(err, tree, file) {
        tree = tree || node
        if (err) {
          reject(err)
        } else if (resolve) {
          resolve(tree)
        } else {
          cb(null, tree, file)
        }
      }
    }
  }

  // Run transforms on a unist node representation of a file (in string or
  // vfile representation), sync.
  function runSync(node, file) {
    var complete = false
    var result

    run(node, file, done)

    assertDone('runSync', 'run', complete)

    return result

    function done(err, tree) {
      complete = true
      bail(err)
      result = tree
    }
  }

  // Stringify a unist node representation of a file (in string or vfile
  // representation) into a string using the `Compiler` on the processor.
  function stringify(node, doc) {
    var file = vfile(doc)
    var Compiler

    freeze()
    Compiler = processor.Compiler
    assertCompiler('stringify', Compiler)
    assertNode(node)

    if (newable(Compiler)) {
      return new Compiler(node, file).compile()
    }

    return Compiler(node, file) // eslint-disable-line new-cap
  }

  // Parse a file (in string or vfile representation) into a unist node using
  // the `Parser` on the processor, then run transforms on that node, and
  // compile the resulting node using the `Compiler` on the processor, and
  // store that result on the vfile.
  function process(doc, cb) {
    freeze()
    assertParser('process', processor.Parser)
    assertCompiler('process', processor.Compiler)

    if (!cb) {
      return new Promise(executor)
    }

    executor(null, cb)

    function executor(resolve, reject) {
      var file = vfile(doc)

      pipeline.run(processor, {file: file}, done)

      function done(err) {
        if (err) {
          reject(err)
        } else if (resolve) {
          resolve(file)
        } else {
          cb(null, file)
        }
      }
    }
  }

  // Process the given document (in string or vfile representation), sync.
  function processSync(doc) {
    var complete = false
    var file

    freeze()
    assertParser('processSync', processor.Parser)
    assertCompiler('processSync', processor.Compiler)
    file = vfile(doc)

    process(file, done)

    assertDone('processSync', 'process', complete)

    return file

    function done(err) {
      complete = true
      bail(err)
    }
  }
}

// Check if `func` is a constructor.
function newable(value) {
  return typeof value === 'function' && keys(value.prototype)
}

// Check if `value` is an object with keys.
function keys(value) {
  var key
  for (key in value) {
    return true
  }
  return false
}

// Assert a parser is available.
function assertParser(name, Parser) {
  if (typeof Parser !== 'function') {
    throw new Error('Cannot `' + name + '` without `Parser`')
  }
}

// Assert a compiler is available.
function assertCompiler(name, Compiler) {
  if (typeof Compiler !== 'function') {
    throw new Error('Cannot `' + name + '` without `Compiler`')
  }
}

// Assert the processor is not frozen.
function assertUnfrozen(name, frozen) {
  if (frozen) {
    throw new Error(
      'Cannot invoke `' +
        name +
        '` on a frozen processor.\nCreate a new processor first, by invoking it: use `processor()` instead of `processor`.'
    )
  }
}

// Assert `node` is a unist node.
function assertNode(node) {
  if (!node || !string(node.type)) {
    throw new Error('Expected node, got `' + node + '`')
  }
}

// Assert that `complete` is `true`.
function assertDone(name, asyncName, complete) {
  if (!complete) {
    throw new Error(
      '`' + name + '` finished async. Use `' + asyncName + '` instead'
    )
  }
}

}).call(this,require('_process'))
},{"_process":2,"bail":6,"extend":14,"is-plain-obj":91,"trough":282,"vfile":298,"x-is-string":300}],286:[function(require,module,exports){
'use strict'

var assign = require('object-assign')

module.exports = u

function u(type, props, value) {
  var node

  if (
    (value === null || value === undefined) &&
    (typeof props !== 'object' || Array.isArray(props))
  ) {
    value = props
    props = {}
  }

  node = assign({type: String(type)}, props)

  if (Array.isArray(value)) {
    node.children = value
  } else if (value !== null && value !== undefined) {
    node.value = String(value)
  }

  return node
}

},{"object-assign":132}],287:[function(require,module,exports){
'use strict'

/* Expose. */
module.exports = generated

/* Detect if a node was available in the original document. */
function generated(node) {
  var position = optional(optional(node).position)
  var start = optional(position.start)
  var end = optional(position.end)

  return !start.line || !start.column || !end.line || !end.column
}

/* Return `value` if it’s an object, an empty object
 * otherwise. */
function optional(value) {
  return value && typeof value === 'object' ? value : {}
}

},{}],288:[function(require,module,exports){
'use strict'

/* eslint-disable max-params */

/* Expose. */
module.exports = is

/* Assert if `test` passes for `node`.
 * When a `parent` node is known the `index` of node */
function is(test, node, index, parent, context) {
  var hasParent = parent !== null && parent !== undefined
  var hasIndex = index !== null && index !== undefined
  var check = convert(test)

  if (
    hasIndex &&
    (typeof index !== 'number' || index < 0 || index === Infinity)
  ) {
    throw new Error('Expected positive finite index or child node')
  }

  if (hasParent && (!is(null, parent) || !parent.children)) {
    throw new Error('Expected parent node')
  }

  if (!node || !node.type || typeof node.type !== 'string') {
    return false
  }

  if (hasParent !== hasIndex) {
    throw new Error('Expected both parent and index')
  }

  return Boolean(check.call(context, node, index, parent))
}

function convert(test) {
  if (typeof test === 'string') {
    return typeFactory(test)
  }

  if (test === null || test === undefined) {
    return ok
  }

  if (typeof test === 'object') {
    return ('length' in test ? anyFactory : matchesFactory)(test)
  }

  if (typeof test === 'function') {
    return test
  }

  throw new Error('Expected function, string, or object as test')
}

function convertAll(tests) {
  var results = []
  var length = tests.length
  var index = -1

  while (++index < length) {
    results[index] = convert(tests[index])
  }

  return results
}

/* Utility assert each property in `test` is represented
 * in `node`, and each values are strictly equal. */
function matchesFactory(test) {
  return matches

  function matches(node) {
    var key

    for (key in test) {
      if (node[key] !== test[key]) {
        return false
      }
    }

    return true
  }
}

function anyFactory(tests) {
  var checks = convertAll(tests)
  var length = checks.length

  return matches

  function matches() {
    var index = -1

    while (++index < length) {
      if (checks[index].apply(this, arguments)) {
        return true
      }
    }

    return false
  }
}

/* Utility to convert a string into a function which checks
 * a given node’s type for said string. */
function typeFactory(test) {
  return type

  function type(node) {
    return Boolean(node && node.type === test)
  }
}

/* Utility to return true. */
function ok() {
  return true
}

},{}],289:[function(require,module,exports){
'use strict'

var iterate = require('array-iterate')

module.exports = modifierFactory

// Turn `callback` into a child-modifier accepting a parent.  See
// `array-iterate` for more info.
function modifierFactory(callback) {
  return iteratorFactory(wrapperFactory(callback))
}

// Turn `callback` into a `iterator' accepting a parent.
function iteratorFactory(callback) {
  return iterator

  function iterator(parent) {
    var children = parent && parent.children

    if (!children) {
      throw new Error('Missing children in `parent` for `modifier`')
    }

    return iterate(children, callback, parent)
  }
}

// Pass the context as the third argument to `callback`.
function wrapperFactory(callback) {
  return wrapper

  function wrapper(value, index) {
    return callback(value, index, this)
  }
}

},{"array-iterate":5}],290:[function(require,module,exports){
'use strict'

/* Expose. */
var position = exports

position.start = factory('start')
position.end = factory('end')

/* Factory to get a `type` point in the positional info of a node. */
function factory(type) {
  point.displayName = type

  return point

  /* Get a point in `node.position` at a bound `type`. */
  function point(node) {
    var point = (node && node.position && node.position[type]) || {}

    return {
      line: point.line || null,
      column: point.column || null,
      offset: isNaN(point.offset) ? null : point.offset
    }
  }
}

},{}],291:[function(require,module,exports){
'use strict'

var visit = require('unist-util-visit')

module.exports = removePosition

/* Remove `position`s from `tree`. */
function removePosition(node, force) {
  visit(node, force ? hard : soft)
  return node
}

function hard(node) {
  delete node.position
}

function soft(node) {
  node.position = undefined
}

},{"unist-util-visit":294}],292:[function(require,module,exports){
'use strict'

var own = {}.hasOwnProperty

module.exports = stringify

function stringify(value) {
  /* Nothing. */
  if (!value || typeof value !== 'object') {
    return null
  }

  /* Node. */
  if (own.call(value, 'position') || own.call(value, 'type')) {
    return position(value.position)
  }

  /* Position. */
  if (own.call(value, 'start') || own.call(value, 'end')) {
    return position(value)
  }

  /* Point. */
  if (own.call(value, 'line') || own.call(value, 'column')) {
    return point(value)
  }

  /* ? */
  return null
}

function point(point) {
  if (!point || typeof point !== 'object') {
    point = {}
  }

  return index(point.line) + ':' + index(point.column)
}

function position(pos) {
  if (!pos || typeof pos !== 'object') {
    pos = {}
  }

  return point(pos.start) + '-' + point(pos.end)
}

function index(value) {
  return value && typeof value === 'number' ? value : 1
}

},{}],293:[function(require,module,exports){
'use strict'

module.exports = visitParents

var is = require('unist-util-is')

var CONTINUE = true
var SKIP = 'skip'
var EXIT = false

visitParents.CONTINUE = CONTINUE
visitParents.SKIP = SKIP
visitParents.EXIT = EXIT

function visitParents(tree, test, visitor, reverse) {
  if (typeof test === 'function' && typeof visitor !== 'function') {
    reverse = visitor
    visitor = test
    test = null
  }

  one(tree, null, [])

  // Visit a single node.
  function one(node, index, parents) {
    var result

    if (!test || is(test, node, index, parents[parents.length - 1] || null)) {
      result = visitor(node, parents)

      if (result === EXIT) {
        return result
      }
    }

    if (node.children && result !== SKIP) {
      return all(node.children, parents.concat(node)) === EXIT ? EXIT : result
    }

    return result
  }

  // Visit children in `parent`.
  function all(children, parents) {
    var min = -1
    var step = reverse ? -1 : 1
    var index = (reverse ? children.length : min) + step
    var child
    var result

    while (index > min && index < children.length) {
      child = children[index]
      result = child && one(child, index, parents)

      if (result === EXIT) {
        return result
      }

      index = typeof result === 'number' ? result : index + step
    }
  }
}

},{"unist-util-is":288}],294:[function(require,module,exports){
'use strict'

module.exports = visit

var visitParents = require('unist-util-visit-parents')

var CONTINUE = visitParents.CONTINUE
var SKIP = visitParents.SKIP
var EXIT = visitParents.EXIT

visit.CONTINUE = CONTINUE
visit.SKIP = SKIP
visit.EXIT = EXIT

function visit(tree, test, visitor, reverse) {
  if (typeof test === 'function' && typeof visitor !== 'function') {
    reverse = visitor
    visitor = test
    test = null
  }

  visitParents(tree, test, overload, reverse)

  function overload(node, parents) {
    var parent = parents[parents.length - 1]
    var index = parent ? parent.children.indexOf(node) : null
    return visitor(node, index, parent)
  }
}

},{"unist-util-visit-parents":293}],295:[function(require,module,exports){
'use strict'

module.exports = factory

function factory(file) {
  var contents = indices(String(file))

  return {
    toPosition: offsetToPositionFactory(contents),
    toOffset: positionToOffsetFactory(contents)
  }
}

// Factory to get the line and column-based `position` for `offset` in the bound
// indices.
function offsetToPositionFactory(indices) {
  return offsetToPosition

  // Get the line and column-based `position` for `offset` in the bound indices.
  function offsetToPosition(offset) {
    var index = -1
    var length = indices.length

    if (offset < 0) {
      return {}
    }

    while (++index < length) {
      if (indices[index] > offset) {
        return {
          line: index + 1,
          column: offset - (indices[index - 1] || 0) + 1,
          offset: offset
        }
      }
    }

    return {}
  }
}

// Factory to get the `offset` for a line and column-based `position` in the
// bound indices.
function positionToOffsetFactory(indices) {
  return positionToOffset

  // Get the `offset` for a line and column-based `position` in the bound
  // indices.
  function positionToOffset(position) {
    var line = position && position.line
    var column = position && position.column

    if (!isNaN(line) && !isNaN(column) && line - 1 in indices) {
      return (indices[line - 2] || 0) + column - 1 || 0
    }

    return -1
  }
}

// Get indices of line-breaks in `value`.
function indices(value) {
  var result = []
  var index = value.indexOf('\n')

  while (index !== -1) {
    result.push(index + 1)
    index = value.indexOf('\n', index + 1)
  }

  result.push(value.length + 1)

  return result
}

},{}],296:[function(require,module,exports){
'use strict'

var stringify = require('unist-util-stringify-position')

module.exports = VMessage

// Inherit from `Error#`.
function VMessagePrototype() {}
VMessagePrototype.prototype = Error.prototype
VMessage.prototype = new VMessagePrototype()

// Message properties.
var proto = VMessage.prototype

proto.file = ''
proto.name = ''
proto.reason = ''
proto.message = ''
proto.stack = ''
proto.fatal = null
proto.column = null
proto.line = null

// Construct a new VMessage.
//
// Note: We cannot invoke `Error` on the created context, as that adds readonly
// `line` and `column` attributes on Safari 9, thus throwing and failing the
// data.
function VMessage(reason, position, origin) {
  var parts
  var range
  var location

  if (typeof position === 'string') {
    origin = position
    position = null
  }

  parts = parseOrigin(origin)
  range = stringify(position) || '1:1'

  location = {
    start: {line: null, column: null},
    end: {line: null, column: null}
  }

  // Node.
  if (position && position.position) {
    position = position.position
  }

  if (position) {
    // Position.
    if (position.start) {
      location = position
      position = position.start
    } else {
      // Point.
      location.start = position
    }
  }

  if (reason.stack) {
    this.stack = reason.stack
    reason = reason.message
  }

  this.message = reason
  this.name = range
  this.reason = reason
  this.line = position ? position.line : null
  this.column = position ? position.column : null
  this.location = location
  this.source = parts[0]
  this.ruleId = parts[1]
}

function parseOrigin(origin) {
  var result = [null, null]
  var index

  if (typeof origin === 'string') {
    index = origin.indexOf(':')

    if (index === -1) {
      result[1] = origin
    } else {
      result[0] = origin.slice(0, index)
      result[1] = origin.slice(index + 1)
    }
  }

  return result
}

},{"unist-util-stringify-position":292}],297:[function(require,module,exports){
(function (process){
'use strict'

var path = require('path')
var replace = require('replace-ext')
var buffer = require('is-buffer')

module.exports = VFile

var own = {}.hasOwnProperty
var proto = VFile.prototype

proto.toString = toString

// Order of setting (least specific to most), we need this because otherwise
// `{stem: 'a', path: '~/b.js'}` would throw, as a path is needed before a
// stem can be set.
var order = ['history', 'path', 'basename', 'stem', 'extname', 'dirname']

// Construct a new file.
function VFile(options) {
  var prop
  var index
  var length

  if (!options) {
    options = {}
  } else if (typeof options === 'string' || buffer(options)) {
    options = {contents: options}
  } else if ('message' in options && 'messages' in options) {
    return options
  }

  if (!(this instanceof VFile)) {
    return new VFile(options)
  }

  this.data = {}
  this.messages = []
  this.history = []
  this.cwd = process.cwd()

  // Set path related properties in the correct order.
  index = -1
  length = order.length

  while (++index < length) {
    prop = order[index]

    if (own.call(options, prop)) {
      this[prop] = options[prop]
    }
  }

  // Set non-path related properties.
  for (prop in options) {
    if (order.indexOf(prop) === -1) {
      this[prop] = options[prop]
    }
  }
}

// Access full path (`~/index.min.js`).
Object.defineProperty(proto, 'path', {
  get: function() {
    return this.history[this.history.length - 1]
  },
  set: function(path) {
    assertNonEmpty(path, 'path')

    if (path !== this.path) {
      this.history.push(path)
    }
  }
})

// Access parent path (`~`).
Object.defineProperty(proto, 'dirname', {
  get: function() {
    return typeof this.path === 'string' ? path.dirname(this.path) : undefined
  },
  set: function(dirname) {
    assertPath(this.path, 'dirname')
    this.path = path.join(dirname || '', this.basename)
  }
})

// Access basename (`index.min.js`).
Object.defineProperty(proto, 'basename', {
  get: function() {
    return typeof this.path === 'string' ? path.basename(this.path) : undefined
  },
  set: function(basename) {
    assertNonEmpty(basename, 'basename')
    assertPart(basename, 'basename')
    this.path = path.join(this.dirname || '', basename)
  }
})

// Access extname (`.js`).
Object.defineProperty(proto, 'extname', {
  get: function() {
    return typeof this.path === 'string' ? path.extname(this.path) : undefined
  },
  set: function(extname) {
    var ext = extname || ''

    assertPart(ext, 'extname')
    assertPath(this.path, 'extname')

    if (ext) {
      if (ext.charAt(0) !== '.') {
        throw new Error('`extname` must start with `.`')
      }

      if (ext.indexOf('.', 1) !== -1) {
        throw new Error('`extname` cannot contain multiple dots')
      }
    }

    this.path = replace(this.path, ext)
  }
})

// Access stem (`index.min`).
Object.defineProperty(proto, 'stem', {
  get: function() {
    return typeof this.path === 'string'
      ? path.basename(this.path, this.extname)
      : undefined
  },
  set: function(stem) {
    assertNonEmpty(stem, 'stem')
    assertPart(stem, 'stem')
    this.path = path.join(this.dirname || '', stem + (this.extname || ''))
  }
})

// Get the value of the file.
function toString(encoding) {
  var value = this.contents || ''
  return buffer(value) ? value.toString(encoding) : String(value)
}

// Assert that `part` is not a path (i.e., does not contain `path.sep`).
function assertPart(part, name) {
  if (part.indexOf(path.sep) !== -1) {
    throw new Error(
      '`' + name + '` cannot be a path: did not expect `' + path.sep + '`'
    )
  }
}

// Assert that `part` is not empty.
function assertNonEmpty(part, name) {
  if (!part) {
    throw new Error('`' + name + '` cannot be empty')
  }
}

// Assert `path` exists.
function assertPath(path, name) {
  if (!path) {
    throw new Error('Setting `' + name + '` requires `path` to be set too')
  }
}

}).call(this,require('_process'))
},{"_process":2,"is-buffer":88,"path":1,"replace-ext":274}],298:[function(require,module,exports){
'use strict'

var VMessage = require('vfile-message')
var VFile = require('./core.js')

module.exports = VFile

var proto = VFile.prototype

proto.message = message
proto.info = info
proto.fail = fail

// Slight backwards compatibility.  Remove in the future.
proto.warn = message

// Create a message with `reason` at `position`.  When an error is passed in as
// `reason`, copies the stack.
function message(reason, position, origin) {
  var filePath = this.path
  var message = new VMessage(reason, position, origin)

  if (filePath) {
    message.name = filePath + ':' + message.name
    message.file = filePath
  }

  message.fatal = false

  this.messages.push(message)

  return message
}

// Fail.  Creates a vmessage, associates it with the file, and throws it.
function fail() {
  var message = this.message.apply(this, arguments)

  message.fatal = true

  throw message
}

// Info.  Creates a vmessage, associates it with the file, and marks the
// fatality as null.
function info() {
  var message = this.message.apply(this, arguments)

  message.fatal = null

  return message
}

},{"./core.js":297,"vfile-message":296}],299:[function(require,module,exports){
module.exports={
  "html": "http://www.w3.org/1999/xhtml",
  "mathml": "http://www.w3.org/1998/Math/MathML",
  "svg": "http://www.w3.org/2000/svg",
  "xlink": "http://www.w3.org/1999/xlink",
  "xml": "http://www.w3.org/XML/1998/namespace",
  "xmlns": "http://www.w3.org/2000/xmlns/"
}

},{}],300:[function(require,module,exports){
var toString = Object.prototype.toString

module.exports = isString

function isString(obj) {
    return toString.call(obj) === "[object String]"
}

},{}],301:[function(require,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}]},{},[4]);
