"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Globals = require("../log4ts/Globals");
var Utils = require("../log-util/Utils");
var Layout = require("./Layout");
/** XmlLayout
 */
var XmlLayout = (function (_super) {
    __extends(XmlLayout, _super);
    function XmlLayout(combineMessages) {
        var _this = _super.call(this) || this;
        _this.combineMessages = Utils.booleanOrDefault(combineMessages, true);
        return _this;
    }
    XmlLayout.prototype.isCombinedMessages = function () {
        return this.combineMessages;
    };
    XmlLayout.prototype.getContentType = function () {
        return "text/xml";
    };
    XmlLayout.prototype.escapeCdata = function (str) {
        return str.replace(/\]\]>/, "]]>]]&gt;<![CDATA[");
    };
    XmlLayout.prototype.format = function (logEvent) {
        var nwln = Globals.newLine;
        var layout = this;
        function formatMessage(message) {
            message = (typeof message === "string") ? message : Utils.toStr(message);
            return "<log4ts:message><![CDATA[" + layout.escapeCdata(message) + "]]></log4ts:message>";
        }
        var str = "<log4ts:event logger=\"" + logEvent.logger.name + "\" timestamp=\"" + this.getTimeStampValue(logEvent) + "\"";
        if (!this.isTimeStampsInMilliseconds()) {
            str += " milliseconds=\"" + logEvent.milliseconds + "\"";
        }
        str += " level=\"" + logEvent.level.name + "\">" + nwln;
        if (this.combineMessages) {
            str += formatMessage(logEvent.getCombinedMessages());
        }
        else {
            str += "<log4ts:messages>" + nwln;
            for (var i = 0, len = logEvent.messages.length; i < len; i++) {
                str += formatMessage(logEvent.messages[i]) + nwln;
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
        if (logEvent.exception) {
            str += "<log4ts:exception><![CDATA[" +
                Utils.getExceptionStringRep(logEvent.exception) +
                "]]></log4ts:exception>" + nwln;
        }
        str += "</log4ts:event>" + nwln + nwln;
        return str;
    };
    XmlLayout.prototype.ignoresThrowable = function () {
        return false;
    };
    XmlLayout.prototype.toString = function () {
        return "XmlLayout";
    };
    return XmlLayout;
}(Layout));
module.exports = XmlLayout;
