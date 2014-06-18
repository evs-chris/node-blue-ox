# blue-ox

blue-ox is a logging library inspired by debug by visionmedia. The justification for yet another logging library (tm) here is while debug is very handy, it doesn't support nice things for large long running apps. Things like different log levels, multiple destinations, blacklist or whitelisting from code, and parameters that can change after load.

## Features

* Namespaced logging with different colors per namespace on the default console logger (like debug)
* Optional timing in log messages i.e. time since this logger was last called (like debug)
* Expandable log levels with trace, debug, warn, error, and fatal built in
* Per namespace settings that inherit backward to the root.
  * Log level - messages above this level will not be logged (fatal is 20, trace is 100)
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

## Usage

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
```
