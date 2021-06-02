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
      document
        .querySelector(
          "#top > div.offCanvasMenu.offCanvasMenu--nav.js-headerOffCanvasMenu.is-active > div.offCanvasMenu-content > div.sidePanel.sidePanel--nav.sidePanel--visitor > div > div > div.js-offCanvasNavTarget > ul"
        )
        ?.insertAdjacentHTML(
          "beforeend",
          `<li><div class="offCanvasMenu-linkHolder"><a class="offCanvasMenu-link"><span>Starlight Powered</span></a></div><ul class="offCanvasMenu-subList"></ul></li>`
        );
    } else {
      document
        .getElementById("top_bar_links")
        ?.insertAdjacentHTML("beforeend", "<a>Starlight Powered</a>");
    }
  }
}
