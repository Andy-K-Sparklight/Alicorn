import os from "os";

// UNCHECKED

// Read properties from '%JAVA_HOME%/release'
export function loadProperties(str: string): Map<string, string> {
  const tMap = new Map<string, string>();
  const all = str.split(os.EOL);
  for (const x of all) {
    const ent = x.trim();
    if (ent !== "") {
      const spGroup = ent.split("=");
      let tValue = spGroup[1] || "";
      if (tValue.startsWith('"')) {
        tValue = tValue.slice(1);
      }
      if (tValue.endsWith('"')) {
        tValue = tValue.slice(0, -1);
      }
      tMap.set(spGroup[0] || "", tValue);
    }
  }
  return tMap;
}
