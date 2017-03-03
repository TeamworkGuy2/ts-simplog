"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Appender = require("./Appender");
var SimpleLayout = require("../layout/SimpleLayout");
/** AlertAppender
 */
var AlertAppender = (function (_super) {
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
