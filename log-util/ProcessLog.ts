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
class ProcessLog {
    /** Millisecond precision timestamp generator */
    public static timestampGenerator: () => number = Date.now;

    private name: string;
    private startTime: number;
    private endTime: number;
    private errorStop: boolean;
    private error: any;
    private errorMsg: string;
    private initialStepCount: number;
    private stepCount: number;
    private steps: ProcessLog.LogStep[];
    private stepCompletedCallback: (step: ProcessLog.LogStep) => void;
    private processStoppedCallback: () => void;
    private processCompletedCallback: () => void;
    private processErrorCallback: (err: any, errMsg: string) => void;
    // functions that are called when a step is completed or all steps are completed
    private stepDone: (step: ProcessLog.LogStep) => void;
    private processStopped: () => void;
    private processDone: () => void;
    private processError: (err: any, errorMsg: string) => void;


    constructor(name: string, steps: number = -1, start: boolean = false) {
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


    public setStepCompletedCallback(cb: (step: ProcessLog.LogStep) => void): void {
        if (typeof cb !== "function") { throw new Error("steps completed callback '" + cb + "' must be a function"); }
        this.stepCompletedCallback = cb;
    }


    public setProcessStoppedCallback(cb: () => void): void {
        if (typeof cb !== "function") { throw new Error("process stopped callback '" + cb + "' must be a function"); }
        this.processStoppedCallback = cb;
    }


    public setProcessCompletedCallback(cb: () => void): void {
        if (typeof cb !== "function") { throw new Error("process completed callback '" + cb + "' must be a function"); }
        this.processCompletedCallback = cb;
    }


    public setProcessErrorCallback(cb: (err, errMsg) => void): void {
        if (typeof cb !== "function") { throw new Error("process error callback '" + cb + "' must be a function"); }
        this.processErrorCallback = cb;
    }


    public startLog(steps?: number): void {
        if (this.startTime != null) {
            throw new Error("cannot start process log more than once");
        }
        if (steps) {
            this.initialStepCount = steps;
            this.stepCount = 0;
        }
        this.startTime = ProcessLog.timestampGenerator();
    }


    public stopLog(): void {
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
    }


    public errorLog(error?: any, errorMsg?: string): void {
        this.errorStop = true;
        this.error = error;
        this.errorMsg = errorMsg;
        this.stopLog();
    }


    public completeStep(msg?: string) {
        if (this.stepCount === this.initialStepCount) { throw new Error("cannot complete any more steps, all steps have already been completed"); }
        if (this.errorStop === true) { throw new Error("cannot complete any more steps, process threw error"); }
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
    }


    public isRunning(): boolean {
        return this.startTime != null && this.endTime == null;
    }


    public isStopped(): boolean {
        return this.endTime != null;
    }


    public hasCompletedAllSteps(): boolean {
        return this.stepCount === this.initialStepCount && this.errorStop === false;
    }


    public hasEncounteredError(): boolean {
        return this.errorStop === true;
    }


    public getTotalSteps(): number {
        return this.initialStepCount;
    }


    public getStepsCompleted(): number {
        return this.stepCount;
    }


    public getTotalLogTime(): number {
        if (this.endTime == null) { throw new Error("cannot get total log time before process has finished"); }
        return this.endTime - this.startTime;
    }


    public getName(): string {
        return this.name;
    }


    public getSteps(): ProcessLog.LogStep[] {
        return this.steps.slice();
    }


    public getStepTimes(): number[] {
        return ProcessLog.pluck(this.steps, "deltaTime");
    }


    public getStepMessages(): string[] {
        return ProcessLog.pluck(this.steps, "stepMessage");
    }


    public toString(): string {
        var stepsStr = " " + this.stepCount + " steps" + (this.initialStepCount > -1 ? " of " + this.initialStepCount : "");
        return this.endTime != null ?
            "process '" + this.name + "' took " + this.getTotalLogTime() + " ms," + stepsStr :
            "process '" + this.name + "' not complete," + stepsStr;
    }


    public printSteps(): string {
        var str = this.toString();
        var steps = this.getSteps();
        for (var i = 0, size = steps.length; i < size; i++) {
            str += "\n" + steps[i].toString();
        }
        return str;
    }

    
    private static pluck<T>(ary: T[], propName: string): any[] {
        var res: any[] = [];
        for (var i = 0, size = ary.length; i < size; i++) {
            res.push(ary[i][propName]);
        }
        return res;
    }


    static startSimpleLog(message?: string): ProcessLog.LogStep {
        return new ProcessLog.LogStep(ProcessLog.timestampGenerator(), null, message ? message : "");
    }


    static stopSimpleLog(simpleLog: ProcessLog.LogStep): ProcessLog.LogStep {
        if (!simpleLog.hasOwnProperty("deltaTime") || !simpleLog.hasOwnProperty("timeStamp")) { throw new Error("invalid parameter '" + simpleLog + "', signature is ProcessLog.stopSimpleLog(LogStep step)"); }
        simpleLog.deltaTime = ProcessLog.timestampGenerator() - simpleLog.timeStamp;
        return simpleLog;
    }

}

module ProcessLog {

    /** A Step in a process */
    export class LogStep {
        /** Millisecond precision timestamp when the log step was create */
        timeStamp: number;
        /** [optional] millisecond delta time between this step and another event */
        deltaTime: number;
        /** the message related to this step */
        stepMessage: string;
        /** this step number in reference to the parent process */
        stepNumber: number;
        /** the total number of steps in the parent process */
        totalSteps: number;


        constructor(timeStamp: number, deltaTime?: number, message?: string, stepNumber?: number, totalSteps?: number) {
            this.timeStamp = timeStamp != null ? timeStamp : null;
            this.deltaTime = deltaTime != null ? deltaTime : null;
            this.stepMessage = message ? message : "";
            this.stepNumber = stepNumber != null ? stepNumber : null;
            this.totalSteps = totalSteps != null ? totalSteps : null;
        }


        public toString(): string {
            var stepsStr = (this.stepNumber || "") + (this.totalSteps != null ? " of " + this.totalSteps : "");
            return this.deltaTime != null ?
                "step " + stepsStr + " '" + this.stepMessage + "' took " + this.deltaTime + " ms" :
                "step " + stepsStr + " '" + this.stepMessage + "' not complete";
        }

    }

}

export = ProcessLog;
