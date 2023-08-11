/*
permissions needed:
 - storage: required to use storage for icons, etc
 - activeTab: required to gain access to modify the current page
 - scripting: for using the executeScript function
*/
let lastUpdate = 0;

chrome.storage.local.get("lastUpdate", (data) => {
	if (data.lastUpdate) {
		lastUpdate = data.lastUpdate;
	}
});

if (lastUpdate < Date.now() - 1000 * 60 * 60 * 8) {
	fetch("https://prices.csgotrader.app/latest/prices_v6.json")
		.then((response) => response.json())
		.then((data) => {
			chrome.storage.local
				.set({ prices: JSON.stringify(data) })
				.then(() => {
					console.log(
						"Prices updated. Last update: " +
							lastUpdate +
							". Current time: " +
							Date.now()
					);
				});
		})
		.catch((err) => console.error(err));

	lastUpdate = Date.now();
	chrome.storage.local.set({ lastUpdate: lastUpdate });
}

// injects code to a specific tab
function injectScript(tabId: number) {
	console.log("injecting script");
	if (chrome.scripting) {
		chrome.scripting.executeScript({
			target: { tabId: tabId },
			files: ["content-script.js"],
		});
	} else {
		chrome.tabs.executeScript(tabId, {
			file: "content-script.js",
		});
	}
}

// listener for tab change
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	console.log(JSON.stringify(changeInfo));
	// check for a URL in the changeInfo parameter (url is only added when it is changed)
	if (changeInfo.url && changeInfo.url.includes("csgofloat")) {
		injectScript(tabId);
	}
});
