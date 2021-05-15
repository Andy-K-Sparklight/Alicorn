export abstract class BaseComponent {
  abstract toBBCode(): string;
}

export class StyleComponent extends BaseComponent {
  bold = false;
  underline = false;
  italic = false;
  background = "";
  foreground = "#5d2391";
  del = false;
  font = "";
  text: string;
  align: "center" | "left" | "right" | "" = "";

  constructor(text: string) {
    super();
    this.text = text;
  }

  toBBCode(): string {
    const tmpArr = [this.text];
    if (this.del) {
      tmpArr.push("[/s]");
      tmpArr.unshift("[s]");
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
    if (this.foreground) {
      tmpArr.push("[/color]");
      tmpArr.unshift(`[color=${this.foreground}]`);
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
