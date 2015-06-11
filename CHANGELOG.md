## 0.3.0

* Fixes default level and sets it to WARN.
* Adds support for requesting a default level along with a new logger. If the logger already exists, the level will be left as-is.
* Converts hard tabs to spaces before outputting multi-line strings on the default console output.
* Exposes `ansi` and `reset` helpers on the `colors` function.

## 0.2.0

* Adds a helper to color log message output.

## 0.1.0

* Adds oddly missing info log level.

## 0.0.1

Initial version supporting inherited configuration, custom levels, namespaces, multiple outputs, and optional globalization.
