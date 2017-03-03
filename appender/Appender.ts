import Globals = require("../log4ts/Globals");
import Utils = require("../log-util/Utils");
import LogLog = require("../log4ts/LogLog");
import Level = require("../log4ts/Level");
import EventSupport = require("../log4ts/EventSupport");
import PatternLayout = require("../layout/PatternLayout");

/** Appender prototype
 */
abstract class Appender extends EventSupport implements Log4Ts.Appender {
    protected layout: Log4Ts.Layout = new PatternLayout();
    protected threshold = Level.ALL;
    protected loggers: Log4Ts.Logger[] = [];
    public options: Log4Ts.AppenderOptions = {};
    public name = "Appender";


    constructor(opts: Log4Ts.AppenderOptions) {
        super();
        this.options = opts || {};
    }

    public abstract toString();

    public group(groupTitle: string, initiallyExpanded?: boolean): void { }

    public groupEnd(groupTitle?: string): void { }

    public append(logEvent: Log4Ts.LogEvent): void { }


    /** Performs threshold checks before delegating actual logging to the
     * subclass's specific append method.
     */
    public doAppend(logEvent: Log4Ts.LogEvent) {
        if (Globals.enabled && logEvent.level.level >= this.threshold.level) {
            this.append(logEvent);
        }
    }


    public setLayout(layout: Log4Ts.Layout) {
        this.layout = layout;
    }


    public getLayout() {
        return this.layout;
    }


    public setThreshold(threshold: Log4Ts.Level) {
        this.threshold = threshold;
    }


    public getThreshold() {
        return this.threshold;
    }


    public setAddedToLogger(logger: Log4Ts.Logger) {
        this.loggers.push(logger);
    }


    public setRemovedFromLogger(logger: Log4Ts.Logger) {
        Utils.arrayRemove(this.loggers, logger);
    }

}

export = Appender;