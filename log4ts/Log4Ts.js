"use strict";
/// <reference path="log4ts.d.ts" />
/// <reference path="../../ts-local-storage-manager/local-store/local-store.d.ts" />
var Globals = require("./Globals");
var Utils = require("../log-util/Utils");
var Level = require("./Level");
var LogLog = require("./LogLog");
var Logger = require("./Logger");
/** Port/fork of log4javascript library to TypeScript.
 * NOTE: the below comment from the original log4javascript library doesn't apply to the TypeScript port, which has been split into multiple files and is used by importing using CommonJS style imports
 * of the individual files you require
 *
 * log4javascript is a logging framework for JavaScript based on log4j
 * for Java. This file contains all core log4javascript code and is the only
 * file required to use log4javascript, unless you require support for
 * document.domain, in which case you will also need console.html, which must be
 * stored in the same directory as the main log4javascript.js file.
 *
 * @author: TeamworkGuy2
 */
var Log4Ts = (function () {
    function Log4Ts(edition, version) {
        this.Level = Level;
        this.logLog = LogLog;
        this.handleError = LogLog.handleError;
        this.ROOT_LOGGER_DEFAULT_LEVEL = Level.DEBUG;
        // Hashtable of loggers keyed by logger name
        this.loggers = {};
        this.loggerNames = [];
        this.rootLogger = new Logger(Logger.rootLoggerName);
        this.rootLogger.setLevel(this.ROOT_LOGGER_DEFAULT_LEVEL);
    }
    Log4Ts.prototype.setEnabled = function (enable) {
        Globals.enabled = Utils.bool(enable);
    };
    Log4Ts.prototype.isEnabled = function () {
        return Globals.enabled;
    };
    Log4Ts.prototype.setTimeStampsInMilliseconds = function (timeStampsInMilliseconds) {
        Globals.useTimeStampsInMilliseconds = Utils.bool(timeStampsInMilliseconds);
    };
    Log4Ts.prototype.isTimeStampsInMilliseconds = function () {
        return Globals.useTimeStampsInMilliseconds;
    };
    /** This evaluates the given expression in the current scope, thus allowing
     * scripts to access private variables. Particularly useful for testing
     */
    Log4Ts.prototype.evalInScope = function (expr) {
        return eval(expr);
    };
    Log4Ts.prototype.setShowStackTraces = function (show) {
        Globals.showStackTraces = Utils.bool(show);
    };
    Log4Ts.prototype.getLogger = function (loggerName) {
        if (loggerName === void 0) { loggerName = Logger.anonymousLoggerName; }
        // Use default logger if loggerName is not specified or invalid
        if (typeof loggerName != "string") {
            loggerName = Logger.anonymousLoggerName;
            LogLog.warn("getLogger(): non-string logger name " + Utils.toStr(loggerName) + " supplied, returning anonymous logger");
        }
        // Do not allow retrieval of the root logger by name
        if (loggerName == Logger.rootLoggerName) {
            LogLog.handleError("getLogger(): root logger may not be obtained by name");
        }
        // Create the logger for this name if it doesn't already exist
        if (!this.loggers[loggerName]) {
            var logger = new Logger(loggerName);
            this.loggers[loggerName] = logger;
            this.loggerNames.push(loggerName);
            // Set up parent logger, if it doesn't exist
            var lastDotIndex = loggerName.lastIndexOf(".");
            var parentLogger;
            if (lastDotIndex > -1) {
                var parentLoggerName = loggerName.substring(0, lastDotIndex);
                parentLogger = this.getLogger(parentLoggerName); // Recursively sets up grandparents etc.
            }
            else {
                parentLogger = this.rootLogger;
            }
            parentLogger.addChild(logger);
        }
        return this.loggers[loggerName];
    };
    Log4Ts.prototype.getRootLogger = function () {
        return this.rootLogger;
    };
    Log4Ts.prototype.getDefaultLogger = function () {
        if (this.defaultLogger == null) {
            LogLog.handleError("default logger not yet initialized, call setupDefaultLogger() to setup a default logger");
        }
        return this.defaultLogger;
    };
    Log4Ts.prototype.getNullLogger = function () {
        if (!this.nullLogger) {
            this.nullLogger = new Logger(Logger.nullLoggerName);
            this.nullLogger.setLevel(Level.OFF);
        }
        return this.nullLogger;
    };
    // Destroys all loggers
    Log4Ts.prototype.resetConfiguration = function () {
        this.rootLogger.setLevel(this.ROOT_LOGGER_DEFAULT_LEVEL);
        this.loggers = {};
    };
    Log4Ts.prototype.setDocumentReady = function () {
        Globals.pageLoaded = true;
        LogLog.eventHandler.dispatchEvent("load", {});
    };
    Log4Ts.setupDefaultLogger = function (defaultAppender) {
        var logger = Log4Ts.defaultInst.getLogger(Logger.defaultLoggerName);
        logger.addAppender(defaultAppender);
        return logger;
    };
    Log4Ts.Cctor = (function () {
        var defaultInst = new Log4Ts("log4ts", "1.4.13");
        Log4Ts.defaultInst = defaultInst;
        // Main load
        var logOnLoad = defaultInst.setDocumentReady;
        if (typeof window !== "undefined") {
            if (window.addEventListener) {
                window.addEventListener("load", logOnLoad, false);
            }
            else if (window.attachEvent) {
                window.attachEvent("onload", logOnLoad);
            }
            else {
                LogLog.handleError("window 'load' event not supported");
            }
        }
        else {
            logOnLoad();
        }
    }());
    return Log4Ts;
}());
module.exports = Log4Ts;
