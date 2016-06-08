import Layout = require("./Layout");

/** SimpleLayout
 */
class SimpleLayout extends Layout {
    private ignoreThrowable: boolean;


    constructor(ignoreThowable = true) {
        super();

        this.ignoreThrowable = ignoreThowable;
    }


    public format(loggingEvent: Log4Ts.LoggingEvent) {
        return loggingEvent.level.name + " - " + loggingEvent.getCombinedMessages();
    }


    public ignoresThrowable() {
        return this.ignoreThrowable;
    }


    public toString() {
        return "SimpleLayout";
    }

}

export = SimpleLayout;