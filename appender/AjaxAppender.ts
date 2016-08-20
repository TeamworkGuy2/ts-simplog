import Globals = require("../log4ts/Globals");
import Utils = require("../log-util/Utils");
import LogLog = require("../log4ts/LogLog");
import Appender = require("../appender/Appender");
import HttpPostDataLayout = require("../layout/HttpPostDataLayout");

/** AjaxAppender
 */
class AjaxAppender extends Appender {
    public defaults = {
        waitForResponse: false,
        timed: false,
        timerInterval: 1000,
        batchSize: 1,
        sendAllOnUnload: false,
        requestSuccessCallback: <(xhr: XMLHttpRequest) => void>null,
        failCallback: <(msg: string) => void>null,
        postVarName: "data",
        contentType: "application/x-www-form-urlencoded"
    };
    public name = "AjaxAppender";

    public getSessionId: () => string;
    public setSessionId: (sessionId: string) => void;

    public isTimed: () => boolean;
    public setTimed: (timed: boolean) => void;

    public getTimerInterval: () => number;
    public setTimerInterval: (timerInterval: number) => void;

    public isWaitForResponse: () => boolean;
    public setWaitForResponse: (waitForResponse: boolean) => void;

    public getBatchSize: () => number;
    public setBatchSize: (batchSize: number) => void;

    public isSendAllOnUnload: () => boolean;
    public setSendAllOnUnload: (sendAllOnUnload: boolean) => void;

    public setRequestSuccessCallback: (requestSuccessCallback: (xhr: XMLHttpRequest) => void) => void;
    public setFailCallback: (failCallback: (msg: string) => void) => void;

    public getPostVarName: () => string;
    public setPostVarName: (postVarName: string) => void;

    public getHeaders: () => { name: string; value: string }[];
    public addHeader: (name: string, value: string) => void;

    public sendAll: () => void;
    public sendAllRemaining: () => boolean;


    constructor(url: string, withCredentials?: boolean, opts?: Log4Ts.AppenderOptions) {
        super(opts);

        this.layout = new HttpPostDataLayout();

        var appender: AjaxAppender = this;
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
        var sessionId: string = null;

        var queuedLogEvents: Log4Ts.LoggingEvent[] = [];
        var queuedRequests: Log4Ts.LoggingEvent[][] = [];
        var headers: { name: string; value: string }[] = [];
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
        this.setSessionId = (sessionIdParam?: string) => {
            sessionId = Utils.stringOrDefault(sessionIdParam, null);
            this.layout.setCustomField("sessionid", sessionId);
        };

        this.setLayout = (layoutParam: Log4Ts.Layout) => {
            if (checkCanConfigure("layout")) {
                this.layout = layoutParam;
                // Set the session id as a custom field on the layout, if not already present
                if (sessionId !== null) {
                    this.setSessionId(sessionId);
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
            } else {
                headers.push({ name: name, value: value });
            }
        };

        // Internal functions
        function sendAll() {
            if (isSupported && Globals.enabled) {
                sending = true;
                var currentRequestBatch: Log4Ts.LoggingEvent[];
                if (waitForResponse) {
                    // Send the first request then use this function as the callback once
                    // the response comes back
                    if (queuedRequests.length > 0) {
                        currentRequestBatch = queuedRequests.shift();
                        sendRequest(preparePostData(currentRequestBatch), sendAll);
                    } else {
                        sending = false;
                        if (timed) {
                            scheduleSending();
                        }
                    }
                } else {
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
                var currentLogEvent: Log4Ts.LoggingEvent;
                var batchedLogEvents: Log4Ts.LoggingEvent[] = [];
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

        function preparePostData(batchedLogEvents: Log4Ts.LoggingEvent[]) {
            // Format the logging events
            var formattedMessages = [];
            var postData = "";
            var currentLogEvent: Log4Ts.LoggingEvent;
            while ((currentLogEvent = batchedLogEvents.shift())) {
                formattedMessages.push(appender.getLayout().formatWithException(currentLogEvent));
            }
            // Create the post data string
            if (batchedLogEvents.length == 1) {
                postData = formattedMessages.join("");
            } else {
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

        function sendRequest(postData: any, successCallback?: (xhr: XMLHttpRequest) => void) {
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
                            } else {
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
                    } catch (headerEx) {
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
            } catch (ex) {
                var errMsg = "AjaxAppender.append: error sending log message to " + url;
                LogLog.handleError(errMsg, ex);
                isSupported = false;
                if (failCallback) {
                    failCallback(errMsg + ". Details: " + Utils.getExceptionStringRep(ex));
                }
            }
        }

        this.append = (logEvent: Log4Ts.LoggingEvent) => {
            if (isSupported) {
                if (!initialized) {
                    init();
                }
                queuedLogEvents.push(logEvent);
                var actualBatchSize = this.getLayout().allowBatching() ? batchSize : 1;

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
                        (<any>oldBeforeUnload)();
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


    public toString() {
        return this.name;
    }

}


// AjaxAppender related
module AjaxAppender {
    var xhrFactory = function () { return new XMLHttpRequest(); };
    var xmlHttpFactories: (() => XMLHttpRequest)[] = [
        xhrFactory,
        function () { return new ActiveXObject("Msxml2.XMLHTTP"); },
        function () { return new ActiveXObject("Microsoft.XMLHTTP"); }
    ];

    export var withCredentialsSupported = false;

    export function getXmlHttp(errorHandler?: () => void) {
        // This is only run the first time; the value of getXmlHttp gets
        // replaced with the factory that succeeds on the first run
        for (var i = 0, len = xmlHttpFactories.length; i < len; i++) {
            var factory = xmlHttpFactories[i];
            try {
                var xmlHttp = factory();
                withCredentialsSupported = (factory == xhrFactory && ("withCredentials" in xmlHttp));
                AjaxAppender.getXmlHttp = factory;
                return xmlHttp;
            } catch (e) {
            }
        }
        // If we're here, all factories have failed, so throw an error
        if (errorHandler) {
            errorHandler();
        } else {
            LogLog.handleError("getXmlHttp: unable to obtain XMLHttpRequest object");
        }
    }

    export function isHttpRequestSuccessful(xmlHttp: XMLHttpRequest) {
        return Utils.isUndefined(xmlHttp.status) || xmlHttp.status === 0 ||
            (xmlHttp.status >= 200 && xmlHttp.status < 300) ||
            xmlHttp.status == 1223 /* Fix for IE */;
    }

}

export = AjaxAppender;