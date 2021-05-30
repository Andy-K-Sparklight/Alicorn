export function mcbbsDeobf(): void {
  const IS_V3 = isV3();
  if (!IS_V3) {
    console.log("V2 UI detected.");
    // Top
    const topBarLinks = document.querySelector("#toptb > div > div.z.light");
    if (topBarLinks) {
      topBarLinks.id = "top_bar_links";
    }
    console.log("Patched ID: top_bar_links");
  } else {
    console.log("V3 UI detected.");
    // Patch debug info
    const debugInfo = document.querySelector(
      "#footer > div.uix_extendedFooter > div > div > div:nth-child(4) > div"
    );
    if (debugInfo) {
      debugInfo.id = "debuginfo";
    }
    console.log("Patched ID: debuginfo");
  }
}

export function isV3(): boolean {
  const rs = document
    .querySelector(
      "#footer > div.uix_extendedFooter > div > div > div:nth-child(4) > div > h3"
    )
    ?.innerHTML?.includes("X3.5");
  return rs === undefined ? false : rs;
}
