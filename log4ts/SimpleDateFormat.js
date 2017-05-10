"use strict";
var Utils = require("../log-util/Utils");
var DateUtil = require("../log-util/DateUtil");
// Date-related stuff
var regex = /('[^']*')|(G+|y+|M+|w+|W+|D+|d+|F+|E+|a+|H+|k+|K+|h+|m+|s+|S+|Z+)|([a-zA-Z]+)|([^a-zA-Z']+)/;
var TEXT2 = 0, TEXT3 = 1, NUMBER = 2, YEAR = 3, MONTH = 4, TIMEZONE = 5;
var types = {
    G: TEXT2,
    y: YEAR,
    M: MONTH,
    w: NUMBER,
    W: NUMBER,
    D: NUMBER,
    d: NUMBER,
    F: NUMBER,
    E: TEXT3,
    a: TEXT2,
    H: NUMBER,
    k: NUMBER,
    K: NUMBER,
    h: NUMBER,
    m: NUMBER,
    s: NUMBER,
    S: NUMBER,
    Z: TIMEZONE
};
var SimpleDateFormat = (function () {
    /** SimpleDateFormat
     * @param formatString
     */
    function SimpleDateFormat(formatString) {
        this.formatString = formatString;
    }
    /**
     * Sets the minimum number of days in a week in order for that week to
     * be considered as belonging to a particular month or year
     */
    SimpleDateFormat.prototype.setMinimalDaysInFirstWeek = function (days) {
        this.minimalDaysInFirstWeek = days;
    };
    SimpleDateFormat.prototype.getMinimalDaysInFirstWeek = function () {
        return Utils.isUndefined(this.minimalDaysInFirstWeek) ? DateUtil.DEFAULT_MINIMAL_DAYS_IN_FIRST_WEEK : this.minimalDaysInFirstWeek;
    };
    SimpleDateFormat.prototype.formatText = function (data, numberOfLetters, minLength) {
        return (numberOfLetters >= 4) ? data : data.substr(0, Math.max(minLength, numberOfLetters));
    };
    SimpleDateFormat.prototype.formatNumber = function (data, numberOfLetters) {
        var dataString = "" + data;
        // Pad with 0s as necessary
        return Utils.padWithZeroes(dataString, numberOfLetters);
    };
    SimpleDateFormat.prototype.format = function (date) {
        var formattedString = "";
        var result;
        var searchStr = this.formatString;
        while ((result = regex.exec(searchStr))) {
            var quotedString = result[1];
            var patternLetters = result[2];
            var otherLetters = result[3];
            var otherCharacters = result[4];
            // If the pattern matched is quoted string, output the text between the quotes
            if (quotedString) {
                if (quotedString === "''") {
                    formattedString += "'";
                }
                else {
                    formattedString += quotedString.substring(1, quotedString.length - 1);
                }
            }
            else if (otherLetters) {
                // Swallow non-pattern letters by doing nothing here
            }
            else if (otherCharacters) {
                // Simply output other characters
                formattedString += otherCharacters;
            }
            else if (patternLetters) {
                // Replace pattern letters
                var patternLetter = patternLetters.charAt(0);
                var numberOfLetters = patternLetters.length;
                var rawData = this.extractPattern(patternLetter, date);
                // Format the raw data depending on the type
                switch (types[patternLetter]) {
                    case TEXT2:
                        formattedString += this.formatText(rawData, numberOfLetters, 2);
                        break;
                    case TEXT3:
                        formattedString += this.formatText(rawData, numberOfLetters, 3);
                        break;
                    case NUMBER:
                        formattedString += this.formatNumber(rawData, numberOfLetters);
                        break;
                    case YEAR:
                        if (numberOfLetters <= 3) {
                            // Output a 2-digit year
                            formattedString += String(rawData).substr(2, 2);
                        }
                        else {
                            formattedString += this.formatNumber(rawData, numberOfLetters);
                        }
                        break;
                    case MONTH:
                        if (numberOfLetters >= 3) {
                            formattedString += this.formatText(DateUtil.MONTHS[rawData], numberOfLetters, numberOfLetters);
                        }
                        else {
                            // NB. Months returned by getMonth are zero-based
                            formattedString += this.formatNumber(rawData + 1, numberOfLetters);
                        }
                        break;
                    case TIMEZONE:
                        var isPositive = (rawData > 0);
                        // The following line looks like a mistake but isn't because of the way getTimezoneOffset measures.
                        var prefix = isPositive ? "-" : "+";
                        var absData = Math.abs(rawData);
                        // Hours
                        var hours = "" + Math.floor(absData / 60);
                        hours = Utils.padWithZeroes(hours, 2);
                        // Minutes
                        var minutes = "" + (absData % 60);
                        minutes = Utils.padWithZeroes(minutes, 2);
                        formattedString += prefix + hours + minutes;
                        break;
                }
            }
            searchStr = searchStr.substr(result.index + result[0].length);
        }
        return formattedString;
    };
    SimpleDateFormat.prototype.extractPattern = function (patternLetter, date, defaultValue) {
        if (defaultValue === void 0) { defaultValue = ""; }
        switch (patternLetter) {
            case "G":
                return "AD";
            case "y":
                return date.getFullYear();
            case "M":
                return date.getMonth();
            case "w":
                return DateUtil.getWeekInYear(date, this.getMinimalDaysInFirstWeek());
            case "W":
                return DateUtil.getWeekInMonth(date, this.getMinimalDaysInFirstWeek());
            case "D":
                return DateUtil.getDayInYear(date);
            case "d":
                return date.getDate();
            case "F":
                return 1 + Math.floor((date.getDate() - 1) / 7);
            case "E":
                return DateUtil.DAYS_OF_WEEK[date.getDay()];
            case "a":
                return (date.getHours() >= 12) ? "PM" : "AM";
            case "H":
                return date.getHours();
            case "k":
                return date.getHours() || 24;
            case "K":
                return date.getHours() % 12;
            case "h":
                return (date.getHours() % 12) || 12;
            case "m":
                return date.getMinutes();
            case "s":
                return date.getSeconds();
            case "S":
                return date.getMilliseconds();
            case "Z":
                return date.getTimezoneOffset(); // This returns the number of minutes since GMT was this time.
            default:
                return defaultValue;
        }
    };
    return SimpleDateFormat;
}());
module.exports = SimpleDateFormat;
