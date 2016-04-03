//var self = require("sdk/self");

var panel_setup = false;

self.port.on("stateChange", function(state) {
    if(!panel_setup) {
        console.log("Panel setup, should only happen once!")
        panel_setup = true;
        setup_panel();
    }
    render_panel(state);
});

function setup_panel() {
    var el = document.getElementById("toggleLogging");
    el.addEventListener("click", function() {
        console.log("Button clicked!");
        self.port.emit("toggleLogging", {});
    });

    var el = document.getElementById("alertHistory");
    el.addEventListener("click", function() {
        alert("test, history should go here");
    });
}

function render_panel(state) {
    function render_status() {
        var elHeader = document.getElementById("loggingEnabled");
        var elStatusLabel = document.getElementById("statusLabel");
        elStatusLabel.innerHTML = state.loggingEnabled ? "Running" : "Paused";
    }
    render_status();
    //console.log(state);

    function render_tablist() {
        var el = document.getElementById("tablist");
        el.innerHTML = JSON.stringify(state.tabs);
    }
    render_tablist();
}

console.log("Panel opened!");

