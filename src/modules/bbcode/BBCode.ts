abstract class BaseComponent {
  abstract toBBCode(): string;
}

class StyleComponent extends BaseComponent {
  bold = false;
  underline = false;
  italic = false;
  background = "";
  foreground = "#5d2391";
  del = false;
  text: string;

  constructor(text: string) {
    super();
    this.text = text;
  }

  color(color: string): StyleComponent {
    this.foreground = color;
    return this;
  }

  toBBCode(): string {
    let tmpArr = [this.text];
    if (this.del) {
      tmpArr.push("[/s]");
      tmpArr.unshift("[s]");
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
    if (!!this.foreground) {
      tmpArr.push("[/color]");
      tmpArr.unshift(`[color=${this.foreground}]`);
    }
    if (!!this.background) {
      tmpArr.push("[/backcolor]");
      tmpArr.unshift(`[backcolor=${this.background}]`);
    }
    return tmpArr.join("");
  }
}
