﻿var htmlStart = [
'<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">',
'<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">',
];

var headerStart = [
'	<head>',
'		<title>log4ts</title>',
'		<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />',
'		<!-- Make IE8 behave like IE7, having gone to all the trouble of making IE work -->',
'		<meta http-equiv="X-UA-Compatible" content="IE=7" />',
'		<script type="text/javascript">',
'			var isIe = false, isIePre7 = false;',
'		</script>',
'		<!--[if IE]><script type="text/javascript">',
'			isIe = true;',
'		</script><![endif]-->',
'		<!--[if lt IE 7]><script type="text/javascript">',
'			isIePre7 = true;',
'		</script><![endif]-->',
'		<script type="text/javascript">',
'			//<![CDATA[',
];

declare var isIe: boolean;
declare var isIePre7: boolean;

function script() {
    var loggingEnabled = true;
    var logQueuedEventsTimer = null;
    var logEntries: LogEntry[] = [];
    var logEntriesAndSeparators = [];
    var logItems = [];
    var renderDelay = 100;
    var unrenderedLogItemsExist = false;
    var rootGroup = null;
    var currentGroup = null;
    var loaded = false;
    var currentLogItem = null;
    var logMainContainer: HTMLElement;

    var logLevels = ["TRACE", "DEBUG", "INFO", "WARN", "ERROR", "FATAL"];


    function copyProperties(obj, props) {
        for (var i in props) {
            obj[i] = props[i];
        }
    }


    /*----------------------------------------------------------------*/

    class LogItem {
        static serializedItemKeys = { LOG_ENTRY: 0, GROUP_START: 1, GROUP_END: 2 };

        mainContainer = null;
        wrappedContainer = null;
        unwrappedContainer = null;
        group = null;
        elementContainers: any[];
        rendered: boolean;
        unwrappedElementContainer: SeparatorElementContainer;
        wrappedElementContainer: SeparatorElementContainer;
        mainElementContainer: SeparatorElementContainer;


        constructor() {
        }


        public appendToLog() {
            for (var i = 0, len = this.elementContainers.length; i < len; i++) {
                this.elementContainers[i].appendToLog();
            }
            this.group.update();
        }

        public doRemove(doUpdate, removeFromGroup) {
            if (this.rendered) {
                for (var i = 0, len = this.elementContainers.length; i < len; i++) {
                    this.elementContainers[i].remove();
                }
                this.unwrappedElementContainer = null;
                this.wrappedElementContainer = null;
                this.mainElementContainer = null;
            }
            if (this.group && removeFromGroup) {
                this.group.removeChild(this, doUpdate);
            }
            if (this === currentLogItem) {
                currentLogItem = null;
            }
        }

        public remove(doUpdate, removeFromGroup) {
            this.doRemove(doUpdate, removeFromGroup);
        }

        public render() { }

        public accept(visitor) {
            visitor.visit(this);
        }

        public getUnwrappedDomContainer() {
            return this.group.unwrappedElementContainer.contentDiv;
        }

        public getWrappedDomContainer() {
            return this.group.wrappedElementContainer.contentDiv;
        }

        public getMainDomContainer() {
            return this.group.mainElementContainer.contentDiv;
        }
    }




    /*----------------------------------------------------------------*/

    class LogItemContainerElement {
        containerDomNode: Node;
        mainDiv: HTMLDivElement;

        constructor() {
        }

        public appendToLog() {
            var insertBeforeFirst = (newestAtTop && this.containerDomNode.hasChildNodes());
            if (insertBeforeFirst) {
                this.containerDomNode.insertBefore(this.mainDiv, this.containerDomNode.firstChild);
            } else {
                this.containerDomNode.appendChild(this.mainDiv);
            }
        }

    }




    /*----------------------------------------------------------------*/

    class SeparatorElementContainer extends LogItemContainerElement {

        constructor(containerDomNode: Node) {
            super();
            this.containerDomNode = containerDomNode;
            this.mainDiv = document.createElement("div");
            this.mainDiv.className = "separator";
            this.mainDiv.innerHTML = "&nbsp;";
        }

        public remove() {
            this.mainDiv.parentNode.removeChild(this.mainDiv);
            this.mainDiv = null;
        }

    }




    /*----------------------------------------------------------------*/

    class Separator extends LogItem {
        content: any;
        formattedMessage: any;

        constructor() {
            super();
            this.rendered = false;
        }


        public render() {
            var containerDomNode = this.group.contentDiv;
            if (isIe) {
                this.unwrappedElementContainer = new SeparatorElementContainer(this.getUnwrappedDomContainer());
                this.wrappedElementContainer = new SeparatorElementContainer(this.getWrappedDomContainer());
                this.elementContainers = [this.unwrappedElementContainer, this.wrappedElementContainer];
            } else {
                this.mainElementContainer = new SeparatorElementContainer(this.getMainDomContainer());
                this.elementContainers = [this.mainElementContainer];
            }
            this.content = this.formattedMessage;
            this.rendered = true;
        }

    }




    /*----------------------------------------------------------------*/
    interface GroupElementContainerType extends LogItemContainerElement {
        group: GroupType;
        containerDomNode: any;
        isRoot: boolean;
        isWrapped: boolean;
        expandable: boolean;
        contentDiv: HTMLElement;
        headingDiv: HTMLDivElement;
        expander: HTMLElement & { unselectable: boolean };
        expanderTextNode: Text;
    }

    function GroupElementContainer(this: GroupElementContainerType, group: GroupType, containerDomNode, isRoot, isWrapped) {
        this.group = group;
        this.containerDomNode = containerDomNode;
        this.isRoot = isRoot;
        this.isWrapped = isWrapped;
        this.expandable = false;

        if (this.isRoot) {
            if (isIe) {
                this.contentDiv = logMainContainer.appendChild(document.createElement("div"));
                this.contentDiv.id = this.isWrapped ? "log_wrapped" : "log_unwrapped";
            } else {
                this.contentDiv = logMainContainer;
            }
        } else {
            var groupElementContainer = this;

            this.mainDiv = document.createElement("div");
            this.mainDiv.className = "group";

            this.headingDiv = this.mainDiv.appendChild(document.createElement("div"));
            this.headingDiv.className = "groupheading";

            this.expander = <any>this.headingDiv.appendChild(document.createElement("span"));
            this.expander.className = "expander unselectable greyedout";
            this.expander.unselectable = true;
            var expanderText = this.group.expanded ? "-" : "+";
            this.expanderTextNode = this.expander.appendChild(document.createTextNode(expanderText));

            this.headingDiv.appendChild(document.createTextNode(" " + this.group.name));

            this.contentDiv = this.mainDiv.appendChild(document.createElement("div"));
            var contentCssClass = this.group.expanded ? "expanded" : "collapsed";
            this.contentDiv.className = "groupcontent " + contentCssClass;

            this.expander.onclick = function () {
                if (groupElementContainer.group.expandable) {
                    groupElementContainer.group.toggleExpanded();
                }
            };
        }
    }

    GroupElementContainer.prototype = new LogItemContainerElement();

    copyProperties(GroupElementContainer.prototype, {
        toggleExpanded: function toggleExpanded() {
            if (!this.isRoot) {
                var oldCssClass, newCssClass, expanderText;
                if (this.group.expanded) {
                    newCssClass = "expanded";
                    oldCssClass = "collapsed";
                    expanderText = "-";
                } else {
                    newCssClass = "collapsed";
                    oldCssClass = "expanded";
                    expanderText = "+";
                }
                replaceClass(this.contentDiv, newCssClass, oldCssClass);
                this.expanderTextNode.nodeValue = expanderText;
            }
        },

        remove: function remove() {
            if (!this.isRoot) {
                this.headingDiv = null;
                this.expander.onclick = null;
                this.expander = null;
                this.expanderTextNode = null;
                this.contentDiv = null;
                this.containerDomNode = null;
                this.mainDiv.parentNode.removeChild(this.mainDiv);
                this.mainDiv = null;
            }
        },

        reverseChildren: function reverseChildren() {
            // Invert the order of the log entries
            var node = null;

            // Remove all the log container nodes
            var childDomNodes = [];
            while ((node = this.contentDiv.firstChild)) {
                this.contentDiv.removeChild(node);
                childDomNodes.push(node);
            }

            // Put them all back in reverse order
            while ((node = childDomNodes.pop())) {
                this.contentDiv.appendChild(node);
            }
        },

        update: function update() {
            if (!this.isRoot) {
                if (this.group.expandable) {
                    removeClass(this.expander, "greyedout");
                } else {
                    addClass(this.expander, "greyedout");
                }
            }
        },

        clear: function clear() {
            if (this.isRoot) {
                this.contentDiv.innerHTML = "";
            }
        }
    });


    /*----------------------------------------------------------------*/
    type GroupTypeBase = LogItem & {
        name: string;
        group: any;
        isRoot: boolean;
        initiallyExpanded: boolean;
        elementContainers: any[];
        children: any[];
        expanded: boolean;
        rendered: boolean;
        expandable: boolean;
    };

    type GroupType = GroupTypeBase & typeof groupMethods;

    function Group(this: GroupType, name: string, isRoot: boolean, initiallyExpanded?: boolean) {
        this.name = name;
        this.group = null;
        this.isRoot = isRoot;
        this.initiallyExpanded = initiallyExpanded;
        this.elementContainers = [];
        this.children = [];
        this.expanded = initiallyExpanded;
        this.rendered = false;
        this.expandable = false;
    }

    Group.prototype = new LogItem();

    var groupMethods = {
        addChild: function addChild(this: GroupTypeBase & typeof groupMethods, logItem) {
            this.children.push(logItem);
            logItem.group = this;
        },

        render: function render(this: GroupTypeBase & typeof groupMethods) {
            if (isIe) {
                var unwrappedDomContainer, wrappedDomContainer;
                if (this.isRoot) {
                    unwrappedDomContainer = logMainContainer;
                    wrappedDomContainer = logMainContainer;
                } else {
                    unwrappedDomContainer = this.getUnwrappedDomContainer();
                    wrappedDomContainer = this.getWrappedDomContainer();
                }
                this.unwrappedElementContainer = new GroupElementContainer(this, unwrappedDomContainer, this.isRoot, false);
                this.wrappedElementContainer = new GroupElementContainer(this, wrappedDomContainer, this.isRoot, true);
                this.elementContainers = [this.unwrappedElementContainer, this.wrappedElementContainer];
            } else {
                var mainDomContainer = this.isRoot ? logMainContainer : this.getMainDomContainer();
                this.mainElementContainer = new GroupElementContainer(this, mainDomContainer, this.isRoot, false);
                this.elementContainers = [this.mainElementContainer];
            }
            this.rendered = true;
        },

        toggleExpanded: function toggleExpanded(this: GroupTypeBase & typeof groupMethods) {
            this.expanded = !this.expanded;
            for (var i = 0, len = this.elementContainers.length; i < len; i++) {
                this.elementContainers[i].toggleExpanded();
            }
        },

        expand: function expand(this: GroupTypeBase & typeof groupMethods) {
            if (!this.expanded) {
                this.toggleExpanded();
            }
        },

        accept: function accept(this: GroupTypeBase & typeof groupMethods, visitor) {
            visitor.visitGroup(this);
        },

        reverseChildren: function reverseChildren(this: GroupTypeBase & typeof groupMethods) {
            if (this.rendered) {
                for (var i = 0, len = this.elementContainers.length; i < len; i++) {
                    this.elementContainers[i].reverseChildren();
                }
            }
        },

        update: function update(this: GroupTypeBase & typeof groupMethods) {
            var previouslyExpandable = this.expandable;
            this.expandable = (this.children.length !== 0);
            if (this.expandable !== previouslyExpandable) {
                for (var i = 0, len = this.elementContainers.length; i < len; i++) {
                    this.elementContainers[i].update();
                }
            }
        },

        flatten: function flatten(this: GroupTypeBase & typeof groupMethods) {
            var visitor = new GroupFlattener();
            this.accept(visitor);
            return visitor.logEntriesAndSeparators;
        },

        removeChild: function removeChild(this: GroupTypeBase & typeof groupMethods, child, doUpdate) {
            array_remove(this.children, child);
            child.group = null;
            if (doUpdate) {
                this.update();
            }
        },

        remove: function remove(this: GroupTypeBase & typeof groupMethods, doUpdate, removeFromGroup) {
            for (var i = 0, len = this.children.length; i < len; i++) {
                this.children[i].remove(false, false);
            }
            this.children = [];
            this.update();
            if (this === currentGroup) {
                currentGroup = this.group;
            }
            this.doRemove(doUpdate, removeFromGroup);
        },

        serialize: function serialize(this: GroupTypeBase & typeof groupMethods, items) {
            items.push([LogItem.serializedItemKeys.GROUP_START, this.name]);
            for (var i = 0, len = this.children.length; i < len; i++) {
                this.children[i].serialize(items);
            }
            if (this !== currentGroup) {
                items.push([LogItem.serializedItemKeys.GROUP_END]);
            }
        },

        clear: function clear(this: GroupTypeBase & typeof groupMethods) {
            for (var i = 0, len = this.elementContainers.length; i < len; i++) {
                this.elementContainers[i].clear();
            }
        }
    };

    copyProperties(Group.prototype, groupMethods);


    /*----------------------------------------------------------------*/

    class LogEntryElementContainer extends LogItemContainerElement {
        contentElement: Element;
        formattedMessage: string;

        constructor() {
            super();
        }

        public remove() {
            this.doRemove();
        }

        public doRemove() {
            this.mainDiv.parentNode.removeChild(this.mainDiv);
            this.mainDiv = null;
            this.contentElement = null;
            this.containerDomNode = null;
        }

        public setContent(content, wrappedContent) {
            if (content === this.formattedMessage) {
                this.contentElement.innerHTML = "";
                this.contentElement.appendChild(document.createTextNode(this.formattedMessage));
            } else {
                this.contentElement.innerHTML = content;
            }
        }

        public setSearchMatch(isMatch) {
            var oldCssClass = isMatch ? "searchnonmatch" : "searchmatch";
            var newCssClass = isMatch ? "searchmatch" : "searchnonmatch";
            replaceClass(this.mainDiv, newCssClass, oldCssClass);
        }

        public clearSearch() {
            removeClass(this.mainDiv, "searchmatch");
            removeClass(this.mainDiv, "searchnonmatch");
        }
    }


    /*----------------------------------------------------------------*/

    class LogEntryWrappedElementContainer extends LogEntryElementContainer {
        logEntry: LogEntry;

        constructor(logEntry: LogEntry, containerDomNode: Element) {
            super();
            this.logEntry = logEntry;
            this.containerDomNode = containerDomNode;
            this.mainDiv = document.createElement("div");
            this.mainDiv.appendChild(document.createTextNode(this.logEntry.formattedMessage));
            this.mainDiv.className = "logentry wrapped " + this.logEntry.level;
            this.contentElement = this.mainDiv;
        }

        public setContent(content, wrappedContent) {
            if (content === this.formattedMessage) {
                this.contentElement.innerHTML = "";
                this.contentElement.appendChild(document.createTextNode(this.formattedMessage));
            } else {
                this.contentElement.innerHTML = wrappedContent;
            }
        }

    }


    /*----------------------------------------------------------------*/
    interface LogEntryUnwrappedElementContainerType extends LogEntryElementContainer {
        logEntry: LogEntry;
        containerDomNode: HTMLElement;
        mainDiv: HTMLDivElement;
        pre: HTMLElement;
    }

    function LogEntryUnwrappedElementContainer(this: LogEntryUnwrappedElementContainerType, logEntry: LogEntry, containerDomNode: HTMLElement) {
        this.logEntry = logEntry;
        this.containerDomNode = containerDomNode;
        this.mainDiv = document.createElement("div");
        this.mainDiv.className = "logentry unwrapped " + this.logEntry.level;
        this.pre = this.mainDiv.appendChild(document.createElement("pre"));
        this.pre.appendChild(document.createTextNode(this.logEntry.formattedMessage));
        this.pre.className = "unwrapped";
        this.contentElement = this.pre;
    }

    LogEntryUnwrappedElementContainer.prototype = new LogEntryElementContainer();

    LogEntryUnwrappedElementContainer.prototype.remove = function remove() {
        this.doRemove();
        this.pre = null;
    };


    /*----------------------------------------------------------------*/
    interface LogEntryMainElementContainerType extends LogEntryElementContainer {
        logEntry: LogEntry;
        containerDomNode: HTMLElement;
        mainDiv: HTMLDivElement;
        pre: HTMLElement;
    }

    function LogEntryMainElementContainer(this: LogEntryMainElementContainerType, logEntry: LogEntry, containerDomNode: HTMLElement) {
        this.logEntry = logEntry;
        this.containerDomNode = containerDomNode;
        this.mainDiv = document.createElement("div");
        this.mainDiv.className = "logentry nonielogentry " + this.logEntry.level;
        this.contentElement = this.mainDiv.appendChild(document.createElement("span"));
        this.contentElement.appendChild(document.createTextNode(this.logEntry.formattedMessage));
    }

    LogEntryMainElementContainer.prototype = new LogEntryElementContainer();


    /*----------------------------------------------------------------*/

    class LogEntry extends LogItem {
        level: string;
        formattedMessage: string;
        content: string;

        constructor(level: string, formattedMessage: string) {
            super();
            this.level = level;
            this.formattedMessage = formattedMessage;
            this.rendered = false;
        }

        public render() {
            var logEntry = this;
            var containerDomNode = this.group.contentDiv;

            // Support for the CSS attribute white-space in IE for Windows is
            // non-existent pre version 6 and slightly odd in 6, so instead
            // use two different HTML elements
            if (isIe) {
                this.formattedMessage = this.formattedMessage.replace(/\\r\\n/g, "\\r"); // Workaround for IE\'s treatment of white space
                this.unwrappedElementContainer = new LogEntryUnwrappedElementContainer(this, this.getUnwrappedDomContainer());
                this.wrappedElementContainer = new LogEntryWrappedElementContainer(this, this.getWrappedDomContainer());
                this.elementContainers = [this.unwrappedElementContainer, this.wrappedElementContainer];
            } else {
                this.mainElementContainer = new LogEntryMainElementContainer(this, this.getMainDomContainer());
                this.elementContainers = [this.mainElementContainer];
            }
            this.content = this.formattedMessage;
            this.rendered = true;
        }

        public setContent(content: string, wrappedContent) {
            if (content != this.content) {
                if (isIe && (content !== this.formattedMessage)) {
                    content = content.replace(/\\r\\n/g, "\\r"); // Workaround for IE\'s treatment of white space
                }
                for (var i = 0, len = this.elementContainers.length; i < len; i++) {
                    this.elementContainers[i].setContent(content, wrappedContent);
                }
                this.content = content;
            }
        }

        public getSearchMatches() {
            var matches = [];
            var i, len;
            if (isIe) {
                var unwrappedEls = getElementsByClass(this.unwrappedElementContainer.mainDiv, "searchterm", "span");
                var wrappedEls = getElementsByClass(this.wrappedElementContainer.mainDiv, "searchterm", "span");
                for (i = 0, len = unwrappedEls.length; i < len; i++) {
                    matches[i] = new Match(this.level, null, unwrappedEls[i], wrappedEls[i]);
                }
            } else {
                var els = getElementsByClass(this.mainElementContainer.mainDiv, "searchterm", "span");
                for (i = 0, len = els.length; i < len; i++) {
                    matches[i] = new Match(this.level, els[i]);
                }
            }
            return matches;
        }

        public setSearchMatch(isMatch) {
            for (var i = 0, len = this.elementContainers.length; i < len; i++) {
                this.elementContainers[i].setSearchMatch(isMatch);
            }
        }

        public clearSearch() {
            for (var i = 0, len = this.elementContainers.length; i < len; i++) {
                this.elementContainers[i].clearSearch();
            }
        }

        public accept(visitor) {
            visitor.visitLogEntry(this);
        }

        public serialize(items) {
            items.push([LogItem.serializedItemKeys.LOG_ENTRY, this.level, this.formattedMessage]);
        }
    }


    /*----------------------------------------------------------------*/

    function LogItemVisitor() {
    }

    LogItemVisitor.prototype = {
        visit: function visit(logItem) {
        },

        visitParent: function visitParent(logItem) {
            if (logItem.group) {
                logItem.group.accept(this);
            }
        },

        visitChildren: function visitChildren(logItem) {
            for (var i = 0, len = logItem.children.length; i < len; i++) {
                logItem.children[i].accept(this);
            }
        },

        visitLogEntry: function visitLogEntry(logEntry) {
            this.visit(logEntry);
        },

        visitSeparator: function visitSeparator(separator) {
            this.visit(separator);
        },

        visitGroup: function visitGroup(group) {
            this.visit(group);
        }
    };


    /*----------------------------------------------------------------*/
    interface GroupFlattenerType {
        logEntriesAndSeparators: any[];
    }

    function GroupFlattener(this: GroupFlattenerType) {
        this.logEntriesAndSeparators = [];
    }

    GroupFlattener.prototype = new LogItemVisitor();

    GroupFlattener.prototype.visitGroup = function visitGroup(group) {
        this.visitChildren(group);
    };

    GroupFlattener.prototype.visitLogEntry = function visitLogEntry(logEntry) {
        this.logEntriesAndSeparators.push(logEntry);
    };

    GroupFlattener.prototype.visitSeparator = function visitSeparator(separator) {
        this.logEntriesAndSeparators.push(separator);
    };


    /*----------------------------------------------------------------*/

    window.onload = function () {
        // Sort out document.domain
        if (location.search) {
            var queryBits = decodeURIComponent(location.search).substr(1).split("&"), nameValueBits;
            for (var i = 0, len = queryBits.length; i < len; i++) {
                nameValueBits = queryBits[i].split("=");
                if (nameValueBits[0] == "log4ts_domain") {
                    document.domain = nameValueBits[1];
                    break;
                }
            }
        }

        // Create DOM objects
        logMainContainer = $("log");
        if (isIePre7) {
            addClass(logMainContainer, "oldIe");
        }

        rootGroup = new Group("root", true);
        rootGroup.render();
        currentGroup = rootGroup;

        setCommandInputWidth();
        setLogContainerHeight();
        toggleLoggingEnabled();
        toggleSearchEnabled();
        toggleSearchFilter();
        toggleSearchHighlight();
        applyFilters();
        checkAllLevels();
        toggleWrap();
        toggleNewestAtTop();
        toggleScrollToLatest();
        renderQueuedLogItems();
        loaded = true;
        $("command")["value"] = "";
        $("command")["autocomplete"] = "off";
        $("command").onkeydown = function (this: HTMLInputElement, evt) {
            evt = getEvent(evt);
            if (evt.keyCode == 10 || evt.keyCode == 13) { // Return/Enter
                evalCommandLine();
                stopPropagation(evt);
            } else if (evt.keyCode == 27) { // Escape
                this.value = "";
                this.focus();
            } else if (evt.keyCode == 38 && commandHistory.length > 0) { // Up
                currentCommandIndex = Math.max(0, currentCommandIndex - 1);
                this.value = commandHistory[currentCommandIndex];
                moveCaretToEnd(this);
            } else if (evt.keyCode == 40 && commandHistory.length > 0) { // Down
                currentCommandIndex = Math.min(commandHistory.length - 1, currentCommandIndex + 1);
                this.value = commandHistory[currentCommandIndex];
                moveCaretToEnd(this);
            }
        };

        // Prevent the keypress moving the caret in Firefox
        $("command").onkeypress = function (evt) {
            evt = getEvent(evt);
            if (evt.keyCode == 38 && commandHistory.length > 0 && evt.preventDefault) { // Up
                evt.preventDefault();
            }
        };

        // Prevent the keyup event blurring the input in Opera
        $("command").onkeyup = function (evt) {
            evt = getEvent(evt);
            if (evt.keyCode == 27 && evt.preventDefault) { // Up
                evt.preventDefault();
                this.focus();
            }
        };

        // Add document keyboard shortcuts
        document.onkeydown = function keyEventHandler(evt) {
            evt = getEvent(evt);
            switch (evt.keyCode) {
                case 69: // Ctrl + shift + E: re-execute last command
                    if (evt.shiftKey && (evt.ctrlKey || evt.metaKey)) {
                        evalLastCommand();
                        cancelKeyEvent(evt);
                        return false;
                    }
                    break;
                case 75: // Ctrl + shift + K: focus search
                    if (evt.shiftKey && (evt.ctrlKey || evt.metaKey)) {
                        focusSearch();
                        cancelKeyEvent(evt);
                        return false;
                    }
                    break;
                case 40: // Ctrl + shift + down arrow: focus command line
                case 76: // Ctrl + shift + L: focus command line
                    if (evt.shiftKey && (evt.ctrlKey || evt.metaKey)) {
                        focusCommandLine();
                        cancelKeyEvent(evt);
                        return false;
                    }
                    break;
            }
        };

        // Workaround to make sure log div starts at the correct size
        setTimeout(setLogContainerHeight, 20);

        setShowCommandLine(showCommandLine);
        doSearch();
    };

    window.onunload = function () {
        if (mainWindowExists()) {
            appender.unload();
        }
        appender = null;
    };

    /*----------------------------------------------------------------*/

    var appender = null;

    var newestAtTop = false;

    function toggleLoggingEnabled() {
        setLoggingEnabled($input("enableLogging").checked);
    }

    function setLoggingEnabled(enable) {
        loggingEnabled = enable;
    }

    function setAppender(appenderParam) {
        appender = appenderParam;
    }

    function setShowCloseButton(showCloseButton) {
        $("closeButton").style.display = showCloseButton ? "inline" : "none";
    }

    function setShowHideButton(showHideButton) {
        $("hideButton").style.display = showHideButton ? "inline" : "none";
    }


    /*----------------------------------------------------------------*/

    function LogItemContentReverser() {
    }

    LogItemContentReverser.prototype = new LogItemVisitor();

    LogItemContentReverser.prototype.visitGroup = function visitGroup(group) {
        group.reverseChildren();
        this.visitChildren(group);
    };


    /*----------------------------------------------------------------*/

    var scrollToLatest = true;

    var closeIfOpenerCloses = true;

    var maxMessages: number = null;

    var showCommandLine = false;

    function setNewestAtTop(isNewestAtTop) {
        var oldNewestAtTop = newestAtTop;
        var i, iLen, j, jLen;
        newestAtTop = Boolean(isNewestAtTop);
        if (oldNewestAtTop != newestAtTop) {
            var visitor = new LogItemContentReverser();
            rootGroup.accept(visitor);

            // Reassemble the matches array
            if (currentSearch) {
                var currentMatch = currentSearch.matches[currentMatchIndex];
                var matchIndex = 0;
                var matches = [];
                var actOnLogEntry = function actOnLogEntry(logEntry) {
                    var logEntryMatches = logEntry.getSearchMatches();
                    for (j = 0, jLen = logEntryMatches.length; j < jLen; j++) {
                        matches[matchIndex] = logEntryMatches[j];
                        if (currentMatch && logEntryMatches[j].equals(currentMatch)) {
                            currentMatchIndex = matchIndex;
                        }
                        matchIndex++;
                    }
                };
                if (newestAtTop) {
                    for (i = logEntries.length - 1; i >= 0; i--) {
                        actOnLogEntry(logEntries[i]);
                    }
                } else {
                    for (i = 0, iLen = logEntries.length; i < iLen; i++) {
                        actOnLogEntry(logEntries[i]);
                    }
                }
                currentSearch.matches = matches;
                if (currentMatch) {
                    currentMatch.setCurrent();
                }
            } else if (scrollToLatest) {
                doScrollToLatest();
            }
        }
        $input("newestAtTop").checked = isNewestAtTop;
    }

    function toggleNewestAtTop() {
        var isNewestAtTop = $input("newestAtTop").checked;
        setNewestAtTop(isNewestAtTop);
    }

    function setScrollToLatest(isScrollToLatest) {
        scrollToLatest = isScrollToLatest;
        if (scrollToLatest) {
            doScrollToLatest();
        }
        $input("scrollToLatest").checked = isScrollToLatest;
    }

    function toggleScrollToLatest() {
        var isScrollToLatest = $input("scrollToLatest").checked;
        setScrollToLatest(isScrollToLatest);
    }

    function doScrollToLatest() {
        var l = logMainContainer;
        if (typeof l.scrollTop != "undefined") {
            if (newestAtTop) {
                l.scrollTop = 0;
            } else {
                var latestLogEntry = l.lastChild;
                if (latestLogEntry) {
                    l.scrollTop = l.scrollHeight;
                }
            }
        }
    }

    function setCloseIfOpenerCloses(isCloseIfOpenerCloses) {
        closeIfOpenerCloses = isCloseIfOpenerCloses;
    }

    function setMaxMessages(max: number) {
        maxMessages = max;
        pruneLogEntries();
    }

    function setShowCommandLine(isShowCommandLine) {
        showCommandLine = isShowCommandLine;
        if (loaded) {
            $("commandLine").style.display = showCommandLine ? "block" : "none";
            setCommandInputWidth();
            setLogContainerHeight();
        }
    }

    function focusCommandLine() {
        if (loaded) {
            $("command").focus();
        }
    }

    function focusSearch() {
        if (loaded) {
            $("searchBox").focus();
        }
    }

    function getLogItems() {
        var items = [];
        for (var i = 0, len = logItems.length; i < len; i++) {
            logItems[i].serialize(items);
        }
        return items;
    }

    function setLogItems(items: ([number, string, any] | [number, string])[]) {
        var loggingReallyEnabled = loggingEnabled;
        // Temporarily turn logging on
        loggingEnabled = true;
        for (var i = 0, len = items.length; i < len; i++) {
            switch (items[i][0]) {
                case LogItem.serializedItemKeys.LOG_ENTRY:
                    log(items[i][1], items[i][2]);
                    break;
                case LogItem.serializedItemKeys.GROUP_START:
                    group(items[i][1]);
                    break;
                case LogItem.serializedItemKeys.GROUP_END:
                    groupEnd();
                    break;
            }
        }
        loggingEnabled = loggingReallyEnabled;
    }

    function log(logLevel: string, formattedMessage: string) {
        if (loggingEnabled) {
            var logEntry = new LogEntry(logLevel, formattedMessage);
            logEntries.push(logEntry);
            logEntriesAndSeparators.push(logEntry);
            logItems.push(logEntry);
            currentGroup.addChild(logEntry);
            if (loaded) {
                if (logQueuedEventsTimer !== null) {
                    clearTimeout(logQueuedEventsTimer);
                }
                logQueuedEventsTimer = setTimeout(renderQueuedLogItems, renderDelay);
                unrenderedLogItemsExist = true;
            }
        }
    }

    function renderQueuedLogItems() {
        logQueuedEventsTimer = null;
        var pruned = pruneLogEntries();

        // Render any unrendered log entries and apply the current search to them
        var initiallyHasMatches = currentSearch ? currentSearch.hasMatches() : false;
        for (var i = 0, len = logItems.length; i < len; i++) {
            if (!logItems[i].rendered) {
                logItems[i].render();
                logItems[i].appendToLog();
                if (currentSearch && (logItems[i] instanceof LogEntry)) {
                    currentSearch.applyTo(logItems[i]);
                }
            }
        }
        if (currentSearch) {
            if (pruned) {
                if (currentSearch.hasVisibleMatches()) {
                    if (currentMatchIndex === null) {
                        setCurrentMatchIndex(0);
                    }
                    displayMatches();
                } else {
                    displayNoMatches();
                }
            } else if (!initiallyHasMatches && currentSearch.hasVisibleMatches()) {
                setCurrentMatchIndex(0);
                displayMatches();
            }
        }
        if (scrollToLatest) {
            doScrollToLatest();
        }
        unrenderedLogItemsExist = false;
    }

    function pruneLogEntries() {
        if ((maxMessages !== null) && (logEntriesAndSeparators.length > maxMessages)) {
            var numberToDelete = logEntriesAndSeparators.length - maxMessages;
            var prunedLogEntries = logEntriesAndSeparators.slice(0, numberToDelete);
            if (currentSearch) {
                currentSearch.removeMatches(prunedLogEntries);
            }
            var group;
            for (var i = 0; i < numberToDelete; i++) {
                group = logEntriesAndSeparators[i].group;
                array_remove(logItems, logEntriesAndSeparators[i]);
                array_remove(logEntries, logEntriesAndSeparators[i]);
                logEntriesAndSeparators[i].remove(true, true);
                if (group.children.length === 0 && group !== currentGroup && group !== rootGroup) {
                    array_remove(logItems, group);
                    group.remove(true, true);
                }
            }
            logEntriesAndSeparators = array_removeFromStart(logEntriesAndSeparators, numberToDelete);
            return true;
        }
        return false;
    }

    function group(name: string, startExpanded?: boolean) {
        if (loggingEnabled) {
            var initiallyExpanded = (typeof startExpanded === "undefined") ? true : Boolean(startExpanded);
            var newGroup = new Group(name, false, initiallyExpanded);
            currentGroup.addChild(newGroup);
            currentGroup = newGroup;
            logItems.push(newGroup);
            if (loaded) {
                if (logQueuedEventsTimer !== null) {
                    clearTimeout(logQueuedEventsTimer);
                }
                logQueuedEventsTimer = setTimeout(renderQueuedLogItems, renderDelay);
                unrenderedLogItemsExist = true;
            }
        }
    }

    function groupEnd() {
        currentGroup = (currentGroup === rootGroup) ? rootGroup : currentGroup.group;
    }

    function mainPageReloaded() {
        currentGroup = rootGroup;
        var separator = new Separator();
        logEntriesAndSeparators.push(separator);
        logItems.push(separator);
        currentGroup.addChild(separator);
    }

    function closeWindow() {
        if (appender && mainWindowExists()) {
            appender.close(true);
        } else {
            window.close();
        }
    }

    function hide() {
        if (appender && mainWindowExists()) {
            appender.hide();
        }
    }

    var mainWindow = window;
    var windowId = "log4tsConsoleWindow_" + new Date().getTime() + "_" + ("" + Math.random()).substr(2);

    function setMainWindow(win) {
        mainWindow = win;
        mainWindow[windowId] = window;
        // If this is a pop-up, poll the opener to see if it\'s closed
        if (opener && closeIfOpenerCloses) {
            pollOpener();
        }
    }

    function pollOpener() {
        if (closeIfOpenerCloses) {
            if (mainWindowExists()) {
                setTimeout(pollOpener, 500);
            } else {
                closeWindow();
            }
        }
    }

    function mainWindowExists() {
        try {
            return (mainWindow && !mainWindow.closed &&
                mainWindow[windowId] == window);
        } catch (ex) { }
        return false;
    }

    function getCheckBox(logLevel: string) {
        return $input("switch_" + logLevel);
    }

    function getIeWrappedLogContainer() {
        return $("log_wrapped");
    }

    function getIeUnwrappedLogContainer() {
        return $("log_unwrapped");
    }

    function applyFilters() {
        for (var i = 0; i < logLevels.length; i++) {
            if (getCheckBox(logLevels[i]).checked) {
                addClass(logMainContainer, logLevels[i]);
            } else {
                removeClass(logMainContainer, logLevels[i]);
            }
        }
        updateSearchFromFilters();
    }

    function toggleAllLevels() {
        var turnOn = $input("switch_ALL").checked;
        for (var i = 0; i < logLevels.length; i++) {
            getCheckBox(logLevels[i]).checked = turnOn;
            if (turnOn) {
                addClass(logMainContainer, logLevels[i]);
            } else {
                removeClass(logMainContainer, logLevels[i]);
            }
        }
    }

    function checkAllLevels() {
        for (var i = 0; i < logLevels.length; i++) {
            if (!getCheckBox(logLevels[i]).checked) {
                getCheckBox("ALL").checked = false;
                return;
            }
        }
        getCheckBox("ALL").checked = true;
    }

    function clearLog() {
        rootGroup.clear();
        currentGroup = rootGroup;
        logEntries = [];
        logItems = [];
        logEntriesAndSeparators = [];
        doSearch();
    }

    function toggleWrap() {
        var enable = $input("wrap").checked;
        if (enable) {
            addClass(logMainContainer, "wrap");
        } else {
            removeClass(logMainContainer, "wrap");
        }
        refreshCurrentMatch();
    }


    /* ------------------------------------------------------------------- */
    // Search

    var searchTimer = null;

    function scheduleSearch() {
        try {
            clearTimeout(searchTimer);
        } catch (ex) {
            // Do nothing
        }
        searchTimer = setTimeout(doSearch, 500);
    }


    interface SearchType {
        searchTerm: string;
        isRegex: boolean;
        searchRegex: RegExp;
        isCaseSensitive: boolean;
        matches: LogEntry[];
    }

    function Search(this: SearchType, searchTerm: string, isRegex: boolean, searchRegex: RegExp, isCaseSensitive: boolean) {
        this.searchTerm = searchTerm;
        this.isRegex = isRegex;
        this.searchRegex = searchRegex;
        this.isCaseSensitive = isCaseSensitive;
        this.matches = [];
    }

    Search.prototype = {
        hasMatches: function hasMatches() {
            return this.matches.length > 0;
        },

        hasVisibleMatches: function hasVisibleMatches() {
            if (this.hasMatches()) {
                for (var i = 0; i < this.matches.length; i++) {
                    if (this.matches[i].isVisible()) {
                        return true;
                    }
                }
            }
            return false;
        },

        match: function match(logEntry: LogEntry) {
            var entryText = String(logEntry.formattedMessage);
            var matchesSearch = false;
            if (this.isRegex) {
                matchesSearch = this.searchRegex.test(entryText);
            } else if (this.isCaseSensitive) {
                matchesSearch = (entryText.indexOf(this.searchTerm) > -1);
            } else {
                matchesSearch = (entryText.toLowerCase().indexOf(this.searchTerm.toLowerCase()) > -1);
            }
            return matchesSearch;
        },

        getNextVisibleMatchIndex: function getNextVisibleMatchIndex() {
            for (var i = currentMatchIndex + 1; i < this.matches.length; i++) {
                if (this.matches[i].isVisible()) {
                    return i;
                }
            }
            // Start again from the first match
            for (i = 0; i <= currentMatchIndex; i++) {
                if (this.matches[i].isVisible()) {
                    return i;
                }
            }
            return -1;
        },

        getPreviousVisibleMatchIndex: function getPreviousVisibleMatchIndex() {
            for (var i = currentMatchIndex - 1; i >= 0; i--) {
                if (this.matches[i].isVisible()) {
                    return i;
                }
            }
            // Start again from the last match
            for (var i = this.matches.length - 1; i >= currentMatchIndex; i--) {
                if (this.matches[i].isVisible()) {
                    return i;
                }
            }
            return -1;
        },

        applyTo: function applyTo(logEntry: LogEntry) {
            var doesMatch = this.match(logEntry);
            if (doesMatch) {
                logEntry.group.expand();
                logEntry.setSearchMatch(true);
                var logEntryContent: string;
                var wrappedLogEntryContent: string;
                var searchTermReplacementStartTag = "<span class=\\\"searchterm\\\">";
                var searchTermReplacementEndTag = "<" + "/span>";
                var preTagName = isIe ? "pre" : "span";
                var preStartTag = "<" + preTagName + " class=\\\"pre\\\">";
                var preEndTag = "<" + "/" + preTagName + ">";
                var startIndex = 0;
                var searchIndex: number;
                var matchedText: string;
                var textBeforeMatch: string;
                if (this.isRegex) {
                    var flags = this.isCaseSensitive ? "g" : "gi";
                    var capturingRegex = new RegExp("(" + this.searchRegex.source + ")", flags);

                    // Replace the search term with temporary tokens for the start and end tags
                    var rnd = ("" + Math.random()).substr(2);
                    var startToken = "%%s" + rnd + "%%";
                    var endToken = "%%e" + rnd + "%%";
                    logEntryContent = logEntry.formattedMessage.replace(capturingRegex, startToken + "$1" + endToken);

                    // Escape the HTML to get rid of angle brackets
                    logEntryContent = escapeHtml(logEntryContent);

                    // Substitute the proper HTML back in for the search match
                    var searchStr = logEntryContent;
                    logEntryContent = "";
                    wrappedLogEntryContent = "";
                    while ((searchIndex = searchStr.indexOf(startToken, startIndex)) > -1) {
                        var endTokenIndex = searchStr.indexOf(endToken, searchIndex);
                        matchedText = searchStr.substring(searchIndex + startToken.length, endTokenIndex);
                        textBeforeMatch = searchStr.substring(startIndex, searchIndex);
                        logEntryContent += preStartTag + textBeforeMatch + preEndTag;
                        logEntryContent += searchTermReplacementStartTag + preStartTag + matchedText +
                            preEndTag + searchTermReplacementEndTag;
                        if (isIe) {
                            wrappedLogEntryContent += textBeforeMatch + searchTermReplacementStartTag +
                                matchedText + searchTermReplacementEndTag;
                        }
                        startIndex = endTokenIndex + endToken.length;
                    }
                    logEntryContent += preStartTag + searchStr.substr(startIndex) + preEndTag;
                    if (isIe) {
                        wrappedLogEntryContent += searchStr.substr(startIndex);
                    }
                }
                else {
                    logEntryContent = "";
                    wrappedLogEntryContent = "";
                    var searchTermReplacementLength = searchTermReplacementStartTag.length +
                        this.searchTerm.length + searchTermReplacementEndTag.length;
                    var searchTermLength = this.searchTerm.length;
                    var searchTermLowerCase = this.searchTerm.toLowerCase();
                    var logTextLowerCase = logEntry.formattedMessage.toLowerCase();
                    while ((searchIndex = logTextLowerCase.indexOf(searchTermLowerCase, startIndex)) > -1) {
                        matchedText = escapeHtml(logEntry.formattedMessage.substr(searchIndex, this.searchTerm.length));
                        textBeforeMatch = escapeHtml(logEntry.formattedMessage.substring(startIndex, searchIndex));
                        var searchTermReplacement = searchTermReplacementStartTag +
                            preStartTag + matchedText + preEndTag + searchTermReplacementEndTag;
                        logEntryContent += preStartTag + textBeforeMatch + preEndTag + searchTermReplacement;
                        if (isIe) {
                            wrappedLogEntryContent += textBeforeMatch + searchTermReplacementStartTag +
                                matchedText + searchTermReplacementEndTag;
                        }
                        startIndex = searchIndex + searchTermLength;
                    }
                    var textAfterLastMatch = escapeHtml(logEntry.formattedMessage.substr(startIndex));
                    logEntryContent += preStartTag + textAfterLastMatch + preEndTag;
                    if (isIe) {
                        wrappedLogEntryContent += textAfterLastMatch;
                    }
                }
                logEntry.setContent(logEntryContent, wrappedLogEntryContent);
                var logEntryMatches = logEntry.getSearchMatches();
                this.matches = this.matches.concat(logEntryMatches);
            } else {
                logEntry.setSearchMatch(false);
                logEntry.setContent(logEntry.formattedMessage, logEntry.formattedMessage);
            }
            return doesMatch;
        },

        removeMatches: function removeMatches(logEntries) {
            var matchesToRemoveCount = 0;
            var currentMatchRemoved = false;
            var matchesToRemove = [];
            var i, iLen, j, jLen;

            // Establish the list of matches to be removed
            for (i = 0, iLen = this.matches.length; i < iLen; i++) {
                for (j = 0, jLen = logEntries.length; j < jLen; j++) {
                    if (this.matches[i].belongsTo(logEntries[j])) {
                        matchesToRemove.push(this.matches[i]);
                        if (i === currentMatchIndex) {
                            currentMatchRemoved = true;
                        }
                    }
                }
            }

            // Set the new current match index if the current match has been deleted
            // This will be the first match that appears after the first log entry being
            // deleted, if one exists; otherwise, it\'s the first match overall
            var newMatch = currentMatchRemoved ? null : this.matches[currentMatchIndex];
            if (currentMatchRemoved) {
                for (i = currentMatchIndex, iLen = this.matches.length; i < iLen; i++) {
                    if (this.matches[i].isVisible() && !array_contains(matchesToRemove, this.matches[i])) {
                        newMatch = this.matches[i];
                        break;
                    }
                }
            }

            // Remove the matches
            for (i = 0, iLen = matchesToRemove.length; i < iLen; i++) {
                array_remove(this.matches, matchesToRemove[i]);
                matchesToRemove[i].remove();
            }

            // Set the new match, if one exists
            if (this.hasVisibleMatches()) {
                if (newMatch === null) {
                    setCurrentMatchIndex(0);
                } else {
                    // Get the index of the new match
                    var newMatchIndex = 0;
                    for (i = 0, iLen = this.matches.length; i < iLen; i++) {
                        if (newMatch === this.matches[i]) {
                            newMatchIndex = i;
                            break;
                        }
                    }
                    setCurrentMatchIndex(newMatchIndex);
                }
            } else {
                currentMatchIndex = null;
                displayNoMatches();
            }
        }
    };


    function getPageOffsetTop(el: HTMLElement, container?: Element) {
        var currentEl = el;
        var y = 0;
        while (currentEl && currentEl != container) {
            y += currentEl.offsetTop;
            currentEl = <HTMLElement>currentEl.offsetParent;
        }
        return y;
    }

    function scrollIntoView(el: HTMLElement) {
        var logContainer = logMainContainer;
        // Check if the whole width of the element is visible and centre if not
        if (!$input("wrap").checked) {
            var logContainerLeft = logContainer.scrollLeft;
            var logContainerRight = logContainerLeft + logContainer.offsetWidth;
            var elLeft = el.offsetLeft;
            var elRight = elLeft + el.offsetWidth;
            if (elLeft < logContainerLeft || elRight > logContainerRight) {
                logContainer.scrollLeft = elLeft - (logContainer.offsetWidth - el.offsetWidth) / 2;
            }
        }
        // Check if the whole height of the element is visible and centre if not
        var logContainerTop = logContainer.scrollTop;
        var logContainerBottom = logContainerTop + logContainer.offsetHeight;
        var elTop = getPageOffsetTop(el) - getToolBarsHeight();
        var elBottom = elTop + el.offsetHeight;
        if (elTop < logContainerTop || elBottom > logContainerBottom) {
            logContainer.scrollTop = elTop - (logContainer.offsetHeight - el.offsetHeight) / 2;
        }
    }


    interface MatchType {
        logEntryLevel: any;
        spanInMainDiv: HTMLElement;
        spanInUnwrappedPre: HTMLElement;
        spanInWrappedDiv: HTMLElement;
        mainSpan: HTMLElement;
    }

    function Match(this: MatchType, logEntryLevel: string, spanInMainDiv: HTMLElement, spanInUnwrappedPre?: HTMLElement, spanInWrappedDiv?: HTMLElement) {
        this.logEntryLevel = logEntryLevel;
        this.spanInMainDiv = spanInMainDiv;
        if (isIe) {
            this.spanInUnwrappedPre = spanInUnwrappedPre;
            this.spanInWrappedDiv = spanInWrappedDiv;
        }
        this.mainSpan = isIe ? spanInUnwrappedPre : spanInMainDiv;
    }

    Match.prototype = {
        equals: function equals(match) {
            return this.mainSpan === match.mainSpan;
        },

        setCurrent: function setCurrent() {
            if (isIe) {
                addClass(this.spanInUnwrappedPre, "currentmatch");
                addClass(this.spanInWrappedDiv, "currentmatch");
                // Scroll the visible one into view
                var elementToScroll = $input("wrap").checked ? this.spanInWrappedDiv : this.spanInUnwrappedPre;
                scrollIntoView(elementToScroll);
            } else {
                addClass(this.spanInMainDiv, "currentmatch");
                scrollIntoView(this.spanInMainDiv);
            }
        },

        belongsTo: function belongsTo(logEntry) {
            if (isIe) {
                return isDescendant(this.spanInUnwrappedPre, logEntry.unwrappedPre);
            } else {
                return isDescendant(this.spanInMainDiv, logEntry.mainDiv);
            }
        },

        setNotCurrent: function setNotCurrent() {
            if (isIe) {
                removeClass(this.spanInUnwrappedPre, "currentmatch");
                removeClass(this.spanInWrappedDiv, "currentmatch");
            } else {
                removeClass(this.spanInMainDiv, "currentmatch");
            }
        },

        isOrphan: function isOrphan() {
            return isOrphanNode(this.mainSpan);
        },

        isVisible: function isVisible() {
            return getCheckBox(this.logEntryLevel).checked;
        },

        remove: function remove() {
            if (isIe) {
                this.spanInUnwrappedPre = null;
                this.spanInWrappedDiv = null;
            } else {
                this.spanInMainDiv = null;
            }
        }
    };


    var currentSearch = null;
    var currentMatchIndex: number = null;

    function doSearch() {
        var searchBox = $input("searchBox");
        var searchTerm = searchBox.value;
        var isRegex = $input("searchRegex").checked;
        var isCaseSensitive = $input("searchCaseSensitive").checked;
        var i;

        if (searchTerm === "") {
            $input("searchReset").disabled = true;
            $("searchNav").style.display = "none";
            removeClass(document.body, "searching");
            removeClass(searchBox, "hasmatches");
            removeClass(searchBox, "nomatches");
            for (i = 0; i < logEntries.length; i++) {
                logEntries[i].clearSearch();
                logEntries[i].setContent(logEntries[i].formattedMessage, logEntries[i].formattedMessage);
            }
            currentSearch = null;
            setLogContainerHeight();
        } else {
            $input("searchReset").disabled = false;
            $("searchNav").style.display = "block";
            var searchRegex: RegExp;
            var regexValid;
            if (isRegex) {
                try {
                    searchRegex = isCaseSensitive ? new RegExp(searchTerm, "g") : new RegExp(searchTerm, "gi");
                    regexValid = true;
                    replaceClass(searchBox, "validregex", "invalidregex");
                    searchBox.title = "Valid regex";
                } catch (ex) {
                    regexValid = false;
                    replaceClass(searchBox, "invalidregex", "validregex");
                    searchBox.title = "Invalid regex: " + (ex.message ? ex.message : (ex.description ? ex.description : "unknown error"));
                    return;
                }
            } else {
                searchBox.title = "";
                removeClass(searchBox, "validregex");
                removeClass(searchBox, "invalidregex");
            }
            addClass(document.body, "searching");
            currentSearch = new Search(searchTerm, isRegex, searchRegex, isCaseSensitive);
            for (i = 0; i < logEntries.length; i++) {
                currentSearch.applyTo(logEntries[i]);
            }
            setLogContainerHeight();

            // Highlight the first search match
            if (currentSearch.hasVisibleMatches()) {
                setCurrentMatchIndex(0);
                displayMatches();
            } else {
                displayNoMatches();
            }
        }
    }

    function updateSearchFromFilters() {
        if (currentSearch) {
            if (currentSearch.hasMatches()) {
                if (currentMatchIndex === null) {
                    currentMatchIndex = 0;
                }
                var currentMatch = currentSearch.matches[currentMatchIndex];
                if (currentMatch.isVisible()) {
                    displayMatches();
                    setCurrentMatchIndex(currentMatchIndex);
                } else {
                    currentMatch.setNotCurrent();
                    // Find the next visible match, if one exists
                    var nextVisibleMatchIndex = currentSearch.getNextVisibleMatchIndex();
                    if (nextVisibleMatchIndex > -1) {
                        setCurrentMatchIndex(nextVisibleMatchIndex);
                        displayMatches();
                    } else {
                        displayNoMatches();
                    }
                }
            } else {
                displayNoMatches();
            }
        }
    }

    function refreshCurrentMatch() {
        if (currentSearch && currentSearch.hasVisibleMatches()) {
            setCurrentMatchIndex(currentMatchIndex);
        }
    }

    function displayMatches() {
        replaceClass($("searchBox"), "hasmatches", "nomatches");
        $("searchBox").title = "" + currentSearch.matches.length + " matches found";
        $("searchNav").style.display = "block";
        setLogContainerHeight();
    }

    function displayNoMatches() {
        replaceClass($("searchBox"), "nomatches", "hasmatches");
        $("searchBox").title = "No matches found";
        $("searchNav").style.display = "none";
        setLogContainerHeight();
    }

    function toggleSearchEnabled(enable?: boolean) {
        enable = (typeof enable == "undefined") ? !$input("searchDisable").checked : enable;
        $input("searchBox").disabled = !enable;
        $input("searchReset").disabled = !enable;
        $input("searchRegex").disabled = !enable;
        $input("searchNext").disabled = !enable;
        $input("searchPrevious").disabled = !enable;
        $input("searchCaseSensitive").disabled = !enable;
        $("searchNav").style.display = (enable && ($input("searchBox").value !== "") && currentSearch && currentSearch.hasVisibleMatches()) ? "block" : "none";

        if (enable) {
            removeClass($("search"), "greyedout");
            addClass(document.body, "searching");
            if ($input("searchHighlight").checked) {
                addClass(logMainContainer, "searchhighlight");
            } else {
                removeClass(logMainContainer, "searchhighlight");
            }
            if ($input("searchFilter").checked) {
                addClass(logMainContainer, "searchfilter");
            } else {
                removeClass(logMainContainer, "searchfilter");
            }
            $input("searchDisable").checked = !enable;
        } else {
            addClass($("search"), "greyedout");
            removeClass(document.body, "searching");
            removeClass(logMainContainer, "searchhighlight");
            removeClass(logMainContainer, "searchfilter");
        }
        setLogContainerHeight();
    }

    function toggleSearchFilter() {
        var enable = $input("searchFilter").checked;
        if (enable) {
            addClass(logMainContainer, "searchfilter");
        } else {
            removeClass(logMainContainer, "searchfilter");
        }
        refreshCurrentMatch();
    }

    function toggleSearchHighlight() {
        var enable = $input("searchHighlight").checked;
        if (enable) {
            addClass(logMainContainer, "searchhighlight");
        } else {
            removeClass(logMainContainer, "searchhighlight");
        }
    }

    function clearSearch() {
        $input("searchBox").value = "";
        doSearch();
    }

    function searchNext() {
        if (currentSearch !== null && currentMatchIndex !== null) {
            currentSearch.matches[currentMatchIndex].setNotCurrent();
            var nextMatchIndex = currentSearch.getNextVisibleMatchIndex();
            if (nextMatchIndex > currentMatchIndex || confirm("Reached the end of the page. Start from the top?")) {
                setCurrentMatchIndex(nextMatchIndex);
            }
        }
    }

    function searchPrevious() {
        if (currentSearch !== null && currentMatchIndex !== null) {
            currentSearch.matches[currentMatchIndex].setNotCurrent();
            var previousMatchIndex = currentSearch.getPreviousVisibleMatchIndex();
            if (previousMatchIndex < currentMatchIndex || confirm("Reached the start of the page. Continue from the bottom?")) {
                setCurrentMatchIndex(previousMatchIndex);
            }
        }
    }

    function setCurrentMatchIndex(index: number) {
        currentMatchIndex = index;
        currentSearch.matches[currentMatchIndex].setCurrent();
    }


    /* ------------------------------------------------------------------------- */
    // CSS Utilities

    function addClass(el: Element, cssClass: string) {
        if (!hasClass(el, cssClass)) {
            if (el.className) {
                el.className += " " + cssClass;
            } else {
                el.className = cssClass;
            }
        }
    }

    function hasClass(el: Element, cssClass: string) {
        if (el.className) {
            var classNames = el.className.split(" ");
            return array_contains(classNames, cssClass);
        }
        return false;
    }

    function removeClass(el: Element, cssClass: string) {
        if (hasClass(el, cssClass)) {
            // Rebuild the className property
            var existingClasses = el.className.split(" ");
            var newClasses = [];
            for (var i = 0, len = existingClasses.length; i < len; i++) {
                if (existingClasses[i] != cssClass) {
                    newClasses[newClasses.length] = existingClasses[i];
                }
            }
            el.className = newClasses.join(" ");
        }
    }

    function replaceClass(el: Element, newCssClass: string, oldCssClass: string) {
        removeClass(el, oldCssClass);
        addClass(el, newCssClass);
    }


    /* ------------------------------------------------------------------------- */
    // Other utility functions

    function getElementsByClass<E extends Element>(el: E, cssClass: string, tagName: string) {
        var elements = <NodeListOf<E>>el.getElementsByTagName(tagName);
        var matches: E[] = [];
        for (var i = 0, len = elements.length; i < len; i++) {
            if (hasClass(elements[i], cssClass)) {
                matches.push(elements[i]);
            }
        }
        return matches;
    }

    // Syntax borrowed from Prototype library
    function $(id: string) {
        return document.getElementById(id);
    }

    var $input = <(id: string) => HTMLInputElement>$;

    function isDescendant(node: Node, ancestorNode: Node) {
        while (node != null) {
            if (node === ancestorNode) {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    }

    function isOrphanNode(node: Node) {
        var curNode = node;
        while (curNode) {
            if (curNode == document.body) {
                return false;
            }
            curNode = curNode.parentNode;
        }
        return true;
    }

    function escapeHtml(str: string) {
        return str.replace(/&/g, "&amp;").replace(/[<]/g, "&lt;").replace(/>/g, "&gt;");
    }

    function getWindowWidth() {
        if (window.innerWidth) {
            return window.innerWidth;
        } else if (document.documentElement && document.documentElement.clientWidth) {
            return document.documentElement.clientWidth;
        } else if (document.body) {
            return document.body.clientWidth;
        }
        return 0;
    }

    function getWindowHeight() {
        if (window.innerHeight) {
            return window.innerHeight;
        } else if (document.documentElement && document.documentElement.clientHeight) {
            return document.documentElement.clientHeight;
        } else if (document.body) {
            return document.body.clientHeight;
        }
        return 0;
    }

    function getToolBarsHeight() {
        return $("switches").offsetHeight;
    }

    function getChromeHeight() {
        var height = getToolBarsHeight();
        if (showCommandLine) {
            height += $("commandLine").offsetHeight;
        }
        return height;
    }

    function setLogContainerHeight() {
        if (logMainContainer) {
            var windowHeight = getWindowHeight();
            $("body").style.height = getWindowHeight() + "px";
            logMainContainer.style.height = "" +
                Math.max(0, windowHeight - getChromeHeight()) + "px";
        }
    }

    function setCommandInputWidth() {
        if (showCommandLine) {
            $("command").style.width = "" + Math.max(0, $("commandLineContainer").offsetWidth -
                ($("evaluateButton").offsetWidth + 13)) + "px";
        }
    }

    window.onresize = function () {
        setCommandInputWidth();
        setLogContainerHeight();
    };

    function getErrorMessage(ex: (string | { message: string; description: string; })) {
        if (typeof ex === "string") {
            return ex;
        }
        else if (ex.message) {
            return ex.message;
        } else if (ex.description) {
            return ex.description;
        }
        return "" + ex;
    }

    function moveCaretToEnd(input: HTMLInputElement) {
        if (input.setSelectionRange) {
            input.focus();
            var length = input.value.length;
            input.setSelectionRange(length, length);
        } else if (input["createTextRange"]) {
            var range = input["createTextRange"]();
            range.collapse(false);
            range.select();
        }
        input.focus();
    }

    function stopPropagation(evt: Event) {
        if (evt.stopPropagation) {
            evt.stopPropagation();
        } else if (typeof evt.cancelBubble != "undefined") {
            evt.cancelBubble = true;
        }
    }

    function getEvent<T extends Event>(evt: T): T {
        return evt ? evt : <T>event;
    }

    function getTarget(evt: Event) {
        return evt.target ? evt.target : evt.srcElement;
    }

    function getRelatedTarget(evt) {
        if (evt.relatedTarget) {
            return evt.relatedTarget;
        }
        else if (evt.srcElement) {
            switch (evt.type) {
                case "mouseover":
                    return evt.fromElement;
                case "mouseout":
                    return evt.toElement;
                default:
                    return evt.srcElement;
            }
        }
    }

    function cancelKeyEvent(evt) {
        evt.returnValue = false;
        stopPropagation(evt);
    }

    function evalCommandLine() {
        var expr = $input("command").value;
        evalCommand(expr);
        $input("command").value = "";
    }

    function evalLastCommand() {
        if (lastCommand != null) {
            evalCommand(lastCommand);
        }
    }

    var lastCommand: string = null;
    var commandHistory: string[] = [];
    var currentCommandIndex = 0;

    function evalCommand(expr: string) {
        if (appender) {
            appender.evalCommandAndAppend(expr);
        } else {
            var prefix = ">>> " + expr + "\\r\\n";
            try {
                log("INFO", prefix + eval(expr));
            } catch (ex) {
                log("ERROR", prefix + "Error: " + getErrorMessage(ex));
            }
        }
        // Update command history
        if (expr != commandHistory[commandHistory.length - 1]) {
            commandHistory.push(expr);
            // Update the appender
            if (appender) {
                appender.storeCommandHistory(commandHistory);
            }
        }
        currentCommandIndex = (expr == commandHistory[currentCommandIndex]) ? currentCommandIndex + 1 : commandHistory.length;
        lastCommand = expr;
    }


    function array_remove<T>(ary: T[], val: T) {
        var index = -1;
        for (var i = 0, len = ary.length; i < len; i++) {
            if (ary[i] === val) {
                index = i;
                break;
            }
        }
        if (index >= 0) {
            ary.splice(index, 1);
            return index;
        } else {
            return -1;
        }
    }

    function array_removeFromStart<T>(ary: T[], numberToRemove: number) {
        if (Array.prototype.splice) {
            ary.splice(0, numberToRemove);
        } else {
            for (var i = numberToRemove, len = ary.length; i < len; i++) {
                ary[i - numberToRemove] = ary[i];
            }
            ary.length = ary.length - numberToRemove;
        }
        return ary;
    }

    function array_contains<T>(arr: T[], val: T) {
        for (var i = 0, len = arr.length; i < len; i++) {
            if (arr[i] == val) {
                return true;
            }
        }
        return false;
    }

}

var headerEnd = [
'			//]]>',
'		</script>',
'		<style type="text/css">',
'			body {',
'				background-color: white;',
'				color: black;',
'				padding: 0;',
'				margin: 0;',
'				font-family: tahoma, verdana, arial, helvetica, sans-serif;',
'				overflow: hidden;',
'			}',
'',
'			div#switchesContainer input {',
'				margin-bottom: 0;',
'			}',
'',
'			div.toolbar {',
'				border-top: solid #ffffff 1px;',
'				border-bottom: solid #aca899 1px;',
'				background-color: #f1efe7;',
'				padding: 3px 5px;',
'				font-size: 68.75%;',
'			}',
'',
'			div.toolbar, div#search input {',
'				font-family: tahoma, verdana, arial, helvetica, sans-serif;',
'			}',
'',
'			div.toolbar input.button {',
'				padding: 0 5px;',
'				font-size: 100%;',
'			}',
'',
'			div.toolbar input.hidden {',
'				display: none;',
'			}',
'',
'			div#switches input#clearButton {',
'				margin-left: 20px;',
'			}',
'',
'			div#levels label {',
'				font-weight: bold;',
'			}',
'',
'			div#levels label, div#options label {',
'				margin-right: 5px;',
'			}',
'',
'			div#levels label#wrapLabel {',
'				font-weight: normal;',
'			}',
'',
'			div#search label {',
'				margin-right: 10px;',
'			}',
'',
'			div#search label.searchboxlabel {',
'				margin-right: 0;',
'			}',
'',
'			div#search input {',
'				font-size: 100%;',
'			}',
'',
'			div#search input.validregex {',
'				color: green;',
'			}',
'',
'			div#search input.invalidregex {',
'				color: red;',
'			}',
'',
'			div#search input.nomatches {',
'				color: white;',
'				background-color: #ff6666;',
'			}',
'',
'			div#search input.nomatches {',
'				color: white;',
'				background-color: #ff6666;',
'			}',
'',
'			div#searchNav {',
'				display: none;',
'			}',
'',
'			div#commandLine {',
'				display: none;',
'			}',
'',
'			div#commandLine input#command {',
'				font-size: 100%;',
'				font-family: Courier New, Courier;',
'			}',
'',
'			div#commandLine input#evaluateButton {',
'			}',
'',
'			*.greyedout {',
'				color: gray !important;',
'				border-color: gray !important;',
'			}',
'',
'			*.greyedout *.alwaysenabled { color: black; }',
'',
'			*.unselectable {',
'				-khtml-user-select: none;',
'				-moz-user-select: none;',
'				user-select: none;',
'			}',
'',
'			div#log {',
'				font-family: Courier New, Courier;',
'				font-size: 75%;',
'				width: 100%;',
'				overflow: auto;',
'				clear: both;',
'				position: relative;',
'			}',
'',
'			div.group {',
'				border-color: #cccccc;',
'				border-style: solid;',
'				border-width: 1px 0 1px 1px;',
'				overflow: visible;',
'			}',
'',
'			div.oldIe div.group, div.oldIe div.group *, div.oldIe *.logentry {',
'				height: 1%;',
'			}',
'',
'			div.group div.groupheading span.expander {',
'				border: solid black 1px;',
'				font-family: Courier New, Courier;',
'				font-size: 0.833em;',
'				background-color: #eeeeee;',
'				position: relative;',
'				top: -1px;',
'				color: black;',
'				padding: 0 2px;',
'				cursor: pointer;',
'				cursor: hand;',
'				height: 1%;',
'			}',
'',
'			div.group div.groupcontent {',
'				margin-left: 10px;',
'				padding-bottom: 2px;',
'				overflow: visible;',
'			}',
'',
'			div.group div.expanded {',
'				display: block;',
'			}',
'',
'			div.group div.collapsed {',
'				display: none;',
'			}',
'',
'			*.logentry {',
'				overflow: visible;',
'				display: none;',
'				white-space: pre;',
'			}',
'',
'			span.pre {',
'				white-space: pre;',
'			}',
'',
'			pre.unwrapped {',
'				display: inline !important;',
'			}',
'',
'			pre.unwrapped pre.pre, div.wrapped pre.pre {',
'				display: inline;',
'			}',
'',
'			div.wrapped pre.pre {',
'				white-space: normal;',
'			}',
'',
'			div.wrapped {',
'				display: none;',
'			}',
'',
'			body.searching *.logentry span.currentmatch {',
'				color: white !important;',
'				background-color: green !important;',
'			}',
'',
'			body.searching div.searchhighlight *.logentry span.searchterm {',
'				color: black;',
'				background-color: yellow;',
'			}',
'',
'			div.wrap *.logentry {',
'				white-space: normal !important;',
'				border-width: 0 0 1px 0;',
'				border-color: #dddddd;',
'				border-style: dotted;',
'			}',
'',
'			div.wrap #log_wrapped, #log_unwrapped {',
'				display: block;',
'			}',
'',
'			div.wrap #log_unwrapped, #log_wrapped {',
'				display: none;',
'			}',
'',
'			div.wrap *.logentry span.pre {',
'				overflow: visible;',
'				white-space: normal;',
'			}',
'',
'			div.wrap *.logentry pre.unwrapped {',
'				display: none;',
'			}',
'',
'			div.wrap *.logentry span.wrapped {',
'				display: inline;',
'			}',
'',
'			div.searchfilter *.searchnonmatch {',
'				display: none !important;',
'			}',
'',
'			div#log *.TRACE, label#label_TRACE {',
'				color: #666666;',
'			}',
'',
'			div#log *.DEBUG, label#label_DEBUG {',
'				color: green;',
'			}',
'',
'			div#log *.INFO, label#label_INFO {',
'				color: #000099;',
'			}',
'',
'			div#log *.WARN, label#label_WARN {',
'				color: #999900;',
'			}',
'',
'			div#log *.ERROR, label#label_ERROR {',
'				color: red;',
'			}',
'',
'			div#log *.FATAL, label#label_FATAL {',
'				color: #660066;',
'			}',
'',
'			div.TRACE#log *.TRACE,',
'			div.DEBUG#log *.DEBUG,',
'			div.INFO#log *.INFO,',
'			div.WARN#log *.WARN,',
'			div.ERROR#log *.ERROR,',
'			div.FATAL#log *.FATAL {',
'				display: block;',
'			}',
'',
'			div#log div.separator {',
'				background-color: #cccccc;',
'				margin: 5px 0;',
'				line-height: 1px;',
'			}',
'		</style>',
'	</head>',
];

var body = [
'	<body id="body">',
'		<div id="switchesContainer">',
'			<div id="switches">',
'				<div id="levels" class="toolbar">',
'					Filters:',
'					<input type="checkbox" id="switch_TRACE" onclick="applyFilters(); checkAllLevels()" checked="checked" title="Show/hide trace messages" /><label for="switch_TRACE" id="label_TRACE">trace</label>',
'					<input type="checkbox" id="switch_DEBUG" onclick="applyFilters(); checkAllLevels()" checked="checked" title="Show/hide debug messages" /><label for="switch_DEBUG" id="label_DEBUG">debug</label>',
'					<input type="checkbox" id="switch_INFO" onclick="applyFilters(); checkAllLevels()" checked="checked" title="Show/hide info messages" /><label for="switch_INFO" id="label_INFO">info</label>',
'					<input type="checkbox" id="switch_WARN" onclick="applyFilters(); checkAllLevels()" checked="checked" title="Show/hide warn messages" /><label for="switch_WARN" id="label_WARN">warn</label>',
'					<input type="checkbox" id="switch_ERROR" onclick="applyFilters(); checkAllLevels()" checked="checked" title="Show/hide error messages" /><label for="switch_ERROR" id="label_ERROR">error</label>',
'					<input type="checkbox" id="switch_FATAL" onclick="applyFilters(); checkAllLevels()" checked="checked" title="Show/hide fatal messages" /><label for="switch_FATAL" id="label_FATAL">fatal</label>',
'					<input type="checkbox" id="switch_ALL" onclick="toggleAllLevels(); applyFilters()" checked="checked" title="Show/hide all messages" /><label for="switch_ALL" id="label_ALL">all</label>',
'				</div>',
'				<div id="search" class="toolbar">',
'					<label for="searchBox" class="searchboxlabel">Search:</label> <input type="text" id="searchBox" onclick="toggleSearchEnabled(true)" onkeyup="scheduleSearch()" size="20" />',
'					<input type="button" id="searchReset" disabled="disabled" value="Reset" onclick="clearSearch()" class="button" title="Reset the search" />',
'					<input type="checkbox" id="searchRegex" onclick="doSearch()" title="If checked, search is treated as a regular expression" /><label for="searchRegex">Regex</label>',
'					<input type="checkbox" id="searchCaseSensitive" onclick="doSearch()" title="If checked, search is case sensitive" /><label for="searchCaseSensitive">Match case</label>',
'					<input type="checkbox" id="searchDisable" onclick="toggleSearchEnabled()" title="Enable/disable search" /><label for="searchDisable" class="alwaysenabled">Disable</label>',
'					<div id="searchNav">',
'						<input type="button" id="searchNext" disabled="disabled" value="Next" onclick="searchNext()" class="button" title="Go to the next matching log entry" />',
'						<input type="button" id="searchPrevious" disabled="disabled" value="Previous" onclick="searchPrevious()" class="button" title="Go to the previous matching log entry" />',
'						<input type="checkbox" id="searchFilter" onclick="toggleSearchFilter()" title="If checked, non-matching log entries are filtered out" /><label for="searchFilter">Filter</label>',
'						<input type="checkbox" id="searchHighlight" onclick="toggleSearchHighlight()" title="Highlight matched search terms" /><label for="searchHighlight" class="alwaysenabled">Highlight all</label>',
'					</div>',
'				</div>',
'				<div id="options" class="toolbar">',
'					Options:',
'					<input type="checkbox" id="enableLogging" onclick="toggleLoggingEnabled()" checked="checked" title="Enable/disable logging" /><label for="enableLogging" id="enableLoggingLabel">Log</label>',
'					<input type="checkbox" id="wrap" onclick="toggleWrap()" title="Enable / disable word wrap" /><label for="wrap" id="wrapLabel">Wrap</label>',
'					<input type="checkbox" id="newestAtTop" onclick="toggleNewestAtTop()" title="If checked, causes newest messages to appear at the top" /><label for="newestAtTop" id="newestAtTopLabel">Newest at the top</label>',
'					<input type="checkbox" id="scrollToLatest" onclick="toggleScrollToLatest()" checked="checked" title="If checked, window automatically scrolls to a new message when it is added" /><label for="scrollToLatest" id="scrollToLatestLabel">Scroll to latest</label>',
'					<input type="button" id="clearButton" value="Clear" onclick="clearLog()" class="button" title="Clear all log messages"  />',
'					<input type="button" id="hideButton" value="Hide" onclick="hide()" class="hidden button" title="Hide the console" />',
'					<input type="button" id="closeButton" value="Close" onclick="closeWindow()" class="hidden button" title="Close the window" />',
'				</div>',
'			</div>',
'		</div>',
'		<div id="log" class="TRACE DEBUG INFO WARN ERROR FATAL"></div>',
'		<div id="commandLine" class="toolbar">',
'			<div id="commandLineContainer">',
'				<input type="text" id="command" title="Enter a JavaScript command here and hit return or press \'Evaluate\'" />',
'				<input type="button" id="evaluateButton" value="Evaluate" class="button" title="Evaluate the command" onclick="evalCommandLine()" />',
'			</div>',
'		</div>',
'	</body>',
];

var htmlEnd = [
'</html>',
];

export = {
    scriptFunction: script,
    htmlDocString: htmlStart.concat(headerStart).concat("(" + script.toString() + "());").concat(headerEnd).concat(body).concat(htmlEnd),
};