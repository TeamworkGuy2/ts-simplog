TypeScript Simple Log
==============

Based on [log4javascript@1.4.13](http://log4javascript.org/)
Sometimes you just want to log something, you want a simple static logging object with methods like log(), error(), and debug() and you want to customize how those messages are logged later. 
You want to write your own AJAX, HTML, or `localStorage` output formatter for your logging. 
And you want the library to be small and easy to customize.

I can't guarantee this will fit everyone's needs, but take a look at the API and example and decide for yourself.
```ts
import Level = require(".../path-to/ts-simplog/log4ts/Level");
import Log4TsRoot = require(".../path-to/ts-simplog/log4ts/Log4TsRoot");
import BrowserConsoleAppender = require(".../path-to/ts-simplog/appender/BrowserConsoleAppender");
import LocalStoreAppender = require(".../path-to/ts-simplog/appender/LocalStoreAppender");
// from dependency https://github.com/TeamworkGuy2/ts-local-storage-manager
import LocalStorageStore = require("ts-local-storage-manager/local-store/LocalStorageStore");
import LocalStoreByTimestamp = require("ts-local-storage-manager/local-store/LocalStoreByTimestamp");

function createLogger(name: string, console: Console) {
    // local storage wrapper for LocalStoreAppender
    var localStoreInst = LocalStoreByTimestamp.newTimestampInst(
            LocalStorageStore.newTimestampInst(window.localStorage));

    var logOptions: Log4Ts.LoggerOptions = {
        logOriginalLoggerName: false,
        logOutputLoggerName: false,
    };
    var log = Log4TsRoot.defaultInst.getLogger(name, logOptions);

    // add appenders to process logged messages, without appenders a logger does nothing
    log.addAppender(new BrowserConsoleAppender(console, null/*name*/, { doLogName: false }));
    log.addAppender(new LocalStoreAppender(localStoreInst, null/*name*/, true, { doLogName: false }));
    return log;
}

var logger = createLogger("my-app", window.console);
try {
    logger.info("Houston, we have logging!");

    logger.log(Level.DEBUG, "Any level you want");
} catch(err) {
    logger.error("operation failed", err);
}
```