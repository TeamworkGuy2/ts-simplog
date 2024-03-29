﻿# Change Log
All notable changes to this project will be documented in this file.
This project does its best to adhere to [Semantic Versioning](http://semver.org/).


--------
### [0.10.0](N/A) - 2022-01-02
#### Changed
* Update to TypeScript 4.4


--------
### [0.9.0](https://github.com/TeamworkGuy2/ts-simplog/commit/d58d55971e2236870326b8905fee3df183a3455e) - 2021-06-12
#### Changed
* Update to TypeScript 4.3


--------
### [0.8.0](https://github.com/TeamworkGuy2/ts-simplog/commit/80a4133b00962345eb5ee6da560affb31e5f5679) - 2020-09-05
#### Changed
* Update to TypeScript 4.0


--------
### [0.7.0](https://github.com/TeamworkGuy2/ts-simplog/commit/5d61440b56a2ba605f4298288fddecc36595def8) - 2019-11-08
#### Changed
* Update to TypeScript 3.7

#### Removed
* Empty `ConsoleAppenderWindowSetup` file
* Clean up unused `ConsoleAppender` code:
  * `commandLineObjectExpansionDepth`
  * `useDocumentWrite`
  * `get/setCommandLineObjectExpansionDepth()`
  * `is/setUseDocumentWrite()`
  * `get/setCommandWindow()`
  * `addCommandLineFunction()`
  * `writeHtml()`


--------
### [0.6.7](https://github.com/TeamworkGuy2/ts-simplog/commit/1f042e53da83ec68d02786fc038b8b6982e02248) - 2019-07-06
#### Changed
* Update to TypeScript 3.5


--------
### [0.6.6](https://github.com/TeamworkGuy2/ts-simplog/commit/ac6a3bbeba6c7ce89bd371dbb800bd0549e80068) - 2018-12-29
#### Changed
* Update to TypeScript 3.2 and fix compile errors

#### Removed
* Removed `ts-local-storage-manager` dependency


--------
### [0.6.5](https://github.com/TeamworkGuy2/ts-simplog/commit/fee728fd1023c51513185b01ee0951b1764d1cef) - 2018-10-20
#### Changed
* Switch `package.json` github dependencies from tag urls to release tarballs to simplify npm install (doesn't require git to npm install tarballs)


--------
### [0.6.4](https://github.com/TeamworkGuy2/ts-simplog/commit/72ac517591e1d06e8919e14ab934913ab1c4aa55) - 2018-10-14
#### Changed
* Update to TypeScript 3.1
* Update dev dependencies and @types
* Enable `tsconfig.json` `strict` and fix compile errors
* Removed compiled bin tarball in favor of git tags


--------
### [0.6.3](https://github.com/TeamworkGuy2/ts-simplog/commit/9057e7fe492ecfa922a53137bed69bf839ee58f4) - 2018-04-09
#### Changed
* Update to TypeScript 2.8
* Update tsconfig.json with `noImplicitReturns: true` and `forceConsistentCasingInFileNames: true`
* Added release tarball and npm script `build-package` to package.json referencing external process to generate tarball


--------
### [0.6.2](https://github.com/TeamworkGuy2/ts-simplog/commit/374ee4ccd76a2adf29ae5cbfd7aa0ebec1b6f426) - 2018-03-15
#### Changed
* Added simplified Console interface `Log4Ts.ConsoleLite` for the minimum console functions used by this project
* `BrowserConsoleAppender`
  * use `Log4Ts.ConsoleLite` instead of `Console`
  * now uses `console.trace` instead of console.debug for `Level.TRACE` logs
* Added README example


--------
### [0.6.1](https://github.com/TeamworkGuy2/ts-simplog/commit/bf21132dfd42c8081e9e97f2466e3776d501df22) - 2018-03-01
#### Changed
* Update to TypeScript 2.7
* Update dependencies: mocha, @types/chai, @types/mocha
* Enable tsconfig.json `noImplicitAny`


--------
### [0.6.0](https://github.com/TeamworkGuy2/ts-simplog/commit/53c4e232ecdc58778c1153872e636ef52b02dbcb) - 2017-11-04
#### Changed
* Added `strictNullChecks` to `tsconfig.json` and updated code to handle null types
* Dropped ConsoleAppenderWindowSetup support, file still exists, but returns null exports
* `ConsoleAppender`, `InPageAppender`, and `PopUpAppender` no longer works correctly due to ConsoleAppenderWindowSetup being removed


--------
### [0.5.1](https://github.com/TeamworkGuy2/ts-simplog/commit/b606482051b7b7a0740d8754141f7a89f6675c3d) - 2017-08-06
#### Changed
* Update to TypeScript 2.4
* Add better types in ConsoleAppenderWindowSetup


--------
### [0.5.0](https://github.com/TeamworkGuy2/ts-simplog/commit/bdff35522c8eb8a8efe7367c45b8a5f05c73ea99) - 2017-06-29
#### Changed
* Removed old ActiveXObject("Msxml2.XMLHTTP") and ActiveXObject("Microsoft.XMLHTTP") fallbacks since all modern browsers support XMLHttpRequest()
* Improved Utils types and added some missing types in various spots


--------
### [0.4.1](https://github.com/TeamworkGuy2/ts-simplog/commit/46aba384be056252f2289ebcf9dda4344848419e) - 2017-05-09
#### Changed
* Update to TypeScript 2.3, added tsconfig.json, use @types/ definitions
* Update documentation for easier Visual Studio use


--------
### [0.4.0](https://github.com/TeamworkGuy2/ts-simplog/commit/fa7ea77c3cc96059058b31e66d1f5252e88a9a5c) - 2017-03-02
#### Changed
* Renamed `LoggingEvent` -> `LogEvent`
* Renamed `DateUtil.getTimeSince()` -> `getMillisSince()`


--------
### [0.3.1](https://github.com/TeamworkGuy2/ts-simplog/commit/bc7981994afe7112f4b4cc94e17cf1d96c805ad9) - 2016-12-21
#### Changed
Minor changes for TypeScript 2.0 compatibility


--------
### [0.3.0](https://github.com/TeamworkGuy2/ts-simplog/commit/4d25f9e35b7cdbd418a91cc3ed33fa2036fee76c) - 2016-10-22
#### Added
* Utils.padWithSpaces() - moved from ConsoleAppender

#### Changed
* DateUtil renamed ONE_DAY_MILLIS -> MILLIS_PER_DAY, ONE_WEEK_MILLIS -> MILLIS_PER_WEEK, monthNames -> MONTHS, dayNames -> DAYS_PER_WEEK

#### Removed
* DateUtil getDifference() and getUtcTime()


--------
### [0.2.2](https://github.com/TeamworkGuy2/ts-simplog/commit/66f7ef6202c07162b734eb2c80ce24b6f2ea3d49) - 2016-09-17
#### Changed
* Fixed BrowserConsoleAppender constructor 'name' parameter to correctly default to the class name when no name is provided
* LocalStoreAppender - added constructor 'name' parameter, defaults to the class name when no name is provided


--------
### [0.2.1](https://github.com/TeamworkGuy2/ts-simplog/commit/464ca23a394ed47291da275caa97f0fb0a2bf8d3) - 2016-09-17
#### Changed
* Added some (by default) redudant type casts so this library can work with ts-date-times if the built in Date class/methods are setup to return TimestampUtc instead of number
* Utils refactoring, added some method parameter types


--------
### [0.2.0](https://github.com/TeamworkGuy2/ts-simplog/commit/b2fdc4c1e6a6749ea715670d6ad10e00d0af5c56) - 2016-08-20
#### Added
* Appender options and name properties

#### Changed
* Renamed EventSupport.eventListeners -> listeners
* Changed Logger options
  * logAppenderName moved to Appender options
  * renamed options.logLoggerName -> logOriginalLoggerName
  * added new options.logOutputLoggerName
* Moved SimpleDateFormat constants and utility methods to new DateUtil class


--------
### [0.1.1](https://github.com/TeamworkGuy2/ts-simplog/commit/a021956657b4cce644c272c8cb7382dac687ab77) - 2016-06-10
#### Added
* Log4TsRoot.getLogger() options parameter
* Logger.setOptions()

#### Changed
* Renamed Log4Ts class to Log4TsRoot so it doesn't interfer with the Log4Ts module that log4ts.d.ts exports


--------
### [0.1.0](https://github.com/TeamworkGuy2/ts-simplog/commit/191565b983a870e5b2c2758a7d21de960f7d00bb) - 2016-06-08
#### Added
Rewrite of [log4javascript@1.4.13](http://log4javascript.org/) with major API changes to make it more module and interface based to work with TypeScript.
ConsoleAppender doesn't fully work yet. 
log4javascript global variable partially moved to Log4Ts.ts, but most of the properties have been moved to separate files which you have to import (this allows build tools to detect which files your using and only include those in your compiled javascript). 
Added ProcessLog.ts and heavily modified Timer.ts. 
Ported many of the unit tests from 'xntest' to mocha and chai.