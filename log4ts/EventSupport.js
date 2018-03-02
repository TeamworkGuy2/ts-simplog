"use strict";
var Utils = require("../log-util/Utils");
/** Custom event support
 */
var EventSupport = /** @class */ (function () {
    function EventSupport(handleError) {
        this.eventTypes = [];
        this.listeners = {};
        this.handleError = handleError;
    }
    EventSupport.prototype.setEventTypes = function (eventTypesParam) {
        this.eventTypes = eventTypesParam;
        this.listeners = {};
        for (var i = 0, len = this.eventTypes.length; i < len; i++) {
            this.listeners[this.eventTypes[i]] = [];
        }
    };
    EventSupport.prototype.addEventListener = function (eventType, listener) {
        if (!Utils.arrayContains(this.eventTypes, eventType)) {
            this.handleError("EventSupport [" + this + "]: addEventListener: no event called '" + eventType + "'");
        }
        this.listeners[eventType].push(listener);
    };
    EventSupport.prototype.removeEventListener = function (eventType, listener) {
        if (!Utils.arrayContains(this.eventTypes, eventType)) {
            this.handleError("EventSupport [" + this + "]: removeEventListener: no event called '" + eventType + "'");
        }
        Utils.arrayRemove(this.listeners[eventType], listener);
    };
    EventSupport.prototype.dispatchEvent = function (eventType, eventArgs) {
        if (Utils.arrayContains(this.eventTypes, eventType)) {
            var listeners = this.listeners[eventType];
            for (var i = 0, len = listeners.length; i < len; i++) {
                listeners[i](this, eventType, eventArgs);
            }
        }
        else {
            this.handleError("EventSupport [" + this + "]: dispatchEvent: no event called '" + eventType + "'");
        }
    };
    EventSupport.prototype.handleError = function (message, exception) {
        (this.handleError || EventSupport.defaultErrorCallback)(message, exception);
        this.dispatchEvent("error", { "message": message, "exception": exception });
    };
    return EventSupport;
}());
module.exports = EventSupport;
