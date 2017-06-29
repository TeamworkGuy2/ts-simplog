"use strict";
var Globals = require("../log4ts/Globals");
// Utility functions
var Utils;
(function (Utils) {
    Utils.urlEncode = encodeURIComponent;
    function emptyFunction() { }
    Utils.emptyFunction = emptyFunction;
    function toStr(obj) {
        if (obj != null && obj.toString != null) {
            return obj.toString();
        }
        else {
            return String(obj);
        }
    }
    Utils.toStr = toStr;
    function isUndefined(obj) {
        return typeof obj == "undefined";
    }
    Utils.isUndefined = isUndefined;
    function bool(obj) {
        return Boolean(obj);
    }
    Utils.bool = bool;
    function trim(str) {
        return str.replace(/^\s+/, "").replace(/\s+$/, "");
    }
    Utils.trim = trim;
    function escapeNewLines(str) {
        return str.replace(/\r\n|\r|\n/g, "\\r\\n");
    }
    Utils.escapeNewLines = escapeNewLines;
    function padWithSpaces(str, len) {
        if (str.length < len) {
            var spaces = [];
            var count = Math.max(0, len - str.length);
            for (var i = 0; i < count; i++) {
                spaces[i] = " ";
            }
            str += spaces.join("");
        }
        return str;
    }
    Utils.padWithSpaces = padWithSpaces;
    function padWithZeroes(str, len) {
        while (str.length < len) {
            str = "0" + str;
        }
        return str;
    }
    Utils.padWithZeroes = padWithZeroes;
    function getExceptionMessage(ex) {
        if (ex.message) {
            return ex.message;
        }
        else if (ex.description) {
            return ex.description;
        }
        else {
            return toStr(ex);
        }
    }
    Utils.getExceptionMessage = getExceptionMessage;
    // Gets the portion of the URL after the last slash
    function getUrlFileName(url) {
        var lastSlashIndex = Math.max(url.lastIndexOf("/"), url.lastIndexOf("\\"));
        return url.substr(lastSlashIndex + 1);
    }
    Utils.getUrlFileName = getUrlFileName;
    // Returns a nicely formatted representation of an error
    function getExceptionStringRep(ex) {
        if (ex) {
            var exStr = "Exception: " + getExceptionMessage(ex);
            if (ex.lineNumber) {
                exStr += " on line number " + ex.lineNumber;
            }
            if (ex.fileName) {
                exStr += " in file " + getUrlFileName(ex.fileName);
            }
            if (Globals.showStackTraces && ex.stack) {
                exStr += Globals.newLine + "Stack trace:" + Globals.newLine + ex.stack;
            }
            return exStr;
        }
        return null;
    }
    Utils.getExceptionStringRep = getExceptionStringRep;
    // formatObjectExpansion
    function formatObjectExpansion(obj, depth, indentation) {
        var objsExpanded = [];
        function formatString(text, indentation) {
            var lines = Utils.splitIntoLines(text);
            for (var j = 1, jLen = lines.length; j < jLen; j++) {
                lines[j] = indentation + lines[j];
            }
            return lines.join(Globals.newLine);
        }
        function doFormat(obj, depth, indentation) {
            var expansion;
            if (!indentation) {
                indentation = "";
            }
            if (obj === null) {
                return "null";
            }
            else if (typeof obj == "undefined") {
                return "undefined";
            }
            else if (typeof obj == "string") {
                return formatString(obj, indentation);
            }
            else if (typeof obj == "object" && Utils.arrayContains(objsExpanded, obj)) {
                try {
                    expansion = Utils.toStr(obj);
                }
                catch (ex) {
                    expansion = "Error formatting property. Details: " + Utils.getExceptionStringRep(ex);
                }
                return expansion + " [already expanded]";
            }
            else if ((obj instanceof Array) && depth > 0) {
                objsExpanded.push(obj);
                expansion = "[" + Globals.newLine;
                var childDepth = depth - 1;
                var childIndentation = indentation + "  ";
                var childLines = [];
                for (var i = 0, len = obj.length; i < len; i++) {
                    try {
                        var childExpansion = doFormat(obj[i], childDepth, childIndentation);
                        childLines.push(childIndentation + childExpansion);
                    }
                    catch (ex) {
                        childLines.push(childIndentation + "Error formatting array member. Details: " + Utils.getExceptionStringRep(ex) + "");
                    }
                }
                expansion += childLines.join("," + Globals.newLine) + Globals.newLine + indentation + "]";
                return expansion;
            }
            else if (Object.prototype.toString.call(obj) == "[object Date]") {
                return obj.toString();
            }
            else if (typeof obj == "object" && depth > 0) {
                objsExpanded.push(obj);
                expansion = "{" + Globals.newLine;
                var childDepth = depth - 1;
                var childIndentation = indentation + "  ";
                var childLines = [];
                for (var key in obj) {
                    try {
                        var childExpansion = doFormat(obj[key], childDepth, childIndentation);
                        childLines.push(childIndentation + key + ": " + childExpansion);
                    }
                    catch (ex) {
                        childLines.push(childIndentation + key + ": Error formatting property. Details: " + Utils.getExceptionStringRep(ex));
                    }
                }
                expansion += childLines.join("," + Globals.newLine) + Globals.newLine + indentation + "}";
                return expansion;
            }
            else {
                return formatString(Utils.toStr(obj), indentation);
            }
        }
        return doFormat(obj, depth, indentation);
    }
    Utils.formatObjectExpansion = formatObjectExpansion;
    function splitIntoLines(text) {
        // Ensure all line breaks are \n only
        var text2 = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        return text2.split("\n");
    }
    Utils.splitIntoLines = splitIntoLines;
    function arrayRemove(arr, val) {
        var index = -1;
        for (var i = 0, len = arr.length; i < len; i++) {
            if (arr[i] === val) {
                index = i;
                break;
            }
        }
        if (index >= 0) {
            arr.splice(index, 1);
            return true;
        }
        else {
            return false;
        }
    }
    Utils.arrayRemove = arrayRemove;
    function arrayContains(arr, val) {
        for (var i = 0, len = arr.length; i < len; i++) {
            if (arr[i] == val) {
                return true;
            }
        }
        return false;
    }
    Utils.arrayContains = arrayContains;
    function booleanOrDefault(param, defaultValue) {
        if (isUndefined(param)) {
            return defaultValue;
        }
        else {
            return bool(param);
        }
    }
    Utils.booleanOrDefault = booleanOrDefault;
    function stringOrDefault(param, defaultValue) {
        if (isUndefined(param)) {
            return defaultValue;
        }
        else {
            return String(param);
        }
    }
    Utils.stringOrDefault = stringOrDefault;
    function intOrDefault(param, defaultValue) {
        if (isUndefined(param)) {
            return defaultValue;
        }
        else {
            var value = parseInt(param, 10);
            return isNaN(value) ? defaultValue : value;
        }
    }
    Utils.intOrDefault = intOrDefault;
    function funcOrDefault(param, defaultValue) {
        if (typeof param == "function") {
            return param;
        }
        else {
            return defaultValue;
        }
    }
    Utils.funcOrDefault = funcOrDefault;
    function isError(err) {
        return (err instanceof Error);
    }
    Utils.isError = isError;
    // TODO pulled from ts-mortar@0.6.0
    /** Modify classChild to extend classParent via prototypal inheritance.
     * Side-effect: classChild's prototype is modified.
     * @param classChild: the sub class that inherits from {@code classParent}
     * @param classParent: the super class that {@code classChild} will inherit from
     * @param allowChildToOverride: true to keep existing {@code classChild} properties, false to overwrite
     * child properties with parent properties when classParent and classChild have properties with the same name
     */
    function extend(classChild, classParent, allowChildToOverride, deepExtend) {
        if (deepExtend === void 0) { deepExtend = false; }
        if (classParent.prototype == null) {
            throw new Error(classParent + ", does not have the property '.prototype'");
        }
        var childProto = classChild.prototype;
        var newChildProto = Object.create(classParent.prototype);
        classChild.prototype = newChildProto;
        for (var key in childProto) {
            if (childProto.hasOwnProperty(key)) {
                var parentConflicts = newChildProto.hasOwnProperty(key) || (deepExtend && key in newChildProto);
                if ((parentConflicts && allowChildToOverride) || !parentConflicts) {
                    var descriptor = Object.getOwnPropertyDescriptor(childProto, key);
                    if (descriptor.get || descriptor.set) {
                        Object.defineProperty(newChildProto, key, descriptor);
                    }
                    else {
                        newChildProto[key] = childProto[key];
                    }
                }
            }
        }
        Object.defineProperty(classChild.prototype, "constructor", {
            value: classChild
        });
    }
    Utils.extend = extend;
})(Utils || (Utils = {}));
module.exports = Utils;
