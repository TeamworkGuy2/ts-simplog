import Layout = require("./Layout");

/** NullLayout
 */
class NullLayout extends Layout {

    constructor() {
        super();
    }


    public format(logEvent: Log4Ts.LogEvent) {
        return logEvent.messages;
    }


    public ignoresThrowable() {
        return true;
    }


    public formatWithException(logEvent: Log4Ts.LogEvent) {
        var messages = logEvent.messages, ex = logEvent.exception;
        return ex ? messages.concat([ex]) : messages;
    }


    public toString() {
        return "NullLayout";
    }

}

export = NullLayout;