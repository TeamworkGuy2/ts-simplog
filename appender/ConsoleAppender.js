"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Globals = require("../log4ts/Globals");
var Utils = require("../log-util/Utils");
var LogLog = require("../log4ts/LogLog");
var Appender = require("./Appender");
var ConsoleAppenderWindowSetup = require("./ConsoleAppenderWindowSetup");
var PatternLayout = require("../layout/PatternLayout");
// PopUpAppender and InPageAppender related
function setCookie(name, value, days, path) {
    var expires;
    path = path ? "; path=" + path : "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    else {
        expires = "";
    }
    document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + expires + path;
}
function getCookie(name) {
    var nameEquals = encodeURIComponent(name) + "=";
    var ca = document.cookie.split(";");
    for (var i = 0, len = ca.length; i < len; i++) {
        var c = ca[i];
        while (c.charAt(0) === " ") {
            c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEquals) === 0) {
            return decodeURIComponent(c.substring(nameEquals.length, c.length));
        }
    }
    return null;
}
// Gets the base URL of the location of this script.
// This is far from infallible.
function getBaseUrl() {
    var scripts = document.getElementsByTagName("script");
    for (var i = 0, len = scripts.length; i < len; ++i) {
        if (scripts[i].src.indexOf("log4ts") != -1) {
            var lastSlash = scripts[i].src.lastIndexOf("/");
            return (lastSlash == -1) ? "" : scripts[i].src.substr(0, lastSlash + 1);
        }
    }
    return null;
}
function isLoaded(wnd) {
    try {
        return Utils.bool(wnd.loaded);
    }
    catch (ex) {
        return false;
    }
}
var defaultCommandLineFunctions = [];
var consoleAppenderIdCounter = 1;
// ConsoleAppender (prototype for PopUpAppender and InPageAppender)
var ConsoleAppender = (function (_super) {
    __extends(ConsoleAppender, _super);
    function ConsoleAppender(opts) {
        _super.call(this, opts);
        this.name = "ConsoleAppender";
    }
    ConsoleAppender.prototype.toString = function () {
        return this.name;
    };
    ConsoleAppender.prototype.create = function (inPage, container, lazyInit, initiallyMinimized, useDocumentWrite, width, height, focusConsoleWindow) {
        var _this = this;
        var queuedLoggingEvents = [];
        var consoleAppenderId = consoleAppenderIdCounter++;
        // Local variables
        lazyInit = Utils.booleanOrDefault(lazyInit, this.defaults.lazyInit);
        width = width ? width : this.defaults.width;
        height = height ? height : this.defaults.height;
        this.commandLineObjectExpansionDepth = this.defaults.commandLineObjectExpansionDepth;
        this.complainAboutPopUpBlocking = this.defaults.complainAboutPopUpBlocking;
        this.container = container;
        this.focusConsoleWindow = focusConsoleWindow;
        this.initiallyMinimized = Utils.booleanOrDefault(initiallyMinimized, this.defaults.initiallyMinimized);
        this.isSupported = true;
        this.maxMessages = this.defaults.maxMessages;
        this.newestMessageAtTop = this.defaults.newestMessageAtTop;
        this.reopenWhenClosed = this.defaults.reopenWhenClosed;
        this.scrollToLatestMessage = this.defaults.scrollToLatestMessage;
        this.showCommandLine = this.defaults.showCommandLine;
        this.showCloseButton = this.defaults.showCloseButton;
        this.showHideButton = this.defaults.showHideButton;
        this.useDocumentWrite = Utils.booleanOrDefault(useDocumentWrite, this.defaults.useDocumentWrite);
        this.useOldPopUp = this.defaults.useOldPopUp;
        this.setLayout(this.defaults.layout);
        // Configuration methods. The function scope is used to prevent direct alteration to the appender configuration properties.
        var appenderName = inPage ? "InPageAppender" : "PopUpAppender";
        var checkCanConfigure = function (configOptionName) {
            if (_this.consoleWindowCreated) {
                LogLog.handleError(appenderName + ": configuration option '" + configOptionName + "' may not be set after the appender has been initialized");
                return false;
            }
            return true;
        };
        this.consoleWindowExists = function () {
            return (_this.consoleWindowLoaded && _this.isSupported && !_this.consoleClosed);
        };
        this.isNewestMessageAtTop = function () { return _this.newestMessageAtTop; };
        this.setNewestMessageAtTop = function (newestMessageAtTopParam) {
            _this.newestMessageAtTop = Utils.bool(newestMessageAtTopParam);
            if (_this.consoleWindowExists()) {
                _this.getConsoleWindow().setNewestAtTop(_this.newestMessageAtTop);
            }
        };
        this.isScrollToLatestMessage = function () { return _this.scrollToLatestMessage; };
        this.setScrollToLatestMessage = function (scrollToLatestMessageParam) {
            _this.scrollToLatestMessage = Utils.bool(scrollToLatestMessageParam);
            if (_this.consoleWindowExists()) {
                _this.getConsoleWindow().setScrollToLatest(_this.scrollToLatestMessage);
            }
        };
        this.getWidth = function () { return width; };
        this.setWidth = function (widthParam) {
            if (checkCanConfigure("width")) {
                width = Utils.stringOrDefault(widthParam, width);
            }
        };
        this.getHeight = function () { return height; };
        this.setHeight = function (heightParam) {
            if (checkCanConfigure("height")) {
                height = Utils.stringOrDefault(heightParam, height);
            }
        };
        this.getMaxMessages = function () { return _this.maxMessages; };
        this.setMaxMessages = function (maxMessagesParam) {
            _this.maxMessages = Utils.intOrDefault(maxMessagesParam, _this.maxMessages);
            if (_this.consoleWindowExists()) {
                _this.getConsoleWindow().setMaxMessages(_this.maxMessages);
            }
        };
        this.isShowCommandLine = function () { return _this.showCommandLine; };
        this.setShowCommandLine = function (showCommandLineParam) {
            _this.showCommandLine = Utils.bool(showCommandLineParam);
            if (_this.consoleWindowExists()) {
                _this.getConsoleWindow().setShowCommandLine(_this.showCommandLine);
            }
        };
        this.isShowHideButton = function () { return _this.showHideButton; };
        this.setShowHideButton = function (showHideButtonParam) {
            _this.showHideButton = Utils.bool(showHideButtonParam);
            if (_this.consoleWindowExists()) {
                _this.getConsoleWindow().setShowHideButton(_this.showHideButton);
            }
        };
        this.isShowCloseButton = function () { return _this.showCloseButton; };
        this.setShowCloseButton = function (showCloseButtonParam) {
            _this.showCloseButton = Utils.bool(showCloseButtonParam);
            if (_this.consoleWindowExists()) {
                _this.getConsoleWindow().setShowCloseButton(_this.showCloseButton);
            }
        };
        this.getCommandLineObjectExpansionDepth = function () { return _this.commandLineObjectExpansionDepth; };
        this.setCommandLineObjectExpansionDepth = function (commandLineObjectExpansionDepthParam) {
            _this.commandLineObjectExpansionDepth = Utils.intOrDefault(commandLineObjectExpansionDepthParam, _this.commandLineObjectExpansionDepth);
        };
        this.minimized = initiallyMinimized;
        this.isInitiallyMinimized = function () { return initiallyMinimized; };
        this.setInitiallyMinimized = function (initiallyMinimizedParam) {
            if (checkCanConfigure("initiallyMinimized")) {
                initiallyMinimized = Utils.bool(initiallyMinimizedParam);
                _this.minimized = initiallyMinimized;
            }
        };
        this.isUseDocumentWrite = function () { return useDocumentWrite; };
        this.setUseDocumentWrite = function (useDocumentWriteParam) {
            if (checkCanConfigure("useDocumentWrite")) {
                useDocumentWrite = Utils.bool(useDocumentWriteParam);
            }
        };
        var checkAndAppend = function () {
            // Next line forces a check of whether the window has been closed
            _this.safeToAppend();
            if (!_this.initialized) {
                init();
            }
            else if (_this.consoleClosed && _this.reopenWhenClosed) {
                _this.createWindow();
            }
            if (_this.safeToAppend()) {
                _this.appendQueuedLoggingEvents();
            }
        };
        this.append = function (loggingEvent) {
            if (_this.isSupported) {
                // Format the message
                var formattedMessage = _this.getLayout().formatWithException(loggingEvent);
                queuedLoggingEvents.push(new QueuedLoggingEvent(loggingEvent, formattedMessage));
                checkAndAppend();
            }
        };
        this.group = function (name, initiallyExpanded) {
            if (_this.isSupported) {
                queuedLoggingEvents.push(new QueuedGroup(name, initiallyExpanded));
                checkAndAppend();
            }
        };
        this.groupEnd = function (name) {
            if (_this.isSupported) {
                queuedLoggingEvents.push(new QueuedGroupEnd(name));
                checkAndAppend();
            }
        };
        this.appendQueuedLoggingEvents = function () {
            while (queuedLoggingEvents.length > 0) {
                queuedLoggingEvents.shift().append();
            }
            if (_this.focusConsoleWindow) {
                _this.getConsoleWindow().focus();
            }
        };
        this.setAddedToLogger = function (logger) {
            _this.loggers.push(logger);
            if (Globals.enabled && !lazyInit) {
                init();
            }
        };
        this.clear = function () {
            if (_this.consoleWindowExists()) {
                _this.getConsoleWindow().clearLog();
            }
            queuedLoggingEvents.length = 0;
        };
        this.focus = function () {
            if (_this.consoleWindowExists()) {
                _this.getConsoleWindow().focus();
            }
        };
        this.focusCommandLine = function () {
            if (_this.consoleWindowExists()) {
                _this.getConsoleWindow().focusCommandLine();
            }
        };
        this.focusSearch = function () {
            if (_this.consoleWindowExists()) {
                _this.getConsoleWindow().focusSearch();
            }
        };
        var cmdWnd = typeof window === "object" ? window : null;
        this.getCommandWindow = function () { return cmdWnd; };
        this.setCommandWindow = function (commandWindowParam) {
            cmdWnd = commandWindowParam;
        };
        this.executeLastCommand = function () {
            if (_this.consoleWindowExists()) {
                _this.getConsoleWindow().evalLastCommand();
            }
        };
        var commandLayout = new PatternLayout("%m");
        this.getCommandLayout = function () { return commandLayout; };
        this.setCommandLayout = function (commandLayoutParam) {
            commandLayout = commandLayoutParam;
        };
        var commandLineFunctions = defaultCommandLineFunctions.concat([]);
        this.addCommandLineFunction = function (functionName, commandLineFunction) {
            commandLineFunctions.push([functionName, commandLineFunction]);
        };
        var commandHistoryCookieName = "log4tsCommandHistory";
        this.storeCommandHistory = function (commandHistory) {
            setCookie(commandHistoryCookieName, commandHistory.join(","));
        };
        this.writeHtml = function (doc) {
            var lines = ConsoleAppenderWindowSetup.htmlDocString;
            doc.open();
            for (var i = 0, len = lines.length; i < len; i++) {
                doc.writeln(lines[i]);
            }
            doc.close();
        };
        // Set up event listeners
        this.setEventTypes(["load", "unload"]);
        this.consoleWindowLoadHandler = function () {
            var wnd = _this.getConsoleWindow();
            wnd.setAppender(_this);
            wnd.setNewestAtTop(_this.newestMessageAtTop);
            wnd.setScrollToLatest(_this.scrollToLatestMessage);
            wnd.setMaxMessages(_this.maxMessages);
            wnd.setShowCommandLine(_this.showCommandLine);
            wnd.setShowHideButton(_this.showHideButton);
            wnd.setShowCloseButton(_this.showCloseButton);
            wnd.setMainWindow(window);
            // Restore command history stored in cookie
            var storedValue = getCookie(commandHistoryCookieName);
            if (storedValue) {
                wnd.commandHistory = storedValue.split(",");
                wnd.currentCommandIndex = wnd.commandHistory.length;
            }
            _this.dispatchEvent("load", { "win": wnd });
        };
        this.unload = function () {
            LogLog.debug("unload " + _this + ", caller: " + _this.unload.caller);
            if (!_this.consoleClosed) {
                LogLog.debug("really doing unload " + _this);
                _this.consoleClosed = true;
                _this.consoleWindowLoaded = false;
                _this.consoleWindowCreated = false;
                _this.dispatchEvent("unload", {});
            }
        };
        this.pollConsoleWindow = function (windowTest, interval, successCallback, errorMessage) {
            var doPoll = function () {
                try {
                    // Test if the console has been closed while polling
                    if (_this.consoleClosed) {
                        clearInterval(poll);
                    }
                    if (windowTest(_this.getConsoleWindow())) {
                        clearInterval(poll);
                        successCallback();
                    }
                }
                catch (ex) {
                    clearInterval(poll);
                    _this.isSupported = false;
                    LogLog.handleError(errorMessage, ex);
                }
            };
            // Poll the pop-up since the onload event is not reliable
            var poll = setInterval(doPoll, interval);
        };
        this.getConsoleUrl = function () {
            var hasDomain = (document.domain != location.hostname);
            return useDocumentWrite ? "" : getBaseUrl() + "console_uncompressed.html" +
                (hasDomain ? "?log4ts_domain=" + encodeURIComponent(document.domain) : "");
        };
        // Define methods and properties that vary between subclasses
        if (inPage) {
            this.setupInPageAppender(consoleAppenderId, checkCanConfigure, width, height);
        }
        else {
            this.setupPopupAppender(consoleAppenderId, checkCanConfigure, width, height);
        }
        var getConsoleWindow = this.getConsoleWindow;
        // Common methods
        var QueuedLoggingEvent = (function () {
            function QueuedLoggingEvent(loggingEvent, formattedMessage) {
                this.loggingEvent = loggingEvent;
                this.levelName = loggingEvent.level.name;
                this.formattedMessage = formattedMessage;
            }
            QueuedLoggingEvent.prototype.append = function () {
                getConsoleWindow().log(this.levelName, this.formattedMessage);
            };
            return QueuedLoggingEvent;
        }());
        var QueuedGroup = (function () {
            function QueuedGroup(name, initiallyExpanded) {
                this.name = name;
                this.initiallyExpanded = initiallyExpanded;
            }
            QueuedGroup.prototype.append = function () {
                getConsoleWindow().group(this.name, this.initiallyExpanded);
            };
            return QueuedGroup;
        }());
        var QueuedGroupEnd = (function () {
            function QueuedGroupEnd(name) {
                this.name = name;
            }
            QueuedGroupEnd.prototype.append = function () {
                getConsoleWindow().groupEnd(name);
            };
            return QueuedGroupEnd;
        }());
    };
    // InPageAppender
    ConsoleAppender.prototype.setupInPageAppender = function (consoleAppenderId, canConfigureFunc, width, height) {
        var _this = this;
        var containerElem = null;
        // Configuration methods. The function scope is used to prevent
        // direct alteration to the appender configuration properties.
        var cssProperties = [];
        this.addCssProperty = function (name, value) {
            if (canConfigureFunc("cssProperties")) {
                cssProperties.push([name, value]);
            }
        };
        // Define useful variables
        var windowCreationStarted = false;
        var iframeElem;
        var iframeId = Globals.uniqueId + "_InPageAppender_" + consoleAppenderId;
        this.hide = function () {
            if (_this.initialized && _this.consoleWindowCreated) {
                if (_this.consoleWindowExists()) {
                    _this.getConsoleWindow().$("command").blur();
                }
                iframeElem.style.display = "none";
                _this.minimized = true;
            }
        };
        this.show = function () {
            if (_this.initialized) {
                if (_this.consoleWindowCreated) {
                    iframeElem.style.display = "block";
                    _this.setShowCommandLine(_this.showCommandLine); // Force IE to update
                    _this.minimized = false;
                }
                else if (!windowCreationStarted) {
                    _this.createWindow(true);
                }
            }
        };
        this.isVisible = function () {
            return !_this.minimized && !_this.consoleClosed;
        };
        this.close = function (fromButton) {
            if (!_this.consoleClosed && (!fromButton || confirm("This will permanently remove the console from the page. No more messages will be logged. Do you wish to continue?"))) {
                iframeElem.parentNode.removeChild(iframeElem);
                _this.unload();
            }
        };
        // Create open, init, getConsoleWindow and safeToAppend functions
        this.open = function () {
            var initErrorMessage = "InPageAppender.open: unable to create console iframe";
            var finalInit = function () {
                try {
                    if (!_this.initiallyMinimized) {
                        _this.show();
                    }
                    _this.consoleWindowLoadHandler();
                    _this.consoleWindowLoaded = true;
                    _this.appendQueuedLoggingEvents();
                }
                catch (ex) {
                    _this.isSupported = false;
                    LogLog.handleError(initErrorMessage, ex);
                }
            };
            var writeToDocument = function () {
                try {
                    var windowTest = function (win) { return isLoaded(win); };
                    if (_this.useDocumentWrite) {
                        _this.writeHtml(_this.getConsoleWindow().document);
                    }
                    if (windowTest(_this.getConsoleWindow())) {
                        finalInit();
                    }
                    else {
                        _this.pollConsoleWindow(windowTest, 100, finalInit, initErrorMessage);
                    }
                }
                catch (ex) {
                    _this.isSupported = false;
                    LogLog.handleError(initErrorMessage, ex);
                }
            };
            _this.minimized = false;
            iframeElem = containerElem.appendChild(document.createElement("div"));
            iframeElem.style.width = width;
            iframeElem.style.height = height;
            iframeElem.style.border = "solid gray 1px";
            for (var i = 0, len = cssProperties.length; i < len; i++) {
                iframeElem.style[cssProperties[i][0]] = cssProperties[i][1];
            }
            var iframeSrc = _this.useDocumentWrite ? "" : " src='" + _this.getConsoleUrl() + "'";
            // Adding an iframe using the DOM would be preferable, but it doesn't work
            // in IE5 on Windows, or in Konqueror prior to version 3.5 - in Konqueror
            // it creates the iframe fine but I haven't been able to find a way to obtain
            // the iframe's window object
            iframeElem.innerHTML = "<iframe id='" + iframeId + "' name='" + iframeId +
                "' width='100%' height='100%' frameborder='0'" + iframeSrc +
                " scrolling='no'></iframe>";
            _this.consoleClosed = false;
            // Write the console HTML to the iframe
            var iframeDocumentExistsTest = function (wnd) {
                try {
                    return Utils.bool(wnd) && Utils.bool(wnd.document);
                }
                catch (ex) {
                    return false;
                }
            };
            if (iframeDocumentExistsTest(_this.getConsoleWindow())) {
                writeToDocument();
            }
            else {
                _this.pollConsoleWindow(iframeDocumentExistsTest, 100, writeToDocument, initErrorMessage);
            }
            _this.consoleWindowCreated = true;
        };
        this.createWindow = function (show) {
            if (show || !_this.initiallyMinimized) {
                var pageLoadHandler = function () {
                    if (!_this.container) {
                        // Set up default container element
                        containerElem = document.createElement("div");
                        containerElem.style.position = "fixed";
                        containerElem.style.left = "0";
                        containerElem.style.right = "0";
                        containerElem.style.bottom = "0";
                        document.body.appendChild(containerElem);
                        _this.addCssProperty("borderWidth", "1px 0 0 0");
                        _this.addCssProperty("zIndex", 1000000); // Can't find anything authoritative that says how big z-index can be
                        open();
                    }
                    else {
                        try {
                            var el = document.getElementById(_this.container);
                            if (el.nodeType == 1) {
                                containerElem = el;
                            }
                            open();
                        }
                        catch (ex) {
                            LogLog.handleError("InPageAppender.init: invalid container element '" + _this.container + "' supplied", ex);
                        }
                    }
                };
                // Test the type of the container supplied. First, check if it's an element
                if (Globals.pageLoaded && _this.container && _this.container.appendChild) {
                    containerElem = _this.container;
                    open();
                }
                else if (Globals.pageLoaded) {
                    pageLoadHandler();
                }
                else {
                    LogLog.eventHandler.addEventListener("load", pageLoadHandler);
                }
                windowCreationStarted = true;
            }
        };
        this.init = function () {
            _this.createWindow();
            _this.initialized = true;
        };
        this.getConsoleWindow = function () {
            var iframe = window.frames[iframeId];
            if (iframe) {
                return iframe;
            }
        };
        this.safeToAppend = function () {
            if (_this.isSupported && !_this.consoleClosed) {
                if (_this.consoleWindowCreated && !_this.consoleWindowLoaded && _this.getConsoleWindow() && isLoaded(_this.getConsoleWindow())) {
                    _this.consoleWindowLoaded = true;
                }
                return _this.consoleWindowLoaded;
            }
            return false;
        };
    };
    // PopUpAppender
    ConsoleAppender.prototype.setupPopupAppender = function (consoleAppenderId, canConfigureFunc, width, height) {
        var _this = this;
        // Configuration methods. The function scope is used to prevent
        // direct alteration to the appender configuration properties.
        this.isUseOldPopUp = function () { return _this.useOldPopUp; };
        this.setUseOldPopUp = function (useOldPopUpParam) {
            if (canConfigureFunc("useOldPopUp")) {
                _this.useOldPopUp = Utils.bool(useOldPopUpParam);
            }
        };
        this.isComplainAboutPopUpBlocking = function () { return _this.complainAboutPopUpBlocking; };
        this.setComplainAboutPopUpBlocking = function (complainAboutPopUpBlockingParam) {
            if (canConfigureFunc("complainAboutPopUpBlocking")) {
                _this.complainAboutPopUpBlocking = Utils.bool(complainAboutPopUpBlockingParam);
            }
        };
        this.isFocusPopUp = function () { return _this.focusConsoleWindow; };
        this.setFocusPopUp = function (focusPopUpParam) {
            // This property can be safely altered after logging has started
            _this.focusConsoleWindow = Utils.bool(focusPopUpParam);
        };
        this.isReopenWhenClosed = function () { return _this.reopenWhenClosed; };
        this.setReopenWhenClosed = function (reopenWhenClosedParam) {
            // This property can be safely altered after logging has started
            _this.reopenWhenClosed = Utils.bool(reopenWhenClosedParam);
        };
        this.close = function () {
            LogLog.debug("close " + _this);
            try {
                popUp.close();
                _this.unload();
            }
            catch (ex) {
            }
        };
        this.hide = function () {
            LogLog.debug("hide " + _this);
            if (_this.consoleWindowExists()) {
                _this.close();
            }
        };
        this.show = function () {
            LogLog.debug("show " + _this);
            if (!_this.consoleWindowCreated) {
                open();
            }
        };
        this.isVisible = function () {
            return _this.safeToAppend();
        };
        // Define useful variables
        var popUp;
        // Create open, init, getConsoleWindow and safeToAppend functions
        this.open = function () {
            var windowProperties = "width=" + width + ",height=" + height + ",status,resizable";
            var frameInfo = "";
            try {
                var frameEl = window.frameElement;
                if (frameEl) {
                    frameInfo = "_" + frameEl.tagName + "_" + (frameEl["name"] || frameEl.id || "");
                }
            }
            catch (e) {
                frameInfo = "_inaccessibleParentFrame";
            }
            var windowName = "PopUp_" + location.host.replace(/[^a-z0-9]/gi, "_") + "_" + consoleAppenderId + frameInfo;
            if (!_this.useOldPopUp || !_this.useDocumentWrite) {
                // Ensure a previous window isn't used by using a unique name
                windowName = windowName + "_" + Globals.uniqueId;
            }
            var checkPopUpClosed = function (wnd) {
                if (_this.consoleClosed) {
                    return true;
                }
                else {
                    try {
                        return Utils.bool(wnd) && wnd.closed;
                    }
                    catch (ex) { }
                }
                return false;
            };
            var popUpClosedCallback = function () {
                if (!_this.consoleClosed) {
                    _this.unload();
                }
            };
            var finalInit = function () {
                _this.getConsoleWindow().setCloseIfOpenerCloses(!_this.useOldPopUp || !_this.useDocumentWrite);
                _this.consoleWindowLoadHandler();
                _this.consoleWindowLoaded = true;
                _this.appendQueuedLoggingEvents();
                _this.pollConsoleWindow(checkPopUpClosed, 500, popUpClosedCallback, "PopUpAppender.checkPopUpClosed: error checking pop-up window");
            };
            try {
                popUp = window.open(_this.getConsoleUrl(), windowName, windowProperties);
                _this.consoleClosed = false;
                _this.consoleWindowCreated = true;
                if (popUp && popUp.document) {
                    if (_this.useDocumentWrite && _this.useOldPopUp && isLoaded(popUp)) {
                        // TODO need to inject functions into the page
                        popUp["mainPageReloaded"]();
                        finalInit();
                    }
                    else {
                        if (_this.useDocumentWrite) {
                            _this.writeHtml(popUp.document);
                        }
                        // Check if the pop-up window object is available
                        var popUpLoadedTest = function (win) { return Utils.bool(win) && isLoaded(win); };
                        if (isLoaded(popUp)) {
                            finalInit();
                        }
                        else {
                            _this.pollConsoleWindow(popUpLoadedTest, 100, finalInit, "PopUpAppender.init: unable to create console window");
                        }
                    }
                }
                else {
                    _this.isSupported = false;
                    LogLog.warn("PopUpAppender.init: pop-ups blocked, please unblock to use PopUpAppender");
                    if (_this.complainAboutPopUpBlocking) {
                        LogLog.handleError("log4ts: pop-up windows appear to be blocked. Please unblock them to use pop-up logging.");
                    }
                }
            }
            catch (ex) {
                LogLog.handleError("PopUpAppender.init: error creating pop-up", ex);
            }
        };
        this.createWindow = function () {
            if (!_this.initiallyMinimized) {
                open();
            }
        };
        this.init = function () {
            _this.createWindow();
            _this.initialized = true;
        };
        this.getConsoleWindow = function () {
            return popUp;
        };
        this.safeToAppend = function () {
            if (_this.isSupported && !Utils.isUndefined(popUp) && !_this.consoleClosed) {
                if (popUp.closed || (_this.consoleWindowLoaded && Utils.isUndefined(popUp.closed))) {
                    _this.unload();
                    LogLog.debug("PopUpAppender: pop-up closed");
                    return false;
                }
                if (!_this.consoleWindowLoaded && isLoaded(popUp)) {
                    _this.consoleWindowLoaded = true;
                }
            }
            return _this.isSupported && _this.consoleWindowLoaded && !_this.consoleClosed;
        };
    };
    ConsoleAppender.addGlobalCommandLineFunction = function (functionName, commandLineFunction) {
        defaultCommandLineFunctions.push([functionName, commandLineFunction]);
    };
    return ConsoleAppender;
}(Appender));
// ==== TODO different ====
function dir(obj) {
    var maxLen = 0;
    // Obtain the length of the longest property name
    for (var p in obj) {
        maxLen = Math.max(Utils.toStr(p).length, maxLen);
    }
    // Create the nicely formatted property list
    var propList = [];
    for (p in obj) {
        var propNameStr = "  " + Utils.padWithSpaces(Utils.toStr(p), maxLen + 2);
        var propVal;
        try {
            propVal = Utils.splitIntoLines(Utils.toStr(obj[p])).join(Utils.padWithSpaces(Globals.newLine, maxLen + 6));
        }
        catch (ex) {
            propVal = "[Error obtaining property. Details: " + Utils.getExceptionMessage(ex) + "]";
        }
        propList.push(propNameStr + propVal);
    }
    return propList.join(Globals.newLine);
}
var nodeTypes = {
    ELEMENT_NODE: 1,
    ATTRIBUTE_NODE: 2,
    TEXT_NODE: 3,
    CDATA_SECTION_NODE: 4,
    ENTITY_REFERENCE_NODE: 5,
    ENTITY_NODE: 6,
    PROCESSING_INSTRUCTION_NODE: 7,
    COMMENT_NODE: 8,
    DOCUMENT_NODE: 9,
    DOCUMENT_TYPE_NODE: 10,
    DOCUMENT_FRAGMENT_NODE: 11,
    NOTATION_NODE: 12
};
var preFormattedElements = ["script", "pre"];
// This should be the definitive list, as specified by the XHTML 1.0 Transitional DTD
var emptyElements = ["br", "img", "hr", "param", "link", "area", "input", "col", "base", "meta"];
var indentationUnit = "  ";
// Create and return an XHTML string from the node specified
function getXhtml(rootNode, includeRootNode, indentation, startNewLine, preformatted) {
    includeRootNode = (typeof includeRootNode == "undefined") ? true : !!includeRootNode;
    if (typeof indentation != "string") {
        indentation = "";
    }
    startNewLine = !!startNewLine;
    preformatted = !!preformatted;
    var xhtml;
    function isWhitespace(node) {
        return ((node.nodeType == nodeTypes.TEXT_NODE) && /^[ \t\r\n]*$/.test(node.nodeValue));
    }
    function fixAttributeValue(attrValue) {
        return attrValue.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    }
    function getStyleAttributeValue(el) {
        var stylePairs = el.style.cssText.split(";");
        var styleValue = "";
        for (var j = 0, len = stylePairs.length; j < len; j++) {
            var nameValueBits = stylePairs[j].split(":");
            var props = [];
            var nameVal0Trim;
            if ((nameVal0Trim = nameValueBits[0].trim()).length !== 0) {
                props.push(nameVal0Trim.toLowerCase() + ":" + nameValueBits[1].trim());
            }
            styleValue = props.join(";");
        }
        return styleValue;
    }
    function getNamespace(el) {
        if (el.prefix) {
            return el.prefix;
        }
        else if (el.outerHTML) {
            var regex = new RegExp("<([^:]+):" + el.tagName + "[^>]*>", "i");
            if (regex.test(el.outerHTML)) {
                return RegExp.$1.toLowerCase();
            }
        }
        return "";
    }
    var lt = "<";
    var gt = ">";
    if (includeRootNode && rootNode.nodeType != nodeTypes.DOCUMENT_FRAGMENT_NODE) {
        var rootElem = rootNode;
        switch (rootElem.nodeType) {
            case nodeTypes.ELEMENT_NODE:
                var tagName = rootElem.tagName.toLowerCase();
                xhtml = startNewLine ? Globals.newLine + indentation : "";
                xhtml += lt;
                // Allow for namespaces, where present
                var prefix = getNamespace(rootElem);
                var hasPrefix = !!prefix;
                if (hasPrefix) {
                    xhtml += prefix + ":";
                }
                xhtml += tagName;
                for (var i = 0, len = rootElem.attributes.length; i < len; i++) {
                    var currentAttr = rootElem.attributes[i];
                    // Check the attribute is valid.
                    if (!currentAttr.specified ||
                        currentAttr.nodeValue === null ||
                        currentAttr.nodeName.toLowerCase() === "style" ||
                        typeof currentAttr.nodeValue !== "string" ||
                        currentAttr.nodeName.indexOf("_moz") === 0) {
                        continue;
                    }
                    xhtml += " " + currentAttr.nodeName.toLowerCase() + "=\"";
                    xhtml += fixAttributeValue(currentAttr.nodeValue);
                    xhtml += "\"";
                }
                // Style needs to be done separately as it is not reported as an
                // attribute in IE
                if (rootElem.style.cssText) {
                    var styleValue = getStyleAttributeValue(rootElem);
                    if (styleValue !== "") {
                        xhtml += " style=\"" + getStyleAttributeValue(rootElem) + "\"";
                    }
                }
                if (Utils.arrayContains(emptyElements, tagName) ||
                    (hasPrefix && !rootElem.hasChildNodes())) {
                    xhtml += "/" + gt;
                }
                else {
                    xhtml += gt;
                    // Add output for childNodes collection (which doesn't include attribute nodes)
                    var childStartNewLine = !(rootElem.childNodes.length === 1 &&
                        rootElem.childNodes[0].nodeType === nodeTypes.TEXT_NODE);
                    var childPreformatted = Utils.arrayContains(preFormattedElements, tagName);
                    for (var i = 0, len = rootElem.childNodes.length; i < len; i++) {
                        xhtml += getXhtml(rootElem.childNodes[i], true, indentation + indentationUnit, childStartNewLine, childPreformatted);
                    }
                    // Add the end tag
                    var endTag = lt + "/" + tagName + gt;
                    xhtml += childStartNewLine ? Globals.newLine + indentation + endTag : endTag;
                }
                return xhtml;
            case nodeTypes.TEXT_NODE:
                if (isWhitespace(rootElem)) {
                    xhtml = "";
                }
                else {
                    if (preformatted) {
                        xhtml = rootElem.nodeValue;
                    }
                    else {
                        // Trim whitespace from each line of the text node
                        var lines = Utils.splitIntoLines(rootElem.nodeValue.trim());
                        var trimmedLines = [];
                        for (var i = 0, len = lines.length; i < len; i++) {
                            trimmedLines[i] = lines[i].trim();
                        }
                        xhtml = trimmedLines.join(Globals.newLine + indentation);
                    }
                    if (startNewLine) {
                        xhtml = Globals.newLine + indentation + xhtml;
                    }
                }
                return xhtml;
            case nodeTypes.CDATA_SECTION_NODE:
                return "<![CDA" + "TA[" + rootElem.nodeValue + "]" + "]>" + Globals.newLine;
            case nodeTypes.DOCUMENT_NODE:
                xhtml = "";
                // Add output for childNodes collection (which doesn't include attribute nodes)
                for (var i = 0, len = rootElem.childNodes.length; i < len; i++) {
                    xhtml += getXhtml(rootElem.childNodes[i], true, indentation);
                }
                return xhtml;
            default:
                return "";
        }
    }
    else {
        xhtml = "";
        // Add output for childNodes collection (which doesn't include attribute nodes)
        for (var i = 0, len = rootNode.childNodes.length; i < len; i++) {
            xhtml += getXhtml(rootNode.childNodes[i], true, indentation + indentationUnit);
        }
        return xhtml;
    }
}
function createCommandLineFunctions() {
    ConsoleAppender.addGlobalCommandLineFunction("$", function (appender, args, returnValue) {
        return document.getElementById(args[0]);
    });
    ConsoleAppender.addGlobalCommandLineFunction("dir", function (appender, args, returnValue) {
        var lines = [];
        for (var i = 0, len = args.length; i < len; i++) {
            lines[i] = dir(args[i]);
        }
        return lines.join(Globals.newLine + Globals.newLine);
    });
    ConsoleAppender.addGlobalCommandLineFunction("dirxml", function (appender, args, returnValue) {
        var lines = [];
        for (var i = 0, len = args.length; i < len; i++) {
            lines[i] = getXhtml(args[i]);
        }
        return lines.join(Globals.newLine + Globals.newLine);
    });
    ConsoleAppender.addGlobalCommandLineFunction("cd", function (appender, args, returnValue) {
        var win, message;
        if (args.length === 0 || args[0] === "") {
            win = window;
            message = "Command line set to run in main window";
        }
        else {
            if (args[0].window == args[0]) {
                win = args[0];
                message = "Command line set to run in frame '" + args[0].name + "'";
            }
            else {
                win = window.frames[args[0]];
                if (win) {
                    message = "Command line set to run in frame '" + args[0] + "'";
                }
                else {
                    returnValue.isError = true;
                    message = "Frame '" + args[0] + "' does not exist";
                    win = appender.getCommandWindow();
                }
            }
        }
        appender.setCommandWindow(win);
        return message;
    });
    ConsoleAppender.addGlobalCommandLineFunction("clear", function (appender, args, returnValue) {
        returnValue.appendResult = false;
        appender.clear();
    });
    ConsoleAppender.addGlobalCommandLineFunction("keys", function (appender, args, returnValue) {
        var keys = [];
        for (var k in args[0]) {
            keys.push(k);
        }
        return keys;
    });
    ConsoleAppender.addGlobalCommandLineFunction("values", function (appender, args, returnValue) {
        var values = [];
        for (var k in args[0]) {
            try {
                values.push(args[0][k]);
            }
            catch (ex) {
                LogLog.warn("values(): Unable to obtain value for key " + k + ". Details: " + Utils.getExceptionMessage(ex));
            }
        }
        return values;
    });
    ConsoleAppender.addGlobalCommandLineFunction("expansionDepth", function (appender, args, returnValue) {
        var expansionDepth = parseInt(args[0], 10);
        if (isNaN(expansionDepth) || expansionDepth < 0) {
            returnValue.isError = true;
            return "" + args[0] + " is not a valid expansion depth";
        }
        else {
            appender.setCommandLineObjectExpansionDepth(expansionDepth);
            return "Object expansion depth set to " + expansionDepth;
        }
    });
}
function init() {
    // Add command line functions
    createCommandLineFunctions();
}
init();
module.exports = ConsoleAppender;
