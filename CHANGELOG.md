# Change Log
All notable changes to this project will be documented in this file.
This project does its best to adhere to [Semantic Versioning](http://semver.org/).


--------
### [0.2.1](N/A) - 2016-09-17
#### Changed
* Added some (by default) redudant type casts so this library can work with ts-date-times if the built in Date class/methods are setup to return TimestampUtc instead of number
* Utils refactoring, added some method parameter types


--------
### [0.2.0](https://github.com/TeamworkGuy2/ts-simplog/commit/b2fdc4c1e6a6749ea715670d6ad10e00d0af5c56) - 2016-08-20
#### Added
* Appender options and name properties

####Changed
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
Initial port of log4javascript with major API changes to make it more module and interface based to work with TypeScript. 
ConsoleAppender doesn't fully work yet. 
log4javascript global variable partially moved to Log4Ts.ts, but most of the properties have been moved to separate files which you have to import (this allows build tools to detect which files your using and only include those in your compiled javascript). 
Added ProcessLog.ts and heavily modified Timer.ts. 
Ported many of the unit tests from 'xntest' to mocha and chai.