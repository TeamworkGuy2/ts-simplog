"use strict";
var Level = require("../log4ts/Level");
/** Timers
 */
var Timer;
(function (Timer) {
    Timer.PERFORMANCE_MARK_START_SUFFIX = "-start";
    Timer.PERFORMANCE_MARK_END_SUFFIX = "-end";
    Timer.PERFORMANCE_MARK_MEASURE_SUFFIX = "-duration";
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
                ;
                inst.endDate = endDate;
                inst.endMillis = endMillis;
                inst.durationMillis = durationMillis;
                return durationMillis;
            },
        };
        return inst;
    }
    Timer.newDateInst = newDateInst;
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
