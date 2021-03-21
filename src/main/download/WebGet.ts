import got from "got";

export async function getJSON(url: string): Promise<Record<string, unknown>> {
  try {
    const response = await got.get(url, { cache: false, responseType: "json" });
    if (response.body !== null && typeof response.body === "object") {
      return Object.assign({}, response.body);
    }
    if (typeof response.body === "string") {
      return Object.assign({}, JSON.parse(response.body));
    }
    return {};
  } catch {
    return {};
  }
}
