import ConsoleAppender = require("./ConsoleAppender");
import PatternLayout = require("../layout/PatternLayout");

/** InPageAppender class
*/
class InPageAppender extends ConsoleAppender {
    public defaults = {
        layout: new PatternLayout("%d{HH:mm:ss} %-5p - %m{1}%n"),
        initiallyMinimized: false,
        lazyInit: true,
        newestMessageAtTop: false,
        scrollToLatestMessage: true,
        width: "100%",
        height: "220px",
        maxMessages: null,
        showCommandLine: true,
        commandLineObjectExpansionDepth: 1,
        showHideButton: false,
        showCloseButton: false,
        showLogEntryDeleteButtons: true,
        useDocumentWrite: true
    };


    constructor(container?: string | Node, lazyInit?: boolean, initiallyMinimized?: boolean, useDocumentWrite?: boolean, width?: string | number, height?: string | number) {
        super();

        this.create(true, container, lazyInit, initiallyMinimized, useDocumentWrite, width, height, false);
    }


    public toString() {
        return "InPageAppender";
    }

}

export = InPageAppender;