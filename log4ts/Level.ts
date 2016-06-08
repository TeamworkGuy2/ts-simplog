/** Levels
 */
class Level implements Log4Ts.Level {
    public static ALL = new Level(Number.MIN_VALUE, "ALL");
    public static TRACE = new Level(10000, "TRACE");
    public static DEBUG = new Level(20000, "DEBUG");
    public static INFO = new Level(30000, "INFO");
    public static WARN = new Level(40000, "WARN");
    public static ERROR = new Level(50000, "ERROR");
    public static FATAL = new Level(60000, "FATAL");
    public static OFF = new Level(Number.MAX_VALUE, "OFF");

    public level: number;
    public name: string;

    constructor(level: number, name: string) {
        this.level = level;
        this.name = name;
    }

    public toString() {
        return this.name;
    }

    public equals(level: Level) {
        return this.level == level.level;
    }

    public isGreaterOrEqual(level: Level) {
        return this.level >= level.level;
    }

}

export = Level;