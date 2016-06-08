import Layout = require("./Layout");

/** NullLayout
 */
class NullLayout extends Layout {

    constructor() {
        super();
    }


    public format(loggingEvent: Log4Ts.LoggingEvent) {
        return loggingEvent.messages;
    }


    public ignoresThrowable() {
        return true;
    }


    public formatWithException(loggingEvent: Log4Ts.LoggingEvent) {
        var messages = loggingEvent.messages, ex = loggingEvent.exception;
        return ex ? messages.concat([ex]) : messages;
    }


    public toString() {
        return "NullLayout";
    }

}

export = NullLayout;