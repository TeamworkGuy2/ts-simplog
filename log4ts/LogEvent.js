"use strict";
var Globals = require("./Globals");
var Utils = require("../log-util/Utils");
/** Logging events
 */
var LogEvent = (function () {
    function LogEvent(logger, timeStamp, level, messages, exception) {
        this.logger = logger;
        this.timeStamp = timeStamp;
        this.timeStampInMilliseconds = timeStamp.getTime();
        this.timeStampInSeconds = Math.floor(this.timeStampInMilliseconds / 1000);
        this.milliseconds = this.timeStamp.getMilliseconds();
        this.level = level;
        this.messages = messages;
        this.exception = exception;
    }
    LogEvent.prototype.getThrowableStrRep = function () {
        return this.exception ? Utils.getExceptionStringRep(this.exception) : "";
    };
    LogEvent.prototype.getCombinedMessages = function () {
        return (this.messages.length == 1) ? this.messages[0] : this.messages.join(Globals.newLine);
    };
    LogEvent.prototype.toString = function () {
        return "LogEvent[" + this.level + "]";
    };
    return LogEvent;
}());
module.exports = LogEvent;
