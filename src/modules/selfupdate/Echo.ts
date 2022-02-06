const ECHO_ENDPOINT = "https://echo.thatrarityegmc.workers.dev/";

export function sendEcho(e: string): void {
  console.log("SEND");
  fetch(ECHO_ENDPOINT, {
    headers: {
      "X-Alicorn-Echo-Type": "SEND",
      "X-Alicorn-Echo-Text": encodeURIComponent(e.trim().slice(-100)),
    },
  })
    .then(() => {})
    .catch((e) => {
      console.log(e);
    });
}

let WEB_ECHOS: string[] = [];

export async function updateWebEchos(): Promise<void> {
  try {
    const ret = await fetch(ECHO_ENDPOINT, {
      headers: {
        "X-Alicorn-Echo-Type": "GET",
      },
    });
    if (ret.ok) {
      const dt = await ret.json();
      const keys = Object.values(dt);
      WEB_ECHOS = keys.map((s) => {
        return String(s);
      });
      localStorage.setItem("Echo.Web", JSON.stringify(WEB_ECHOS));
      console.log(`Updated echo data, ${WEB_ECHOS.length} items in all.`);
    }
  } catch {}
}

export function getEchos(): string[] {
  try {
    if (WEB_ECHOS.length > 0) {
      return WEB_ECHOS;
    }
    return (WEB_ECHOS = JSON.parse(localStorage.getItem("Echo.Web") || "[]"));
  } catch {
    return [];
  }
}
