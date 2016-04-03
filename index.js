var self = require("sdk/self");

var ss = require("sdk/simple-storage");
var tabs = require("sdk/tabs");
var privateBrowsing = require("sdk/private-browsing");
var { setInterval, clearInterval } = require("sdk/timers");

var { ToggleButton } = require("sdk/ui/button/toggle");
var panels = require("sdk/panel");

var settings = {
    log_inactive: true,
    loggingInterval: 5000
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

    let nowstr = "2016-04-02 23:18:15";
    ss.storage.tab_history[nowstr] = tabs;
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
    // Then log every state.loggingInterval seconds
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




/*
// a dummy function, to show how tests work.
// to see how to test this function, look at test/test-index.js
function dummy(text, callback) {
  callback(text);
}



function registerHandlers() {
	function onOpen(tab) {
	  console.log(tab.url + " is open");
	  tab.on("pageshow", logShow);
	  tab.on("activate", logActivate);
	  tab.on("deactivate", logDeactivate);
	  tab.on("close", logClose);
	}

	function logShow(tab) {
	  console.log(tab.url + " is loaded");
	}

	function logActivate(tab) {
	  console.log(tab.url + " is activated");
	}

	function logDeactivate(tab) {
	  console.log(tab.url + " is deactivated");
	}

	function logClose(tab) {
	  console.log(tab.url + " is closed");
	}

	tabs.on('open', onOpen);

	// Listen for tab openings.
	tabs.on('open', function onOpen(tab) {
	  myOpenTabs.push(tab);
	});

	// Listen for tab content loads.
	tabs.on('ready', function(tab) {
	  console.log('tab is loaded', tab.title, tab.url);
	});
}
**/
//exports.dummy = dummy;
