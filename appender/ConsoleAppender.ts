import Globals = require("../log4ts/Globals");
import Utils = require("../log-util/Utils");
import LogLog = require("../log4ts/LogLog");
import Appender = require("./Appender");
import ConsoleAppenderWindowSetup = require("./ConsoleAppenderWindowSetup");
import PatternLayout = require("../layout/PatternLayout");


// Console extension functions
function padWithSpaces(str: string, len: number) {
    if (str.length < len) {
        var spaces = [];
        var numberOfSpaces = Math.max(0, len - str.length);
        for (var i = 0; i < numberOfSpaces; i++) {
            spaces[i] = " ";
        }
        str += spaces.join("");
    }
    return str;
}

// PopUpAppender and InPageAppender related

function setCookie(name: string, value: string, days?: number, path?: string) {
    var expires;
    path = path ? "; path=" + path : "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    } else {
        expires = "";
    }
    document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + expires + path;
}

function getCookie(name: string) {
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

function isLoaded(wnd: { loaded?: boolean }) {
    try {
        return Utils.bool(wnd.loaded);
    } catch (ex) {
        return false;
    }
}


var defaultCommandLineFunctions: [string, (...args: any[]) => void][] = [];
var consoleAppenderIdCounter = 1;


// ConsoleAppender (prototype for PopUpAppender and InPageAppender)
class ConsoleAppender extends Appender {
    public defaults: {
        initiallyMinimized: boolean;
        lazyInit: boolean;
        useDocumentWrite: boolean;
        newestMessageAtTop: boolean;
        scrollToLatestMessage: boolean;
        width: string | number;
        height: string | number;
        maxMessages: number;
        showCommandLine: boolean;
        commandLineObjectExpansionDepth: number;
        showHideButton: boolean;
        showCloseButton: boolean;
        layout: Log4Ts.Layout;
        // optional
        useOldPopUp?: boolean;
        complainAboutPopUpBlocking?: boolean;
        reopenWhenClosed?: boolean;
    };

    constructor() {
        super();
    }

    public toString() {
        return "ConsoleAppender";
    }

    public isNewestMessageAtTop: () => boolean;
    public setNewestMessageAtTop: (newestMessageAtTop: boolean) => void;

    public isScrollToLatestMessage: () => boolean;
    public setScrollToLatestMessage: (scrollToLatestMessage: boolean) => void;

    public getHeight: () => string | number;
    public setHeight: (height: string | number) => void;

    public getWidth: () => string | number;
    public setWidth: (width: string | number) => void;

    public getMaxMessages: () => number;
    public setMaxMessages: (maxMessages: number) => void;

    public isShowCommandLine: () => boolean;
    public setShowCommandLine: (showCommandLine: boolean) => void;

    public isShowHideButton: () => boolean;
    public setShowHideButton: (showHideButton: boolean) => void;

    public isShowCloseButton: () => boolean;
    public setShowCloseButton: (showCloseButton: boolean) => void;

    public getCommandLineObjectExpansionDepth: () => number;
    public setCommandLineObjectExpansionDepth: (commandLineObjectExpansionDepth: number) => void;

    public isInitiallyMinimized: () => boolean;
    public setInitiallyMinimized: (initiallyMinimized: boolean) => void;

    public isUseDocumentWrite: () => boolean;
    public setUseDocumentWrite: (useDocumentWrite: boolean) => void;

    public getCommandWindow: () => Window;
    public setCommandWindow: (commandWindow: Window) => void;

    public getCommandLayout: () => Log4Ts.Layout;
    public setCommandLayout: (commandLayout: Log4Ts.Layout) => void;

    public isComplainAboutPopUpBlocking: () => boolean;
    public setComplainAboutPopUpBlocking: (complainAboutPopUpBlocking: boolean) => void;

    public isUseOldPopUp: () => boolean;
    public setUseOldPopUp: (useOldPopUp: boolean) => void;

    public isFocusPopUp: () => boolean;
    public setFocusPopUp: (reopenWhenClosed: boolean) => void;
    public isReopenWhenClosed: () => boolean;
    public setReopenWhenClosed: (reopenWhenClosed: boolean) => void;

    public addCommandLineFunction: (functionName: string, commandLineFunction: (...args: any[]) => void) => void;
    public addCssProperty: (name: string, value: string | number) => void;
    public appendQueuedLoggingEvents: () => void;
    public clear: () => void;
    public close: (fromButton?: boolean) => void;
    public consoleWindowLoadHandler: () => void;
    public consoleWindowExists: () => boolean;
    public executeLastCommand: () => void;
    public focus: () => void;
    public focusCommandLine: () => void;
    public focusSearch: () => void;
    public getConsoleUrl: () => string;
    public getConsoleWindow: () => Window & any; // TODO type
    public hide: () => void;
    public isVisible: () => boolean;
    public pollConsoleWindow: (windowTest: (wnd: Window & any) => void, interval: number, successCallback: () => void, errorMessage: any) => void;
    public show: () => void;
    public storeCommandHistory: (commandHistory: string[]) => void;
    public unload: () => void;
    public writeHtml: (doc: { open(): void; close(): void; writeln(str: string): void; }) => void;

    // Extract params
    public commandLineObjectExpansionDepth: number;
    public complainAboutPopUpBlocking: boolean;
    public consoleWindowCreated: boolean;
    public consoleWindowLoaded: boolean;
    public consoleClosed: boolean;
    public container: string | Node;
    public focusConsoleWindow: boolean;
    public initialized: boolean;
    public initiallyMinimized: boolean;
    public isSupported: boolean;
    public maxMessages: number;
    public minimized: boolean;
    public newestMessageAtTop: boolean;
    public reopenWhenClosed: boolean;
    public scrollToLatestMessage: boolean;
    public showCommandLine: boolean;
    public showCloseButton: boolean;
    public showHideButton: boolean;
    public useDocumentWrite: boolean;
    public useOldPopUp: boolean;

    // Functions whose implementations vary between subclasses
    public init: () => void;
    public createWindow: (show?: boolean) => void;
    public safeToAppend: () => boolean;
    public open: () => void;


    public create(inPage: boolean, container?: string | Node, lazyInit?: boolean, initiallyMinimized?: boolean,
        useDocumentWrite?: boolean, width?: string | number, height?: string | number, focusConsoleWindow?: boolean) {

        var queuedLoggingEvents: (QueuedLoggingEvent | QueuedGroup | QueuedGroupEnd)[] = [];
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
        var checkCanConfigure = (configOptionName) => {
            if (this.consoleWindowCreated) {
                LogLog.handleError(appenderName + ": configuration option '" + configOptionName + "' may not be set after the appender has been initialized");
                return false;
            }
            return true;
        };

        this.consoleWindowExists = () => {
            return (this.consoleWindowLoaded && this.isSupported && !this.consoleClosed);
        };

        this.isNewestMessageAtTop = () => this.newestMessageAtTop;
        this.setNewestMessageAtTop = (newestMessageAtTopParam) => {
            this.newestMessageAtTop = Utils.bool(newestMessageAtTopParam);
            if (this.consoleWindowExists()) {
                this.getConsoleWindow().setNewestAtTop(this.newestMessageAtTop);
            }
        };

        this.isScrollToLatestMessage = () => this.scrollToLatestMessage;
        this.setScrollToLatestMessage = (scrollToLatestMessageParam) => {
            this.scrollToLatestMessage = Utils.bool(scrollToLatestMessageParam);
            if (this.consoleWindowExists()) {
                this.getConsoleWindow().setScrollToLatest(this.scrollToLatestMessage);
            }
        };

        this.getWidth = () => width;
        this.setWidth = (widthParam) => {
            if (checkCanConfigure("width")) {
                width = Utils.stringOrDefault(widthParam, width);
            }
        };

        this.getHeight = () => height;
        this.setHeight = (heightParam) => {
            if (checkCanConfigure("height")) {
                height = Utils.stringOrDefault(heightParam, height);
            }
        };

        this.getMaxMessages = () => this.maxMessages;
        this.setMaxMessages = (maxMessagesParam) => {
            this.maxMessages = Utils.intOrDefault(maxMessagesParam, this.maxMessages);
            if (this.consoleWindowExists()) {
                this.getConsoleWindow().setMaxMessages(this.maxMessages);
            }
        };

        this.isShowCommandLine = () => this.showCommandLine;
        this.setShowCommandLine = (showCommandLineParam) => {
            this.showCommandLine = Utils.bool(showCommandLineParam);
            if (this.consoleWindowExists()) {
                this.getConsoleWindow().setShowCommandLine(this.showCommandLine);
            }
        };

        this.isShowHideButton = () => this.showHideButton;
        this.setShowHideButton = (showHideButtonParam) => {
            this.showHideButton = Utils.bool(showHideButtonParam);
            if (this.consoleWindowExists()) {
                this.getConsoleWindow().setShowHideButton(this.showHideButton);
            }
        };

        this.isShowCloseButton = () => this.showCloseButton;
        this.setShowCloseButton = (showCloseButtonParam) => {
            this.showCloseButton = Utils.bool(showCloseButtonParam);
            if (this.consoleWindowExists()) {
                this.getConsoleWindow().setShowCloseButton(this.showCloseButton);
            }
        };

        this.getCommandLineObjectExpansionDepth = () => this.commandLineObjectExpansionDepth;
        this.setCommandLineObjectExpansionDepth = (commandLineObjectExpansionDepthParam) => {
            this.commandLineObjectExpansionDepth = Utils.intOrDefault(commandLineObjectExpansionDepthParam, this.commandLineObjectExpansionDepth);
        };

        this.minimized = initiallyMinimized;
        this.isInitiallyMinimized = () => initiallyMinimized;
        this.setInitiallyMinimized = (initiallyMinimizedParam) => {
            if (checkCanConfigure("initiallyMinimized")) {
                initiallyMinimized = Utils.bool(initiallyMinimizedParam);
                this.minimized = initiallyMinimized;
            }
        };

        this.isUseDocumentWrite = () => useDocumentWrite;
        this.setUseDocumentWrite = (useDocumentWriteParam) => {
            if (checkCanConfigure("useDocumentWrite")) {
                useDocumentWrite = Utils.bool(useDocumentWriteParam);
            }
        };

        var checkAndAppend = () => {
            // Next line forces a check of whether the window has been closed
            this.safeToAppend();
            if (!this.initialized) {
                init();
            } else if (this.consoleClosed && this.reopenWhenClosed) {
                this.createWindow();
            }
            if (this.safeToAppend()) {
                this.appendQueuedLoggingEvents();
            }
        };

        this.append = (loggingEvent) => {
            if (this.isSupported) {
                // Format the message
                var formattedMessage = this.getLayout().formatWithException(loggingEvent);
                queuedLoggingEvents.push(new QueuedLoggingEvent(loggingEvent, formattedMessage));
                checkAndAppend();
            }
        };

        this.group = (name, initiallyExpanded) => {
            if (this.isSupported) {
                queuedLoggingEvents.push(new QueuedGroup(name, initiallyExpanded));
                checkAndAppend();
            }
        };

        this.groupEnd = (name) => {
            if (this.isSupported) {
                queuedLoggingEvents.push(new QueuedGroupEnd(name));
                checkAndAppend();
            }
        };

        this.appendQueuedLoggingEvents = () => {
            while (queuedLoggingEvents.length > 0) {
                queuedLoggingEvents.shift().append();
            }
            if (this.focusConsoleWindow) {
                this.getConsoleWindow().focus();
            }
        };

        this.setAddedToLogger = (logger) => {
            this.loggers.push(logger);
            if (Globals.enabled && !lazyInit) {
                init();
            }
        };

        this.clear = () => {
            if (this.consoleWindowExists()) {
                this.getConsoleWindow().clearLog();
            }
            queuedLoggingEvents.length = 0;
        };

        this.focus = () => {
            if (this.consoleWindowExists()) {
                this.getConsoleWindow().focus();
            }
        };

        this.focusCommandLine = () => {
            if (this.consoleWindowExists()) {
                this.getConsoleWindow().focusCommandLine();
            }
        };

        this.focusSearch = () => {
            if (this.consoleWindowExists()) {
                this.getConsoleWindow().focusSearch();
            }
        };

        var cmdWnd = typeof window === "object" ? window : null;

        this.getCommandWindow = () => cmdWnd;
        this.setCommandWindow = (commandWindowParam) => {
            cmdWnd = commandWindowParam;
        };

        this.executeLastCommand = () => {
            if (this.consoleWindowExists()) {
                this.getConsoleWindow().evalLastCommand();
            }
        };

        var commandLayout: Log4Ts.Layout = new PatternLayout("%m");
        this.getCommandLayout = () => commandLayout;
        this.setCommandLayout = (commandLayoutParam) => {
            commandLayout = commandLayoutParam;
        };

        var commandLineFunctions = defaultCommandLineFunctions.concat([]);

        this.addCommandLineFunction = (functionName, commandLineFunction) => {
            commandLineFunctions.push([functionName, commandLineFunction]);
        };

        var commandHistoryCookieName = "log4tsCommandHistory";
        this.storeCommandHistory = (commandHistory: string[]) => {
            setCookie(commandHistoryCookieName, commandHistory.join(","));
        };

        this.writeHtml = (doc: { open(): void; close(): void; writeln(str: string): void; }) => {
            var lines = ConsoleAppenderWindowSetup.htmlDocString;
            doc.open();
            for (var i = 0, len = lines.length; i < len; i++) {
                doc.writeln(lines[i]);
            }
            doc.close();
        };

        // Set up event listeners
        this.setEventTypes(["load", "unload"]);

        this.consoleWindowLoadHandler = () => {
            var wnd = this.getConsoleWindow();
            wnd.setAppender(this);
            wnd.setNewestAtTop(this.newestMessageAtTop);
            wnd.setScrollToLatest(this.scrollToLatestMessage);
            wnd.setMaxMessages(this.maxMessages);
            wnd.setShowCommandLine(this.showCommandLine);
            wnd.setShowHideButton(this.showHideButton);
            wnd.setShowCloseButton(this.showCloseButton);
            wnd.setMainWindow(window);

            // Restore command history stored in cookie
            var storedValue = getCookie(commandHistoryCookieName);
            if (storedValue) {
                wnd.commandHistory = storedValue.split(",");
                wnd.currentCommandIndex = wnd.commandHistory.length;
            }

            this.dispatchEvent("load", { "win": wnd });
        };

        this.unload = () => {
            LogLog.debug("unload " + this + ", caller: " + this.unload.caller);
            if (!this.consoleClosed) {
                LogLog.debug("really doing unload " + this);
                this.consoleClosed = true;
                this.consoleWindowLoaded = false;
                this.consoleWindowCreated = false;
                this.dispatchEvent("unload", {});
            }
        };

        this.pollConsoleWindow = (windowTest: (wnd: Window & any) => void, interval: number, successCallback: () => void, errorMessage: any) => {
            var doPoll = () => {
                try {
                    // Test if the console has been closed while polling
                    if (this.consoleClosed) {
                        clearInterval(poll);
                    }
                    if (windowTest(this.getConsoleWindow())) {
                        clearInterval(poll);
                        successCallback();
                    }
                } catch (ex) {
                    clearInterval(poll);
                    this.isSupported = false;
                    LogLog.handleError(errorMessage, ex);
                }
            };

            // Poll the pop-up since the onload event is not reliable
            var poll = setInterval(doPoll, interval);
        };

        this.getConsoleUrl = () => {
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
        class QueuedLoggingEvent {
            loggingEvent: Log4Ts.LoggingEvent;
            levelName: string;
            formattedMessage: any[] | string;

            constructor(loggingEvent: Log4Ts.LoggingEvent, formattedMessage: any[] | string) {
                this.loggingEvent = loggingEvent;
                this.levelName = loggingEvent.level.name;
                this.formattedMessage = formattedMessage;
            }

            public append() {
                getConsoleWindow().log(this.levelName, this.formattedMessage);
            }
        }


        class QueuedGroup {
            name: string;
            initiallyExpanded: boolean;

            constructor(name: string, initiallyExpanded?: boolean) {
                this.name = name;
                this.initiallyExpanded = initiallyExpanded;
            }

            public append() {
                getConsoleWindow().group(this.name, this.initiallyExpanded);
            }
        }


        class QueuedGroupEnd {
            name: string;

            constructor(name: string) {
                this.name = name;
            }

            public append() {
                getConsoleWindow().groupEnd(name);
            }
        }

    }


    // InPageAppender
    public setupInPageAppender(consoleAppenderId: number, canConfigureFunc: (configOptionName: any) => boolean, width?: string | number, height?: string | number) {
        var containerElement = null;

        // Configuration methods. The function scope is used to prevent
        // direct alteration to the appender configuration properties.
        var cssProperties: [string, string | number][] = [];
        this.addCssProperty = (name: string, value: string | number) => {
            if (canConfigureFunc("cssProperties")) {
                cssProperties.push([name, value]);
            }
        };

        // Define useful variables
        var windowCreationStarted = false;
        var iframeContainerDiv;
        var iframeId = Globals.uniqueId + "_InPageAppender_" + consoleAppenderId;

        this.hide = () => {
            if (this.initialized && this.consoleWindowCreated) {
                if (this.consoleWindowExists()) {
                    this.getConsoleWindow().$("command").blur();
                }
                iframeContainerDiv.style.display = "none";
                this.minimized = true;
            }
        };

        this.show = () => {
            if (this.initialized) {
                if (this.consoleWindowCreated) {
                    iframeContainerDiv.style.display = "block";
                    this.setShowCommandLine(this.showCommandLine); // Force IE to update
                    this.minimized = false;
                } else if (!windowCreationStarted) {
                    this.createWindow(true);
                }
            }
        };

        this.isVisible = () => {
            return !this.minimized && !this.consoleClosed;
        };

        this.close = (fromButton) => {
            if (!this.consoleClosed && (!fromButton || confirm("This will permanently remove the console from the page. No more messages will be logged. Do you wish to continue?"))) {
                iframeContainerDiv.parentNode.removeChild(iframeContainerDiv);
                this.unload();
            }
        };

        // Create open, init, getConsoleWindow and safeToAppend functions
        this.open = () => {
            var initErrorMessage = "InPageAppender.open: unable to create console iframe";

            var finalInit = () => {
                try {
                    if (!this.initiallyMinimized) {
                        this.show();
                    }
                    this.consoleWindowLoadHandler();
                    this.consoleWindowLoaded = true;
                    this.appendQueuedLoggingEvents();
                } catch (ex) {
                    this.isSupported = false;
                    LogLog.handleError(initErrorMessage, ex);
                }
            };

            var writeToDocument = () => {
                try {
                    var windowTest = (win) => isLoaded(win);
                    if (this.useDocumentWrite) {
                        this.writeHtml(this.getConsoleWindow().document);
                    }
                    if (windowTest(this.getConsoleWindow())) {
                        finalInit();
                    } else {
                        this.pollConsoleWindow(windowTest, 100, finalInit, initErrorMessage);
                    }
                } catch (ex) {
                    this.isSupported = false;
                    LogLog.handleError(initErrorMessage, ex);
                }
            }

            this.minimized = false;
            iframeContainerDiv = containerElement.appendChild(document.createElement("div"));

            iframeContainerDiv.style.width = width;
            iframeContainerDiv.style.height = height;
            iframeContainerDiv.style.border = "solid gray 1px";

            for (var i = 0, len = cssProperties.length; i < len; i++) {
                iframeContainerDiv.style[cssProperties[i][0]] = cssProperties[i][1];
            }

            var iframeSrc = this.useDocumentWrite ? "" : " src='" + this.getConsoleUrl() + "'";

            // Adding an iframe using the DOM would be preferable, but it doesn't work
            // in IE5 on Windows, or in Konqueror prior to version 3.5 - in Konqueror
            // it creates the iframe fine but I haven't been able to find a way to obtain
            // the iframe's window object
            iframeContainerDiv.innerHTML = "<iframe id='" + iframeId + "' name='" + iframeId +
                "' width='100%' height='100%' frameborder='0'" + iframeSrc +
                " scrolling='no'></iframe>";
            this.consoleClosed = false;

            // Write the console HTML to the iframe
            var iframeDocumentExistsTest = (wnd) => {
                try {
                    return Utils.bool(wnd) && Utils.bool(wnd.document);
                } catch (ex) {
                    return false;
                }
            };
            if (iframeDocumentExistsTest(this.getConsoleWindow())) {
                writeToDocument();
            } else {
                this.pollConsoleWindow(iframeDocumentExistsTest, 100, writeToDocument, initErrorMessage);
            }
            this.consoleWindowCreated = true;
        };

        this.createWindow = (show?: boolean) => {
            if (show || !this.initiallyMinimized) {
                var pageLoadHandler = () => {
                    if (!this.container) {
                        // Set up default container element
                        containerElement = document.createElement("div");
                        containerElement.style.position = "fixed";
                        containerElement.style.left = "0";
                        containerElement.style.right = "0";
                        containerElement.style.bottom = "0";
                        document.body.appendChild(containerElement);
                        this.addCssProperty("borderWidth", "1px 0 0 0");
                        this.addCssProperty("zIndex", 1000000); // Can't find anything authoritative that says how big z-index can be
                        open();
                    } else {
                        try {
                            var el = document.getElementById(<string>this.container);
                            if (el.nodeType == 1) {
                                containerElement = el;
                            }
                            open();
                        } catch (ex) {
                            LogLog.handleError("InPageAppender.init: invalid container element '" + this.container + "' supplied", ex);
                        }
                    }
                };

                // Test the type of the container supplied. First, check if it's an element
                if (Globals.pageLoaded && this.container && (<Node>this.container).appendChild) {
                    containerElement = this.container;
                    open();
                } else if (Globals.pageLoaded) {
                    pageLoadHandler();
                } else {
                    LogLog.eventHandler.addEventListener("load", pageLoadHandler);
                }
                windowCreationStarted = true;
            }
        };

        this.init = () => {
            this.createWindow();
            this.initialized = true;
        };

        this.getConsoleWindow = (): Window => {
            var iframe = window.frames[iframeId];
            if (iframe) {
                return iframe;
            }
        };

        this.safeToAppend = () => {
            if (this.isSupported && !this.consoleClosed) {
                if (this.consoleWindowCreated && !this.consoleWindowLoaded && this.getConsoleWindow() && isLoaded(this.getConsoleWindow())) {
                    this.consoleWindowLoaded = true;
                }
                return this.consoleWindowLoaded;
            }
            return false;
        };
    }


    // PopUpAppender
    public setupPopupAppender(consoleAppenderId: number, canConfigureFunc: (configOptionName: any) => boolean, width: string | number, height: string | number) {
        // Configuration methods. The function scope is used to prevent
        // direct alteration to the appender configuration properties.
        this.isUseOldPopUp = () => this.useOldPopUp;
        this.setUseOldPopUp = (useOldPopUpParam) => {
            if (canConfigureFunc("useOldPopUp")) {
                this.useOldPopUp = Utils.bool(useOldPopUpParam);
            }
        };

        this.isComplainAboutPopUpBlocking = () => this.complainAboutPopUpBlocking;
        this.setComplainAboutPopUpBlocking = (complainAboutPopUpBlockingParam) => {
            if (canConfigureFunc("complainAboutPopUpBlocking")) {
                this.complainAboutPopUpBlocking = Utils.bool(complainAboutPopUpBlockingParam);
            }
        };

        this.isFocusPopUp = () => this.focusConsoleWindow;
        this.setFocusPopUp = (focusPopUpParam) => {
            // This property can be safely altered after logging has started
            this.focusConsoleWindow = Utils.bool(focusPopUpParam);
        };

        this.isReopenWhenClosed = () => this.reopenWhenClosed;
        this.setReopenWhenClosed = (reopenWhenClosedParam) => {
            // This property can be safely altered after logging has started
            this.reopenWhenClosed = Utils.bool(reopenWhenClosedParam);
        };

        this.close = () => {
            LogLog.debug("close " + this);
            try {
                popUp.close();
                this.unload();
            } catch (ex) {
                // Do nothing
            }
        };

        this.hide = () => {
            LogLog.debug("hide " + this);
            if (this.consoleWindowExists()) {
                this.close();
            }
        };

        this.show = () => {
            LogLog.debug("show " + this);
            if (!this.consoleWindowCreated) {
                open();
            }
        };

        this.isVisible = () => {
            return this.safeToAppend();
        };

        // Define useful variables
        var popUp;

        // Create open, init, getConsoleWindow and safeToAppend functions
        this.open = () => {
            var windowProperties = "width=" + width + ",height=" + height + ",status,resizable";
            var frameInfo = "";
            try {
                var frameEl = window.frameElement;
                if (frameEl) {
                    frameInfo = "_" + frameEl.tagName + "_" + (frameEl["name"] || frameEl.id || "");
                }
            } catch (e) {
                frameInfo = "_inaccessibleParentFrame";
            }

            var windowName = "PopUp_" + location.host.replace(/[^a-z0-9]/gi, "_") + "_" + consoleAppenderId + frameInfo;
            if (!this.useOldPopUp || !this.useDocumentWrite) {
                // Ensure a previous window isn't used by using a unique name
                windowName = windowName + "_" + Globals.uniqueId;
            }

            var checkPopUpClosed = (wnd) => {
                if (this.consoleClosed) {
                    return true;
                } else {
                    try {
                        return Utils.bool(wnd) && wnd.closed;
                    } catch (ex) { }
                }
                return false;
            };

            var popUpClosedCallback = () => {
                if (!this.consoleClosed) {
                    this.unload();
                }
            };

            var finalInit = () => {
                this.getConsoleWindow().setCloseIfOpenerCloses(!this.useOldPopUp || !this.useDocumentWrite);
                this.consoleWindowLoadHandler();
                this.consoleWindowLoaded = true;
                this.appendQueuedLoggingEvents();
                this.pollConsoleWindow(checkPopUpClosed, 500, popUpClosedCallback,
                    "PopUpAppender.checkPopUpClosed: error checking pop-up window");
            };

            try {
                popUp = window.open(this.getConsoleUrl(), windowName, windowProperties);
                this.consoleClosed = false;
                this.consoleWindowCreated = true;
                if (popUp && popUp.document) {
                    if (this.useDocumentWrite && this.useOldPopUp && isLoaded(popUp)) {
                        popUp.mainPageReloaded();
                        finalInit();
                    } else {
                        if (this.useDocumentWrite) {
                            this.writeHtml(popUp.document);
                        }
                        // Check if the pop-up window object is available
                        var popUpLoadedTest = (win) => Utils.bool(win) && isLoaded(win);
                        if (isLoaded(popUp)) {
                            finalInit();
                        } else {
                            this.pollConsoleWindow(popUpLoadedTest, 100, finalInit,
                                "PopUpAppender.init: unable to create console window");
                        }
                    }
                } else {
                    this.isSupported = false;
                    LogLog.warn("PopUpAppender.init: pop-ups blocked, please unblock to use PopUpAppender");
                    if (this.complainAboutPopUpBlocking) {
                        LogLog.handleError("log4ts: pop-up windows appear to be blocked. Please unblock them to use pop-up logging.");
                    }
                }
            } catch (ex) {
                LogLog.handleError("PopUpAppender.init: error creating pop-up", ex);
            }
        };

        this.createWindow = () => {
            if (!this.initiallyMinimized) {
                open();
            }
        };

        this.init = () => {
            this.createWindow();
            this.initialized = true;
        };

        this.getConsoleWindow = () => {
            return popUp;
        };

        this.safeToAppend = () => {
            if (this.isSupported && !Utils.isUndefined(popUp) && !this.consoleClosed) {
                if (popUp.closed || (this.consoleWindowLoaded && Utils.isUndefined(popUp.closed))) { // Extra check for Opera
                    this.unload();
                    LogLog.debug("PopUpAppender: pop-up closed");
                    return false;
                }
                if (!this.consoleWindowLoaded && isLoaded(popUp)) {
                    this.consoleWindowLoaded = true;
                }
            }
            return this.isSupported && this.consoleWindowLoaded && !this.consoleClosed;
        };
    }


    public static addGlobalCommandLineFunction(functionName: string, commandLineFunction: (...args: any[]) => void) {
        defaultCommandLineFunctions.push([functionName, commandLineFunction]);
    }

}




// ==== TODO different ====
function dir(obj: any) {
    var maxLen = 0;
    // Obtain the length of the longest property name
    for (var p in obj) {
        maxLen = Math.max(Utils.toStr(p).length, maxLen);
    }
    // Create the nicely formatted property list
    var propList = [];
    for (p in obj) {
        var propNameStr = "  " + padWithSpaces(Utils.toStr(p), maxLen + 2);
        var propVal;
        try {
            propVal = Utils.splitIntoLines(Utils.toStr(obj[p])).join(padWithSpaces(Globals.newLine, maxLen + 6));
        } catch (ex) {
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
function getXhtml(rootNode: Node, includeRootNode?: boolean, indentation?: string, startNewLine?: boolean, preformatted?: boolean) {
    includeRootNode = (typeof includeRootNode == "undefined") ? true : !!includeRootNode;
    if (typeof indentation != "string") {
        indentation = "";
    }
    startNewLine = !!startNewLine;
    preformatted = !!preformatted;
    var xhtml;

    function isWhitespace(node: Node) {
        return ((node.nodeType == nodeTypes.TEXT_NODE) && /^[ \t\r\n]*$/.test(node.nodeValue));
    }

    function fixAttributeValue(attrValue) {
        return attrValue.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    }

    function getStyleAttributeValue(el: HTMLElement) {
        var stylePairs = el.style.cssText.split(";");
        var styleValue = "";
        for (var j = 0, len = stylePairs.length; j < len; j++) {
            var nameValueBits = stylePairs[j].split(":");
            var props = [];
            var nameVal0Trim: string;
            if ((nameVal0Trim = nameValueBits[0].trim()).length !== 0) {
                props.push(nameVal0Trim.toLowerCase() + ":" + nameValueBits[1].trim());
            }
            styleValue = props.join(";");
        }
        return styleValue;
    }

    function getNamespace(el: HTMLElement) {
        if (el.prefix) {
            return el.prefix;
        } else if (el.outerHTML) {
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
        var rootElem = <HTMLElement>rootNode;
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
                        xhtml += getXhtml(rootElem.childNodes[i], true, indentation + indentationUnit,
                            childStartNewLine, childPreformatted);
                    }
                    // Add the end tag
                    var endTag = lt + "/" + tagName + gt;
                    xhtml += childStartNewLine ? Globals.newLine + indentation + endTag : endTag;
                }
                return xhtml;
            case nodeTypes.TEXT_NODE:
                if (isWhitespace(rootElem)) {
                    xhtml = "";
                } else {
                    if (preformatted) {
                        xhtml = rootElem.nodeValue;
                    } else {
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
    } else {
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
        } else {
            if (args[0].window == args[0]) {
                win = args[0];
                message = "Command line set to run in frame '" + args[0].name + "'";
            } else {
                win = window.frames[args[0]];
                if (win) {
                    message = "Command line set to run in frame '" + args[0] + "'";
                } else {
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
            } catch (ex) {
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
        } else {
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


export = ConsoleAppender;