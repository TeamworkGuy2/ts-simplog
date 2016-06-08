"use strict";
var Globals = require("./Globals");
var Utils = require("../log-util/Utils");
/** Logging events
 */
var LoggingEvent = (function () {
    function LoggingEvent(logger, timeStamp, level, messages, exception) {
        this.logger = logger;
        this.timeStamp = timeStamp;
        this.timeStampInMilliseconds = timeStamp.getTime();
        this.timeStampInSeconds = Math.floor(this.timeStampInMilliseconds / 1000);
        this.milliseconds = this.timeStamp.getMilliseconds();
        this.level = level;
        this.messages = messages;
        this.exception = exception;
    }
    LoggingEvent.prototype.getThrowableStrRep = function () {
        return this.exception ? Utils.getExceptionStringRep(this.exception) : "";
    };
    LoggingEvent.prototype.getCombinedMessages = function () {
        return (this.messages.length == 1) ? this.messages[0] : this.messages.join(Globals.newLine);
    };
    LoggingEvent.prototype.toString = function () {
        return "LoggingEvent[" + this.level + "]";
    };
    return LoggingEvent;
}());
module.exports = LoggingEvent;
