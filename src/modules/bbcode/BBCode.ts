abstract class BaseComponent {
    abstract toBBCode(): string;
}

export class StyleComponent extends BaseComponent {
    bold = false;
    underline = false;
    italic = false;
    background = "";
    color = "#5d2391";
    del = false;
    font = "";
    text: string;
    size = "";
    align: "center" | "left" | "right" | "" = "";

    constructor(text: string) {
        super();
        this.text = text;
    }

    make(text: string): StyleComponent {
        this.text = text;
        return this;
    }

    toBBCode(): string {
        const tmpArr = [this.text];
        if (this.del) {
            tmpArr.push("[/s]");
            tmpArr.unshift("[s]");
        }
        if (this.size) {
            tmpArr.push("[/size]");
            tmpArr.unshift(`[size=${this.size}]`);
        }
        if (this.font) {
            tmpArr.push("[/font]");
            tmpArr.unshift(`[font=${this.font}]`);
        }
        if (this.bold) {
            tmpArr.push("[/b]");
            tmpArr.unshift("[b]");
        }
        if (this.italic) {
            tmpArr.push("[/i]");
            tmpArr.unshift("[i]");
        }
        if (this.underline) {
            tmpArr.push("[/u]");
            tmpArr.unshift("[u]");
        }
        if (this.color) {
            tmpArr.push("[/color]");
            tmpArr.unshift(`[color=${this.color}]`);
        }
        if (this.background) {
            tmpArr.push("[/backcolor]");
            tmpArr.unshift(`[backcolor=${this.background}]`);
        }
        if (this.align) {
            tmpArr.push("[/align]");
            tmpArr.unshift(`[align=${this.align}]`);
        }
        return tmpArr.join("");
    }
}

export class URLComponent extends StyleComponent {
    url: string;
    display: string;

    constructor(url: string, display?: string) {
        super(url);
        this.url = url;
        this.display = display || url;
    }

    toBBCode(): string {
        const baseArr = [super.toBBCode()];
        baseArr.push("[/url]");
        baseArr.unshift(`[url=${this.url}]`);
        return baseArr.toString();
    }
}

export class CodeComponent extends StyleComponent {
    constructor(code: string) {
        super(code);
        this.font = "Courier New";
    }
}

export class Spoiler extends BaseComponent {
    child = "";

    constructor(content: string) {
        super();
        this.child = content;
    }

    toBBCode(): string {
        return `[spoiler]${this.child}[/spoiler]`;
    }
}

export class Page extends BaseComponent {
    toBBCode(): string {
        return "[page]";
    }
}

export class Index extends BaseComponent {
    entries: Map<string | number, string> = new Map();

    constructor() {
        super();
    }

    addEntry(id: string | number, name: string): void {
        this.entries.set(id, name);
    }

    toBBCode(): string {
        const a = [];
        for (const [i, n] of this.entries.entries()) {
            a.push(`[#${i}]${n}`);
        }
        a.unshift("[index]");
        a.push("[/index]");
        return a.join("");
    }
}

export class Line extends BaseComponent {
    toBBCode(): string {
        return "[img]static/image/hrline/3.gif[/img]";
    }
}

export class ComponentsGroup {
    builtStrings: string[] = [];

    db(c: BaseComponent): void {
        this.builtStrings.push(c.toBBCode());
    }

    dbRaw(s: string): void {
        this.builtStrings.push(s);
    }

    out(conj = ""): string {
        return this.builtStrings.join(conj);
    }
}

export class Box extends BaseComponent {
    content = "";
    width = "80%";
    background = "#ffe0f0";

    constructor(content: string) {
        super();
        this.content = content;
    }

    toBBCode(): string {
        return `[table=${this.width},${this.background}][tr][td]${this.content}[/td][/tr][/table]`;
    }
}
