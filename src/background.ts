let lastUpdate = 0;

chrome.storage.local.get("lastUpdate", (data) => {
	if (data.lastUpdate) {
		lastUpdate = data.lastUpdate;
	}
});

// update every 8 hours
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
