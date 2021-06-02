import { Executor } from "./Component";
import { isV3 } from "./StarlightDeobf";

export class PageSwitchFix extends Executor {
  execute(document: Document): void {
    if (isV3()) {
      // Remove those nodes and regenerate them
      const pageSelectors = document.querySelectorAll("div.page-selector");
      for (const p of pageSelectors) {
        const oldInnerHTML = p.innerHTML;
        p.innerHTML = "";
        setTimeout(() => {
          p.innerHTML = oldInnerHTML;
          document.querySelectorAll("a.page-switch-btn").forEach((v) => {
            v.addEventListener("click", () => {
              const cURL = new URL(window.location.href);
              cURL.searchParams.set("page", v.getAttribute("data-page") || "1");
              window.location.href = cURL.toString();
            });
          });
        }, 0);
      }
    }
  }
}
