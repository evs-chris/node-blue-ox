# blue-ox

blue-ox is a logging library inspired by debug by visionmedia. The justification for yet another logging library (tm) here is while debug is very handy, it doesn't support nice things for large long running apps. Things like different log levels, multiple destinations, blacklist or whitelisting from code, and parameters that can change after load.

## Example

![console output](https://github.com/evs-chris/node-blue-ox/raw/master/assets/output.jpg)

## Features

* Namespaced logging with different colors per namespace on the default console logger (like debug)
* Optional timing in log messages i.e. time since this logger was last called (like debug)
* Expandable log levels with trace, debug, info, warn, error, and fatal built in
* Per namespace settings that inherit backward to the root.
  * Log level - messages above this level will not be logged (fatal is 20, trace is 100, all is 1000)
  * Outputs - multiple outputs can be assigned to process messages
  * Timing - timing can be turned on and off per namespace
  * Color - each namespace root sets the color for all of its children so that modules group visually
* Blacklist or whitelist - you can decide either what messages you don't want to see or what messages you only want to see
* Can be set up globally so that any nested dependencies will use the same loggers and configuration - this is strictly opt-in
* Logging calls are processed based on their first argument
  * Errors get their stack trace added and the default console logger indents them
  * Strings with % escapes are processed with util.format
  * Single string args are left untouched
  * Everything else is processed with util.inspect and concatenated
* Multi-line log messages are indented by the default output so that they don't muddle the flow of other messages. Hard tabs are also converted to spaces.
* Simple color helper to colorize parts of a message

## Usage

#### Main Module

`var logger = require('blue-ox');` or `var logger = require('blue-ox').beGlobal();`
`var log = logger(scope[, defaultLevel])`

`scope` is a path-like string separated by `:`s. Each root scope gets a color from a round-robin list of colors to make them stand out a little more in the default output. If a logger is requested with a `defaultLevel` and does not already exist, it will be created with the default level. If the logger already exists, the level is left as-is.

#### Global helper

`logger.beGlobal()` or `logger.beGlobal(true)` sets up the global and returns the module.

`logger.beGlobal(false)` tears the global down and returns the module.

#### Color helper

`log.color(color[, bright][, string])`

The appropriate ANSI escape sequences are added only if `logger.useColor` is true, and it defaults to true if node is run in a TTY.

If a string is supplied, then a reset will be inserted at the end of it. Otherwise, only an initial change sequence will be returned.

To output a reset, you can use `log.color.reset()`. To dump out an ANSI code, you can use `log.color.ansi(code)`.

### Examples

```javascript
var log = require('blue-ox')('mymodule');

// log an error
log.error(new Error('I will have a stack trace.'));

// log a warning
log.warn(new Error('I will also have a stack trace, but I will be labeled as WARN by default.'));

// sorta pretend we're using debug
var debug = log.debug;
debug('I will put out a debug message.');

// shared namespace, like debug
var child = require('blue-ox')('mymodule:child');

child.trace('I will have the same coloring as mymodule messages, but I will have a deeper namespace.');

// add a custom level
require('blue-ox').addLevel('foo');
child.foo('fooing'); // 'outputs FOO: mymodule:child > fooing' on the default console output

// color helper
log.info('Now listening on port ' + log.color('green', true, '3000'));
```
