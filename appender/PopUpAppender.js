"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var ConsoleAppender = require("./ConsoleAppender");
var PatternLayout = require("../layout/PatternLayout");
/** PopUpAppender class
 */
var PopUpAppender = /** @class */ (function (_super) {
    __extends(PopUpAppender, _super);
    function PopUpAppender(lazyInit, initiallyMinimized, useDocumentWrite, width, height, opts) {
        var _this = _super.call(this, opts) || this;
        _this.defaults = {
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
        _this.name = "PopUpAppender";
        _this.create(false, null, lazyInit, initiallyMinimized, useDocumentWrite, width, height, _this.defaults.focusPopUp);
        return _this;
    }
    PopUpAppender.prototype.toString = function () {
        return this.name;
    };
    return PopUpAppender;
}(ConsoleAppender));
module.exports = PopUpAppender;
