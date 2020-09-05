"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Appender = require("./Appender");
var Level = require("../log4ts/Level");
var NullLayout = require("../layout/NullLayout");
/** An {@link Appender} that appends to a {@link UniqueStoreI}.
 * With the option to consolidate events from a {@code #group(String) groups} into single log entries
 * @author TeamworkGuy2
 * @since 2016-6-4
 */
var LocalStoreAppender = /** @class */ (function (_super) {
    __extends(LocalStoreAppender, _super);
    function LocalStoreAppender(store, name, mergeGroupEvents, opts) {
        if (name === void 0) { name = "LocalStoreAppender"; }
        if (mergeGroupEvents === void 0) { mergeGroupEvents = false; }
        var _this = _super.call(this, opts) || this;
        _this.groupNames = [];
        _this.groupEvents = [];
        _this.name = "LocalStoreAppender";
        _this.layout = new NullLayout();
        _this.threshold = Level.INFO;
        _this.store = store;
        _this.mergeGroups = mergeGroupEvents;
        _this.customName = name;
        return _this;
    }
    LocalStoreAppender.prototype.append = function (logEvent) {
        var msgs = logEvent.messages && logEvent.messages.length === 1 ? logEvent.messages[0] : logEvent.messages;
        if (this.groupNames.length > 0 && this.mergeGroups === true) {
            this.groupEvents[this.groupEvents.length - 1].push(msgs);
        }
        else {
            var value = JSON.stringify(msgs);
            this.store.addItem(value, true);
        }
    };
    LocalStoreAppender.prototype.group = function (name) {
        this.groupNames.push(name);
        this.groupEvents.push([]);
    };
    LocalStoreAppender.prototype.groupEnd = function () {
        if (this.mergeGroups === true) {
            var groupName = this.groupNames[this.groupNames.length - 1];
            var groupEvents = this.groupEvents[this.groupEvents.length - 1];
            // consolidate multiple log events from a group into a single object
            this.store.addItem(JSON.stringify({
                group: groupName,
                events: groupEvents
            }), true);
        }
        this.groupNames.pop();
        this.groupEvents.pop();
    };
    LocalStoreAppender.prototype.toString = function () {
        return this.customName;
    };
    return LocalStoreAppender;
}(Appender));
module.exports = LocalStoreAppender;
