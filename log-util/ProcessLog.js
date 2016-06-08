"use strict";
/* Basic process time/step logging
 * example usage:
 * var timer = new ProcessLog("operation X", -1, true); // unknown number of steps, start timer now
 * log.completeStep("initiate");
 * log.completeStep("processing...");
 * log.completeStep("done!");
 * log.stopLog();
 * console.log(log.toString()); // prints total time from start to finish and number of steps
 * console.log(log.printSteps()); // prints information about how long each step took
 *
 * @author TeamworkGuy2
 * @since 2016-05-26
 */
var ProcessLog = (function () {
    function ProcessLog(name, steps, start) {
        if (steps === void 0) { steps = -1; }
        if (start === void 0) { start = false; }
        this.name = name ? name : "";
        this.startTime = null;
        this.endTime = null;
        this.errorStop = false;
        this.error = null;
        this.errorMsg = null;
        this.initialStepCount = steps;
        this.stepCount = 0;
        this.steps = [];
        this.stepCompletedCallback = null;
        this.processStoppedCallback = null;
        this.processCompletedCallback = null;
        this.processErrorCallback = null;
        /** functions that are called when a step is completed or all steps are completed */
        this.stepDone = function (step) {
            if (this.stepCompletedCallback) {
                this.stepCompletedCallback(step || this.steps[this.steps.length - 1]);
            }
        };
        this.processStopped = function () {
            if (this.processStoppedCallback) {
                this.processStoppedCallback();
            }
        };
        this.processDone = function () {
            if (this.processCompletedCallback) {
                this.processCompletedCallback();
            }
        };
        this.processError = function (err, errorMsg) {
            if (this.processErrorCallback) {
                this.processErrorCallback(err || this.error, errorMsg || this.errorMsg);
            }
        };
        if (start === true) {
            this.startLog();
        }
    }
    ProcessLog.prototype.setStepCompletedCallback = function (cb) {
        if (typeof cb !== "function") {
            throw new Error("steps completed callback '" + cb + "' must be a function");
        }
        this.stepCompletedCallback = cb;
    };
    ProcessLog.prototype.setProcessStoppedCallback = function (cb) {
        if (typeof cb !== "function") {
            throw new Error("process stopped callback '" + cb + "' must be a function");
        }
        this.processStoppedCallback = cb;
    };
    ProcessLog.prototype.setProcessCompletedCallback = function (cb) {
        if (typeof cb !== "function") {
            throw new Error("process completed callback '" + cb + "' must be a function");
        }
        this.processCompletedCallback = cb;
    };
    ProcessLog.prototype.setProcessErrorCallback = function (cb) {
        if (typeof cb !== "function") {
            throw new Error("process error callback '" + cb + "' must be a function");
        }
        this.processErrorCallback = cb;
    };
    ProcessLog.prototype.startLog = function (steps) {
        if (this.startTime != null) {
            throw new Error("cannot start process log more than once");
        }
        if (steps) {
            this.initialStepCount = steps;
            this.stepCount = 0;
        }
        this.startTime = ProcessLog.timestampGenerator();
    };
    ProcessLog.prototype.stopLog = function () {
        if (this.endTime != null) {
            return;
        }
        this.endTime = ProcessLog.timestampGenerator();
        if (this.errorStop === false) {
            if (this.stepCount === this.initialStepCount) {
                this.processDone();
            }
            else {
                this.processStopped();
            }
        }
        else {
            this.processError(this.error, this.errorMsg);
        }
    };
    ProcessLog.prototype.errorLog = function (error, errorMsg) {
        this.errorStop = true;
        this.error = error;
        this.errorMsg = errorMsg;
        this.stopLog();
    };
    ProcessLog.prototype.completeStep = function (msg) {
        if (this.stepCount === this.initialStepCount) {
            throw new Error("cannot complete any more steps, all steps have already been completed");
        }
        if (this.errorStop === true) {
            throw new Error("cannot complete any more steps, process threw error");
        }
        this.stepCount++;
        var deltaTime = null;
        var timeStamp = ProcessLog.timestampGenerator();
        if (this.steps.length > 0) {
            deltaTime = timeStamp - this.steps[this.steps.length - 1].timeStamp;
        }
        else if (this.startTime != null) {
            deltaTime = timeStamp - this.startTime;
        }
        else {
            throw new Error("cannot complete a step before calling startLog()");
        }
        var completedStep = new ProcessLog.LogStep(timeStamp, deltaTime, msg ? msg : "", this.stepCount, this.initialStepCount > -1 ? this.initialStepCount : null);
        this.steps.push(completedStep);
        this.stepDone(completedStep);
        if (this.stepCount === this.initialStepCount) {
            this.stopLog();
        }
        return completedStep;
    };
    ProcessLog.prototype.isRunning = function () {
        return this.startTime != null && this.endTime == null;
    };
    ProcessLog.prototype.isStopped = function () {
        return this.endTime != null;
    };
    ProcessLog.prototype.hasCompletedAllSteps = function () {
        return this.stepCount === this.initialStepCount && this.errorStop === false;
    };
    ProcessLog.prototype.hasEncounteredError = function () {
        return this.errorStop === true;
    };
    ProcessLog.prototype.getTotalSteps = function () {
        return this.initialStepCount;
    };
    ProcessLog.prototype.getStepsCompleted = function () {
        return this.stepCount;
    };
    ProcessLog.prototype.getTotalLogTime = function () {
        if (this.endTime == null) {
            throw new Error("cannot get total log time before process has finished");
        }
        return this.endTime - this.startTime;
    };
    ProcessLog.prototype.getName = function () {
        return this.name;
    };
    ProcessLog.prototype.getSteps = function () {
        return this.steps.slice();
    };
    ProcessLog.prototype.getStepTimes = function () {
        return ProcessLog.pluck(this.steps, "deltaTime");
    };
    ProcessLog.prototype.getStepMessages = function () {
        return ProcessLog.pluck(this.steps, "stepMessage");
    };
    ProcessLog.prototype.toString = function () {
        var stepsStr = " " + this.stepCount + " steps" + (this.initialStepCount > -1 ? " of " + this.initialStepCount : "");
        return this.endTime != null ?
            "process '" + this.name + "' took " + this.getTotalLogTime() + " ms," + stepsStr :
            "process '" + this.name + "' not complete," + stepsStr;
    };
    ProcessLog.prototype.printSteps = function () {
        var str = this.toString();
        var steps = this.getSteps();
        for (var i = 0, size = steps.length; i < size; i++) {
            str += "\n" + steps[i].toString();
        }
        return str;
    };
    ProcessLog.pluck = function (ary, propName) {
        var res = [];
        for (var i = 0, size = ary.length; i < size; i++) {
            res.push(ary[i][propName]);
        }
        return res;
    };
    ProcessLog.startSimpleLog = function (message) {
        return new ProcessLog.LogStep(ProcessLog.timestampGenerator(), null, message ? message : "");
    };
    ProcessLog.stopSimpleLog = function (simpleLog) {
        if (!simpleLog.hasOwnProperty("deltaTime") || !simpleLog.hasOwnProperty("timeStamp")) {
            throw new Error("invalid parameter '" + simpleLog + "', signature is ProcessLog.stopSimpleLog(LogStep step)");
        }
        simpleLog.deltaTime = ProcessLog.timestampGenerator() - simpleLog.timeStamp;
        return simpleLog;
    };
    /** Millisecond precision timestamp generator */
    ProcessLog.timestampGenerator = Date.now;
    return ProcessLog;
}());
var ProcessLog;
(function (ProcessLog) {
    /** A Step in a process */
    var LogStep = (function () {
        function LogStep(timeStamp, deltaTime, message, stepNumber, totalSteps) {
            this.timeStamp = timeStamp != null ? timeStamp : null;
            this.deltaTime = deltaTime != null ? deltaTime : null;
            this.stepMessage = message ? message : "";
            this.stepNumber = stepNumber != null ? stepNumber : null;
            this.totalSteps = totalSteps != null ? totalSteps : null;
        }
        LogStep.prototype.toString = function () {
            var stepsStr = (this.stepNumber || "") + (this.totalSteps != null ? " of " + this.totalSteps : "");
            return this.deltaTime != null ?
                "step " + stepsStr + " '" + this.stepMessage + "' took " + this.deltaTime + " ms" :
                "step " + stepsStr + " '" + this.stepMessage + "' not complete";
        };
        return LogStep;
    }());
    ProcessLog.LogStep = LogStep;
})(ProcessLog || (ProcessLog = {}));
module.exports = ProcessLog;
