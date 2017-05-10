"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Level = require("../log4ts/Level");
var Appender = require("../appender/Appender");
var NullLayout = require("../layout/NullLayout");
/** BrowserConsoleAppender (only works in Opera and Safari and Firefox with Firebug extension)
 */
var BrowserConsoleAppender = (function (_super) {
    __extends(BrowserConsoleAppender, _super);
    function BrowserConsoleAppender(console, name, opts) {
        if (name === void 0) { name = "BrowserConsoleAppender"; }
        var _this = _super.call(this, opts) || this;
        _this.name = "BrowserConsoleAppender";
        _this.layout = new NullLayout();
        _this.threshold = Level.DEBUG;
        _this.customName = name;
        _this.console = console;
        return _this;
    }
    BrowserConsoleAppender.prototype.append = function (logEvent) {
        var console = this.console;
        if (console && console.log) {
            // use specific logging methods or fallback to console.log
            var funcName;
            if (console.debug && Level.DEBUG.isGreaterOrEqual(logEvent.level)) {
                funcName = "debug";
            }
            else if (console.info && Level.INFO.equals(logEvent.level)) {
                funcName = "info";
            }
            else if (console.warn && Level.WARN.equals(logEvent.level)) {
                funcName = "warn";
            }
            else if (console.error && logEvent.level.isGreaterOrEqual(Level.ERROR)) {
                funcName = "error";
            }
            else {
                funcName = "log";
            }
            console[funcName].apply(console, this.getFormattedMessage(logEvent, false));
        }
        else if ((typeof opera != "undefined") && opera.postError) {
            opera.postError(this.getFormattedMessage(logEvent, true));
        }
    };
    BrowserConsoleAppender.prototype.group = function (name) {
        if (this.console && this.console.group) {
            this.console.group(name);
        }
    };
    BrowserConsoleAppender.prototype.groupEnd = function () {
        if (this.console && this.console.groupEnd) {
            this.console.groupEnd();
        }
    };
    BrowserConsoleAppender.prototype.toString = function () {
        return this.name + ": " + this.customName;
    };
    BrowserConsoleAppender.prototype.getFormattedMessage = function (logEvent, concatenate) {
        var formattedMessage = this.getLayout().formatWithException(logEvent);
        return (typeof formattedMessage === "string") ?
            (concatenate ? formattedMessage : [formattedMessage]) :
            (concatenate ? formattedMessage.join(" ") : formattedMessage);
    };
    return BrowserConsoleAppender;
}(Appender));
module.exports = BrowserConsoleAppender;
