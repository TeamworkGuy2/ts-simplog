"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ConsoleAppender = require("./ConsoleAppender");
var PatternLayout = require("../layout/PatternLayout");
/** InPageAppender class
*/
var InPageAppender = (function (_super) {
    __extends(InPageAppender, _super);
    function InPageAppender(container, lazyInit, initiallyMinimized, useDocumentWrite, width, height) {
        _super.call(this);
        this.defaults = {
            layout: new PatternLayout("%d{HH:mm:ss} %-5p - %m{1}%n"),
            initiallyMinimized: false,
            lazyInit: true,
            newestMessageAtTop: false,
            scrollToLatestMessage: true,
            width: "100%",
            height: "220px",
            maxMessages: null,
            showCommandLine: true,
            commandLineObjectExpansionDepth: 1,
            showHideButton: false,
            showCloseButton: false,
            showLogEntryDeleteButtons: true,
            useDocumentWrite: true
        };
        this.create(true, container, lazyInit, initiallyMinimized, useDocumentWrite, width, height, false);
    }
    InPageAppender.prototype.toString = function () {
        return "InPageAppender";
    };
    return InPageAppender;
}(ConsoleAppender));
module.exports = InPageAppender;
