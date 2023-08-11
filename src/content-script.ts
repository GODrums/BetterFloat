import { FloatItem, ItemCondition, ItemStyle } from "./@typings/FloatTypes";

async function init() {
	console.log("content-script init");
	let activeTab = getTabNumber();
	console.log(`Currently on tab ${activeTab}`);

	if (!isActive) {
		console.debug("Starting observer");
		await applyMutation();
		isActive = true;
	}
}

async function loadMapping() {
	if (Object.keys(priceMapping).length == 0) {
		console.debug(
			"[BetterFloat] Attempting to load price mapping from localstorage"
		);

		let mapping = null;

		chrome.storage.local.get("prices", (data) => {
			if (data) {
				mapping = data.prices;
			} else {
				mapping = "";
			}
		});

		// since chrome.storage.local.get is async, we need to wait for it to finish
		while (mapping == null) {
			await new Promise((r) => setTimeout(r, 100));
		}

		if (mapping.length > 0) {
			priceMapping = JSON.parse(mapping);
		} else {
			console.debug(
				"[BetterFloat] Failed. Loading price mapping from file."
			);
			// fallback to loading older prices from file
			let response = await fetchFile("../public/prices_v6.json");
			priceMapping = await response.json();
		}
		console.debug("[BetterFloat] Price mapping successfully initialized");
	}
	return true;
}

// convert to get from rums.dev
async function getBuffMapping(name: string) {
	if (Object.keys(buffMapping).length == 0) {
		console.debug("[BetterSkinport] Loading buff mapping");
		let response = await fetchFile("../public/buff_item_map.json");
		buffMapping = await response.json();
	}
	if (buffMapping["name_to_id"][name]) {
		return buffMapping["name_to_id"][name];
	} else {
		console.debug(`[BetterFloat] No buff mapping found for ${name}`);
		return 0;
	}
}

function fetchFile(name: string) {
	const url = chrome.runtime.getURL(name);
	return fetch(url);
}

async function applyMutation() {
	let observer = new MutationObserver(async (mutations) => {
		for (let mutation of mutations) {
			for (let i = 0; i < mutation.addedNodes.length; i++) {
				let addedNode = mutation.addedNodes[i];
				// some nodes are not elements, so we need to check
				if (
					addedNode instanceof HTMLElement &&
					addedNode.className &&
					addedNode.className.toString().includes("flex-item")
				) {
					console.log(JSON.stringify(addedNode));
					adjustItem(addedNode);
				}
			}
		}
	});
	await loadMapping();
	observer.observe(document, { childList: true, subtree: true });
}

function adjustItem(container: Element) {
	const item = getFloatItem(container);
	addBuffPrice(item, container);
}

function getFloatItem(container: Element): FloatItem {
	const nameContainer = container.querySelector("app-item-name");
	const floatContainer = container.querySelector("item-float-bar");
	const priceContainer = container.querySelector(".price");
	const header_details = <Element>nameContainer.childNodes[1];

	let condition: ItemCondition = "";
	let quality = "";
	let style: ItemStyle = "";

	header_details.childNodes.forEach((node) => {
		switch (node.nodeType) {
			case Node.ELEMENT_NODE:
				let text = node.textContent.trim();
				if (
					text.includes("StatTrak") ||
					text.includes("Souvenir") ||
					text.includes("Container") ||
					text.includes("Sticker")
				) {
					// TODO: integrate the ItemQuality type
					// https://stackoverflow.com/questions/51528780/typescript-check-typeof-against-custom-type
					quality = text;
				} else {
					style = text as ItemStyle;
				}
				break;
			case Node.TEXT_NODE:
				condition = node.textContent.trim() as ItemCondition;
				break;
			case Node.COMMENT_NODE:
				break;
		}
	});
	return {
		name: nameContainer.querySelector(".item-name").textContent.replace("\n", ""),
		quality: quality,
		style: style,
		condition: condition,
		float: Number(
			floatContainer?.querySelector(".ng-star-inserted")?.textContent ?? 0
		),
		price: Number(priceContainer.textContent.split("  ")[0].trim().replace("$", "").replace(",", "")),
		bargain: false,
	};
}

async function addBuffPrice(item: FloatItem, container: Element) {
	await loadMapping();
	let buff_name = createBuffName(item);
	let buff_id = await getBuffMapping(buff_name);

	let price = priceMapping[buff_name]["buff163"];
	const suggestedContainer = container.querySelector(".suggested-container");

	if (suggestedContainer) {
		let buff_url =
			buff_id > 0
				? `https://buff.163.com/goods/${buff_id}`
				: `https://buff.163.com/market/csgo#tab=selling&page_num=1&search=${encodeURIComponent(
						buff_name
				  )}`;
		suggestedContainer.setAttribute("href", buff_url);
        suggestedContainer.setAttribute("target", "_blank");
        suggestedContainer.setAttribute("aria-describedby", "");
		suggestedContainer.innerHTML = `<img src="${chrome.runtime.getURL("../public/buff_favicon.png")}"" style="height: 20px; margin-top: 5px; margin-right: 3px"><div class="suggested-price betterfloat-buffprice">▼${price["highest_order"]["price"]} ▲${price["starting_at"]["price"]}</div>`;
	}

    const priceContainer = container.querySelector(".price");
    if (priceContainer.querySelector(".sale-tag")) {
        priceContainer.removeChild(priceContainer.querySelector(".sale-tag"));
    }
    const difference = item.price - price["starting_at"]["price"];
    priceContainer.innerHTML += `<span class="sale-tag betterfloat-sale-tag" style="position: relative;top: -3px;left: 3px;font-size: 15px;padding: 5px;border-radius: 5px;background-color: ${(difference < 0 ? "green" : "red")}"> ${(difference > 0 ? "+$" : "-$") + Math.abs(difference).toFixed(2)} </span>`;
}

function createBuffName(item: FloatItem): string {
	let full_name = `${item.name}`;
	if (item.quality.includes("Sticker")) {
		full_name = `Sticker |` + full_name;
	} else if (!item.quality.includes("Container")) {
		if (
			item.quality.includes("StatTrak") ||
			item.quality.includes("Souvenir")
		) {
			full_name = full_name.includes("★")
				? `★ StatTrak™ ${full_name.split("★ ")[1]}`
				: `${item.quality} ${full_name}`;
		}
		full_name += ` (${item.condition})`;
	}
	return full_name.replace(/ +(?= )/g, "").replace(/\//g, "-").trim();
}

function getTabNumber() {
	return Number(
		document
			.querySelector(".mat-tab-label-active")
			.getAttribute("aria-posinset")
	);
}

let isActive = false;
let buffMapping = {};
let priceMapping = {};
init();
