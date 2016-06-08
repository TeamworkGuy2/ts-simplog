import Utils = require("../log-util/Utils");
import Layout = require("./Layout");

/** HttpPostDataLayout
 */
class HttpPostDataLayout extends Layout {

    constructor() {
        super();

        this.setKeys();
        this.returnsPostData = true;
    }


    // Disable batching
    public allowBatching() {
        return false;
    }


    public format(loggingEvent: Log4Ts.LoggingEvent) {
        var dataValues = this.getDataValues(loggingEvent);
        var queryBits = [];
        for (var i = 0, len = dataValues.length; i < len; i++) {
            var val = (dataValues[i][1] instanceof Date) ?
                String(dataValues[i][1].getTime()) : dataValues[i][1];
            queryBits.push(Utils.urlEncode(dataValues[i][0]) + "=" + Utils.urlEncode(val));
        }
        return queryBits.join("&");
    }


    public ignoresThrowable() {
        return false;
    }


    public toString() {
        return "HttpPostDataLayout";
    }

}

export = HttpPostDataLayout;