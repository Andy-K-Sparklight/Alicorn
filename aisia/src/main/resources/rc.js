try {
    console.log("Alicorn RC, a hybrid startup loader.");
    console.log("Loading libraries...");
    global.$ = require("./aisia.js");
    console.log("Loading main method...");
    require("./a2.js").main();
} catch (e) {
    console.error("It does not work!");
    console.error(e);
    require("electron").app.exit(1);
}