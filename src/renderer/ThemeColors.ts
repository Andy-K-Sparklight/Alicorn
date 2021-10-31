export const AL_THEMES: Record<string, [string, string, string, string]> = {
  Twikie: ["5d2391", "d796f0", "df307f", "ffe0f0"],
  Rarity: ["5e50a0", "76ade5", "794897", "ffffff"],
  Mint: ["009688", "80cbc4", "01bcd4", "e0f2f1"],
  Grass: ["689f38", "9ccc65", "ffa100", "f1f8e9"],
  Classic: ["049ae5", "64b5f6", "ff80ab", "e1f5fe"],
  FadeGray: ["373737", "808080", "626262", "f0f0f0"],
  "66CCFF": ["3681c6", "5cd9ff", "007faf", "f0f0ff"],
  NightLightDark: ["808080", "000000", "888888", "000000"],
  OldPink: ["37474f", "607d8b", "f06292", "eceff1"],
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
