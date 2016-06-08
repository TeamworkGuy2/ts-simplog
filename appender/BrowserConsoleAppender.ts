import Level = require("../log4ts/Level");
import Appender = require("../appender/Appender");
import NullLayout = require("../layout/NullLayout");

/** BrowserConsoleAppender (only works in Opera and Safari and Firefox with Firebug extension)
 */
class BrowserConsoleAppender extends Appender {
    private name: string;
    private console: Console;


    constructor(console: Console, name?: string) {
        super();
        this.layout = new NullLayout();
        this.threshold = Level.DEBUG;
        this.name = name;
        this.console = console;
    }


    public append(logEvent: Log4Ts.LoggingEvent) {
        var console = this.console;

        if (console && console.log) {
            // use specific logging methods or fallback to console.log
            var consoleFunc;

            if (console.debug && Level.DEBUG.isGreaterOrEqual(logEvent.level)) {
                consoleFunc = console.debug;
            } else if (console.info && Level.INFO.equals(logEvent.level)) {
                consoleFunc = console.info;
            } else if (console.warn && Level.WARN.equals(logEvent.level)) {
                consoleFunc = console.warn;
            } else if (console.error && logEvent.level.isGreaterOrEqual(Level.ERROR)) {
                consoleFunc = console.error;
            } else {
                consoleFunc = console.log;
            }

            consoleFunc.apply(console, this.getFormattedMessage(logEvent, false));
        }
        else if ((typeof opera != "undefined") && opera.postError) { // Opera
            opera.postError(this.getFormattedMessage(logEvent, true));
        }
    }


    public group(name: string) {
        if (this.console && this.console.group) {
            this.console.group(name);
        }
    }


    public groupEnd() {
        if (this.console && this.console.groupEnd) {
            this.console.groupEnd();
        }
    }


    public toString() {
        return "BrowserConsoleAppender";
    }


    private getFormattedMessage(logEvent: Log4Ts.LoggingEvent, concatenate?: boolean) {
        var formattedMessage = this.getLayout().formatWithException(logEvent);
        return (typeof formattedMessage === "string") ?
            (concatenate ? formattedMessage : [formattedMessage]) :
            (concatenate ? formattedMessage.join(" ") : formattedMessage);
    }

}

export = BrowserConsoleAppender;