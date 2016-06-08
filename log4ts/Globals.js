"use strict";
var now = new Date();
var Globals = {
    enabled: !((typeof log4ts_disabled != "undefined") && log4ts_disabled),
    useTimeStampsInMilliseconds: true,
    showStackTraces: false,
    applicationStartDate: now,
    uniqueId: "log4ts_" + now.getTime() + "_" + Math.floor(Math.random() * 100000000),
    newLine: "\r\n",
    pageLoaded: false,
};
module.exports = Globals;
