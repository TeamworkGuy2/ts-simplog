"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Globals = require("../log4ts/Globals");
var Utils = require("../log-util/Utils");
var LogLog = require("../log4ts/LogLog");
var Appender = require("../appender/Appender");
var HttpPostDataLayout = require("../layout/HttpPostDataLayout");
/** AjaxAppender
 */
var AjaxAppender = (function (_super) {
    __extends(AjaxAppender, _super);
    function AjaxAppender(url, withCredentials, opts) {
        var _this = this;
        _super.call(this, opts);
        this.defaults = {
            waitForResponse: false,
            timed: false,
            timerInterval: 1000,
            batchSize: 1,
            sendAllOnUnload: false,
            requestSuccessCallback: null,
            failCallback: null,
            postVarName: "data",
            contentType: "application/x-www-form-urlencoded"
        };
        this.name = "AjaxAppender";
        this.layout = new HttpPostDataLayout();
        var appender = this;
        var isSupported = true;
        if (!url) {
            LogLog.handleError("AjaxAppender: URL must be specified in constructor");
            isSupported = false;
        }
        var timed = this.defaults.timed;
        var waitForResponse = this.defaults.waitForResponse;
        var batchSize = this.defaults.batchSize;
        var timerInterval = this.defaults.timerInterval;
        var requestSuccessCallback = this.defaults.requestSuccessCallback;
        var failCallback = this.defaults.failCallback;
        var postVarName = this.defaults.postVarName;
        var sendAllOnUnload = this.defaults.sendAllOnUnload;
        var contentType = this.defaults.contentType;
        var sessionId = null;
        var queuedLogEvents = [];
        var queuedRequests = [];
        var headers = [];
        var sending = false;
        var initialized = false;
        // Configuration methods. The function scope is used to prevent
        // direct alteration to the appender configuration properties.
        function checkCanConfigure(configOptionName) {
            if (initialized) {
                LogLog.handleError("AjaxAppender: configuration option '" + configOptionName + "' may not be set after the appender has been initialized");
                return false;
            }
            return true;
        }
        this.getSessionId = function () { return sessionId; };
        this.setSessionId = function (sessionIdParam) {
            sessionId = Utils.stringOrDefault(sessionIdParam, null);
            _this.layout.setCustomField("sessionid", sessionId);
        };
        this.setLayout = function (layoutParam) {
            if (checkCanConfigure("layout")) {
                _this.layout = layoutParam;
                // Set the session id as a custom field on the layout, if not already present
                if (sessionId !== null) {
                    _this.setSessionId(sessionId);
                }
            }
        };
        this.isTimed = function () { return timed; };
        this.setTimed = function (timedParam) {
            if (checkCanConfigure("timed")) {
                timed = Utils.bool(timedParam);
            }
        };
        this.getTimerInterval = function () { return timerInterval; };
        this.setTimerInterval = function (timerIntervalParam) {
            if (checkCanConfigure("timerInterval")) {
                timerInterval = Utils.intOrDefault(timerIntervalParam, timerInterval);
            }
        };
        this.isWaitForResponse = function () { return waitForResponse; };
        this.setWaitForResponse = function (waitForResponseParam) {
            if (checkCanConfigure("waitForResponse")) {
                waitForResponse = Utils.bool(waitForResponseParam);
            }
        };
        this.getBatchSize = function () { return batchSize; };
        this.setBatchSize = function (batchSizeParam) {
            if (checkCanConfigure("batchSize")) {
                batchSize = Utils.intOrDefault(batchSizeParam, batchSize);
            }
        };
        this.isSendAllOnUnload = function () { return sendAllOnUnload; };
        this.setSendAllOnUnload = function (sendAllOnUnloadParam) {
            if (checkCanConfigure("sendAllOnUnload")) {
                sendAllOnUnload = Utils.booleanOrDefault(sendAllOnUnloadParam, sendAllOnUnload);
            }
        };
        this.setRequestSuccessCallback = function (requestSuccessCallbackParam) {
            requestSuccessCallback = Utils.funcOrDefault(requestSuccessCallbackParam, requestSuccessCallback);
        };
        this.setFailCallback = function (failCallbackParam) {
            failCallback = Utils.funcOrDefault(failCallbackParam, failCallback);
        };
        this.getPostVarName = function () { return postVarName; };
        this.setPostVarName = function (postVarNameParam) {
            if (checkCanConfigure("postVarName")) {
                postVarName = Utils.stringOrDefault(postVarNameParam, postVarName);
            }
        };
        this.getHeaders = function () { return headers; };
        this.addHeader = function (name, value) {
            if (name.toLowerCase() == "content-type") {
                contentType = value;
            }
            else {
                headers.push({ name: name, value: value });
            }
        };
        // Internal functions
        function sendAll() {
            if (isSupported && Globals.enabled) {
                sending = true;
                var currentRequestBatch;
                if (waitForResponse) {
                    // Send the first request then use this function as the callback once
                    // the response comes back
                    if (queuedRequests.length > 0) {
                        currentRequestBatch = queuedRequests.shift();
                        sendRequest(preparePostData(currentRequestBatch), sendAll);
                    }
                    else {
                        sending = false;
                        if (timed) {
                            scheduleSending();
                        }
                    }
                }
                else {
                    // Rattle off all the requests without waiting to see the response
                    while ((currentRequestBatch = queuedRequests.shift())) {
                        sendRequest(preparePostData(currentRequestBatch));
                    }
                    sending = false;
                    if (timed) {
                        scheduleSending();
                    }
                }
            }
        }
        this.sendAll = sendAll;
        // Called when the window unloads. At this point we're don't care about waiting
        // for responses or timers or incomplete batches - everything must go, now
        function sendAllRemaining() {
            var sendingAnything = false;
            if (isSupported && Globals.enabled) {
                // Create requests for everything left over, batched as normal
                var actualBatchSize = appender.getLayout().allowBatching() ? batchSize : 1;
                var currentLogEvent;
                var batchedLogEvents = [];
                while ((currentLogEvent = queuedLogEvents.shift())) {
                    batchedLogEvents.push(currentLogEvent);
                    if (queuedLogEvents.length >= actualBatchSize) {
                        // Queue this batch of log entries
                        queuedRequests.push(batchedLogEvents);
                        batchedLogEvents = [];
                    }
                }
                // If there's a partially completed batch, add it
                if (batchedLogEvents.length > 0) {
                    queuedRequests.push(batchedLogEvents);
                }
                sendingAnything = (queuedRequests.length > 0);
                waitForResponse = false;
                timed = false;
                sendAll();
            }
            return sendingAnything;
        }
        this.sendAllRemaining = sendAllRemaining;
        function preparePostData(batchedLogEvents) {
            // Format the logging events
            var formattedMessages = [];
            var postData = "";
            var currentLogEvent;
            while ((currentLogEvent = batchedLogEvents.shift())) {
                formattedMessages.push(appender.getLayout().formatWithException(currentLogEvent));
            }
            // Create the post data string
            if (batchedLogEvents.length == 1) {
                postData = formattedMessages.join("");
            }
            else {
                postData = appender.getLayout().batchHeader +
                    formattedMessages.join(appender.getLayout().batchSeparator) +
                    appender.getLayout().batchFooter;
            }
            if (contentType == appender.defaults.contentType) {
                postData = appender.getLayout().returnsPostData ? postData :
                    Utils.urlEncode(postVarName) + "=" + Utils.urlEncode(postData);
                // Add the layout name to the post data
                if (postData.length > 0) {
                    postData += "&";
                }
                postData += "layout=" + Utils.urlEncode(appender.getLayout().toString());
            }
            return postData;
        }
        function scheduleSending() {
            setTimeout(sendAll, timerInterval);
        }
        function xmlHttpErrorHandler() {
            var msg = "AjaxAppender: could not create XMLHttpRequest object. AjaxAppender disabled";
            LogLog.handleError(msg);
            isSupported = false;
            if (failCallback) {
                failCallback(msg);
            }
        }
        function sendRequest(postData, successCallback) {
            try {
                var xmlHttp = AjaxAppender.getXmlHttp(xmlHttpErrorHandler);
                if (isSupported) {
                    xmlHttp.onreadystatechange = function () {
                        if (xmlHttp.readyState == 4) {
                            if (AjaxAppender.isHttpRequestSuccessful(xmlHttp)) {
                                if (requestSuccessCallback) {
                                    requestSuccessCallback(xmlHttp);
                                }
                                if (successCallback) {
                                    successCallback(xmlHttp);
                                }
                            }
                            else {
                                var msg = "AjaxAppender.append: XMLHttpRequest request to URL " +
                                    url + " returned status code " + xmlHttp.status;
                                LogLog.handleError(msg);
                                if (failCallback) {
                                    failCallback(msg);
                                }
                            }
                            xmlHttp.onreadystatechange = Utils.emptyFunction;
                            xmlHttp = null;
                        }
                    };
                    xmlHttp.open("POST", url, true);
                    // Add withCredentials to facilitate CORS requests with cookies
                    if (withCredentials && AjaxAppender.withCredentialsSupported) {
                        xmlHttp.withCredentials = true;
                    }
                    try {
                        for (var i = 0, header; header = headers[i++];) {
                            xmlHttp.setRequestHeader(header.name, header.value);
                        }
                        xmlHttp.setRequestHeader("Content-Type", contentType);
                    }
                    catch (headerEx) {
                        var msg = "AjaxAppender.append: your browser's XMLHttpRequest implementation" +
                            " does not support setRequestHeader, therefore cannot post data. AjaxAppender disabled";
                        LogLog.handleError(msg);
                        isSupported = false;
                        if (failCallback) {
                            failCallback(msg);
                        }
                        return;
                    }
                    xmlHttp.send(postData);
                }
            }
            catch (ex) {
                var errMsg = "AjaxAppender.append: error sending log message to " + url;
                LogLog.handleError(errMsg, ex);
                isSupported = false;
                if (failCallback) {
                    failCallback(errMsg + ". Details: " + Utils.getExceptionStringRep(ex));
                }
            }
        }
        this.append = function (logEvent) {
            if (isSupported) {
                if (!initialized) {
                    init();
                }
                queuedLogEvents.push(logEvent);
                var actualBatchSize = _this.getLayout().allowBatching() ? batchSize : 1;
                if (queuedLogEvents.length >= actualBatchSize) {
                    var currentLogEvent;
                    var batchedLogEvents = [];
                    while ((currentLogEvent = queuedLogEvents.shift())) {
                        batchedLogEvents.push(currentLogEvent);
                    }
                    // Queue this batch of log entries
                    queuedRequests.push(batchedLogEvents);
                    // If using a timer, the queue of requests will be processed by the
                    // timer function, so nothing needs to be done here.
                    if (!timed && (!waitForResponse || (waitForResponse && !sending))) {
                        sendAll();
                    }
                }
            }
        };
        function init() {
            initialized = true;
            // Add unload event to send outstanding messages
            if (sendAllOnUnload) {
                var oldBeforeUnload = window.onbeforeunload;
                window.onbeforeunload = function () {
                    if (oldBeforeUnload) {
                        oldBeforeUnload();
                    }
                    sendAllRemaining();
                };
            }
            // Start timer
            if (timed) {
                scheduleSending();
            }
        }
    }
    AjaxAppender.prototype.toString = function () {
        return this.name;
    };
    return AjaxAppender;
}(Appender));
// AjaxAppender related
var AjaxAppender;
(function (AjaxAppender) {
    var xhrFactory = function () { return new XMLHttpRequest(); };
    var xmlHttpFactories = [
        xhrFactory,
        function () { return new ActiveXObject("Msxml2.XMLHTTP"); },
        function () { return new ActiveXObject("Microsoft.XMLHTTP"); }
    ];
    AjaxAppender.withCredentialsSupported = false;
    function getXmlHttp(errorHandler) {
        // This is only run the first time; the value of getXmlHttp gets
        // replaced with the factory that succeeds on the first run
        for (var i = 0, len = xmlHttpFactories.length; i < len; i++) {
            var factory = xmlHttpFactories[i];
            try {
                var xmlHttp = factory();
                AjaxAppender.withCredentialsSupported = (factory == xhrFactory && ("withCredentials" in xmlHttp));
                AjaxAppender.getXmlHttp = factory;
                return xmlHttp;
            }
            catch (e) {
            }
        }
        // If we're here, all factories have failed, so throw an error
        if (errorHandler) {
            errorHandler();
        }
        else {
            LogLog.handleError("getXmlHttp: unable to obtain XMLHttpRequest object");
        }
    }
    AjaxAppender.getXmlHttp = getXmlHttp;
    function isHttpRequestSuccessful(xmlHttp) {
        return Utils.isUndefined(xmlHttp.status) || xmlHttp.status === 0 ||
            (xmlHttp.status >= 200 && xmlHttp.status < 300) ||
            xmlHttp.status == 1223 /* Fix for IE */;
    }
    AjaxAppender.isHttpRequestSuccessful = isHttpRequestSuccessful;
})(AjaxAppender || (AjaxAppender = {}));
module.exports = AjaxAppender;
