
declare var opera: { postError(arg?: any): void };

declare var log4ts_disabled: boolean;


declare module Log4Ts {

    export interface Appender {
        //protected layout: Layout;
        //protected threshold: Level;
        //protected loggers: Logger[];

        group(groupTitle: string, initiallyExpanded?: boolean): void;
        groupEnd(): void;
        append(loggingEvent: LoggingEvent): void;
        doAppend(loggingEvent: LoggingEvent): void;
        setLayout(layout: Layout): void;
        getLayout(): Layout;
        setThreshold(threshold: Level): void;
        getThreshold(): Level;
        setAddedToLogger(logger: Logger): void;
        setRemovedFromLogger(logger: Logger): void;
        toString(): string;
    }


    export interface EventListener {
        (eventHandler: EventSupport, eventType: string, args: any[] | any): void;
    }


    export interface EventSupport {
        eventTypes: string[];
        eventListeners: { [type: string]: EventListener[] };

        setEventTypes(eventTypesParam: string[]): void;
        addEventListener(eventType: string, listener: EventListener): void;
        removeEventListener(eventType: string, listener: EventListener): void;
        dispatchEvent(eventType: string, eventArgs: any[] | any): void;
        handleError(message, exception?): void;
    }


    export interface Level {
        level: number;
        name: string;

        //new (level: number, name: string);

        toString(): string;
        equals(level: Level): boolean;
        isGreaterOrEqual(level: Level): boolean;
    }


    export interface Layout {
        defaults: {
            loggerKey: string;
            timeStampKey: string;
            millisecondsKey: string;
            levelKey: string;
            messageKey: string;
            exceptionKey: string;
            urlKey: string;
        };

        loggerKey: string;
        timeStampKey: string;
        millisecondsKey: string;
        levelKey: string;
        messageKey: string;
        exceptionKey: string;
        urlKey: string;
        batchHeader: string;
        batchFooter: string;
        batchSeparator: string;
        returnsPostData: boolean;
        overrideTimeStampsSetting: boolean;
        useTimeStampsInMilliseconds: boolean;
        combineMessages: boolean;
        customFields: { name: string; value: any }[];

        format(loggingEvent: LoggingEvent): any[] | string;
        ignoresThrowable(): boolean;
        toString(): string;
        allowBatching(): boolean;
        setTimeStampsInMilliseconds(timeStampsInMilliseconds: boolean): void;
        isTimeStampsInMilliseconds(): boolean;
        getTimeStampValue(logEvent: LoggingEvent): number;
        getDataValues(loggingEvent: LoggingEvent, combineMessages?: boolean): [string, any][];
        setKeys(loggerKey?: string, timeStampKey?: string, levelKey?: string, messageKey?: string, exceptionKey?: string, urlKey?: string, millisecondsKey?: string): void;
        setCustomField(name: string, value: any): void;
        hasCustomFields(): boolean;
        formatWithException(loggingEvent: LoggingEvent): any[] | string
    }


    export interface Logger {
        name: string;
        parent: Logger;
        children: any[];
        appenders: Appender[];
        loggerLevel: Level;


        trace(...msgs: any[]): void;
        debug(...msgs: any[]): void;
        info(...msgs: any[]): void;
        warn(...msgs: any[]): void;
        error(...msgs: any[]): void;
        fatal(...msgs: any[]): void;

        isEnabledFor(level: Level): boolean;
        isTraceEnabled(): boolean;
        isDebugEnabled(): boolean;
        isInfoEnabled(): boolean;
        isWarnEnabled(): boolean;
        isErrorEnabled(): boolean;
        isFatalEnabled(): boolean;

        addChild(childLogger: Logger): void;

        getAdditivity(): boolean;

        setAdditivity(additivity: boolean): void;

        addAppender(appender: Appender): void;

        removeAppender(appender: Appender): void;

        removeAllAppenders(): void;

        getEffectiveAppenders(): Appender[];

        invalidateAppenderCache(): void;

        log(level: Level, params: any[] | IArguments): void;

        callAppenders(loggingEvent: LoggingEvent): void;

        setLevel(level: Level): void;

        getLevel(): Level;

        getEffectiveLevel(): Level;

        group(name: string, initiallyExpanded?: boolean): void;

        groupEnd(name?: string): void;

        timeStart(name: string, level: Level): void;

        timeEnd(name: string): void;

        assert(expr: boolean): void;

        toString(): string;
    }


    export interface LoggingEvent {
        logger: Logger;
        timeStamp: Date;
        level: Level;
        messages: any[];
        exception: any;
        milliseconds: number;
        timeStampInSeconds: number;
        timeStampInMilliseconds: number;

        getThrowableStrRep(): string;
        getCombinedMessages(): any;
        toString(): string;
    }


    export interface LoggerOptions {
        logLoggerName?: boolean;
        logAppenderName?: boolean
    }


    export interface Timer {
        name: string;
        level: Log4Ts.Level;
        startDate: Date;
        startMillis: number;
        endDate: Date;
        endMillis: number;
        durationMillis: number;
        /** Returns elapsed time in milliseconds */
        measure(): number;
    }

}