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
var Utils = require("../log-util/Utils");
var Layout = require("./Layout");
/** HttpPostDataLayout
 */
var HttpPostDataLayout = /** @class */ (function (_super) {
    __extends(HttpPostDataLayout, _super);
    function HttpPostDataLayout() {
        var _this = _super.call(this) || this;
        _this.setKeys();
        _this.returnsPostData = true;
        return _this;
    }
    // Disable batching
    HttpPostDataLayout.prototype.allowBatching = function () {
        return false;
    };
    HttpPostDataLayout.prototype.format = function (logEvent) {
        var dataValues = this.getDataValues(logEvent);
        var queryBits = [];
        for (var i = 0, len = dataValues.length; i < len; i++) {
            var dataVal = dataValues[i][1];
            var val = (dataVal instanceof Date) ? String(dataVal.getTime()) : dataVal;
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
