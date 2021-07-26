// Inject alicorn.sh for GNU/Linux
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require("fs");
const START_SH = "#!/bin/sh\ncd `dirname $0`\n./Alicorn";
fs.writeFile(
  "./out/Alicorn-linux-x64/alicorn.sh",
  START_SH,
  { mode: "0777" },
  () => {
    console.log("Shell launcher emitted.");
  }
);
