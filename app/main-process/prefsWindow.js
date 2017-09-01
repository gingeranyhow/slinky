const electron = require('electron');
const ipc = electron.ipcMain;
const dialog = electron.dialog;
const BrowserWindow = electron.BrowserWindow;
const path = require("path");

const electronWindowOptions = {
  width: 400,
  height: 400,
  minWidth: 400,
  minHeight: 400,
  //maxWidth: 400,
  //maxHeight: 400,
  title: "McSlinky Prefs",
  alwaysOnTop: true
};

var prefsWindow;

function PrefsWindow() {
    prefsWindow = new BrowserWindow(electronWindowOptions);
    prefsWindow.loadURL("file://" + __dirname + "/../prefs/index.html");
    prefsWindow.on("closed", () => {
      prefsWindow = null;
    });
}

PrefsWindow.show = function() {
    if (prefsWindow) {
      console.log("prefs already open");
      prefsWindow.focus();
    } else {
      console.log("prefs not open yet");
      return new PrefsWindow();
    }
}

exports.PrefsWindow = PrefsWindow;