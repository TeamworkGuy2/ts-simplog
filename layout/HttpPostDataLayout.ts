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


    public format(logEvent: Log4Ts.LogEvent) {
        var dataValues = this.getDataValues(logEvent);
        var queryBits = [];
        for (var i = 0, len = dataValues.length; i < len; i++) {
            var dataVal = dataValues[i][1];
            var val = (dataVal instanceof Date) ? String(dataVal.getTime()) : dataVal;
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