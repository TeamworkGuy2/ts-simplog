"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Appender = require("./Appender");
var Level = require("../log4ts/Level");
var NullLayout = require("../layout/NullLayout");
/** An {@link Appender} that appends to a {@link UniqueStoreI}.
 * With the option to consolidate events from a {@code #group(String) groups} into single log entries
 * @author TeamworkGuy2
 * @since 2016-6-4
 */
var LocalStoreAppender = (function (_super) {
    __extends(LocalStoreAppender, _super);
    function LocalStoreAppender(store, mergeGroupEvents, opts) {
        if (mergeGroupEvents === void 0) { mergeGroupEvents = false; }
        _super.call(this, opts);
        this.name = "LocalStoreAppender";
        this.groupNames = [];
        this.groupEvents = [];
        this.layout = new NullLayout();
        this.threshold = Level.INFO;
        this.store = store;
        this.mergeGroups = mergeGroupEvents;
    }
    LocalStoreAppender.prototype.append = function (loggingEvent) {
        var msgs = loggingEvent.messages && loggingEvent.messages.length === 1 ? loggingEvent.messages[0] : loggingEvent.messages;
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
        return this.name;
    };
    return LocalStoreAppender;
}(Appender));
module.exports = LocalStoreAppender;
