﻿import chai = require("chai");
import mocha = require("mocha");
import Globals = require("../log4ts/Globals");
import Utils = require("../log-util/Utils");
import Appender = require("../appender/Appender");
import ConsoleAppender = require("../appender/ConsoleAppender");
import HttpPostDataLayout = require("../layout/HttpPostDataLayout");
import InPageAppender = require("../appender/InPageAppender");
import JsonLayout = require("../layout/JsonLayout");
import PopUpAppender = require("../appender/PopUpAppender");
import Level = require("../log4ts/Level");
import Log4TsRoot = require("../log4ts/Log4TsRoot");
import LogEvent = require("../log4ts/LogEvent");
import NullLayout = require("../layout/NullLayout");
import PatternLayout = require("../layout/PatternLayout");
import SimpleLayout = require("../layout/SimpleLayout");
import XmlLayout = require("../layout/XmlLayout");
import BrowserConsoleAppender = require("../appender/BrowserConsoleAppender");

var asr = chai.assert;


function array_contains<T>(arr: T[], val: T) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] == val) {
            return true;
        }
    }
    return false;
}


var logNamerParams = {
    baseName: "test",
    joiner: ".",
    counters: <number[]>[],
    usedNames: <string[]>[],
    usedLoggers: <Log4Ts.Logger[][]>[],
};

/** Create a hierarchy of loggers named in the format 'test0_1.test1_1.test2_1', then 'test0_2.test1_2.test2_2'
 * @param parts how many loggers to create
 */
function uniqueLogNamer(parts: number) {
    if (parts < 1) { throw new Error("must get a logger name with atleast 1 part"); }

    var res: Log4Ts.Logger[] = [];
    var names: string[] = [];

    for (var i = 0; i < parts; i++) {
        var levelCounter = logNamerParams.counters[i] || (logNamerParams.counters[i] = 0);
        logNamerParams.counters[i]++;
        var nameStr = logNamerParams.baseName + i + "_" + (levelCounter + 1);
        names.push(nameStr);
    }

    var fullName = names.join(logNamerParams.joiner);
    var childLogger = Log4TsRoot.defaultInst.getLogger(fullName);

    // TODO debugging
    console.log("created logger '" + fullName + "' logger=" + childLogger + ", parent=" + childLogger.parent);

    res[parts - 1] = childLogger;
    var i = parts - 1;
    while (i > 0) {
        res[i - 1] = res[i].parent;
        i--;
    }

    logNamerParams.usedNames.push(fullName);
    logNamerParams.usedLoggers.push(res);

    return res;
}


// Recursively checks that obj2's interface contains all of obj1's
// interface (functions and objects only)
function compareObjectInterface(obj1: any, obj1_name: string, obj2: any, obj2_name: string, namePrefix?: string) {
    if (!namePrefix) {
        namePrefix = "";
    }
    var obj1PropertyNames = new Array();
    for (var i in obj1) {
        if (i != "prototype" && i != "arguments") {
            obj1PropertyNames.push(i);
        }
    }
    if (obj1 && obj1.prototype && !array_contains(obj1PropertyNames, "prototype")) {
        //obj1PropertyNames.push("prototype");
    }
    for (var j = 0; j < obj1PropertyNames.length; j++) {
        var propertyName = obj1PropertyNames[j];
        if ((typeof obj1[propertyName] == "function" || typeof obj1[propertyName] == "object") && !(obj1[propertyName] instanceof Array)) {
            var propertyFullyQualifiedName = (namePrefix == "") ? propertyName : namePrefix + "." + propertyName;
            try {
                if (typeof obj2[propertyName] == "undefined") {
                    throw new Error(obj2_name + " does not contain " + propertyFullyQualifiedName + " in " + obj1_name);
                } else if (typeof obj2[propertyName] != typeof obj1[propertyName]) {
                    throw new Error(obj2_name + "'s " + propertyFullyQualifiedName + " is of the wrong type: " + typeof obj2[propertyName] + " when it is type " + typeof obj1[propertyName] + " in " + obj1_name);
                } else if (obj1[propertyName] != Function.prototype.apply) {
                    if (!compareObjectInterface(obj1[propertyName], obj1_name, obj2[propertyName], obj2_name, propertyFullyQualifiedName)) {
                        throw new Error("Interfaces don't match");
                    }
                }
            } catch (ex) {
                throw new Error("Exception while checking property name " + propertyFullyQualifiedName + " in " + obj2_name + ": " + ex.message);
            }
        }
    }
    return true;
}


// Simply tests a layout for exceptions when formatting
function testLayoutWithVariables(layout: Log4Ts.Layout, tsLogger: Log4Ts.Logger) {
    var emptyObject = {};
    var emptyArray = [];
    var emptyString = "";
    var localUndefined = emptyArray[0];
    var oneLevelObject = {
        "name": "One-level object"
    };
    var twoLevelObject = {
        "name": "Two-level object",
        "data": oneLevelObject
    };
    var threeLevelObject = {
        "name": "Three-level object",
        "data": twoLevelObject
    };
    var anArray = [
        3,
        "stuff",
        true,
        false,
        0,
        null,
        localUndefined,
        3.14,
        function (p) { return "I'm a function"; },
        [1, "things"]
    ];
    var arrayOfTestItems = [emptyObject, emptyString, emptyString, localUndefined, oneLevelObject,
        twoLevelObject, threeLevelObject, anArray];

    tsLogger.info("Testing layout " + layout);
    for (var i = 0; i < arrayOfTestItems.length; i++) {
        var testItem = arrayOfTestItems[i];
        var ex = new Error("Test error");
        var logEvent = new LogEvent(tsLogger, new Date(), Level.INFO, [testItem], null);
        tsLogger.info("Formatting", testItem, result);
        var result = layout.format(logEvent);
        // Now try with an exception
        logEvent.exception = ex;
        tsLogger.info("Formatting with exception", testItem, result);
        result = layout.format(logEvent);
    }
}


class ArrayAppender extends Appender {
    public layout = new NullLayout();
    public logMessages: any[];
    public name = "[ArrayAppender]";

    constructor(layout?: Log4Ts.Layout, opts?: Log4Ts.AppenderOptions) {
        super(opts);

        if (layout) {
            this.setLayout(layout);
        }
        this.logMessages = [];
    }

    public append(logEvent: Log4Ts.LogEvent) {
        var formattedMessage = this.getLayout().format(logEvent);
        if (this.getLayout().ignoresThrowable()) {
            formattedMessage += logEvent.getThrowableStrRep();
        }
        this.logMessages.push(formattedMessage);
    }

    public toString() {
        return this.name;
    }
}


suite("log4ts test", function log4tsTest() {
    var tslog = Log4TsRoot.defaultInst;
    var tsLogger: Log4Ts.Logger;
    var tsAppender: ArrayAppender;

    tslog.logLog.setQuietMode(true);

    beforeEach(function () {
        tsLogger = tslog.getLogger("test");
        tsLogger.removeAllAppenders();
        tsAppender = new ArrayAppender();
        tsLogger.addAppender(tsAppender);
    });

    afterEach(function () {
        tsLogger.removeAppender(tsAppender);
        tsLogger = null;
        tsAppender = null;
        tslog.resetConfiguration();
    });


    test("Disable log4javascript test", function () {
        tslog.setEnabled(false);
        tsLogger.debug("TEST");
        asr.equal(tsAppender.logMessages.length, 0);
        tslog.setEnabled(true);
    });

    test("Logger logging test", function () {
        // Should log since the default level for loggers is DEBUG and the default threshold for appenders is ALL
        tsLogger.debug("TEST");
        asr.equal(tsAppender.logMessages.length, 1);
    });

    test("Logger levels test", function () {
        var origLevel = tsLogger.getEffectiveLevel();
        tsLogger.setLevel(Level.INFO);
        tsLogger.debug("TEST");
        tsLogger.setLevel(origLevel);
        asr.equal(tsAppender.logMessages.length, 0);
    });

    test("Logger getEffectiveLevel inheritance test 1", function () {
        var [parentLogger, childLogger] = uniqueLogNamer(2);
        parentLogger.setLevel(Level.ERROR);
        asr.equal(childLogger.getEffectiveLevel(), Level.ERROR);
    });

    test("Logger getEffectiveLevel inheritance test 2", function () {
        var [grandParentLogger, parentLogger, childLogger] = uniqueLogNamer(3);
        grandParentLogger.setLevel(Level.ERROR);
        asr.equal(childLogger.getEffectiveLevel(), Level.ERROR);
    });

    test("Logger getEffectiveLevel inheritance test 3", function () {
        var [parentLogger, childLogger] = uniqueLogNamer(2);
        parentLogger.setLevel(Level.ERROR);
        childLogger.setLevel(Level.INFO);
        asr.equal(childLogger.getEffectiveLevel(), Level.INFO);
    });

    test("Logger getEffectiveLevel root inheritance test", function () {
        var rootLogger = Log4TsRoot.defaultInst.getRootLogger();
        var [g, p, childLogger] = uniqueLogNamer(3);
        rootLogger.setLevel(Level.WARN);
        asr.equal(childLogger.getEffectiveLevel().level, Level.WARN.level);
    });

    test("Logger null level test", function () {
        tsLogger.setLevel(null);
        // Should default to root logger level, which is DEBUG
        asr.equal(tsLogger.getEffectiveLevel(), Level.DEBUG);
    });

    test("Logger appender additivity test 1", function () {
        var [parentLogger, childLogger] = uniqueLogNamer(2);
        var parentLoggerAppender = new ArrayAppender();
        var childLoggerAppender = new ArrayAppender();

        parentLogger.addAppender(parentLoggerAppender);
        childLogger.addAppender(childLoggerAppender);

        parentLogger.info("Parent logger test message");
        childLogger.info("Child logger test message");

        asr.equal(parentLoggerAppender.logMessages.length, 2);
        asr.equal(childLoggerAppender.logMessages.length, 1);
    });

    test("Logger appender additivity test 2", function () {
        var [parentLogger, childLogger] = uniqueLogNamer(2);
        var parentLoggerAppender = new ArrayAppender();
        var childLoggerAppender = new ArrayAppender();

        parentLogger.addAppender(parentLoggerAppender);
        childLogger.addAppender(childLoggerAppender);

        childLogger.setAdditivity(false);

        parentLogger.info("Parent logger test message");
        childLogger.info("Child logger test message");

        asr.equal(parentLoggerAppender.logMessages.length, 1);
        asr.equal(childLoggerAppender.logMessages.length, 1);
    });

    test("Logger appender additivity test 3", function () {
        var [parentLogger, childLogger] = uniqueLogNamer(2);
        var parentLoggerAppender = new ArrayAppender();
        var childLoggerAppender = new ArrayAppender();

        parentLogger.addAppender(parentLoggerAppender);
        childLogger.addAppender(childLoggerAppender);

        childLogger.setAdditivity(false);

        parentLogger.info("Parent logger test message");
        childLogger.info("Child logger test message");

        childLogger.setAdditivity(true);

        childLogger.info("Child logger test message 2");

        asr.equal(parentLoggerAppender.logMessages.length, 2);
        asr.equal(childLoggerAppender.logMessages.length, 2);
    });

    test("Appender threshold test", function () {
        tsAppender.setThreshold(Level.INFO);
        tsLogger.debug("TEST");
        asr.equal(tsAppender.logMessages.length, 0);
    });

    test("Basic appender / layout test", function () {
        tsLogger.debug("TEST");
        asr.equal(tsAppender.logMessages[0], "TEST");
    });

    test("Appender uniqueness within logger test", function () {
        // Add the same appender to the logger for a second time
        tsLogger.addAppender(tsAppender);
        tsLogger.debug("TEST");
        asr.equal(tsAppender.logMessages.length, 1);
    });

    test("Logger remove appender test", function () {
        tsLogger.debug("TEST");
        tsLogger.removeAppender(tsAppender);
        tsLogger.debug("TEST AGAIN");
        asr.equal(tsAppender.logMessages.length, 1);
    });

    test("", function () {
        tsLogger.debug("TEST");
        tsLogger.removeAppender(tsAppender);
        tsLogger.debug("TEST AGAIN");
        asr.equal(tsAppender.logMessages.length, 1);
    });
    test("SimpleLayout format test", function () {
        var layout = new SimpleLayout();
        testLayoutWithVariables(layout, tsLogger);
    });

    test("SimpleLayout test", function () {
        tsAppender.setLayout(new SimpleLayout());
        tsLogger.debug("TEST");
        asr.equal(tsAppender.logMessages[0], "DEBUG - TEST");
    });
    test("NullLayout format test", function () {
        var layout = new NullLayout();
        testLayoutWithVariables(layout, tsLogger);
    });

    test("NullLayout test", function () {
        tsAppender.setLayout(new NullLayout());
        tsLogger.debug("TEST");
        asr.equal(tsAppender.logMessages[0], "TEST");
    });
    test("XmlLayout format test", function () {
        var layout = new XmlLayout();
        testLayoutWithVariables(layout, tsLogger);
    });

    test("XmlLayout test", function () {
        tsAppender.setLayout(new XmlLayout());
        tsLogger.debug("TEST");
        asr.match(tsAppender.logMessages[0], /^<log4ts:event logger="test" timestamp="\d+" level="DEBUG">\s*<log4ts:message><!\[CDATA\[TEST\]\]><\/log4ts:message>\s*<\/log4ts:event>\s*$/);
    });

    test("XmlLayout with exception test", function () {
        tsAppender.setLayout(new XmlLayout());
        tsLogger.debug("TEST", new Error("Test error"));
        asr.match(tsAppender.logMessages[0], /^<log4ts:event logger="test" timestamp="\d+" level="DEBUG">\s*<log4ts:message><!\[CDATA\[TEST\]\]><\/log4ts:message>\s*<log4ts:exception>\s*<!\[CDATA\[.*\]\]><\/log4ts:exception>\s*<\/log4ts:event>\s*$/);
    });


    var xmlParams: {
        date: Date;
        timeInMilliseconds: number;
        timeInSeconds: number;
        milliseconds: number;
        logEvent: LogEvent;
        layout: XmlLayout;
    } = <any>{};

    function setUpXmlLayoutMillisecondsTest() {
        xmlParams.date = new Date();
        xmlParams.timeInMilliseconds = xmlParams.date.getTime();
        xmlParams.timeInSeconds = Math.floor(xmlParams.timeInMilliseconds / 1000);
        xmlParams.milliseconds = xmlParams.date.getMilliseconds();

        xmlParams.logEvent = new LogEvent(tsLogger, xmlParams.date, Level.DEBUG, ["TEST"], null);
        xmlParams.layout = new XmlLayout();
    }

    test("XmlLayout seconds/milliseconds test 1", function () {
        setUpXmlLayoutMillisecondsTest();

        // Test default (i.e. timestamps in milliseconds) first
        var regex = new RegExp('^<log4ts:event logger="test" timestamp="' + xmlParams.timeInMilliseconds + '" level="DEBUG">\\s*<log4ts:message><!\\[CDATA\\[TEST\\]\\]></log4ts:message>\\s*</log4ts:event>\\s*$');
        asr.match(xmlParams.layout.format(xmlParams.logEvent), regex);
    });

    test("XmlLayout seconds/milliseconds test 2", function () {
        setUpXmlLayoutMillisecondsTest();

        // Change the global setting
        Log4TsRoot.defaultInst.setTimeStampsInMilliseconds(false);
        var formatted = xmlParams.layout.format(xmlParams.logEvent);
        Log4TsRoot.defaultInst.setTimeStampsInMilliseconds(true);
        var regex = new RegExp('^<log4ts:event logger="test" timestamp="' + xmlParams.timeInSeconds + '" milliseconds="' + xmlParams.milliseconds + '" level="DEBUG">\\s*<log4ts:message><!\\[CDATA\\[TEST\\]\\]></log4ts:message>\\s*</log4ts:event>\\s*$');
        asr.match(formatted, regex);
    });

    test("XmlLayout seconds/milliseconds test 3", function () {
        setUpXmlLayoutMillisecondsTest();

        // Change the layout setting
        xmlParams.layout.setTimeStampsInMilliseconds(false);
        var formatted = xmlParams.layout.format(xmlParams.logEvent);
        var regex = new RegExp('^<log4ts:event logger="test" timestamp="' + xmlParams.timeInSeconds + '" milliseconds="' + xmlParams.milliseconds + '" level="DEBUG">\\s*<log4ts:message><!\\[CDATA\\[TEST\\]\\]></log4ts:message>\\s*</log4ts:event>\\s*$');
        asr.match(formatted, regex);
    });
    test("escapeNewLines test", function () {
        var str = "1\r2\n3\n4\r\n5\r6\r\n7";
        asr.equal(Utils.escapeNewLines(str), "1\\r\\n2\\r\\n3\\r\\n4\\r\\n5\\r\\n6\\r\\n7");
    });

    test("JsonLayout format test", function () {
        var layout = new JsonLayout();
        testLayoutWithVariables(layout, tsLogger);
    });

    test("JsonLayout test", function () {
        tsAppender.setLayout(new JsonLayout());
        tsLogger.debug("TEST");
        asr.match(tsAppender.logMessages[0], /^{"logger":"test","timestamp":\d+,"level":"DEBUG","url":".*","message":"TEST"}$/);
    });

    test("JsonLayout JSON validity test", function () {
        tsAppender.setLayout(new JsonLayout());
        tsLogger.debug("TEST");
        asr.equal(JSON.parse(tsAppender.logMessages[0]).message, "TEST");
    });

    test("JsonLayout with number type message test", function () {
        tsAppender.setLayout(new JsonLayout());
        tsLogger.debug(15);
        asr.match(tsAppender.logMessages[0], /^{"logger":"test","timestamp":\d+,"level":"DEBUG","url":".*","message":15}$/);
    });

    test("JsonLayout with object type message test", function () {
        tsAppender.setLayout(new JsonLayout());
        tsLogger.debug({});
        asr.match(tsAppender.logMessages[0], /^{"logger":"test","timestamp":\d+,"level":"DEBUG","url":".*","message":"\[object Object\]"}$/);
    });

    test("JsonLayout with boolean type message test", function () {
        tsAppender.setLayout(new JsonLayout());
        tsLogger.debug(false);
        asr.match(tsAppender.logMessages[0], /^{"logger":"test","timestamp":\d+,"level":"DEBUG","url":".*","message":false}$/);
    });

    test("JsonLayout with quote test", function () {
        tsAppender.setLayout(new JsonLayout());
        tsLogger.debug("TE\"S\"T");
        asr.match(tsAppender.logMessages[0], /^{"logger":"test","timestamp":\d+,"level":"DEBUG","url":".*","message":"TE\\"S\\"T"}$/);
    });

    test("JsonLayout with exception test", function () {
        tsAppender.setLayout(new JsonLayout());
        tsLogger.debug("TEST", new Error("Test error"));
        asr.match(tsAppender.logMessages[0], /^{"logger":"test","timestamp":\d+,"level":"DEBUG","url":".*","message":"TEST","exception":.*}$/);
    });


    var jsonParams: {
        date: Date;
        timeInMilliseconds: number;
        timeInSeconds: number;
        milliseconds: number;
        logEvent: LogEvent;
        layout: JsonLayout;
    } = <any>{};

    var setUpJsonLayoutMillisecondsTest = function () {
        jsonParams.date = new Date();
        jsonParams.timeInMilliseconds = jsonParams.date.getTime();
        jsonParams.timeInSeconds = Math.floor(jsonParams.timeInMilliseconds / 1000);
        jsonParams.milliseconds = jsonParams.date.getMilliseconds();

        jsonParams.logEvent = new LogEvent(tsLogger, jsonParams.date, Level.DEBUG, ["TEST"], null);
        jsonParams.layout = new JsonLayout();
    };

    test("JsonLayout seconds/milliseconds test 1", function () {
        setUpJsonLayoutMillisecondsTest();

        // Test default (i.e. timestamps in milliseconds) first
        var regex = new RegExp('^{"logger":"test","timestamp":' + jsonParams.timeInMilliseconds + ',"level":"DEBUG","url":".*","message":"TEST"}$');
        asr.match(jsonParams.layout.format(jsonParams.logEvent), regex);
    });

    test("JsonLayout seconds/milliseconds test 2", function () {
        setUpJsonLayoutMillisecondsTest();

        // Change the global setting
        Log4TsRoot.defaultInst.setTimeStampsInMilliseconds(false);
        var formatted = jsonParams.layout.format(jsonParams.logEvent);
        Log4TsRoot.defaultInst.setTimeStampsInMilliseconds(true);
        var regex = new RegExp('^{"logger":"test","timestamp":' + jsonParams.timeInSeconds + ',"level":"DEBUG","url":".*","message":"TEST","milliseconds":' + jsonParams.milliseconds + '}$');
        asr.match(formatted, regex);
    });

    test("JsonLayout seconds/milliseconds test 3", function () {
        setUpJsonLayoutMillisecondsTest();

        // Change the layout setting
        jsonParams.layout.setTimeStampsInMilliseconds(false);
        var formatted = jsonParams.layout.format(jsonParams.logEvent);
        var regex = new RegExp('^{"logger":"test","timestamp":' + jsonParams.timeInSeconds + ',"level":"DEBUG","url":".*","message":"TEST","milliseconds":' + jsonParams.milliseconds + '}$');
        asr.match(formatted, regex);
    });
    test("HttpPostDataLayout format test", function () {
        var layout = new HttpPostDataLayout();
        testLayoutWithVariables(layout, tsLogger);
    });

    test("HttpPostDataLayout test", function () {
        tsAppender.setLayout(new HttpPostDataLayout());
        tsLogger.debug("TEST");
        asr.match(tsAppender.logMessages[0], /^logger=test&timestamp=\d+&level=DEBUG&url=.*&message=TEST$/);
    });

    test("HttpPostDataLayout URL encoding test", function () {
        tsAppender.setLayout(new HttpPostDataLayout());
        tsLogger.debug("TEST +\"1\"");
        asr.match(tsAppender.logMessages[0], /^logger=test&timestamp=\d+&level=DEBUG&url=.*&message=TEST%20%2B%221%22$/);
    });

    test("HttpPostDataLayout with exception test", function () {
        tsAppender.setLayout(new HttpPostDataLayout());
        tsLogger.debug("TEST", new Error("Test error"));
        asr.match(tsAppender.logMessages[0], /^logger=test&timestamp=\d+&level=DEBUG&url=.*&message=TEST&exception=.*$/);
    });

    (function () {
        var nwln = Globals.newLine;
        var arr = [
            null,
            undefined,
            1.2,
            "A string",
            [1, "test"],
            { a: { b: 1 } }
        ];

        test("Basic formatObjectExpansion array test (depth: 1)", function () {
            asr.equal(Utils.formatObjectExpansion(arr, 1),
                "[" + nwln +
                "  null," + nwln +
                "  undefined," + nwln +
                "  1.2," + nwln +
                "  A string," + nwln +
                "  1,test," + nwln +
                "  [object Object]" + nwln +
                "]"
            );
        });

        test("Basic formatObjectExpansion array test (depth: 2)", function () {
            asr.equal(Utils.formatObjectExpansion(arr, 2),
                "[" + nwln +
                "  null," + nwln +
                "  undefined," + nwln +
                "  1.2," + nwln +
                "  A string," + nwln +
                "  [" + nwln +
                "    1," + nwln +
                "    test" + nwln +
                "  ]," + nwln +
                "  {" + nwln +
                "    a: [object Object]" + nwln +
                "  }" + nwln +
                "]"
            );
        });

        test("formatObjectExpansion simple object test", function () {
            var obj = {
                STRING: "A string"
            };
            asr.equal(Utils.formatObjectExpansion(obj, 1),
                "{" + nwln +
                "  STRING: A string" + nwln +
                "}"
            );
        });

        test("formatObjectExpansion simple circular object test", function () {
            var obj = { a: null };
            obj.a = obj;

            asr.equal(Utils.formatObjectExpansion(obj, 2),
                "{" + nwln +
                "  a: [object Object] [already expanded]" + nwln +
                "}"
            );
        });
    })();

    /* ---------------------------------------------------------- */

    function getSampleDate() {
        var date = new Date();
        date.setFullYear(2006);
        date.setMonth(7);
        date.setDate(30);
        date.setHours(15);
        date.setMinutes(38);
        date.setSeconds(45);
        return date;
    }

    /* ---------------------------------------------------------- */

    test("String.replace test", function () {
        asr.equal("Hello world".replace(/o/g, "Z"), "HellZ wZrld");
    });

    test("PatternLayout format test", function () {
        var layout = new PatternLayout();
        testLayoutWithVariables(layout, tsLogger);
    });

    test("PatternLayout dates test", function () {
        var layout = new PatternLayout("%d %d{DATE} %d{HH:ss}");
        tsAppender.setLayout(layout);
        tsLogger.debug("TEST");
        asr.match(tsAppender.logMessages[0], /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3} \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2},\d{3} \d{2}:\d{2}$/);
    });

    test("PatternLayout modifiers test", function () {
        var layout = new PatternLayout("%m|%3m|%-3m|%6m|%-6m|%.2m|%1.2m|%6.8m|%-1.2m|%-6.8m|");
        tsAppender.setLayout(layout);
        tsLogger.debug("TEST");
        asr.equal(tsAppender.logMessages[0], "TEST|TEST|TEST|  TEST|TEST  |ST|ST|  TEST|ST|TEST  |");
    });

    test("PatternLayout conversion characters test", function () {
        var layout = new PatternLayout("%c %n %p %r literal %%");
        tsAppender.setLayout(layout);
        tsLogger.debug("TEST");
        asr.match(tsAppender.logMessages[0], /^test \s+ DEBUG \d+ literal %$/);
    });

    test("PatternLayout message test", function () {
        var layout = new PatternLayout("%m{1} %m{2}");
        tsAppender.setLayout(layout);
        var testObj = {
            strikers: {
                quick: "Marlon"
            }
        };
        tsLogger.debug(testObj);
        asr.equal("{\r\n  strikers: [object Object]\r\n} {\r\n  strikers: {\r\n    quick: Marlon\r\n  }\r\n}", tsAppender.logMessages[0]);
    });

    // Tests for exceptions when logging
    test("Logging/grouping test", function () {
        var browserConsoleAppender = new BrowserConsoleAppender(console);
        tsLogger.addAppender(browserConsoleAppender);

        // Test each level
        tsLogger.trace("TEST TRACE");
        tsLogger.debug("TEST DEBUG");
        tsLogger.info("TEST INFO");
        tsLogger.warn("TEST WARN");
        tsLogger.error("TEST ERROR");
        tsLogger.fatal("TEST FATAL");

        // Test with exception
        tsLogger.fatal("TEST FATAL", new Error("Fake error"));

        // Test multiple messages
        tsLogger.info("TEST INFO", "Second message", ["a", "b", "c"]);

        // Test groups
        tsLogger.group("TEST GROUP");
        tsLogger.info("TEST INFO");
        tsLogger.groupEnd("TEST GROUP");
        tsLogger.info("TEST INFO");

        tsLogger.removeAppender(browserConsoleAppender);
    });


    /*
        test("AjaxAppender JsonLayout single message test", function(t) {
            t.async(10000);
            // Create and add an Ajax appender
            var ajaxAppender = new log4javascript.AjaxAppender("../log4javascript.do");
            ajaxAppender.setLayout(new log4javascript.JsonLayout());
            ajaxAppender.setRequestSuccessCallback(
                function(xmlHttp) {
                    // Response comes back as JSON array of messages logged
                    var jsonResponse = xmlHttp.responseText;
                    var arr = eval(jsonResponse);
                    asr.equal(arr.length, 1);
                    asr.equal(arr[0], "TEST");
                    t.succeed();
                }
            );
            ajaxAppender.setFailCallback(
                function(msg) {
                    t.fail(msg);
                    ajaxErrorMessage = msg;
                }
            );
            tsLogger.addAppender(ajaxAppender);
            tsLogger.debug("TEST");
        });
    
        test("AjaxAppender JsonLayout batched messages test", function(t) {
            t.async(10000);
            var message1 = "TEST 1";
            var message2 = "String with \"lots of 'quotes'\" + plusses in";
            var message3 = "A non-threatening string";
            // Create and add an Ajax appender
            var ajaxAppender = new log4javascript.AjaxAppender("../log4javascript.do");
            ajaxAppender.setLayout(new log4javascript.JsonLayout());
            ajaxAppender.setBatchSize(3);
            ajaxAppender.setRequestSuccessCallback(
                function(xmlHttp) {
                    // Response comes back as JSON array of messages logged
                    var jsonResponse = xmlHttp.responseText;
                    var arr = eval(jsonResponse);
                    asr.equal(arr.length, 3);
                    asr.equal(arr[0], message1);
                    asr.equal(arr[1], message2);
                    asr.equal(arr[2], message3);
                    t.succeed();
                }
            );
            ajaxAppender.setFailCallback(
                function(msg) {
                    t.fail(msg);
                    ajaxErrorMessage = msg;
                }
            );
            tsLogger.addAppender(ajaxAppender);
            tsLogger.debug(message1);
            tsLogger.info(message2);
            tsLogger.warn(message3);
        });
    
        test("AjaxAppender HttpPostDataLayout single message test", function(t) {
            t.async(10000);
            // Create and add an Ajax appender
            var ajaxAppender = new log4javascript.AjaxAppender("../log4javascript.do");
            var testMessage = "TEST +\"1\"";
            ajaxAppender.setLayout(new log4javascript.HttpPostDataLayout());
            ajaxAppender.setRequestSuccessCallback(
                function(xmlHttp) {
                    // Response comes back as JSON array of messages logged
                    var jsonResponse = xmlHttp.responseText;
                    var arr = eval(jsonResponse);
                    asr.equal(arr.length, 1);
                    asr.equal(arr[0], testMessage);
                    t.succeed();
                }
            );
            ajaxAppender.setFailCallback(
                function(msg) {
                    t.fail(msg);
                    ajaxErrorMessage = msg;
                }
            );
            tsLogger.addAppender(ajaxAppender);
            tsLogger.debug(testMessage);
        });
    */

    function testConsoleAppender(asr: Chai.AssertStatic, done: MochaDone, appender: ConsoleAppender) {
        var windowLoaded = false;
        var domChecked = false;
        var isDone = false;

        // Set a timeout to allow the pop-up to appear
        function onLoadHandler() {
            Log4TsRoot.defaultInst.logLog.debug("onLoadHandler");
            windowLoaded = true;

            var win = appender.getConsoleWindow();

            if (win && win.loaded) {
                // Check that the log container element contains the log message. Since
                // the console window waits 100 milliseconds before actually rendering the
                // message as a DOM element, we need to use a timer
                var checkDom = function () {
                    Log4TsRoot.defaultInst.logLog.debug("checkDom");
                    domChecked = true;
                    var logContainer = win.logMainContainer;
                    if (logContainer.hasChildNodes()) {
                        if (logContainer.innerHTML.indexOf("TEST MESSAGE") == -1) {
                            appender.close();
                            asr.ifError("Log message not correctly logged (log container innerHTML: " + logContainer.innerHTML + ")");
                        } else {
                            asr.ok(appender.isVisible());
                            appender.close();
                            asr.ok(!appender.isVisible());
                        }
                    } else {
                        appender.close();
                        asr.ifError("Console has no log messages");
                    }
                    isDone = true;
                    done();
                };
                setTimeout(checkDom, 50);
            }
            else {
                appender.close();
                asr.ifError("Console mistakenly raised load event");
                isDone = true;
                done();
            }
        }

        Log4TsRoot.defaultInst.logLog.eventHandler.addEventListener("load", onLoadHandler);
        tsLogger.addAppender(appender);
        tsLogger.debug("TEST MESSAGE");

        setTimeout(function () {
            // TODO debugging
            console.log("debugging setDocumentReady()");

            Log4TsRoot.defaultInst.setDocumentReady();
        }, 30);

        setTimeout(function () {
            if (!isDone) { asr.ifError("async setDocumentReady() load event never ran"); }
            Log4TsRoot.defaultInst.logLog.eventHandler.removeEventListener("load", onLoadHandler);
            done();
        }, 100);
    };


    /*
    test("InlineAppender async test", function (done) {
        var inlineAppender = new InPageAppender();
        inlineAppender.setInitiallyMinimized(false);
        inlineAppender.setNewestMessageAtTop(false);
        inlineAppender.setScrollToLatestMessage(true);
        inlineAppender.setWidth(600);
        inlineAppender.setHeight(200);

        testConsoleAppender(asr, done, inlineAppender);
    });

    test("InPageAppender with separate console HTML file async test", function (done) {
        var inPageAppender = new InPageAppender();
        inPageAppender.setInitiallyMinimized(false);
        inPageAppender.setNewestMessageAtTop(false);
        inPageAppender.setScrollToLatestMessage(true);
        inPageAppender.setUseDocumentWrite(false);
        inPageAppender.setWidth(600);
        inPageAppender.setHeight(200);

        testConsoleAppender(asr, done, inPageAppender);
    });

    test("PopUpAppender async test", function (done) {
        var popUpAppender = new PopUpAppender();
        popUpAppender.setFocusPopUp(true);
        popUpAppender.setUseOldPopUp(false);
        popUpAppender.setNewestMessageAtTop(false);
        popUpAppender.setScrollToLatestMessage(true);
        popUpAppender.setComplainAboutPopUpBlocking(false);
        popUpAppender.setWidth(600);
        popUpAppender.setHeight(200);

        testConsoleAppender(asr, done, popUpAppender);
    });

    test("PopUpAppender with separate console HTML file async test", function (done) {
        var popUpAppender = new PopUpAppender();
        popUpAppender.setFocusPopUp(true);
        popUpAppender.setUseOldPopUp(false);
        popUpAppender.setNewestMessageAtTop(false);
        popUpAppender.setScrollToLatestMessage(true);
        popUpAppender.setComplainAboutPopUpBlocking(false);
        popUpAppender.setUseDocumentWrite(false);
        popUpAppender.setWidth(600);
        popUpAppender.setHeight(200);

        testConsoleAppender(asr, done, popUpAppender);
    });
    */
});