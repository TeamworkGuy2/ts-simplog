"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Globals = require("../log4ts/Globals");
var Utils = require("../log-util/Utils");
var Layout = require("./Layout");
/** JsonLayout
 */
var JsonLayout = (function (_super) {
    __extends(JsonLayout, _super);
    function JsonLayout(readable, combineMessages) {
        var _this = _super.call(this) || this;
        var nwln = Globals.newLine;
        _this.readable = Utils.booleanOrDefault(readable, false);
        _this.combineMessages = Utils.booleanOrDefault(combineMessages, true);
        _this.batchHeader = _this.readable ? "[" + nwln : "[";
        _this.batchFooter = _this.readable ? "]" + nwln : "]";
        _this.batchSeparator = _this.readable ? "," + nwln : ",";
        _this.setKeys();
        _this.colon = _this.readable ? ": " : ":";
        _this.tab = _this.readable ? "\t" : "";
        _this.lineBreak = _this.readable ? nwln : "";
        return _this;
    }
    JsonLayout.prototype.isReadable = function () {
        return this.readable;
    };
    JsonLayout.prototype.isCombinedMessages = function () {
        return this.combineMessages;
    };
    JsonLayout.prototype.format = function (loggingEvent) {
        var layout = this;
        var dataValues = this.getDataValues(loggingEvent, this.combineMessages);
        var str = "{" + this.lineBreak;
        function formatValue(val, prefix, expand) {
            // Check the type of the data value to decide whether quotation marks
            // or expansion are required
            var formattedValue;
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
    };
    JsonLayout.prototype.ignoresThrowable = function () {
        return false;
    };
    JsonLayout.prototype.getContentType = function () {
        return "application/json";
    };
    JsonLayout.prototype.toString = function () {
        return "JsonLayout";
    };
    return JsonLayout;
}(Layout));
module.exports = JsonLayout;
