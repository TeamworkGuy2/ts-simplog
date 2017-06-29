import Level = require("../log4ts/Level");

/** Timers
 */
module Timer {
    export var PERFORMANCE_MARK_START_SUFFIX = "-start";
    export var PERFORMANCE_MARK_END_SUFFIX = "-end";
    export var PERFORMANCE_MARK_MEASURE_SUFFIX = "-duration";


    /** Create a timer using new Date()
     * @param name the new timer's name
     * @param level the log level of the timer
     * @return a new Log4Ts.Timer instance
     */
    export function newDateInst(name: string, level: Log4Ts.Level = Level.INFO): Log4Ts.Timer {
        var startDate = new Date();

        var inst: Log4Ts.Timer = {
            name: name,
            level: level,
            startDate: startDate,
            startMillis: <number>startDate.getTime(),
            endDate: null,
            endMillis: null,
            durationMillis: null,
            measure: () => {
                var endDate = new Date();
                var endMillis = <number>endDate.getTime();
                var durationMillis = endMillis - inst.startMillis;
                inst.endDate = endDate;
                inst.endMillis = endMillis;
                inst.durationMillis = durationMillis;
                return durationMillis;
            },
        };
        return inst;
    }


    /** Create a timer using window.performance.now()
     * @param name the new timer's name
     * @param level the log level of the timer
     * @return a new Log4Ts.Timer instance
     */
    export function newPerformanceNowInst(name: string, level: Log4Ts.Level = Level.INFO): Log4Ts.Timer {
        var startMillis = <number>window.performance.now();

        var inst: Log4Ts.Timer = {
            name: name,
            level: level,
            startDate: new Date(),
            startMillis: startMillis,
            endDate: null,
            endMillis: null,
            durationMillis: null,
            measure: () => {
                var endMillis = <number>window.performance.now();
                var durationMillis = endMillis - startMillis;
                inst.endDate = new Date();
                inst.endMillis = endMillis;
                inst.durationMillis = durationMillis;
                return durationMillis;
            },
        };
        return inst;
    }


    /** Create a timer using window.performance.mark(...)
     * @param name the new timer's name
     * @param level the log level of the timer
     * @param startSuffix a suffix to append to the timer's name to make a unique start time marker, or a method which takes the timer name and returns a unique start time marker
     * @param endSuffix a suffix to append to the timer's name to make a unique end time marker, or a method which takes the timer name and returns a unique end time marker
     * @param measureSuffix a suffix to append to the timer's name to make a measure time marker, or a method which takes the timer name and returns a unique measure time marker
     * @return a new Log4Ts.Timer instance
     */
    export function newPerformanceMarkInst(name: string, level: Log4Ts.Level = Level.INFO,
            startSuffix?: string | ((name: string) => string), endSuffix?: string | ((name: string) => string), measureSuffix?: string | ((name: string) => string)): Log4Ts.Timer {

        var startName = (startSuffix != null ? (typeof startSuffix === "string" ? name + startSuffix : startSuffix(name)) : name + Timer.PERFORMANCE_MARK_START_SUFFIX);
        var endName = (endSuffix != null ? (typeof endSuffix === "string" ? name + endSuffix : endSuffix(name)) : name + Timer.PERFORMANCE_MARK_END_SUFFIX);
        var measureName = (measureSuffix != null ? (typeof measureSuffix === "string" ? name + measureSuffix : measureSuffix(name)) : name + Timer.PERFORMANCE_MARK_MEASURE_SUFFIX);

        window.performance.mark(startName);
        var startMillis = <number>window.performance.now();

        var inst: Log4Ts.Timer = {
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
                var endMillis = <number>window.performance.now();
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
