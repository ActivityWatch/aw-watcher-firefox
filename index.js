var self = require("sdk/self");

var ss = require("sdk/simple-storage");
var tabs = require("sdk/tabs");
var privateBrowsing = require("sdk/private-browsing");
var { setInterval, clearInterval } = require("sdk/timers");

var { ToggleButton } = require("sdk/ui/button/toggle");
var panels = require("sdk/panel");
var Request = require("sdk/request").Request;

var settings = {
    log_inactive: true,
    loggingInterval: 5000,
    server_enabled: true,
    server_hostname: "localhost",
    server_port: "5000"
}

var state = {
    intervalId: 0,
    loggingEnabled: true,
    tabs: []
}

var button = ToggleButton({
  id: "activitywatch",
  label: "ActivityWatch",
  icon: "./icon-16.png",
  onChange: handleChange
});

var panel = panels.Panel({
  contentURL: self.data.url("panel.html"),
  contentScriptFile: self.data.url("panel.js"),
  onHide: _ => button.state('window', {checked: false})
});

panel.port.on("toggleLogging", function(data) {
    console.log("Logging toggled from panel")
    state.loggingEnabled = !state.loggingEnabled;
    panel.port.emit("stateChange", state);
})

function handleChange(state) {
  if (state.checked)
      panel.show({position: button});
}

function save_tabs(tabs) {
    if(ss.storage.tab_history === undefined) {
        ss.storage.tab_history = {};
    }

    let now = new Date();

    // Will fill up quick, so don't do without ensuring it doesn't fill up
    // TODO: Do something smart
    //ss.storage.tab_history[now.toISOString()] = tabs;

    // Send to actwa-server
    var event = {
        "tags": "firefox-watcher",
        "tabs": tabs,
        "timestamp": now.toISOString()
    }

    let url = "http://" + settings["server_hostname"] + ":" + settings["server_port"] + "/api/0/activity/firefoxwatcher";
    let headers = {
        "Content-Type": "application/json",
        // TODO: Use authorization in the future
        //"Authorization": "Basic " + %Base64(username + ":" + "password")
    }

    r = Request({
        "url": url,
        "headers": headers,
        "content": events,
        "contentType": "application/json",
        "onComplete": function(response) {
            console.log("Completed request to actwa-server");
        }
    })
    r.post();
}


function listTabs() {
    function tabToObj(tab) {
        return {"id": tab.id, "title": tab.title, "url": tab.url, "index": tab.index, "private": privateBrowsing.isPrivate(tab)}
    }

    var openTabs = [];
	for(let tab of tabs) {
        openTabs.push(tabToObj(tab));
	}

    // Marks the active tab as active
    openTabs.forEach(tab => tab.isActive = (tab.id == tabs.activeTab.id));

    return openTabs;
}

function filterTabsOnlyActive(tabs) {
    return tabs.filter(tab => tab.isActive);
}

function startLogging() {
    function log() {
        var tabs;
        if(settings.log_inactive) {
            tabs = listTabs();
        } else {
            tabs = filterTabsOnlyActive(listTabs());
        }
        state.tabs = tabs;
        save_tabs(tabs);
        console.log("Logged tab: " + tabs[0].title);
    }

    // Run once immediately
    log();

    // Then log every state.loggingInterval milliseconds
    state.intervalId = setInterval(log, settings.loggingInterval || 5000);
}

function stopLogging() {
    clearInterval(state.intervalId);
}


function main() {
    startLogging();
    console.log("Settings: ");
    console.log(settings);

    function startPanel() {
        function updatePanel() {
            panel.port.emit("stateChange", state)
        }

        updatePanel();
        setInterval(updatePanel, 10000)
    }

    startPanel();
}

main();

