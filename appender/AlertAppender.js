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
var SimpleLayout = require("../layout/SimpleLayout");
/** AlertAppender
 */
var AlertAppender = /** @class */ (function (_super) {
    __extends(AlertAppender, _super);
    function AlertAppender(opts) {
        var _this = _super.call(this, opts) || this;
        _this.layout = new SimpleLayout();
        _this.name = "AlertAppender";
        return _this;
    }
    AlertAppender.prototype.append = function (logEvent) {
        alert(this.getLayout().formatWithException(logEvent));
    };
    AlertAppender.prototype.toString = function () {
        return this.name;
    };
    return AlertAppender;
}(Appender));
module.exports = AlertAppender;
