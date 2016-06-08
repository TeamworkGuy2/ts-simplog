import Appender = require("./Appender");
import SimpleLayout = require("../layout/SimpleLayout");

/** AlertAppender
 */
class AlertAppender extends Appender {
    public layout = new SimpleLayout();

    constructor() {
        super();
    }


    public append(loggingEvent: Log4Ts.LoggingEvent) {
        alert(this.getLayout().formatWithException(loggingEvent));
    }


    public toString() {
        return "AlertAppender";
    }

}

export = AlertAppender;