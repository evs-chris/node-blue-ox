'use strict';

// global(!) if you want to defeat dependencies of dependencies
// you must opt in though -- beGlobal() in main module
if (global.hasOwnProperty('blue-ox')) {
  module.exports = global['blue-ox'];
  return global['blue-ox'];
}

var tty = require('tty');
var _ = require('lodash');
var util = require('util');

var levels = {
  all: 1000
};

var reverseLevels = _.invert(levels);

function addLevel(name, value) {
  levels[name] = value;
  reverseLevels = _.invert(levels);

  proto[name] = function(message) { logProxy(value, this, message, _.toArray(arguments).slice(1)); };
}

function removeLevel(name) {
  delete levels[name];
  reverseLevels = _.invert(levels);

  delete proto[name];
}

var colorCodes = [6, 1, 4, 3, 5, 2];
var brightColors = function brightColors(c) { c = c === undefined ? 1 : c; if (out.useColor) return '\u001b[3' + c + 'm'; else return ''; };
var colors = function colors(c) { c = c === undefined ? 1 : c; if (out.useColor) return '\u001b[1m\u001b[3' + c + 'm'; else return ''; };
var reset = function reset() { if (out.useColor) return '\u001b[0m'; else return ''; };
var ansi = function ansi(code) { if (out.useColor) return '\u001b[' + code + 'm'; else return ''; };

var useBlacklist = true;
var blacklist = [];
var whitelist = [];

function listControl(black, add, remove) {
  if (arguments.length === 3 && Array.isArray(arguments[1]) && Array.isArray(arguments[2])) ; // roll on
  else if (arguments.length === 2 && Array.isArray(arguments[1])) remove = [];
  else if (arguments.length > 1) { remove = []; add = _.toArray(arguments).slice(1); }
  else return;

  var list = black ? blacklist : whitelist;
  remove.unshift(list);
  list = _.without.apply(null, remove);
  list = _.union(list, add);
  if (black) blacklist = list;
  else whitelist = list;
}

var timing = false;
var timeSizes = [[1000 * 60 * 60 * 24 * 365.25, 'yr'], [1000 * 60 * 60 * 24 * 30, 'mo'], [1000 * 60 * 60 * 24 * 7, 'wk'], [1000 * 60 * 50 * 24, 'd'],
  [1000 * 60 * 60, 'hr'], [1000 * 60, 'min'], [1000, 's'], [1, 'ms']];
function relTime(ms) {
  var i, t, d, m, u, res;
  for (i = 0; i < timeSizes.length; i++) {
    t = timeSizes[i];
    d = Math.floor(ms / t[0]);
    if (d > 1) { m = ms % t[0]; break; }
  }

  if (i < timeSizes.length - 1) {
    u = timeSizes[i + 1];
    m = Math.floor(m / u[0]);
  }

  res = d + t[1];
  if (d < 10 && i < timeSizes.length - 1 && m > 1) {
    res += ' ' + m + u[1];
  }

  return res;
}

var levelColors = { trace: 4, error: 1, fatal: 5, warn: 3, debug: 2, custom: 6, unknown: 6, info: 2 };
var ansiColors = { 'red': 1, 'green': 2, 'yellow': 3, 'blue': 4, 'magenta': 5, 'pink': 5, 'cyan': 6, 'aqua': 6, 'black': 0, 'white': 7 };

function levelControl(level, scope) {
  var scp;
  if (arguments.length === 0) return (reverseLevels[globalLevel] || 'unknown').toUpperCase();
  else if (arguments.length === 1 && typeof arguments[0] === 'string' && !levels.hasOwnProperty(arguments[0].toLowerCase())) return (reverseLevels[out(level)._level || globalLevel] || 'unknown').toUpperCase();

  if (level === null && typeof scope === 'string') {
    scp = out(scope);
    delete scp._level;
    return;
  }

  if (typeof level === 'string') level = levels[level.toLowerCase()];
  if (arguments.length === 1 || scope === null || scope === undefined) {
    globalLevel = level;
  } else if (typeof scope === 'string') {
    scp = out(scope);
    scp._level = level;
  }
}

var scopes = {};

var availableOutputs = {
  console: {
    _record: '{{ brightColor(levelColor) }}{{ level.toUpperCase() }}{{ reset() }}{{ ansi(90) }}:{{ reset() }} {{ color(scopeColor) }}{{ scope }}{{ reset() }} {{ ansi(94) }}{{ time }}{{ reset() }}{{ ansi(90) }}>{{ reset() }} {{ message }}',
    recordTpl: null,
    output: function(level, scope, message) {
      if (message.indexOf('\n') > 0) message = message.replace(/\n+$/g, '').replace(/\t/g, '  ').replace(/\n(  )?/gm, '\n  ' + ansi(90) + '|' + reset() + ' ');
      console.log(this.recordTpl({ level: level, levelColor: levelColors[level] || levelColors.custom, scope: scope.scope, scopeColor: scope.localColor, message: message, time: (scope.timing === true || timing) ? '+' + relTime(scope.timeOffset) + ' ' : '' }));
    },
    record: function(rec) {
      this._record = rec;
      this.recordTpl = _.template(rec, null, { imports: { reset: reset, color: colors, brightColor: brightColors, ansi: ansi }, interpolate: /{{([\s\S]+?)}}/g, evaluate: /{{-([\s\S]+?)}}/g });
    }
  }
};

availableOutputs.console.record(availableOutputs.console._record);
var outputs = [availableOutputs.console];

function addOutput(name, output) { availableOutputs[name] = output; outputs.push(output); }
function useOutputs() { outputs = _.map(arguments, function(n) { return availableOutputs[n]; }); }

function nextColor() {
  var cur = out.currentColor++;
  if (out.currentColor === colorCodes) out.currentColor = 0;
  return colorCodes[cur];
}

function strOrInspect(v) { return typeof v === 'string' ? v : util.inspect(v); }

function logProxy(level, scope, message, args) {
  var stack = _.foldl(_.first(scope.scope.split(':'), 2), function(a, c) { a.push((a.length > 0 ? a[a.length - 1] + ':' : '') + c); return a; }, []);
  if (useBlacklist) {
    if (_.intersection(stack, blacklist).length > 0) return;
  } else {
    if (_.intersection(stack, whitelist).length < 1) return;
  }

  if (typeof level === 'string') level = levels[level];
  if (level <= (scope._level || globalLevel)) {
    level = reverseLevels[level];
    if (args.length === 0 && typeof message === 'string') ; // do nothing
    else if (typeof message === 'string' && message.indexOf('%') >= 0) {
      // formatted string
      args.unshift(message);
      message = util.format.apply(null, args);
    } else {
      if (util.isError(message)) {
        message = message.stack.replace(/\n  /gm, '\n') + '\n' + _.map(args, strOrInspect).join(' ');
      } else {
        if (typeof message === 'string' && args.length > 0)
          message += '\n' + _.map(args, strOrInspect).join(' ');
        else {
          args.unshift(message);
          message = _.map(args, strOrInspect).join(' ');
        }
      }
    }

    // update timing
    if (scope.timing === true || ((scope.timing === undefined || scope.timing !== false) && timing)) {
      var cur = scope.time || Date.now();
      scope.time = Date.now();
      scope.timeOffset = scope.time - cur;
    }

    _.each(scope.outputs || outputs, function(o) { o.output(level, scope, message); });
  }
}

var proto = {
  log: function log(level, message) { logProxy(level, this, message, _.toArray(arguments).slice(2)); },
  level: function level() { var args = _.toArray(arguments); args.push(this.scope); return levelControl.apply(null, args); },
  color: function() {
    var c, col, str, bright;

    if (arguments.length === 2) { // color and string
      c = arguments[0];
      bright = false;
      str = arguments[1];
    } else if (arguments.length === 3) { // color, bright, and string
      c = arguments[0];
      bright = arguments[1];
      str = arguments[2];
    }

    if (!out.useColor) return str;

    if (typeof c === 'string') {
      c = c.toLowerCase();
      col = levelColors[c];
      if (col === undefined) col = ansiColors[c];
      if (col === undefined) col = 1;
      return (bright ? colors : brightColors)(col) + str + reset();
    } else {
      return (bright ? colors : brightColors)(c) + str + reset();
    }
  }
};
proto.color.reset = reset;
proto.color.ansi = ansi;

_.each({
  trace: 120,
  debug: 100,
  info: 80,
  warn: 60,
  error: 40,
  fatal: 20
}, function(v, k) { addLevel(k, v); });
var globalLevel = levels.warn;

var out = module.exports = function(scope, level) {
  var scp = scopes[scope], root;
  if (scp === undefined || scp === null) {
    if (scope.indexOf(':') > 0) root = scopes[scope.replace(/:.*$/, '')];
    if (!!root) {
      scp = Object.create(root);
      scp.root = root;
    } else {
      scp = Object.create(proto);
      scp.localColor = nextColor();
    }
    scp.scope = scope;
    scopes[scope] = scp;

    if (typeof level === 'string') scp._level = levels[level];
    else if (typeof level === 'number') scp._level = level;
  }

  return scp;
};

out.currentColor = 0;
out.useColor = tty.isatty(1);
out.addOutput = addOutput;
out.useOutputs = useOutputs;
out.level = levelControl;

out.blacklist = function() { var args = _.toArray(arguments); args.unshift(true); listControl.apply(null, args); };
out.whitelist = function() { var args = _.toArray(arguments); args.unshift(false); listControl.apply(null, args); };
out.useBlacklist = function() { useBlacklist = (arguments.length === 0 || arguments[0]); };
out.useWhitelist = function() { useBlacklist = !(arguments.length === 0 || arguments[0]); };
out.clearBlacklist = function() { blacklist = []; };
out.clearWhitelist = function() { whitelist = []; };
out.timing = function() { timing = (arguments.length === 0 || arguments[0]); };

out.addLevel = addLevel;
out.removeLevel = removeLevel;

out.console = availableOutputs.console;
out.outputs = outputs;
out.availableOutputs = availableOutputs;
out.color = proto.color;

out.humanizeMs = relTime;

out.beGlobal = function(please) { if (arguments.length === 0 || please) global['blue-ox'] = out; else delete global['blue-ox']; return out; };
