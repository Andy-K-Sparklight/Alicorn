export const AL_THEMES: Record<string, [string, string, string, string]> = {
  FadeGray: ["373737", "808080", "626262", "f0f0f0"],
  Twikie: ["5d2391", "d796f0", "df307f", "ffe0f0"],
  Rarity: ["503e8a", "76ade5", "794897", "eaeaf4"],
  Mint: ["009688", "80cbc4", "01bcd4", "e0f2f1"],
  Grass: ["689f38", "9ccc65", "ffa100", "f1f8e9"],
  Starlight: ["562875", "c394d7", "ac7dc9", "f2c7f8"],
  Cherry: ["ed81af", "ef91b9", "f772b9", "ffdfed"],
  PurpleDark: ["fad000", "6943ff", "97ffff", "2d2b55"],
  Azure: ["104ebb", "ffd700", "072150", "bfefff"],
  Winter: ["7898fd", "a4c2ff", "55abfc", "e7f0ff"],
  SweetieBelle: ["785b88", "b28dc1", "f08ab4", "efeded"],
  PinkDark: ["e594bf", "e7a0c6", "ef9fc5", "342f36"],
  "66CCFF": ["3681c6", "5cd9ff", "007faf", "f0f0ff"],
  SheepGreen: ["45bf4d", "6bd6dd", "009dac", "e9faea"],
  Classic: ["049ae5", "64b5f6", "ff80ab", "e1f5fe"],
  NightLightDark: ["808080", "202020", "888888", "000000"],
  OldPink: ["37474f", "607d8b", "f06292", "eceff1"],
  WhatGreenDark: ["54b0a1", "a4cdc3", "6da396", "272727"],
  GoldDark: ["cca700", "ffd900", "fcec3f", "151515"],
  UNIXDark: ["00be00", "00ea00", "00d300", "000000"],
  Maud: ["554373", "9885b7", "3b4177", "b8b7be"],
  Apple: ["ef6f2f", "faba62", "ef9c54", "faf5ab"],
  Random: [randomColor3(), randomColor3(), randomColor3(), randomColor3()],
};

function randomColor3(): string {
  return randomColorUnit() + randomColorUnit() + randomColorUnit();
}

function randomColorUnit(): string {
  let b = Math.floor(Math.random() * 255).toString(16);
  if (b.length === 1) {
    b = "0" + b;
  }
  return b;
}
