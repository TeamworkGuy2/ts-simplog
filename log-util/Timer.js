"use strict";
var Level = require("../log4ts/Level");
/** Timers
 */
var Timer;
(function (Timer) {
    Timer.PERFORMANCE_MARK_START_SUFFIX = "-start";
    Timer.PERFORMANCE_MARK_END_SUFFIX = "-end";
    Timer.PERFORMANCE_MARK_MEASURE_SUFFIX = "-duration";
    /** Create a timer using new Date()
     * @param name the new timer's name
     * @param level the log level of the timer
     * @return a new Log4Ts.Timer instance
     */
    function newDateInst(name, level) {
        if (level === void 0) { level = Level.INFO; }
        var startDate = new Date();
        var inst = {
            name: name,
            level: level,
            startDate: startDate,
            startMillis: startDate.getTime(),
            endDate: null,
            endMillis: null,
            durationMillis: null,
            measure: function () {
                var endDate = new Date();
                var endMillis = endDate.getTime();
                var durationMillis = endMillis - inst.startMillis;
                inst.endDate = endDate;
                inst.endMillis = endMillis;
                inst.durationMillis = durationMillis;
                return durationMillis;
            },
        };
        return inst;
    }
    Timer.newDateInst = newDateInst;
    /** Create a timer using window.performance.now()
     * @param name the new timer's name
     * @param level the log level of the timer
     * @return a new Log4Ts.Timer instance
     */
    function newPerformanceNowInst(name, level) {
        if (level === void 0) { level = Level.INFO; }
        var startMillis = window.performance.now();
        var inst = {
            name: name,
            level: level,
            startDate: new Date(),
            startMillis: startMillis,
            endDate: null,
            endMillis: null,
            durationMillis: null,
            measure: function () {
                var endMillis = window.performance.now();
                var durationMillis = endMillis - startMillis;
                inst.endDate = new Date();
                inst.endMillis = endMillis;
                inst.durationMillis = durationMillis;
                return durationMillis;
            },
        };
        return inst;
    }
    Timer.newPerformanceNowInst = newPerformanceNowInst;
    /** Create a timer using window.performance.mark(...)
     * @param name the new timer's name
     * @param level the log level of the timer
     * @param startSuffix a suffix to append to the timer's name to make a unique start time marker, or a method which takes the timer name and returns a unique start time marker
     * @param endSuffix a suffix to append to the timer's name to make a unique end time marker, or a method which takes the timer name and returns a unique end time marker
     * @param measureSuffix a suffix to append to the timer's name to make a measure time marker, or a method which takes the timer name and returns a unique measure time marker
     * @return a new Log4Ts.Timer instance
     */
    function newPerformanceMarkInst(name, level, startSuffix, endSuffix, measureSuffix) {
        if (level === void 0) { level = Level.INFO; }
        var startName = (startSuffix != null ? (typeof startSuffix === "string" ? name + startSuffix : startSuffix(name)) : name + Timer.PERFORMANCE_MARK_START_SUFFIX);
        var endName = (endSuffix != null ? (typeof endSuffix === "string" ? name + endSuffix : endSuffix(name)) : name + Timer.PERFORMANCE_MARK_END_SUFFIX);
        var measureName = (measureSuffix != null ? (typeof measureSuffix === "string" ? name + measureSuffix : measureSuffix(name)) : name + Timer.PERFORMANCE_MARK_MEASURE_SUFFIX);
        window.performance.mark(startName);
        var startMillis = window.performance.now();
        var inst = {
            name: name,
            level: level,
            startDate: new Date(),
            startMillis: startMillis,
            endDate: null,
            endMillis: null,
            durationMillis: null,
            measure: function () {
                window.performance.mark(endName);
                window.performance.measure(measureName, startName, endName);
                var endMillis = window.performance.now();
                var durationMillis = window.performance.getEntriesByName(measureName)[0].duration;
                inst.endDate = new Date();
                inst.endMillis = endMillis;
                inst.durationMillis = durationMillis;
                return durationMillis;
            },
        };
        return inst;
    }
    Timer.newPerformanceMarkInst = newPerformanceMarkInst;
})(Timer || (Timer = {}));
module.exports = Timer;
