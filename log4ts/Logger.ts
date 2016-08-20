import Globals = require("./Globals");
import Utils = require("../log-util/Utils");
import LogLog = require("./LogLog");
import Level = require("./Level");
import LoggingEvent = require("./LoggingEvent");
import Timer = require("../log-util/Timer");

/** Loggers
 */
class Logger implements Log4Ts.Logger {
    static anonymousLoggerName = "[anonymous]";
    static defaultLoggerName = "[default]";
    static nullLoggerName = "[null]";
    static rootLoggerName = "root";

    public name: string;
    public parent: Log4Ts.Logger;
    public children: any[];
    public appenders: Log4Ts.Appender[];
    public loggerLevel: Log4Ts.Level;
    private additive: boolean;
    private isRoot: boolean;
    private isNull: boolean;
    private timers: { [name: string]: Log4Ts.Timer };
    private appenderCache: Log4Ts.Appender[] = null;
    private appenderCacheInvalidated: boolean;
    private options: Log4Ts.LoggerOptions;


    constructor(name: string, options: Log4Ts.LoggerOptions = {}) {
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


    public setOptions(options: Log4Ts.LoggerOptions = {}) {
        this.options = options;
    }


    public trace(...args: any[]): void;
    public trace() {
        this.log(Level.TRACE, arguments);
    }

    public debug(...args: any[]): void;
    public debug() {
        this.log(Level.DEBUG, arguments);
    }

    public info(...args: any[]): void;
    public info() {
        this.log(Level.INFO, arguments);
    }

    public warn(...args: any[]): void;
    public warn() {
        this.log(Level.WARN, arguments);
    }

    public error(...args: any[]): void;
    public error() {
        this.log(Level.ERROR, arguments);
    }

    public fatal(...args: any[]): void;
    public fatal() {
        this.log(Level.FATAL, arguments);
    }

    public isEnabledFor(level: Log4Ts.Level) {
        return level.isGreaterOrEqual(this.getEffectiveLevel());
    }

    public isTraceEnabled() {
        return this.isEnabledFor(Level.TRACE);
    }

    public isDebugEnabled() {
        return this.isEnabledFor(Level.DEBUG);
    }

    public isInfoEnabled() {
        return this.isEnabledFor(Level.INFO);
    }

    public isWarnEnabled() {
        return this.isEnabledFor(Level.WARN);
    }

    public isErrorEnabled() {
        return this.isEnabledFor(Level.ERROR);
    }

    public isFatalEnabled() {
        return this.isEnabledFor(Level.FATAL);
    }


    public addChild(childLogger: Logger) {
        this.children.push(childLogger);
        childLogger.parent = this;
        childLogger.invalidateAppenderCache();
    }


    public getAdditivity() {
        return this.additive;
    }


    public setAdditivity(additivity: boolean) {
        var valueChanged = (this.additive != additivity);
        this.additive = additivity;
        if (valueChanged) {
            this.invalidateAppenderCache();
        }
    }


    // Create methods that use the appenders variable in this scope
    public addAppender(appender: Log4Ts.Appender) {
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
    }


    public removeAppender(appender: Log4Ts.Appender) {
        Utils.arrayRemove(this.appenders, appender);
        // TODO Appender type
        appender.setRemovedFromLogger(this);
        this.invalidateAppenderCache();
    }


    public removeAllAppenders() {
        var appenderCount = this.appenders.length;
        if (appenderCount > 0) {
            for (var i = 0; i < appenderCount; i++) {
                // TODO Appender type
                this.appenders[i].setRemovedFromLogger(this);
            }
            this.appenders.length = 0;
            this.invalidateAppenderCache();
        }
    }


    public getEffectiveAppenders() {
        if (this.appenderCache === null || this.appenderCacheInvalidated) {
            // Build appender cache
            var parentEffectiveAppenders: Log4Ts.Appender[] = (this.isRoot || !this.getAdditivity()) ? [] : this.parent.getEffectiveAppenders();
            this.appenderCache = parentEffectiveAppenders.concat(this.appenders);
            this.appenderCacheInvalidated = false;
        }
        return this.appenderCache;
    }


    public invalidateAppenderCache() {
        this.appenderCacheInvalidated = true;
        for (var i = 0, len = this.children.length; i < len; i++) {
            this.children[i].invalidateAppenderCache();
        }
    }


    public log(level: Log4Ts.Level, params: (any | Error)[] | IArguments) {
        if (Globals.enabled && level.isGreaterOrEqual(this.getEffectiveLevel())) {
            // Check whether last param is an exception
            var exception: Error;
            var finalParamIndex = params.length - 1;
            var lastParam = params[finalParamIndex];
            if (params.length > 1 && Utils.isError(lastParam)) {
                exception = lastParam;
                finalParamIndex--;
            }

            // Construct genuine array for the params
            var messages = [];
            for (var i = 0; i <= finalParamIndex; i++) {
                messages[i] = params[i];
            }

            var loggingEvent = new LoggingEvent(this, new Date(), level, messages, exception);

            this.callAppenders(loggingEvent);
        }
    }


    public callAppenders(evnt: Log4Ts.LoggingEvent) {
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
    }


    public setLevel(level: Log4Ts.Level) {
        // Having a level of null on the root logger would be very bad.
        if (this.isRoot && level === null) {
            LogLog.handleError("Logger.setLevel: you cannot set the level of the root logger to null");
        } else {
            this.loggerLevel = level;
        }
    }


    public getLevel() {
        return this.loggerLevel;
    }


    public getEffectiveLevel() {
        for (var logger: Log4Ts.Logger = this; logger !== null; logger = logger.parent) {
            var level = logger.getLevel();
            if (level !== null) {
                return level;
            }
        }
    }


    public group(name: string, initiallyExpanded?: boolean) {
        if (Globals.enabled) {
            var effectiveAppenders = this.getEffectiveAppenders();
            for (var i = 0, len = effectiveAppenders.length; i < len; i++) {
                effectiveAppenders[i].group(name, initiallyExpanded);
            }
        }
    }


    public groupEnd() {
        if (Globals.enabled) {
            var effectiveAppenders = this.getEffectiveAppenders();
            for (var i = 0, len = effectiveAppenders.length; i < len; i++) {
                effectiveAppenders[i].groupEnd();
            }
        }
    }


    public timeStart(name: string, level: Log4Ts.Level) {
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
    }


    public timeEnd(name: string) {
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
    }


    public assert(expr: boolean) {
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
    }


    public toString() {
        return "Logger[" + this.name + "]";
    }

}

export = Logger;