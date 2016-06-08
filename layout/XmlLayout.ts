import Globals = require("../log4ts/Globals");
import Utils = require("../log-util/Utils");
import Layout = require("./Layout");

/** XmlLayout
 */
class XmlLayout extends Layout {

    constructor(combineMessages?: boolean) {
        super();

        this.combineMessages = Utils.booleanOrDefault(combineMessages, true);
    }


    public isCombinedMessages() {
        return this.combineMessages;
    }


    public getContentType() {
        return "text/xml";
    }


    public escapeCdata(str: string) {
        return str.replace(/\]\]>/, "]]>]]&gt;<![CDATA[");
    }


    public format(loggingEvent: Log4Ts.LoggingEvent) {
        var nwln = Globals.newLine;
        var layout = this;

        function formatMessage(message) {
            message = (typeof message === "string") ? message : Utils.toStr(message);
            return "<log4ts:message><![CDATA[" + layout.escapeCdata(message) + "]]></log4ts:message>";
        }

        var str = "<log4ts:event logger=\"" + loggingEvent.logger.name + "\" timestamp=\"" + this.getTimeStampValue(loggingEvent) + "\"";

        if (!this.isTimeStampsInMilliseconds()) {
            str += " milliseconds=\"" + loggingEvent.milliseconds + "\"";
        }
        str += " level=\"" + loggingEvent.level.name + "\">" + nwln;

        if (this.combineMessages) {
            str += formatMessage(loggingEvent.getCombinedMessages());
        } else {
            str += "<log4ts:messages>" + nwln;
            for (var i = 0, len = loggingEvent.messages.length; i < len; i++) {
                str += formatMessage(loggingEvent.messages[i]) + nwln;
            }
            str += "</log4ts:messages>" + nwln;
        }

        if (this.hasCustomFields()) {
            for (var i = 0, len = this.customFields.length; i < len; i++) {
                str += "<log4ts:customfield name=\"" +
                    this.customFields[i].name + "\"><![CDATA[" +
                    this.customFields[i].value.toString() +
                    "]]></log4ts:customfield>" + nwln;
            }
        }

        if (loggingEvent.exception) {
            str += "<log4ts:exception><![CDATA[" +
                Utils.getExceptionStringRep(loggingEvent.exception) +
                "]]></log4ts:exception>" + nwln;
        }
        str += "</log4ts:event>" + nwln + nwln;

        return str;
    }


    public ignoresThrowable() {
        return false;
    }


    public toString() {
        return "XmlLayout";
    }

}

export = XmlLayout;