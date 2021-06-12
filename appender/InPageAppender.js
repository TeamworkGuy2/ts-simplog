"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var ConsoleAppender = require("./ConsoleAppender");
var PatternLayout = require("../layout/PatternLayout");
/** InPageAppender class
*/
var InPageAppender = /** @class */ (function (_super) {
    __extends(InPageAppender, _super);
    function InPageAppender(container, lazyInit, initiallyMinimized, width, height, opts) {
        var _this = _super.call(this, opts) || this;
        _this.defaults = {
            layout: new PatternLayout("%d{HH:mm:ss} %-5p - %m{1}%n"),
            initiallyMinimized: false,
            lazyInit: true,
            newestMessageAtTop: false,
            scrollToLatestMessage: true,
            width: "100%",
            height: "220px",
            maxMessages: null,
            showCommandLine: true,
            showHideButton: false,
            showCloseButton: false,
            showLogEntryDeleteButtons: true,
        };
        _this.name = "InPageAppender";
        _this.create(true, container, lazyInit, initiallyMinimized, width, height, false);
        return _this;
    }
    InPageAppender.prototype.toString = function () {
        return this.name;
    };
    return InPageAppender;
}(ConsoleAppender));
module.exports = InPageAppender;
