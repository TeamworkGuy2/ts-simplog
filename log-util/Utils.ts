import Globals = require("../log4ts/Globals");

// Utility functions

module Utils {

    export var urlEncode = encodeURIComponent;


    export function emptyFunction() { }


    export function toStr(obj: any): string {
        if (obj && obj.toString) {
            return obj.toString();
        } else {
            return String(obj);
        }
    }


    export function isUndefined(obj: any) {
        return typeof obj == "undefined";
    }


    export function bool(obj: any) {
        return Boolean(obj);
    }


    export function trim(str: string) {
        return str.replace(/^\s+/, "").replace(/\s+$/, "");
    }


    export function escapeNewLines(str: string) {
        return str.replace(/\r\n|\r|\n/g, "\\r\\n");
    }


    export function padWithSpaces(str: string, len: number) {
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


    export function padWithZeroes(str: string, len: number) {
        while (str.length < len) {
            str = "0" + str;
        }
        return str;
    }


    export function getExceptionMessage(ex: { message?: string; description?: string; }) {
        if (ex.message) {
            return ex.message;
        } else if (ex.description) {
            return ex.description;
        } else {
            return toStr(ex);
        }
    }


    // Gets the portion of the URL after the last slash
    export function getUrlFileName(url: string) {
        var lastSlashIndex = Math.max(url.lastIndexOf("/"), url.lastIndexOf("\\"));
        return url.substr(lastSlashIndex + 1);
    }


    // Returns a nicely formatted representation of an error
    export function getExceptionStringRep(ex: { message?: string; description?: string; lineNumber?: string | number; fileName?: string; stack?: string; }) {
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


    // formatObjectExpansion
    export function formatObjectExpansion(obj: any, depth: number, indentation?: string) {
        var objsExpanded = [];

        function formatString(text: string, indentation: string) {
            var lines = Utils.splitIntoLines(text);
            for (var j = 1, jLen = lines.length; j < jLen; j++) {
                lines[j] = indentation + lines[j];
            }
            return lines.join(Globals.newLine);
        }

        function doFormat(obj: any, depth: number, indentation?: string): string {
            var expansion: string;

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
                } catch (ex) {
                    expansion = "Error formatting property. Details: " + Utils.getExceptionStringRep(ex);
                }
                return expansion + " [already expanded]";
            }
            else if ((obj instanceof Array) && depth > 0) {
                objsExpanded.push(obj);
                expansion = "[" + Globals.newLine;
                var childDepth = depth - 1;
                var childIndentation = indentation + "  ";
                var childLines: string[] = [];
                for (var i = 0, len = obj.length; i < len; i++) {
                    try {
                        var childExpansion = doFormat(obj[i], childDepth, childIndentation);
                        childLines.push(childIndentation + childExpansion);
                    } catch (ex) {
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
                var childLines: string[] = [];
                for (var key in obj) {
                    try {
                        var childExpansion = doFormat(obj[key], childDepth, childIndentation);
                        childLines.push(childIndentation + key + ": " + childExpansion);
                    } catch (ex) {
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


    export function splitIntoLines(text: string) {
        // Ensure all line breaks are \n only
        var text2 = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        return text2.split("\n");
    }


    export function arrayRemove<T>(arr: T[], val: T): boolean {
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
        } else {
            return false;
        }
    }


    export function arrayContains<T>(arr: T[], val: T): boolean {
        for (var i = 0, len = arr.length; i < len; i++) {
            if (arr[i] == val) {
                return true;
            }
        }
        return false;
    }


    export function booleanOrDefault(param, defaultValue) {
        if (isUndefined(param)) {
            return defaultValue;
        } else {
            return bool(param);
        }
    }


    export function stringOrDefault(param, defaultValue) {
        if (isUndefined(param)) {
            return defaultValue;
        } else {
            return String(param);
        }
    }


    export function intOrDefault(param, defaultValue) {
        if (isUndefined(param)) {
            return defaultValue;
        } else {
            var value = parseInt(param, 10);
            return isNaN(value) ? defaultValue : value;
        }
    }


    export function funcOrDefault(param, defaultValue) {
        if (typeof param == "function") {
            return param;
        } else {
            return defaultValue;
        }
    }


    export function isError(err: Error | any) {
        return (err instanceof Error);
    }


    // TODO pulled from ts-mortar@0.6.0
    /** Modify classChild to extend classParent via prototypal inheritance.
     * Side-effect: classChild's prototype is modified.
     * @param classChild: the sub class that inherits from {@code classParent}
     * @param classParent: the super class that {@code classChild} will inherit from
     * @param allowChildToOverride: true to keep existing {@code classChild} properties, false to overwrite
     * child properties with parent properties when classParent and classChild have properties with the same name
     */
    export function extend(classChild: any, classParent: any, allowChildToOverride: boolean, deepExtend: boolean = false): void {
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

}

export = Utils;