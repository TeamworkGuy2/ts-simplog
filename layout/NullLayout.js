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
var Layout = require("./Layout");
/** NullLayout
 */
var NullLayout = /** @class */ (function (_super) {
    __extends(NullLayout, _super);
    function NullLayout() {
        return _super.call(this) || this;
    }
    NullLayout.prototype.format = function (logEvent) {
        return logEvent.messages;
    };
    NullLayout.prototype.ignoresThrowable = function () {
        return true;
    };
    NullLayout.prototype.formatWithException = function (logEvent) {
        var messages = logEvent.messages, ex = logEvent.exception;
        return ex ? messages.concat([ex]) : messages;
    };
    NullLayout.prototype.toString = function () {
        return "NullLayout";
    };
    return NullLayout;
}(Layout));
module.exports = NullLayout;
