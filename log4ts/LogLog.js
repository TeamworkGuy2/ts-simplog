"use strict";
var Globals = require("./Globals");
var Utils = require("../log-util/Utils");
var EventSupport = require("./EventSupport");
/** Simple logging for log4ts itself
 */
var LogLog;
(function (LogLog) {
    LogLog.debugMessages = []; // TODO only exported for tests
    var alertAllErrors = false;
    var numberOfErrors = 0;
    var quietMode = false;
    var Cctor = (function () {
        EventSupport.defaultErrorCallback = error;
        LogLog.eventHandler = new EventSupport();
        LogLog.eventHandler.setEventTypes(["load", "error"]);
        LogLog.handleError = LogLog.eventHandler.handleError;
    }());
    function setQuietMode(quietMode) {
        quietMode = Utils.bool(quietMode);
    }
    LogLog.setQuietMode = setQuietMode;
    function setAlertAllErrors(alertAllErrors) {
        alertAllErrors = alertAllErrors;
    }
    LogLog.setAlertAllErrors = setAlertAllErrors;
    function debug(message) {
        LogLog.debugMessages.push(message);
    }
    LogLog.debug = debug;
    function displayDebug() {
        alert(LogLog.debugMessages.join(Globals.newLine));
    }
    LogLog.displayDebug = displayDebug;
    function warn(message, exception) {
    }
    LogLog.warn = warn;
    function error(message, exception) {
        if (++numberOfErrors == 1 || alertAllErrors) {
            if (!quietMode) {
                var alertMessage = "log4ts error: " + message;
                if (exception) {
                    alertMessage += Globals.newLine + Globals.newLine + "Original error: " + Utils.getExceptionStringRep(exception);
                }
                alert(alertMessage);
            }
        }
    }
    LogLog.error = error;
})(LogLog || (LogLog = {}));
module.exports = LogLog;
