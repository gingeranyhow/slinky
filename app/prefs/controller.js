const electron = require("electron");
const ipc = electron.ipcRenderer;
const remote = electron.remote;
const path = require("path");

const dialog = remote.dialog;

const settings = require("electron-settings");

const $ = window.jQuery = require('../renderer/jquery-2.2.3.min.js');

// Wait for DOM to be ready before kicking most stuff off
// (some of the views get confused otherwise)
$(document).ready(() => {

  /* for reference; these are declared in main.js
      settings.defaults({
        narrativeCountDanger: 140,
        dialogCountDanger: 75,
        charCountCutoff: 560,
        enforceCharCounts: true
    });
  */

  // display current values

  settings.get("mainPath").then( val => {
    if (val) {
      $("#mainPathDisplay").html(val);
    } else {
      $("#mainPathDisplay").html("(None selected)");
    }
  });
    settings.get("inkRunner").then(val => {
        if (val) {
            $("#inkRunnerDisplay").html(val);
        } else {
            $("#inkRunnerDisplay").html("(None selected)");
        }
    });
  settings.get("charCountDanger").then( val => {
    $("#charCountDanger").val(val);
  });

  settings.get("charCountCutoff").then( val => {
    $("#charCountCutoff").val(val);
  });

  settings.get("enforceCharCounts").then( val => {
    $("#enforceCharCounts").prop("checked", val);
  });

  // update on changes

  $("#charCountDanger").on("change input", (event) => {
    var val = $("#charCountDanger").val();
    settings.set("charCountDanger", val);
    console.log("charCountDanger changed! " + val);
  });

  $("#charCountCutoff").on("change input", (event) => {
    var val = $("#charCountCutoff").val();
    settings.set("charCountCutoff", val);
    console.log("charCountDanger changed! " + val);
  });

  $("#enforceCharCounts").on("change", (event) => {
    var val = $("#enforceCharCounts").prop("checked");
    settings.set("enforceCharCounts", val);
    console.log("enforceCharCounts changed! " + val);
  });

  $("#locateMainPath").on("click", (event) => {
    remote.getCurrentWindow().setSheetOffset(0);

    var selectedFiles = dialog.showOpenDialog(remote.getCurrentWindow(), {properties: ["openFile"]});
    // selectedFiles is an array
    settings.set("mainPath", selectedFiles[0]);
    $("#mainPathDisplay").html(selectedFiles[0]);

    event.preventDefault();
  });

    $("#locateInkRunner").on("click", (event) => {
        remote.getCurrentWindow().setSheetOffset(0);

        var selectedFiles = dialog.showOpenDialog(remote.getCurrentWindow(), { properties: ["openFile"] });
        // selectedFiles is an array
        settings.set("inkRunner", selectedFiles[0]);
        $("#inkRunnerDisplay").html(selectedFiles[0]);

        event.preventDefault();
    });
});
