import Appender = require("./Appender");
import Level = require("../log4ts/Level");
import NullLayout = require("../layout/NullLayout");

/** An {@link Appender} that appends to a {@link UniqueStoreI}.
 * With the option to consolidate events from a {@code #group(String) groups} into single log entries
 * @author TeamworkGuy2
 * @since 2016-6-4
 */
class LocalStoreAppender extends Appender {
    private store: { addItem(value: any, plainString?: boolean): string };
    private mergeGroups: boolean;
    private groupNames: string[] = [];
    private groupEvents: any[][] = [];
    public customName: string;
    public name = "LocalStoreAppender";


    constructor(store: { addItem(value: any, plainString?: boolean): string }, name = "LocalStoreAppender", mergeGroupEvents = false, opts?: Log4Ts.AppenderOptions) {
        super(opts);
        this.layout = new NullLayout();
        this.threshold = Level.INFO;
        this.store = store;
        this.mergeGroups = mergeGroupEvents;
        this.customName = name;
    }


    public append(logEvent: Log4Ts.LogEvent) {
        var msgs = logEvent.messages && logEvent.messages.length === 1 ? logEvent.messages[0] : logEvent.messages;

        if (this.groupNames.length > 0 && this.mergeGroups === true) {
            this.groupEvents[this.groupEvents.length - 1].push(msgs);
        }
        else {
            var value = JSON.stringify(msgs);
            this.store.addItem(value, true);
        }
    }


    public group(name: string) {
        this.groupNames.push(name);
        this.groupEvents.push([]);
    }


    public groupEnd() {
        if (this.mergeGroups === true) {
            var groupName = this.groupNames[this.groupNames.length - 1];
            var groupEvents = this.groupEvents[this.groupEvents.length - 1];
            // consolidate multiple log events from a group into a single object
            this.store.addItem(JSON.stringify({
                group: groupName,
                events: groupEvents
            }), true);
        }

        this.groupNames.pop();
        this.groupEvents.pop();
    }


    public toString() {
        return this.customName;
    }

}

export = LocalStoreAppender;