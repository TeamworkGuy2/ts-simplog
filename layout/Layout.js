"use strict";
var Globals = require("../log4ts/Globals");
var Utils = require("../log-util/Utils");
/** Layout prototype
 */
var Layout = /** @class */ (function () {
    function Layout() {
        this.defaults = {
            loggerKey: "logger",
            timeStampKey: "timestamp",
            millisecondsKey: "milliseconds",
            levelKey: "level",
            messageKey: "message",
            exceptionKey: "exception",
            urlKey: "url"
        };
        this.loggerKey = "logger";
        this.timeStampKey = "timestamp";
        this.millisecondsKey = "milliseconds";
        this.levelKey = "level";
        this.messageKey = "message";
        this.exceptionKey = "exception";
        this.urlKey = "url";
        this.batchHeader = "";
        this.batchFooter = "";
        this.batchSeparator = "";
        this.returnsPostData = false;
        this.overrideTimeStampsSetting = false;
        this.useTimeStampsInMilliseconds = null;
        this.combineMessages = false;
        this.customFields = [];
        this.hasWindow = typeof window === "object";
    }
    Layout.prototype.getContentType = function () {
        return "text/plain";
    };
    Layout.prototype.allowBatching = function () {
        return true;
    };
    Layout.prototype.setTimeStampsInMilliseconds = function (timeStampsInMilliseconds) {
        this.overrideTimeStampsSetting = true;
        this.useTimeStampsInMilliseconds = Utils.bool(timeStampsInMilliseconds);
    };
    Layout.prototype.isTimeStampsInMilliseconds = function () {
        return this.overrideTimeStampsSetting ? this.useTimeStampsInMilliseconds : Globals.useTimeStampsInMilliseconds;
    };
    Layout.prototype.getTimeStampValue = function (logEvent) {
        return this.isTimeStampsInMilliseconds() ? logEvent.timeStampInMilliseconds : logEvent.timeStampInSeconds;
    };
    Layout.prototype.getDataValues = function (logEvent, combineMessages) {
        var dataValues = [
            [this.loggerKey, logEvent.logger.name],
            [this.timeStampKey, this.getTimeStampValue(logEvent)],
            [this.levelKey, logEvent.level.name],
            [this.urlKey, this.hasWindow ? window.location.href : "no-window-url"],
            [this.messageKey, combineMessages ? logEvent.getCombinedMessages() : logEvent.messages]
        ];
        if (!this.isTimeStampsInMilliseconds()) {
            dataValues.push([this.millisecondsKey, logEvent.milliseconds]);
        }
        if (logEvent.exception) {
            dataValues.push([this.exceptionKey, Utils.getExceptionStringRep(logEvent.exception)]);
        }
        if (this.hasCustomFields()) {
            for (var i = 0, len = this.customFields.length; i < len; i++) {
                var val = this.customFields[i].value;
                // Check if the value is a function. If so, execute it, passing it the current layout and the logging event
                if (typeof val === "function") {
                    val = val(this, logEvent);
                }
                dataValues.push([this.customFields[i].name, val]);
            }
        }
        return dataValues;
    };
    Layout.prototype.setKeys = function (loggerKey, timeStampKey, levelKey, messageKey, exceptionKey, urlKey, millisecondsKey) {
        var str = Utils.stringOrDefault;
        var df = this.defaults;
        this.loggerKey = str(loggerKey, df.loggerKey);
        this.timeStampKey = str(timeStampKey, df.timeStampKey);
        this.levelKey = str(levelKey, df.levelKey);
        this.messageKey = str(messageKey, df.messageKey);
        this.exceptionKey = str(exceptionKey, df.exceptionKey);
        this.urlKey = str(urlKey, df.urlKey);
        this.millisecondsKey = str(millisecondsKey, df.millisecondsKey);
    };
    Layout.prototype.setCustomField = function (name, value) {
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
    };
    Layout.prototype.hasCustomFields = function () {
        return (this.customFields.length > 0);
    };
    Layout.prototype.formatWithException = function (logEvent) {
        var formatted = this.format(logEvent);
        if (logEvent.exception && this.ignoresThrowable()) {
            formatted += logEvent.getThrowableStrRep();
        }
        return formatted;
    };
    return Layout;
}());
module.exports = Layout;
