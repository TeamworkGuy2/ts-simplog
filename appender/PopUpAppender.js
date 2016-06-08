"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ConsoleAppender = require("./ConsoleAppender");
var PatternLayout = require("../layout/PatternLayout");
/** PopUpAppender class
 */
var PopUpAppender = (function (_super) {
    __extends(PopUpAppender, _super);
    function PopUpAppender(lazyInit, initiallyMinimized, useDocumentWrite, width, height) {
        _super.call(this);
        this.defaults = {
            layout: new PatternLayout("%d{HH:mm:ss} %-5p - %m{1}%n"),
            initiallyMinimized: false,
            focusPopUp: false,
            lazyInit: true,
            useOldPopUp: true,
            complainAboutPopUpBlocking: true,
            newestMessageAtTop: false,
            scrollToLatestMessage: true,
            width: "600",
            height: "400",
            reopenWhenClosed: false,
            maxMessages: null,
            showCommandLine: true,
            commandLineObjectExpansionDepth: 1,
            showHideButton: false,
            showCloseButton: true,
            useDocumentWrite: true
        };
        this.create(false, null, lazyInit, initiallyMinimized, useDocumentWrite, width, height, this.defaults.focusPopUp);
    }
    PopUpAppender.prototype.toString = function () {
        return "PopUpAppender";
    };
    return PopUpAppender;
}(ConsoleAppender));
module.exports = PopUpAppender;
