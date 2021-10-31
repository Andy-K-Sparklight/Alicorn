export const AL_THEMES: Record<string, [string, string, string, string]> = {
  Twikie: ["5d2391", "d796f0", "df307f", "ffe0f0"],
  Maud: ["554373", "9885b7", "3b4177", "b8b7be"],
  "66CCFF": ["3681c6", "5cd9ff", "007faf", "e4f7ff"],
  Apple: ["ef6f2f", "faba62", "ef9c54", "faf5ab"],
  Rarity: ["5e50a0", "76ade5", "794897", "ffffff"],
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
