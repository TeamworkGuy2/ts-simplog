import Globals = require("./Globals");
import Utils = require("../log-util/Utils");

/** Logging events
 */
class LoggingEvent implements Log4Ts.LoggingEvent {
    public logger: Log4Ts.Logger;
    public timeStamp: Date;
    public level: Log4Ts.Level;
    public messages: any[];
    public exception: any;
    public milliseconds: number;
    public timeStampInSeconds: number;
    public timeStampInMilliseconds: number;


    constructor(logger: Log4Ts.Logger, timeStamp: Date, level: Log4Ts.Level, messages: any[], exception: any) {
        this.logger = logger;
        this.timeStamp = timeStamp;
        this.timeStampInMilliseconds = timeStamp.getTime();
        this.timeStampInSeconds = Math.floor(this.timeStampInMilliseconds / 1000);
        this.milliseconds = this.timeStamp.getMilliseconds();
        this.level = level;
        this.messages = messages;
        this.exception = exception;
    }


    public getThrowableStrRep() {
        return this.exception ? Utils.getExceptionStringRep(this.exception) : "";
    }


    public getCombinedMessages() {
        return (this.messages.length == 1) ? this.messages[0] : this.messages.join(Globals.newLine);
    }


    public toString() {
        return "LoggingEvent[" + this.level + "]";
    }

}

export = LoggingEvent;