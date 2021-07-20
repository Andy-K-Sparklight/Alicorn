// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require("fs-extra");
fs.remove("./dist")
  .then(() => {
    console.log("Removed dist.");
  })
  .catch(() => {});
fs.remove("./out")
  .then(() => {
    console.log("Removed out.");
  })
  .catch(() => {});
fs.remove("./web")
  .then(() => {
    console.log("Removed web.");
  })
  .catch(() => {});
