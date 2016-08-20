import Globals = require("../log4ts/Globals");
import Utils = require("../log-util/Utils");
import Layout = require("./Layout");

/** JsonLayout
 */
class JsonLayout extends Layout {
    private readable: boolean;
    private colon: string;
    private tab: string;
    private lineBreak: string;


    constructor(readable?: boolean, combineMessages?: boolean) {
        super();

        var nwln = Globals.newLine;
        this.readable = Utils.booleanOrDefault(readable, false);
        this.combineMessages = Utils.booleanOrDefault(combineMessages, true);
        this.batchHeader = this.readable ? "[" + nwln : "[";
        this.batchFooter = this.readable ? "]" + nwln : "]";
        this.batchSeparator = this.readable ? "," + nwln : ",";
        this.setKeys();
        this.colon = this.readable ? ": " : ":";
        this.tab = this.readable ? "\t" : "";
        this.lineBreak = this.readable ? nwln : "";
    }


    public isReadable() {
        return this.readable;
    }


    public isCombinedMessages() {
        return this.combineMessages;
    }


    public format(loggingEvent: Log4Ts.LoggingEvent) {
        var layout = this;
        var dataValues = this.getDataValues(loggingEvent, this.combineMessages);
        var str = "{" + this.lineBreak;

        function formatValue(val, prefix: string, expand: boolean) {
            // Check the type of the data value to decide whether quotation marks
            // or expansion are required
            var formattedValue: string;
            var valType = Object.prototype.toString.call(val);

            if (valType === "[object Date]") {
                formattedValue = String(val.getTime());
            }
            else if (expand && (valType === "[object Array]")) {
                formattedValue = "[" + layout.lineBreak;
                for (var i = 0, len = val.length; i < len; i++) {
                    var childPrefix = prefix + layout.tab;
                    formattedValue += childPrefix + formatValue(val[i], childPrefix, false);
                    if (i < val.length - 1) {
                        formattedValue += ",";
                    }
                    formattedValue += layout.lineBreak;
                }
                formattedValue += prefix + "]";
            }
            else if (valType !== "[object Number]" && valType !== "[object Boolean]") {
                formattedValue = "\"" + Utils.escapeNewLines(Utils.toStr(val).replace(/\"/g, "\\\"")) + "\"";
            }
            else {
                formattedValue = val;
            }
            return formattedValue;
        }

        for (var i = 0, count = dataValues.length - 1; i <= count; i++) {
            str += this.tab + "\"" + dataValues[i][0] + "\"" + this.colon + formatValue(dataValues[i][1], this.tab, true);
            if (i < count) {
                str += ",";
            }
            str += this.lineBreak;
        }
        str += "}" + this.lineBreak;
        return str;
    }


    public ignoresThrowable() {
        return false;
    }


    public getContentType() {
        return "application/json";
    }


    public toString() {
        return "JsonLayout";
    }

}

export = JsonLayout;