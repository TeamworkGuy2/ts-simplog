import Globals = require("./Globals");
import Utils = require("../log-util/Utils");
import EventSupport = require("./EventSupport");

/** Simple logging for log4ts itself
 */
module LogLog {
    export var eventHandler: Log4Ts.EventSupport;
    export var debugMessages = []; // TODO only exported for tests
    var alertAllErrors = false;
    var numberOfErrors = 0;
    var quietMode = false;

    export var handleError: typeof EventSupport.prototype.handleError;

    var Cctor = (function () {
        EventSupport.defaultErrorCallback = error;
        eventHandler = new EventSupport();
        eventHandler.setEventTypes(["load", "error"]);
        LogLog.handleError = eventHandler.handleError;
    } ());


    export function setQuietMode(quietMode: boolean) {
        quietMode = Utils.bool(quietMode);
    }


    export function setAlertAllErrors(alertAllErrors: boolean) {
        alertAllErrors = alertAllErrors;
    }


    export function debug(message) {
        debugMessages.push(message);
    }


    export function displayDebug() {
        alert(debugMessages.join(Globals.newLine));
    }


    export function warn(message, exception?) {
    }


    export function error(message, exception?) {
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

}

export = LogLog;