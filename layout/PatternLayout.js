"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Globals = require("../log4ts/Globals");
var Utils = require("../log-util/Utils");
var DateUtil = require("../log-util/DateUtil");
var LogLog = require("../log4ts/LogLog");
var Layout = require("./Layout");
var SimpleDateFormat = require("../log4ts/SimpleDateFormat");
/** PatternLayout
 */
var PatternLayout = (function (_super) {
    __extends(PatternLayout, _super);
    function PatternLayout(pattern) {
        var _this = _super.call(this) || this;
        if (pattern) {
            _this.pattern = pattern;
        }
        else {
            _this.pattern = PatternLayout.DEFAULT_CONVERSION_PATTERN;
        }
        return _this;
    }
    PatternLayout.prototype.format = function (logEvent) {
        var regex = /%(-?[0-9]+)?(\.?[0-9]+)?([acdfmMnpr%])(\{([^\}]+)\})?|([^%]+)/;
        var formattedString = "";
        var result;
        var searchStr = this.pattern;
        // Cannot use regex global flag since it doesn't work with exec in IE5
        while ((result = regex.exec(searchStr))) {
            var matchedString = result[0];
            var padding = result[1];
            var truncation = result[2];
            var conversionCharacter = result[3];
            var specifier = result[5];
            var text = result[6];
            // Check if the pattern matched was just normal text
            if (text) {
                formattedString += "" + text;
            }
            else {
                // Create a raw replacement string based on the conversion
                // character and specifier
                var replacement = "";
                switch (conversionCharacter) {
                    case "a": // Array of messages
                    case "m":
                        var depth = 0;
                        if (specifier) {
                            depth = parseInt(specifier, 10);
                            if (isNaN(depth)) {
                                LogLog.handleError("PatternLayout.format: invalid specifier '" +
                                    specifier + "' for conversion character '" + conversionCharacter +
                                    "' - should be a number");
                                depth = 0;
                            }
                        }
                        var messages = (conversionCharacter === "a") ? logEvent.messages[0] : logEvent.messages;
                        for (var i = 0, len = messages.length; i < len; i++) {
                            if (i > 0 && (replacement.charAt(replacement.length - 1) !== " ")) {
                                replacement += " ";
                            }
                            if (depth === 0) {
                                replacement += messages[i];
                            }
                            else {
                                replacement += Utils.formatObjectExpansion(messages[i], depth);
                            }
                        }
                        break;
                    case "c":
                        var loggerName = logEvent.logger.name;
                        if (specifier) {
                            var precision = parseInt(specifier, 10);
                            var loggerNameBits = logEvent.logger.name.split(".");
                            if (precision >= loggerNameBits.length) {
                                replacement = loggerName;
                            }
                            else {
                                replacement = loggerNameBits.slice(loggerNameBits.length - precision).join(".");
                            }
                        }
                        else {
                            replacement = loggerName;
                        }
                        break;
                    case "d":
                        var dateFormat = PatternLayout.ISO8601_DATEFORMAT;
                        if (specifier) {
                            dateFormat = specifier;
                            // Pick up special cases
                            if (dateFormat == "ISO8601") {
                                dateFormat = PatternLayout.ISO8601_DATEFORMAT;
                            }
                            else if (dateFormat == "ABSOLUTE") {
                                dateFormat = PatternLayout.ABSOLUTETIME_DATEFORMAT;
                            }
                            else if (dateFormat == "DATE") {
                                dateFormat = PatternLayout.DATETIME_DATEFORMAT;
                            }
                        }
                        // Format the date
                        replacement = (new SimpleDateFormat(dateFormat)).format(logEvent.timeStamp);
                        break;
                    case "f":
                        if (this.hasCustomFields()) {
                            var fieldIndex = 0;
                            if (specifier) {
                                fieldIndex = parseInt(specifier, 10);
                                if (isNaN(fieldIndex)) {
                                    LogLog.handleError("PatternLayout.format: invalid specifier '" + specifier + "' for conversion character 'f' - should be a number");
                                }
                                else if (fieldIndex === 0) {
                                    LogLog.handleError("PatternLayout.format: invalid specifier '" + specifier + "' for conversion character 'f' - must be greater than zero");
                                }
                                else if (fieldIndex > this.customFields.length) {
                                    LogLog.handleError("PatternLayout.format: invalid specifier '" + specifier + "' for conversion character 'f' - there aren't that many custom fields");
                                }
                                else {
                                    fieldIndex = fieldIndex - 1;
                                }
                            }
                            var val = this.customFields[fieldIndex].value;
                            if (typeof val == "function") {
                                val = val(this, logEvent);
                            }
                            replacement = val;
                        }
                        break;
                    case "n":
                        replacement = Globals.newLine;
                        break;
                    case "p":
                        replacement = logEvent.level.name;
                        break;
                    case "r":
                        replacement = "" + DateUtil.getMillisSince(logEvent.timeStamp, Globals.applicationStartDate);
                        break;
                    case "%":
                        replacement = "%";
                        break;
                    default:
                        replacement = matchedString;
                        break;
                }
                // Format the replacement according to any padding or truncation specified
                var l;
                // First, truncation
                if (truncation) {
                    l = parseInt(truncation.substr(1), 10);
                    var strLen = replacement.length;
                    if (l < strLen) {
                        replacement = replacement.substring(strLen - l, strLen);
                    }
                }
                // Next, padding
                if (padding) {
                    if (padding.charAt(0) == "-") {
                        l = parseInt(padding.substr(1), 10);
                        // Right pad with spaces
                        while (replacement.length < l) {
                            replacement += " ";
                        }
                    }
                    else {
                        l = parseInt(padding, 10);
                        // Left pad with spaces
                        while (replacement.length < l) {
                            replacement = " " + replacement;
                        }
                    }
                }
                formattedString += replacement;
            }
            searchStr = searchStr.substr(result.index + result[0].length);
        }
        return formattedString;
    };
    PatternLayout.prototype.ignoresThrowable = function () {
        return true;
    };
    PatternLayout.prototype.toString = function () {
        return "PatternLayout";
    };
    return PatternLayout;
}(Layout));
PatternLayout.TTCC_CONVERSION_PATTERN = "%r %p %c - %m%n";
PatternLayout.DEFAULT_CONVERSION_PATTERN = "%m%n";
PatternLayout.ISO8601_DATEFORMAT = "yyyy-MM-dd HH:mm:ss,SSS";
PatternLayout.DATETIME_DATEFORMAT = "dd MMM yyyy HH:mm:ss,SSS";
PatternLayout.ABSOLUTETIME_DATEFORMAT = "HH:mm:ss,SSS";
module.exports = PatternLayout;
