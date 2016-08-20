import Appender = require("./Appender");
import SimpleLayout = require("../layout/SimpleLayout");

/** AlertAppender
 */
class AlertAppender extends Appender {
    public layout = new SimpleLayout();
    public name = "AlertAppender";

    constructor(opts?: Log4Ts.AppenderOptions) {
        super(opts);
    }


    public append(loggingEvent: Log4Ts.LoggingEvent) {
        alert(this.getLayout().formatWithException(loggingEvent));
    }


    public toString() {
        return this.name;
    }

}

export = AlertAppender;