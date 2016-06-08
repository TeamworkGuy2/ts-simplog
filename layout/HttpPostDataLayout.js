"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Utils = require("../log-util/Utils");
var Layout = require("./Layout");
/** HttpPostDataLayout
 */
var HttpPostDataLayout = (function (_super) {
    __extends(HttpPostDataLayout, _super);
    function HttpPostDataLayout() {
        _super.call(this);
        this.setKeys();
        this.returnsPostData = true;
    }
    // Disable batching
    HttpPostDataLayout.prototype.allowBatching = function () {
        return false;
    };
    HttpPostDataLayout.prototype.format = function (loggingEvent) {
        var dataValues = this.getDataValues(loggingEvent);
        var queryBits = [];
        for (var i = 0, len = dataValues.length; i < len; i++) {
            var val = (dataValues[i][1] instanceof Date) ?
                String(dataValues[i][1].getTime()) : dataValues[i][1];
            queryBits.push(Utils.urlEncode(dataValues[i][0]) + "=" + Utils.urlEncode(val));
        }
        return queryBits.join("&");
    };
    HttpPostDataLayout.prototype.ignoresThrowable = function () {
        return false;
    };
    HttpPostDataLayout.prototype.toString = function () {
        return "HttpPostDataLayout";
    };
    return HttpPostDataLayout;
}(Layout));
module.exports = HttpPostDataLayout;
