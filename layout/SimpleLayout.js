"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Layout = require("./Layout");
/** SimpleLayout
 */
var SimpleLayout = (function (_super) {
    __extends(SimpleLayout, _super);
    function SimpleLayout(ignoreThowable) {
        if (ignoreThowable === void 0) { ignoreThowable = true; }
        var _this = _super.call(this) || this;
        _this.ignoreThrowable = ignoreThowable;
        return _this;
    }
    SimpleLayout.prototype.format = function (loggingEvent) {
        return loggingEvent.level.name + " - " + loggingEvent.getCombinedMessages();
    };
    SimpleLayout.prototype.ignoresThrowable = function () {
        return this.ignoreThrowable;
    };
    SimpleLayout.prototype.toString = function () {
        return "SimpleLayout";
    };
    return SimpleLayout;
}(Layout));
module.exports = SimpleLayout;
