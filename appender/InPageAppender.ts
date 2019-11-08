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
        maxMessages: <number><any>null,
        showCommandLine: true,
        showHideButton: false,
        showCloseButton: false,
        showLogEntryDeleteButtons: true,
    };
    public name = "InPageAppender";


    constructor(container?: string | Node, lazyInit?: boolean, initiallyMinimized?: boolean, width?: string | number, height?: string | number, opts?: Log4Ts.AppenderOptions) {
        super(opts);

        this.create(true, container, lazyInit, initiallyMinimized, width, height, false);
    }


    public toString() {
        return this.name;
    }

}

export = InPageAppender;