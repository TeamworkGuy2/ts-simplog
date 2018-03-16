"use strict";
var Globals = require("./Globals");
var Utils = require("../log-util/Utils");
var LogLog = require("./LogLog");
var Level = require("./Level");
var LogEvent = require("./LogEvent");
var Timer = require("../log-util/Timer");
/** Loggers
 */
var Logger = /** @class */ (function () {
    function Logger(name, options) {
        if (options === void 0) { options = {}; }
        this.name = name;
        this.parent = null;
        this.children = [];
        this.additive = true;
        this.appenders = [];
        this.timers = {};
        this.loggerLevel = null;
        this.isRoot = (this.name === Logger.rootLoggerName);
        this.isNull = (this.name === Logger.nullLoggerName);
        this.appenderCache = null;
        this.appenderCacheInvalidated = false;
        this.options = options;
        this.addChild = this.addChild.bind(this);
        this.getAdditivity = this.getAdditivity.bind(this);
        this.setAdditivity = this.setAdditivity.bind(this);
        this.addAppender = this.addAppender.bind(this);
        this.removeAppender = this.removeAppender.bind(this);
        this.removeAllAppenders = this.removeAllAppenders.bind(this);
        this.getEffectiveAppenders = this.getEffectiveAppenders.bind(this);
        this.invalidateAppenderCache = this.invalidateAppenderCache.bind(this);
        this.log = this.log.bind(this);
        this.callAppenders = this.callAppenders.bind(this);
        this.setLevel = this.setLevel.bind(this);
        this.getEffectiveLevel = this.getEffectiveLevel.bind(this);
        this.getLevel = this.getLevel.bind(this);
        this.group = this.group.bind(this);
        this.groupEnd = this.groupEnd.bind(this);
        this.timeStart = this.timeStart.bind(this);
        this.timeEnd = this.timeEnd.bind(this);
        this.assert = this.assert.bind(this);
        this.toString = this.toString.bind(this);
    }
    Logger.prototype.setOptions = function (options) {
        if (options === void 0) { options = {}; }
        this.options = options;
    };
    Logger.prototype.trace = function () {
        this.log(Level.TRACE, arguments);
    };
    Logger.prototype.debug = function () {
        this.log(Level.DEBUG, arguments);
    };
    Logger.prototype.info = function () {
        this.log(Level.INFO, arguments);
    };
    Logger.prototype.warn = function () {
        this.log(Level.WARN, arguments);
    };
    Logger.prototype.error = function () {
        this.log(Level.ERROR, arguments);
    };
    Logger.prototype.fatal = function () {
        this.log(Level.FATAL, arguments);
    };
    Logger.prototype.isEnabledFor = function (level) {
        return level.isGreaterOrEqual(this.getEffectiveLevel());
    };
    Logger.prototype.isTraceEnabled = function () {
        return this.isEnabledFor(Level.TRACE);
    };
    Logger.prototype.isDebugEnabled = function () {
        return this.isEnabledFor(Level.DEBUG);
    };
    Logger.prototype.isInfoEnabled = function () {
        return this.isEnabledFor(Level.INFO);
    };
    Logger.prototype.isWarnEnabled = function () {
        return this.isEnabledFor(Level.WARN);
    };
    Logger.prototype.isErrorEnabled = function () {
        return this.isEnabledFor(Level.ERROR);
    };
    Logger.prototype.isFatalEnabled = function () {
        return this.isEnabledFor(Level.FATAL);
    };
    Logger.prototype.addChild = function (childLogger) {
        this.children.push(childLogger);
        childLogger.parent = this;
        childLogger.invalidateAppenderCache();
    };
    Logger.prototype.getAdditivity = function () {
        return this.additive;
    };
    Logger.prototype.setAdditivity = function (additivity) {
        var valueChanged = (this.additive != additivity);
        this.additive = additivity;
        if (valueChanged) {
            this.invalidateAppenderCache();
        }
    };
    // Create methods that use the appenders variable in this scope
    Logger.prototype.addAppender = function (appender) {
        if (this.isNull) {
            LogLog.handleError("Logger.addAppender: you may not add an appender to the null logger");
        }
        else {
            if (!Utils.arrayContains(this.appenders, appender)) {
                this.appenders.push(appender);
                // TODO Appender type
                appender.setAddedToLogger(this);
                this.invalidateAppenderCache();
            }
        }
    };
    Logger.prototype.removeAppender = function (appender) {
        Utils.arrayRemove(this.appenders, appender);
        // TODO Appender type
        appender.setRemovedFromLogger(this);
        this.invalidateAppenderCache();
    };
    Logger.prototype.removeAllAppenders = function () {
        var appenderCount = this.appenders.length;
        if (appenderCount > 0) {
            for (var i = 0; i < appenderCount; i++) {
                // TODO Appender type
                this.appenders[i].setRemovedFromLogger(this);
            }
            this.appenders.length = 0;
            this.invalidateAppenderCache();
        }
    };
    Logger.prototype.getEffectiveAppenders = function () {
        if (this.appenderCache === null || this.appenderCacheInvalidated) {
            // Build appender cache
            var parentEffectiveAppenders = (this.isRoot || !this.getAdditivity()) ? [] : this.parent.getEffectiveAppenders();
            this.appenderCache = parentEffectiveAppenders.concat(this.appenders);
            this.appenderCacheInvalidated = false;
        }
        return this.appenderCache;
    };
    Logger.prototype.invalidateAppenderCache = function () {
        this.appenderCacheInvalidated = true;
        for (var i = 0, len = this.children.length; i < len; i++) {
            this.children[i].invalidateAppenderCache();
        }
    };
    Logger.prototype.log = function (level, params) {
        if (Globals.enabled && level.isGreaterOrEqual(this.getEffectiveLevel())) {
            // Check whether last param is an exception
            var exception;
            var lastIdx = params.length - 1;
            var lastParam = params[lastIdx];
            if (params.length > 1 && Utils.isError(lastParam)) {
                exception = lastParam;
                lastIdx--;
            }
            // Construct genuine array for the params
            var messages = [];
            for (var i = 0; i <= lastIdx; i++) {
                messages[i] = params[i];
            }
            var logEvent = new LogEvent(this, new Date(), level, messages, exception);
            this.callAppenders(logEvent);
        }
    };
    Logger.prototype.callAppenders = function (evnt) {
        if (this.options.logOriginalLoggerName && evnt.logger.name) {
            evnt.messages.unshift(evnt.logger.name);
        }
        if (this.options.logOutputLoggerName && this.name) {
            evnt.messages.unshift(this.name);
        }
        var appenders = this.getEffectiveAppenders();
        for (var i = 0, len = appenders.length; i < len; i++) {
            var appender = appenders[i];
            var logName = appender.options.doLogName && appender.name;
            if (logName) {
                evnt.messages.unshift(appender.name);
            }
            appender.doAppend(evnt);
            if (logName) {
                evnt.messages.shift();
            }
        }
    };
    Logger.prototype.setLevel = function (level) {
        // Having a level of null on the root logger would be very bad.
        if (this.isRoot && level === null) {
            LogLog.handleError("Logger.setLevel: you cannot set the level of the root logger to null");
        }
        else {
            this.loggerLevel = level;
        }
    };
    Logger.prototype.getLevel = function () {
        return this.loggerLevel;
    };
    Logger.prototype.getEffectiveLevel = function () {
        for (var logger = this; logger !== null; logger = logger.parent) {
            var level = logger.getLevel();
            if (level !== null) {
                return level;
            }
        }
        return null;
    };
    Logger.prototype.group = function (name, initiallyExpanded) {
        if (Globals.enabled) {
            var effectiveAppenders = this.getEffectiveAppenders();
            for (var i = 0, len = effectiveAppenders.length; i < len; i++) {
                effectiveAppenders[i].group(name, initiallyExpanded);
            }
        }
    };
    Logger.prototype.groupEnd = function () {
        if (Globals.enabled) {
            var effectiveAppenders = this.getEffectiveAppenders();
            for (var i = 0, len = effectiveAppenders.length; i < len; i++) {
                effectiveAppenders[i].groupEnd();
            }
        }
    };
    Logger.prototype.timeStart = function (name, level) {
        if (Globals.enabled) {
            if (name == null) {
                LogLog.handleError("Logger.time: a name for the timer must be supplied");
            }
            else if (level != null) {
                LogLog.handleError("Logger.time: null level is not valid");
            }
            else {
                this.timers[name] = Timer.newDateInst(name, level);
            }
        }
    };
    Logger.prototype.timeEnd = function (name) {
        if (Globals.enabled) {
            if (name == null) {
                LogLog.handleError("Logger.timeEnd: a name for the timer must be supplied");
            }
            else if (this.timers[name]) {
                var timer = this.timers[name];
                var milliseconds = timer.measure();
                this.log(timer.level, ["Timer " + Utils.toStr(name) + " completed in " + milliseconds + "ms"]);
                delete this.timers[name];
            }
            else {
                LogLog.warn("Logger.timeEnd: no timer found with name " + name);
            }
        }
    };
    Logger.prototype.assert = function (expr) {
        if (Globals.enabled && !expr) {
            var args = [];
            for (var i = 1, len = arguments.length; i < len; i++) {
                args.push(arguments[i]);
            }
            args = (args.length > 0) ? args : ["Assertion Failure"];
            args.push(Globals.newLine);
            args.push(expr);
            this.log(Level.ERROR, args);
        }
    };
    Logger.prototype.toString = function () {
        return "Logger[" + this.name + "]";
    };
    Logger.anonymousLoggerName = "[anonymous]";
    Logger.defaultLoggerName = "[default]";
    Logger.nullLoggerName = "[null]";
    Logger.rootLoggerName = "root";
    return Logger;
}());
module.exports = Logger;
