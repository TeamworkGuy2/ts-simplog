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


    public append(logEvent: Log4Ts.LogEvent) {
        alert(this.getLayout().formatWithException(logEvent));
    }


    public toString() {
        return this.name;
    }

}

export = AlertAppender;