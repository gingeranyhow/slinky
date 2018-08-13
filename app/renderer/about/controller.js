const electron = require("electron");
const ipc = electron.ipcRenderer;
const $ = window.jQuery = require('../jquery-2.2.3.min.js');

ipc.on("set-about-data", (event, data) => {
    //$("#version-mcslinky").text(data);
    $("#version-inky").text("McSlinky version: "+data.inkyVersion);
    $("#version-ink").text("ink version: "+data.inkVersion);
    $("#version-inkjs").text("inkjs version: "+data.inkjsVersion);
});