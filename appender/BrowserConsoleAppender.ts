import Level = require("../log4ts/Level");
import Appender = require("../appender/Appender");
import NullLayout = require("../layout/NullLayout");

/** BrowserConsoleAppender (only works in Opera and Safari and Firefox with Firebug extension)
 */
class BrowserConsoleAppender extends Appender {
    private console: Log4Ts.ConsoleLite;
    private customName: string;
    public name = "BrowserConsoleAppender";


    constructor(console: Log4Ts.ConsoleLite, name = "BrowserConsoleAppender", opts?: Log4Ts.AppenderOptions) {
        super(opts);
        this.layout = new NullLayout();
        this.threshold = Level.DEBUG;
        this.customName = name;
        this.console = console;
    }


    public append(logEvent: Log4Ts.LogEvent) {
        var console = this.console;

        if (console && console["log"]) {
            // use specific logging methods or fallback to console.log
            var funcName: keyof Log4Ts.ConsoleLite;

            if (console["trace"] && Level.TRACE.isGreaterOrEqual(logEvent.level)) {
                funcName = "trace";
            } else if (console["debug"] && Level.DEBUG.equals(logEvent.level)) {
                funcName = "debug";
            } else if (console["info"] && Level.INFO.equals(logEvent.level)) {
                funcName = "info";
            } else if (console["warn"] && Level.WARN.equals(logEvent.level)) {
                funcName = "warn";
            } else if (console["error"] && logEvent.level.isGreaterOrEqual(Level.ERROR)) {
                funcName = "error";
            } else {
                funcName = "log";
            }

            console[funcName].apply(console, <any>this.getFormattedMessage(logEvent, false));
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
        return this.name + ": " + this.customName;
    }


    private getFormattedMessage(logEvent: Log4Ts.LogEvent, concatenate: true): string;
    private getFormattedMessage(logEvent: Log4Ts.LogEvent, concatenate?: false): any[];
    private getFormattedMessage(logEvent: Log4Ts.LogEvent, concatenate?: boolean): string | any[];
    private getFormattedMessage(logEvent: Log4Ts.LogEvent, concatenate?: boolean): string | any[] {
        var formattedMessage = this.getLayout().formatWithException(logEvent);
        return (typeof formattedMessage === "string") ?
            (concatenate ? formattedMessage : [formattedMessage]) :
            (concatenate ? formattedMessage.join(" ") : formattedMessage);
    }

}

export = BrowserConsoleAppender;