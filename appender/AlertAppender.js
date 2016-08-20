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
        _super.call(this, opts);
        this.layout = new SimpleLayout();
        this.name = "AlertAppender";
    }
    AlertAppender.prototype.append = function (loggingEvent) {
        alert(this.getLayout().formatWithException(loggingEvent));
    };
    AlertAppender.prototype.toString = function () {
        return this.name;
    };
    return AlertAppender;
}(Appender));
module.exports = AlertAppender;
