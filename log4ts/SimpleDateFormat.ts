import Utils = require("../log-util/Utils");

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


class SimpleDateFormat {
    private formatString: string;
    private minimalDaysInFirstWeek: number;


    /** SimpleDateFormat
     * @param formatString
     */
    constructor(formatString: string) {
        this.formatString = formatString;
    }


    /**
     * Sets the minimum number of days in a week in order for that week to
     * be considered as belonging to a particular month or year
     */
    public setMinimalDaysInFirstWeek(days: number) {
        this.minimalDaysInFirstWeek = days;
    }


    public getMinimalDaysInFirstWeek() {
        return Utils.isUndefined(this.minimalDaysInFirstWeek) ? DEFAULT_MINIMAL_DAYS_IN_FIRST_WEEK : this.minimalDaysInFirstWeek;
    }


    public formatText(data: string, numberOfLetters: number, minLength: number) {
        return (numberOfLetters >= 4) ? data : data.substr(0, Math.max(minLength, numberOfLetters));
    }


    public formatNumber(data: number, numberOfLetters: number) {
        var dataString = "" + data;
        // Pad with 0s as necessary
        return SimpleDateFormat.padWithZeroes(dataString, numberOfLetters);
    }


    public format(date: Date) {
        var formattedString = "";
        var result: RegExpExecArray & [string, string, "G"|"y"|"M"|"w"|"W"|"D"|"d"|"F"|"E"|"a"|"H"|"k"|"K"|"h"|"m"|"s"|"S"|"Z", string, string];
        var searchString = this.formatString;
        while ((result = <any>regex.exec(searchString))) {
            var quotedString = result[1];
            var patternLetters = result[2];
            var otherLetters = result[3];
            var otherCharacters = result[4];

            // If the pattern matched is quoted string, output the text between the quotes
            if (quotedString) {
                if (quotedString === "''") {
                    formattedString += "'";
                } else {
                    formattedString += quotedString.substring(1, quotedString.length - 1);
                }
            } else if (otherLetters) {
                // Swallow non-pattern letters by doing nothing here
            } else if (otherCharacters) {
                // Simply output other characters
                formattedString += otherCharacters;
            } else if (patternLetters) {
                // Replace pattern letters
                var patternLetter = <typeof patternLetters>patternLetters.charAt(0);
                var numberOfLetters = patternLetters.length;
                var rawData: number | string = <any>"";
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
                        formattedString += this.formatText(<string>rawData, numberOfLetters, 2);
                        break;
                    case TEXT3:
                        formattedString += this.formatText(<string>rawData, numberOfLetters, 3);
                        break;
                    case NUMBER:
                        formattedString += this.formatNumber(<number>rawData, numberOfLetters);
                        break;
                    case YEAR:
                        if (numberOfLetters <= 3) {
                            // Output a 2-digit year
                            formattedString += String(rawData).substr(2, 2);
                        } else {
                            formattedString += this.formatNumber(<number>rawData, numberOfLetters);
                        }
                        break;
                    case MONTH:
                        if (numberOfLetters >= 3) {
                            formattedString += this.formatText(monthNames[rawData], numberOfLetters, numberOfLetters);
                        } else {
                            // NB. Months returned by getMonth are zero-based
                            formattedString += this.formatNumber(<number>rawData + 1, numberOfLetters);
                        }
                        break;
                    case TIMEZONE:
                        var isPositive = (rawData > 0);
                        // The following line looks like a mistake but isn't because of the way getTimezoneOffset measures.
                        var prefix = isPositive ? "-" : "+";
                        var absData = Math.abs(<number>rawData);

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
    }

}

module SimpleDateFormat {

    export function padWithZeroes(str: string, len: number) {
        while (str.length < len) {
            str = "0" + str;
        }
        return str;
    }


    export function newDateAtMidnight(year, month, day) {
        var d = new Date(year, month, day, 0, 0, 0);
        d.setMilliseconds(0);
        return d;
    }


    export function getDifference(base: Date, date: Date) {
        return base.getTime() - date.getTime();
    }


    export function isBefore(base: Date, date: Date) {
        return base.getTime() < date.getTime();
    }


    export function getUtcTime(date: Date) {
        return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
    }


    export function getTimeSince(base: Date, date: Date) {
        return getUtcTime(base) - getUtcTime(date);
    }


    export function getPreviousSunday(date: Date) {
        // Using midday avoids any possibility of DST messing things up
        var midday = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
        var previousSunday = new Date(midday.getTime() - date.getDay() * ONE_DAY_MILLIS);
        return newDateAtMidnight(previousSunday.getFullYear(), previousSunday.getMonth(), previousSunday.getDate());
    }


    export function getWeekInYear(date: Date, minimalDaysInFirstWeek?: number) {
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


    export function getWeekInMonth(date: Date, minimalDaysInFirstWeek?: number) {
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


    export function getDayInYear(date: Date) {
        var startOfYear = newDateAtMidnight(date.getFullYear(), 0, 1);
        return 1 + Math.floor(getTimeSince(date, startOfYear) / ONE_DAY_MILLIS);
    }

}

export = SimpleDateFormat;