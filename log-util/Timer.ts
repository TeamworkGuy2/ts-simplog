import Level = require("../log4ts/Level");

/** Timers
 */
module Timer {
    export var PERFORMANCE_MARK_START_SUFFIX = "-start";
    export var PERFORMANCE_MARK_END_SUFFIX = "-end";
    export var PERFORMANCE_MARK_MEASURE_SUFFIX = "-duration";


    export function newDateInst(name: string, level: Log4Ts.Level = Level.INFO): Log4Ts.Timer {
        var startDate = new Date();

        var inst = {
            name: name,
            level: level,
            startDate: startDate,
            startMillis: startDate.getTime(),
            endDate: null,
            endMillis: null,
            durationMillis: null,
            measure: () => {
                var endDate = new Date();
                var endMillis = endDate.getTime();
                var durationMillis = endMillis - inst.startMillis;;
                inst.endDate = endDate;
                inst.endMillis = endMillis;
                inst.durationMillis = durationMillis;
                return durationMillis;
            },
        };
        return inst;
    }


    export function newPerformanceNowInst(name: string, level: Log4Ts.Level = Level.INFO): Log4Ts.Timer {
        var startMillis = window.performance.now();

        var inst = {
            name: name,
            level: level,
            startDate: new Date(),
            startMillis: startMillis,
            endDate: null,
            endMillis: null,
            durationMillis: null,
            measure: () => {
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


    export function newPerformanceMarkInst(name: string, level: Log4Ts.Level = Level.INFO,
            startSuffix?: string | ((name: string) => string), endSuffix?: string | ((name: string) => string), measureSuffix?: string | ((name: string) => string)): Log4Ts.Timer {
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
            measure: () => {
                window.performance.mark(endName);
                window.performance.measure(measureName, startName, endName);
                var endMillis = window.performance.now();
                var durationMillis = (<PerformanceEntry>window.performance.getEntriesByName(measureName)[0]).duration;
                inst.endDate = new Date();
                inst.endMillis = endMillis;
                inst.durationMillis = durationMillis;
                return durationMillis;
            },
        };
        return inst;
    }

}

export = Timer;
