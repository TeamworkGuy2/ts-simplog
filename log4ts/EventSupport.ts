﻿import Utils = require("../log-util/Utils");

/** Custom event support
 */
class EventSupport implements Log4Ts.EventSupport {
    public static defaultErrorCallback: (msg, exception?) => void;
    public eventTypes: string[] = [];
    public eventListeners: { [type: string]: Log4Ts.EventListener[] } = {};


    constructor(handleError?: (msg, exception?) => void) {
        this.handleError = handleError;
    }


    public setEventTypes(eventTypesParam: string[]) {
        this.eventTypes = eventTypesParam;
        this.eventListeners = {};
        for (var i = 0, len = this.eventTypes.length; i < len; i++) {
            this.eventListeners[this.eventTypes[i]] = [];
        }
    }


    public addEventListener(eventType: string, listener: Log4Ts.EventListener) {
        if (!Utils.arrayContains(this.eventTypes, eventType)) {
            this.handleError("EventSupport [" + this + "]: addEventListener: no event called '" + eventType + "'");
        }
        this.eventListeners[eventType].push(listener);
    }


    public removeEventListener(eventType: string, listener: Log4Ts.EventListener) {
        if (!Utils.arrayContains(this.eventTypes, eventType)) {
            this.handleError("EventSupport [" + this + "]: removeEventListener: no event called '" + eventType + "'");
        }
        Utils.arrayRemove(this.eventListeners[eventType], listener);
    }


    public dispatchEvent(eventType: string, eventArgs: any[] | any) {
        if (Utils.arrayContains(this.eventTypes, eventType)) {
            var listeners = this.eventListeners[eventType];
            for (var i = 0, len = listeners.length; i < len; i++) {
                listeners[i](this, eventType, eventArgs);
            }
        } else {
            this.handleError("EventSupport [" + this + "]: dispatchEvent: no event called '" + eventType + "'");
        }
    }


    public handleError(message, exception?) {
        (this.handleError || EventSupport.defaultErrorCallback)(message, exception);
        this.dispatchEvent("error", { "message": message, "exception": exception });
    }

}

export = EventSupport;