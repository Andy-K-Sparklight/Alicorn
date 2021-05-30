import { RenderAble } from "./Component";
import { isV3 } from "./StarlightDeobf";

const VERSION = "Experimental 0.1";

export class StarlightVersion extends RenderAble {
  render(document: Document): void {
    document
      .getElementById("debuginfo")
      ?.insertAdjacentHTML("afterend", `<span>Starlight ${VERSION}</span>`);
    if (isV3()) {
      document
        .querySelector(
          "#top > div.p-body > div.uix_sidebarNav > div.uix_sidebarNav__inner.uix_stickyBodyElement > div > ul"
        )
        ?.insertAdjacentHTML(
          "beforeend",
          `<li class="uix_sidebarNavList__listItem"><div class="p-navEl"><div><a class="p-navEl-link p-navEl-link--splitMenu"><i class="fas fa-magic"></i><span>Starlight Powered</span></a></div></div></li>`
        );
    } else {
      document
        .getElementById("top_bar_links")
        ?.insertAdjacentHTML("beforeend", "<a>Starlight Powered</a>");
    }
  }
}
