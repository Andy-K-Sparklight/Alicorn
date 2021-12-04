import { readFile } from "fs-extra";

const SKIN_CHANGE_ENDPOINT =
  "https://api.minecraftservices.com/minecraft/profile/skins";

export async function uploadPremiumSkin(
  acToken: string,
  type: "classic" | "slim",
  filePt: string
): Promise<boolean> {
  const f = await readFile(filePt);
  const blob = new File([f], "skin.png");
  const fd = new FormData();
  fd.append("variant", type);
  fd.append("file", blob);
  const res = await fetch(SKIN_CHANGE_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + acToken,
    },

    body: fd,
  });
  const ret = await res.text();
  if (!res.ok) {
    return false;
  }
  return ret.length === 0;
}

export async function setPremiumSkinFromURL(
  acToken: string,
  type: "classic" | "slim",
  url: string
): Promise<boolean> {
  const res = await fetch(SKIN_CHANGE_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + acToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      variant: type,
      url: url,
    }),
  });
  const ret = await res.text();
  if (!res.ok) {
    return false;
  }
  return ret.length === 0;
}
