"use strict";
var Utils = require("../log-util/Utils");
// Date-related stuff
var regex = /('[^']*')|(G+|y+|M+|w+|W+|D+|d+|F+|E+|a+|H+|k+|K+|h+|m+|s+|S+|Z+)|([a-zA-Z]+)|([^a-zA-Z']+)/;
var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
var dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
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
var ONE_DAY_MILLIS = 24 * 60 * 60 * 1000;
var ONE_WEEK_MILLIS = 7 * ONE_DAY_MILLIS;
var DEFAULT_MINIMAL_DAYS_IN_FIRST_WEEK = 1;
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
        return Utils.isUndefined(this.minimalDaysInFirstWeek) ? DEFAULT_MINIMAL_DAYS_IN_FIRST_WEEK : this.minimalDaysInFirstWeek;
    };
    SimpleDateFormat.prototype.formatText = function (data, numberOfLetters, minLength) {
        return (numberOfLetters >= 4) ? data : data.substr(0, Math.max(minLength, numberOfLetters));
    };
    SimpleDateFormat.prototype.formatNumber = function (data, numberOfLetters) {
        var dataString = "" + data;
        // Pad with 0s as necessary
        return SimpleDateFormat.padWithZeroes(dataString, numberOfLetters);
    };
    SimpleDateFormat.prototype.format = function (date) {
        var formattedString = "";
        var result;
        var searchString = this.formatString;
        while ((result = regex.exec(searchString))) {
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
            }
            else if (otherCharacters) {
                // Simply output other characters
                formattedString += otherCharacters;
            }
            else if (patternLetters) {
                // Replace pattern letters
                var patternLetter = patternLetters.charAt(0);
                var numberOfLetters = patternLetters.length;
                var rawData = "";
                switch (patternLetter) {
                    case "G":
                        rawData = "AD";
                        break;
                    case "y":
                        rawData = date.getFullYear();
                        break;
                    case "M":
                        rawData = date.getMonth();
                        break;
                    case "w":
                        rawData = SimpleDateFormat.getWeekInYear(date, this.getMinimalDaysInFirstWeek());
                        break;
                    case "W":
                        rawData = SimpleDateFormat.getWeekInMonth(date, this.getMinimalDaysInFirstWeek());
                        break;
                    case "D":
                        rawData = SimpleDateFormat.getDayInYear(date);
                        break;
                    case "d":
                        rawData = date.getDate();
                        break;
                    case "F":
                        rawData = 1 + Math.floor((date.getDate() - 1) / 7);
                        break;
                    case "E":
                        rawData = dayNames[date.getDay()];
                        break;
                    case "a":
                        rawData = (date.getHours() >= 12) ? "PM" : "AM";
                        break;
                    case "H":
                        rawData = date.getHours();
                        break;
                    case "k":
                        rawData = date.getHours() || 24;
                        break;
                    case "K":
                        rawData = date.getHours() % 12;
                        break;
                    case "h":
                        rawData = (date.getHours() % 12) || 12;
                        break;
                    case "m":
                        rawData = date.getMinutes();
                        break;
                    case "s":
                        rawData = date.getSeconds();
                        break;
                    case "S":
                        rawData = date.getMilliseconds();
                        break;
                    case "Z":
                        rawData = date.getTimezoneOffset(); // This returns the number of minutes since GMT was this time.
                        break;
                }
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
                            formattedString += this.formatText(monthNames[rawData], numberOfLetters, numberOfLetters);
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
                        hours = SimpleDateFormat.padWithZeroes(hours, 2);
                        // Minutes
                        var minutes = "" + (absData % 60);
                        minutes = SimpleDateFormat.padWithZeroes(minutes, 2);
                        formattedString += prefix + hours + minutes;
                        break;
                }
            }
            searchString = searchString.substr(result.index + result[0].length);
        }
        return formattedString;
    };
    return SimpleDateFormat;
}());
var SimpleDateFormat;
(function (SimpleDateFormat) {
    function padWithZeroes(str, len) {
        while (str.length < len) {
            str = "0" + str;
        }
        return str;
    }
    SimpleDateFormat.padWithZeroes = padWithZeroes;
    function newDateAtMidnight(year, month, day) {
        var d = new Date(year, month, day, 0, 0, 0);
        d.setMilliseconds(0);
        return d;
    }
    SimpleDateFormat.newDateAtMidnight = newDateAtMidnight;
    function getDifference(base, date) {
        return base.getTime() - date.getTime();
    }
    SimpleDateFormat.getDifference = getDifference;
    function isBefore(base, date) {
        return base.getTime() < date.getTime();
    }
    SimpleDateFormat.isBefore = isBefore;
    function getUtcTime(date) {
        return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
    }
    SimpleDateFormat.getUtcTime = getUtcTime;
    function getTimeSince(base, date) {
        return getUtcTime(base) - getUtcTime(date);
    }
    SimpleDateFormat.getTimeSince = getTimeSince;
    function getPreviousSunday(date) {
        // Using midday avoids any possibility of DST messing things up
        var midday = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
        var previousSunday = new Date(midday.getTime() - date.getDay() * ONE_DAY_MILLIS);
        return newDateAtMidnight(previousSunday.getFullYear(), previousSunday.getMonth(), previousSunday.getDate());
    }
    SimpleDateFormat.getPreviousSunday = getPreviousSunday;
    function getWeekInYear(date, minimalDaysInFirstWeek) {
        if (Utils.isUndefined(minimalDaysInFirstWeek)) {
            minimalDaysInFirstWeek = DEFAULT_MINIMAL_DAYS_IN_FIRST_WEEK;
        }
        var previousSunday = getPreviousSunday(date);
        var startOfYear = newDateAtMidnight(date.getFullYear(), 0, 1);
        var weeksSinceSartOfYear = Math.floor(getTimeSince(previousSunday, startOfYear) / ONE_WEEK_MILLIS);
        var numberOfSundays = isBefore(previousSunday, startOfYear) ? 0 : 1 + weeksSinceSartOfYear;
        var numberOfDaysInFirstWeek = 7 - startOfYear.getDay();
        var weekInYear = numberOfSundays;
        if (numberOfDaysInFirstWeek < minimalDaysInFirstWeek) {
            weekInYear--;
        }
        return weekInYear;
    }
    SimpleDateFormat.getWeekInYear = getWeekInYear;
    function getWeekInMonth(date, minimalDaysInFirstWeek) {
        if (Utils.isUndefined(minimalDaysInFirstWeek)) {
            minimalDaysInFirstWeek = DEFAULT_MINIMAL_DAYS_IN_FIRST_WEEK;
        }
        var previousSunday = getPreviousSunday(date);
        var startOfMonth = newDateAtMidnight(date.getFullYear(), date.getMonth(), 1);
        var numberOfSundays = isBefore(previousSunday, startOfMonth) ?
            0 : 1 + Math.floor(getTimeSince(previousSunday, startOfMonth) / ONE_WEEK_MILLIS);
        var numberOfDaysInFirstWeek = 7 - startOfMonth.getDay();
        var weekInMonth = numberOfSundays;
        if (numberOfDaysInFirstWeek >= minimalDaysInFirstWeek) {
            weekInMonth++;
        }
        return weekInMonth;
    }
    SimpleDateFormat.getWeekInMonth = getWeekInMonth;
    function getDayInYear(date) {
        var startOfYear = newDateAtMidnight(date.getFullYear(), 0, 1);
        return 1 + Math.floor(getTimeSince(date, startOfYear) / ONE_DAY_MILLIS);
    }
    SimpleDateFormat.getDayInYear = getDayInYear;
})(SimpleDateFormat || (SimpleDateFormat = {}));
module.exports = SimpleDateFormat;
