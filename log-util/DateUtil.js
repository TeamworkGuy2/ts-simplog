"use strict";
var DateUtil;
(function (DateUtil) {
    DateUtil.ONE_DAY_MILLIS = 24 * 60 * 60 * 1000;
    DateUtil.ONE_WEEK_MILLIS = 7 * DateUtil.ONE_DAY_MILLIS;
    DateUtil.DEFAULT_MINIMAL_DAYS_IN_FIRST_WEEK = 1;
    DateUtil.monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    DateUtil.dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    function newMidnightDate(year, month, day) {
        var d = new Date(year, month, day, 0, 0, 0);
        d.setMilliseconds(0);
        return d;
    }
    DateUtil.newMidnightDate = newMidnightDate;
    function getDifference(base, date) {
        return base.getTime() - date.getTime();
    }
    DateUtil.getDifference = getDifference;
    function isBefore(base, date) {
        return base.getTime() < date.getTime();
    }
    DateUtil.isBefore = isBefore;
    function getUtcTime(date) {
        return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
    }
    DateUtil.getUtcTime = getUtcTime;
    function getTimeSince(base, date) {
        return getUtcTime(base) - getUtcTime(date);
    }
    DateUtil.getTimeSince = getTimeSince;
    function getPreviousSunday(date) {
        // Using midday avoids any possibility of DST messing things up
        var midday = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
        var previousSunday = new Date(midday.getTime() - date.getDay() * DateUtil.ONE_DAY_MILLIS);
        return newMidnightDate(previousSunday.getFullYear(), previousSunday.getMonth(), previousSunday.getDate());
    }
    DateUtil.getPreviousSunday = getPreviousSunday;
    function getWeekInYear(date, minimalDaysInFirstWeek) {
        if (minimalDaysInFirstWeek == null) {
            minimalDaysInFirstWeek = DateUtil.DEFAULT_MINIMAL_DAYS_IN_FIRST_WEEK;
        }
        var previousSunday = getPreviousSunday(date);
        var startOfYear = newMidnightDate(date.getFullYear(), 0, 1);
        var weeksSinceSartOfYear = Math.floor(getTimeSince(previousSunday, startOfYear) / DateUtil.ONE_WEEK_MILLIS);
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
            0 : 1 + Math.floor(getTimeSince(previousSunday, startOfMonth) / DateUtil.ONE_WEEK_MILLIS);
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
        return 1 + Math.floor(getTimeSince(date, startOfYear) / DateUtil.ONE_DAY_MILLIS);
    }
    DateUtil.getDayInYear = getDayInYear;
})(DateUtil || (DateUtil = {}));
module.exports = DateUtil;
