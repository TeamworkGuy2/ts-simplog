import Layout = require("./Layout");

/** SimpleLayout
 */
class SimpleLayout extends Layout {
    private ignoreThrowable: boolean;


    constructor(ignoreThowable = true) {
        super();

        this.ignoreThrowable = ignoreThowable;
    }


    public format(logEvent: Log4Ts.LogEvent) {
        return logEvent.level.name + " - " + logEvent.getCombinedMessages();
    }


    public ignoresThrowable() {
        return this.ignoreThrowable;
    }


    public toString() {
        return "SimpleLayout";
    }

}

export = SimpleLayout;