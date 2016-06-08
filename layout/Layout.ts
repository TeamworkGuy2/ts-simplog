import Globals = require("../log4ts/Globals");
import Utils = require("../log-util/Utils");
import LogLog = require("../log4ts/LogLog");

/** Layout prototype
 */
abstract class Layout implements Log4Ts.Layout {
    public defaults = {
        loggerKey: "logger",
        timeStampKey: "timestamp",
        millisecondsKey: "milliseconds",
        levelKey: "level",
        messageKey: "message",
        exceptionKey: "exception",
        urlKey: "url"
    };

    public loggerKey = "logger";
    public timeStampKey = "timestamp";
    public millisecondsKey = "milliseconds";
    public levelKey = "level";
    public messageKey = "message";
    public exceptionKey = "exception";
    public urlKey = "url";
    public batchHeader = "";
    public batchFooter = "";
    public batchSeparator = "";
    public returnsPostData = false;
    public overrideTimeStampsSetting = false;
    public useTimeStampsInMilliseconds: boolean = null;
    public combineMessages: boolean;
    public customFields: { name: string; value: any }[];
    private hasWindow: boolean;


    constructor() {
        this.customFields = [];
        this.hasWindow = typeof window === "object";
    }

    public abstract format(loggingEvent: Log4Ts.LoggingEvent): any[] | string; // { LogLog.handleError("Layout.format: layout supplied has no format() method"); }

    public abstract ignoresThrowable(): boolean; // { LogLog.handleError("Layout.ignoresThrowable: layout supplied has no ignoresThrowable() method"); }

    public abstract toString(): string;


    public getContentType() {
        return "text/plain";
    }


    public allowBatching() {
        return true;
    }


    public setTimeStampsInMilliseconds(timeStampsInMilliseconds: boolean) {
        this.overrideTimeStampsSetting = true;
        this.useTimeStampsInMilliseconds = Utils.bool(timeStampsInMilliseconds);
    }


    public isTimeStampsInMilliseconds() {
        return this.overrideTimeStampsSetting ? this.useTimeStampsInMilliseconds : Globals.useTimeStampsInMilliseconds;
    }


    public getTimeStampValue(logEvent: Log4Ts.LoggingEvent) {
        return this.isTimeStampsInMilliseconds() ? logEvent.timeStampInMilliseconds : logEvent.timeStampInSeconds;
    }


    public getDataValues(loggingEvent: Log4Ts.LoggingEvent, combineMessages?: boolean) {
        var dataValues: [string, any][] = [
            [this.loggerKey, loggingEvent.logger.name],
            [this.timeStampKey, this.getTimeStampValue(loggingEvent)],
            [this.levelKey, loggingEvent.level.name],
            [this.urlKey, this.hasWindow ? window.location.href : "no-window-url"],
            [this.messageKey, combineMessages ? loggingEvent.getCombinedMessages() : loggingEvent.messages]
        ];
        if (!this.isTimeStampsInMilliseconds()) {
            dataValues.push([this.millisecondsKey, loggingEvent.milliseconds]);
        }
        if (loggingEvent.exception) {
            dataValues.push([this.exceptionKey, Utils.getExceptionStringRep(loggingEvent.exception)]);
        }
        if (this.hasCustomFields()) {
            for (var i = 0, len = this.customFields.length; i < len; i++) {
                var val = this.customFields[i].value;

                // Check if the value is a function. If so, execute it, passing it the
                // current layout and the logging event
                if (typeof val === "function") {
                    val = val(this, loggingEvent);
                }
                dataValues.push([this.customFields[i].name, val]);
            }
        }
        return dataValues;
    }


    public setKeys(loggerKey?: string, timeStampKey?: string, levelKey?: string, messageKey?: string, exceptionKey?: string, urlKey?: string, millisecondsKey?: string) {
        var strOrDefault = Utils.stringOrDefault;
        this.loggerKey = strOrDefault(loggerKey, this.defaults.loggerKey);
        this.timeStampKey = strOrDefault(timeStampKey, this.defaults.timeStampKey);
        this.levelKey = strOrDefault(levelKey, this.defaults.levelKey);
        this.messageKey = strOrDefault(messageKey, this.defaults.messageKey);
        this.exceptionKey = strOrDefault(exceptionKey, this.defaults.exceptionKey);
        this.urlKey = strOrDefault(urlKey, this.defaults.urlKey);
        this.millisecondsKey = strOrDefault(millisecondsKey, this.defaults.millisecondsKey);
    }


    public setCustomField(name: string, value: any) {
        var fieldUpdated = false;
        for (var i = 0, len = this.customFields.length; i < len; i++) {
            if (this.customFields[i].name === name) {
                this.customFields[i].value = value;
                fieldUpdated = true;
            }
        }
        if (!fieldUpdated) {
            this.customFields.push({ "name": name, "value": value });
        }
    }


    public hasCustomFields() {
        return (this.customFields.length > 0);
    }


    public formatWithException(loggingEvent: Log4Ts.LoggingEvent): any[] | string {
        var formatted = this.format(loggingEvent);
        if (loggingEvent.exception && this.ignoresThrowable()) {
            formatted += loggingEvent.getThrowableStrRep();
        }
        return formatted;
    }

}

export = Layout;