
module DateUtil {
    export var ONE_DAY_MILLIS = 24 * 60 * 60 * 1000;
    export var ONE_WEEK_MILLIS = 7 * ONE_DAY_MILLIS;
    export var DEFAULT_MINIMAL_DAYS_IN_FIRST_WEEK = 1;

    export var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    export var dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];


    export function newMidnightDate(year: number, month: number, day: number) {
        var d = new Date(year, month, day, 0, 0, 0);
        d.setMilliseconds(0);
        return d;
    }


    export function getDifference(base: Date, date: Date) {
        return <number>base.getTime() - <number>date.getTime();
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
        var previousSunday = new Date(<number>midday.getTime() - date.getDay() * ONE_DAY_MILLIS);
        return newMidnightDate(previousSunday.getFullYear(), previousSunday.getMonth(), previousSunday.getDate());
    }


    export function getWeekInYear(date: Date, minimalDaysInFirstWeek?: number) {
        if (minimalDaysInFirstWeek == null) {
            minimalDaysInFirstWeek = DEFAULT_MINIMAL_DAYS_IN_FIRST_WEEK;
        }
        var previousSunday = getPreviousSunday(date);
        var startOfYear = newMidnightDate(date.getFullYear(), 0, 1);
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
        if (minimalDaysInFirstWeek == null) {
            minimalDaysInFirstWeek = DEFAULT_MINIMAL_DAYS_IN_FIRST_WEEK;
        }
        var previousSunday = getPreviousSunday(date);
        var startOfMonth = newMidnightDate(date.getFullYear(), date.getMonth(), 1);
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
        var startOfYear = newMidnightDate(date.getFullYear(), 0, 1);
        return 1 + Math.floor(getTimeSince(date, startOfYear) / ONE_DAY_MILLIS);
    }

}

export = DateUtil;
