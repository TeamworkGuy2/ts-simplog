import ConsoleAppender = require("./ConsoleAppender");
import PatternLayout = require("../layout/PatternLayout");

/** PopUpAppender class
 */
class PopUpAppender extends ConsoleAppender {
    public defaults = {
        layout: new PatternLayout("%d{HH:mm:ss} %-5p - %m{1}%n"),
        initiallyMinimized: false,
        focusPopUp: false,
        lazyInit: true,
        useOldPopUp: true,
        complainAboutPopUpBlocking: true,
        newestMessageAtTop: false,
        scrollToLatestMessage: true,
        width: "600",
        height: "400",
        reopenWhenClosed: false,
        maxMessages: <number><any>null,
        showCommandLine: true,
        commandLineObjectExpansionDepth: 1,
        showHideButton: false,
        showCloseButton: true,
        useDocumentWrite: true
    };
    public name = "PopUpAppender";


    constructor(lazyInit?: boolean, initiallyMinimized?: boolean, useDocumentWrite?: boolean, width?: string | number, height?: string | number, opts?: Log4Ts.AppenderOptions) {
        super(opts);

        this.create(false, null, lazyInit, initiallyMinimized, useDocumentWrite, width, height, this.defaults.focusPopUp);
    }


    public toString() {
        return this.name;
    }

}

export = PopUpAppender;