"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Globals = require("../log4ts/Globals");
var Utils = require("../log-util/Utils");
var Level = require("../log4ts/Level");
var EventSupport = require("../log4ts/EventSupport");
var PatternLayout = require("../layout/PatternLayout");
/** Appender prototype
 */
var Appender = (function (_super) {
    __extends(Appender, _super);
    function Appender(opts) {
        var _this = _super.call(this) || this;
        _this.layout = new PatternLayout();
        _this.threshold = Level.ALL;
        _this.loggers = [];
        _this.options = {};
        _this.name = "Appender";
        _this.options = opts || {};
        return _this;
    }
    Appender.prototype.group = function (groupTitle, initiallyExpanded) { };
    Appender.prototype.groupEnd = function (groupTitle) { };
    Appender.prototype.append = function (logEvent) { };
    /** Performs threshold checks before delegating actual logging to the
     * subclass's specific append method.
     */
    Appender.prototype.doAppend = function (logEvent) {
        if (Globals.enabled && logEvent.level.level >= this.threshold.level) {
            this.append(logEvent);
        }
    };
    Appender.prototype.setLayout = function (layout) {
        this.layout = layout;
    };
    Appender.prototype.getLayout = function () {
        return this.layout;
    };
    Appender.prototype.setThreshold = function (threshold) {
        this.threshold = threshold;
    };
    Appender.prototype.getThreshold = function () {
        return this.threshold;
    };
    Appender.prototype.setAddedToLogger = function (logger) {
        this.loggers.push(logger);
    };
    Appender.prototype.setRemovedFromLogger = function (logger) {
        Utils.arrayRemove(this.loggers, logger);
    };
    return Appender;
}(EventSupport));
module.exports = Appender;
