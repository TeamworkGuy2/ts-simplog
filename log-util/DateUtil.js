"use strict";
var DateUtil;
(function (DateUtil) {
    /** Number of milliseconds in a 24 hour period */
    DateUtil.MILLIS_PER_DAY = 1000 * 60 * 60 * 24;
    /** Number of milliseconds in a 7 x 24 hour period */
    DateUtil.MILLIS_PER_WEEK = 7 * DateUtil.MILLIS_PER_DAY;
    DateUtil.DEFAULT_MINIMAL_DAYS_IN_FIRST_WEEK = 1;
    DateUtil.MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    DateUtil.DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    function newMidnightDate(year, month, day) {
        var d = new Date(year, month, day, 0, 0, 0);
        d.setMilliseconds(0);
        return d;
    }
    DateUtil.newMidnightDate = newMidnightDate;
    function isBefore(base, date) {
        return base.getTime() < date.getTime();
    }
    DateUtil.isBefore = isBefore;
    function getMillisSince(base, date) {
        return base.getTime() - date.getTime();
    }
    DateUtil.getMillisSince = getMillisSince;
    function getPreviousSunday(date) {
        // Using midday avoids any possibility of DST messing things up
        var midday = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
        var previousSunday = new Date(midday.getTime() - date.getDay() * DateUtil.MILLIS_PER_DAY);
        return newMidnightDate(previousSunday.getFullYear(), previousSunday.getMonth(), previousSunday.getDate());
    }
    DateUtil.getPreviousSunday = getPreviousSunday;
    function getWeekInYear(date, minimalDaysInFirstWeek) {
        if (minimalDaysInFirstWeek == null) {
            minimalDaysInFirstWeek = DateUtil.DEFAULT_MINIMAL_DAYS_IN_FIRST_WEEK;
        }
        var previousSunday = getPreviousSunday(date);
        var startOfYear = newMidnightDate(date.getFullYear(), 0, 1);
        var weeksSinceSartOfYear = Math.floor(getMillisSince(previousSunday, startOfYear) / DateUtil.MILLIS_PER_WEEK);
        var numberOfSundays = isBefore(previousSunday, startOfYear) ? 0 : 1 + weeksSinceSartOfYear;
        var numberOfDaysInFirstWeek = 7 - startOfYear.getDay();
        var weekInYear = numberOfSundays;
        if (numberOfDaysInFirstWeek < minimalDaysInFirstWeek) {
            weekInYear--;
        }
        return weekInYear;
    }
    DateUtil.getWeekInYear = getWeekInYear;
    function getWeekInMonth(date, minimalDaysInFirstWeek) {
        if (minimalDaysInFirstWeek == null) {
            minimalDaysInFirstWeek = DateUtil.DEFAULT_MINIMAL_DAYS_IN_FIRST_WEEK;
        }
        var previousSunday = getPreviousSunday(date);
        var startOfMonth = newMidnightDate(date.getFullYear(), date.getMonth(), 1);
        var numberOfSundays = isBefore(previousSunday, startOfMonth) ?
            0 : 1 + Math.floor(getMillisSince(previousSunday, startOfMonth) / DateUtil.MILLIS_PER_WEEK);
        var numberOfDaysInFirstWeek = 7 - startOfMonth.getDay();
        var weekInMonth = numberOfSundays;
        if (numberOfDaysInFirstWeek >= minimalDaysInFirstWeek) {
            weekInMonth++;
        }
        return weekInMonth;
    }
    DateUtil.getWeekInMonth = getWeekInMonth;
    function getDayInYear(date) {
        var startOfYear = newMidnightDate(date.getFullYear(), 0, 1);
        return 1 + Math.floor(getMillisSince(date, startOfYear) / DateUtil.MILLIS_PER_DAY);
    }
    DateUtil.getDayInYear = getDayInYear;
})(DateUtil || (DateUtil = {}));
module.exports = DateUtil;
