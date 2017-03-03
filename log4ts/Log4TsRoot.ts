/// <reference path="log4ts.d.ts" />
/// <reference path="../../ts-local-storage-manager/local-store/local-store.d.ts" />
import Globals = require("./Globals");
import Utils = require("../log-util/Utils");
import Level = require("./Level");
import LogLog = require("./LogLog");
import Appender = require("../appender/Appender");
import EventSupport = require("./EventSupport");
import Logger = require("./Logger");

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
class Log4TsRoot {
    public static defaultInst: Log4TsRoot;

    private static Cctor = (function () {
        var defaultInst = new Log4TsRoot("log4ts", "1.4.13");
        Log4TsRoot.defaultInst = defaultInst;

        // Main load
        var logOnLoad = defaultInst.setDocumentReady;
        if (typeof window !== "undefined") {
            if (window.addEventListener) {
                window.addEventListener("load", logOnLoad, false);
            }
            else if ((<any>window).attachEvent) {
                (<any>window).attachEvent("onload", logOnLoad);
            }
            else {
                LogLog.handleError("window 'load' event not supported");
            }
        }
        else {
            logOnLoad();
        }
    } ());

    public version: string;
    public edition: string;

    public Level = Level;
    public logLog = LogLog;
    public handleError = LogLog.handleError;

    private ROOT_LOGGER_DEFAULT_LEVEL = Level.DEBUG;
    private rootLogger: Logger;
    private defaultLogger: Logger;
    private nullLogger: Logger;
    // Hashtable of loggers keyed by logger name
    private loggers: { [name: string]: Logger } = {};
    private loggerNames: string[] = [];


    constructor(edition: string, version: string) {
        this.rootLogger = new Logger(Logger.rootLoggerName);
        this.rootLogger.setLevel(this.ROOT_LOGGER_DEFAULT_LEVEL);
    }


    public setEnabled(enable: boolean) {
        Globals.enabled = Utils.bool(enable);
    }


    public isEnabled() {
        return Globals.enabled;
    }


    public setTimeStampsInMilliseconds(timeStampsInMilliseconds: boolean) {
        Globals.useTimeStampsInMilliseconds = Utils.bool(timeStampsInMilliseconds);
    }


    public isTimeStampsInMilliseconds() {
        return Globals.useTimeStampsInMilliseconds;
    }


    public setShowStackTraces(show: boolean) {
        Globals.showStackTraces = Utils.bool(show);
    }


    public getLogger(loggerName: string = Logger.anonymousLoggerName, options?: Log4Ts.LoggerOptions) {
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
            var logger = new Logger(loggerName, options);
            this.loggers[loggerName] = logger;
            this.loggerNames.push(loggerName);

            // Set up parent logger, if it doesn't exist
            var lastDotIndex = loggerName.lastIndexOf(".");
            var parentLogger: Logger;
            if (lastDotIndex > -1) {
                var parentLoggerName = loggerName.substring(0, lastDotIndex);
                parentLogger = this.getLogger(parentLoggerName); // Recursively sets up grandparents etc.
            } else {
                parentLogger = this.rootLogger;
            }
            parentLogger.addChild(logger);
        }
        return this.loggers[loggerName];
    }


    public getRootLogger() {
        return this.rootLogger;
    }


    public getDefaultLogger() {
        if (this.defaultLogger == null) {
            LogLog.handleError("default logger not yet initialized, call setupDefaultLogger() to setup a default logger");
        }
        return this.defaultLogger;
    }


    public getNullLogger() {
        if (!this.nullLogger) {
            this.nullLogger = new Logger(Logger.nullLoggerName);
            this.nullLogger.setLevel(Level.OFF);
        }
        return this.nullLogger;
    }


    // Destroys all loggers
    public resetConfiguration() {
        this.rootLogger.setLevel(this.ROOT_LOGGER_DEFAULT_LEVEL);
        this.loggers = {};
    }


    public setDocumentReady() {
        Globals.pageLoaded = true;
        LogLog.eventHandler.dispatchEvent("load", {});
    }


    public static setupDefaultLogger(defaultAppender: Appender) {
        var logger = Log4TsRoot.defaultInst.getLogger(Logger.defaultLoggerName);
        logger.addAppender(defaultAppender);
        return logger;
    }

}

export = Log4TsRoot;