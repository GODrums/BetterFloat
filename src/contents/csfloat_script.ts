import { html } from "common-tags";
import { CrimsonKimonoMapping, CyanbitKarambitMapping, OverprintMapping, PhoenixMapping } from "cs-tierlist";
import { AcidFadeCalculator, AmberFadeCalculator } from "csgo-fade-percentage-calculator";
import getSymbolFromCurrency from "currency-symbol-map";
import Decimal from "decimal.js";

import { dynamicUIHandler } from "~lib/handlers/urlhandler";
import { CSFloatHelpers } from "~lib/helpers/csfloat_helpers";
import {
	ICON_ARROWUP_SMALL,
	ICON_BUFF,
	ICON_C5GAME,
	ICON_CAMERA_FLIPPED,
	ICON_CLOCK,
	ICON_CRIMSON,
	ICON_CSFLOAT,
	ICON_CSGOSTASH,
	ICON_EXCLAMATION,
	ICON_GEM_CYAN,
	ICON_OVERPRINT_ARROW,
	ICON_OVERPRINT_FLOWER,
	ICON_OVERPRINT_MIXED,
	ICON_OVERPRINT_POLYGON,
	ICON_PHOENIX,
	ICON_PRICEMPIRE,
	ICON_SPIDER_WEB,
	ICON_STEAM,
	ICON_YOUPIN,
} from "~lib/util/globals";
import { getAllSettings, getSetting } from "~lib/util/storage";
import { genGemContainer } from "~lib/util/uigeneration";
import { activateHandler, initPriceMapping } from "../lib/handlers/eventhandler";
import {
	getBuffMapping,
	getCSFCurrencyRate,
	getCSFPopupItem,
	getCrimsonWebMapping,
	getFirstCSFItem,
	getFirstHistorySale,
	getItemPrice,
	getSpecificCSFOffer,
	getStallData,
	loadMapping,
} from "../lib/handlers/mappinghandler";
import { fetchCSBlueGemPastSales, fetchCSBlueGemPatternData } from "../lib/handlers/networkhandler";
import {
	calculateTime,
	getBuffPrice,
	getFloatColoring,
	getMarketURL,
	getSPBackgroundColor,
	handleSpecialStickerNames,
	isBuffBannedItem,
	toTruncatedString,
	waitForElement,
} from "../lib/util/helperfunctions";

import type { PlasmoCSConfig } from "plasmo";
import type { BlueGem, Extension, FadePercentage } from "~lib/@typings/ExtensionTypes";
import type { CSFloat, DopplerPhase, ItemCondition, ItemStyle } from "~lib/@typings/FloatTypes";
import { type IStorage, MarketSource } from "~lib/util/storage";

export const config: PlasmoCSConfig = {
	matches: ["https://*.csfloat.com/*"],
	run_at: "document_end",
	css: ["../css/csfloat_styles.css"],
};

init();

async function init() {
	console.time("[BetterFloat] CSFloat init timer");

	if (location.host !== "csfloat.com") {
		return;
	}

	// catch the events thrown by the script
	// this has to be done as first thing to not miss timed events
	activateHandler();

	extensionSettings = await getAllSettings();

	if (!extensionSettings["csf-enable"]) return;

	await initPriceMapping(extensionSettings["csf-pricingsource"] as MarketSource);

	console.group("[BetterFloat] Loading mappings...");
	await loadMapping(extensionSettings["csf-pricingsource"] as MarketSource);
	console.groupEnd();
	console.timeEnd("[BetterFloat] CSFloat init timer");

	if (extensionSettings["csf-topbutton"]) {
		CSFloatHelpers.createTopButton();
	}

	//check if url is in supported subpages
	if (location.pathname === "/") {
		await firstLaunch();
	} else {
		for (let i = 0; i < supportedSubPages.length; i++) {
			if (location.pathname.includes(supportedSubPages[i])) {
				await firstLaunch();
				break;
			}
		}
	}

	// mutation observer is only needed once
	if (!isObserverActive) {
		isObserverActive = true;
		applyMutation();
		console.log("[BetterFloat] Mutation observer started");
	}

	dynamicUIHandler();
}

// required as mutation does not detect initial DOM
async function firstLaunch() {
	const items = document.querySelectorAll("item-card");

	for (let i = 0; i < items.length; i++) {
		await adjustItem(items[i], items[i].getAttribute("width")?.includes("100%") ? POPOUT_ITEM.PAGE : POPOUT_ITEM.NONE);
	}

	if (location.pathname.includes("/stall/")) {
		// await customStall(location.pathname.split('/').pop() ?? '');
	}
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function customStall(stall_id: string) {
	if (stall_id === "me") {
		const popupOuter = document.createElement("div");
		const settingsPopup = document.createElement("div");
		settingsPopup.setAttribute("class", "betterfloat-customstall-popup");
		settingsPopup.setAttribute("style", "display: none;");

		const popupHeader = document.createElement("h3");
		popupHeader.textContent = "CUSTOM STALL";
		popupHeader.setAttribute("style", "font-weight: 600; font-size: 24px; line-height: 0; margin-top: 20px;");
		const popupSubHeader = document.createElement("h4");
		popupSubHeader.textContent = "by BetterFloat";
		popupSubHeader.setAttribute("style", "font-size: 18px; color: rgb(130, 130, 130); line-height: 0;");
		const popupCloseButton = document.createElement("button");
		popupCloseButton.type = "button";
		popupCloseButton.className = "betterfloat-customstall-close";
		popupCloseButton.textContent = "x";
		popupCloseButton.onclick = () => {
			settingsPopup.style.display = "none";
		};
		settingsPopup.appendChild(popupHeader);
		settingsPopup.appendChild(popupSubHeader);
		settingsPopup.appendChild(popupCloseButton);

		const popupBackground = document.createElement("div");
		popupBackground.className = "betterfloat-customstall-popup-content";
		const backgroundText = document.createElement("p");
		backgroundText.setAttribute("style", "font-weight: 600; margin: 5px 0;");
		backgroundText.textContent = "BACKGROUND";
		popupBackground.appendChild(backgroundText);

		const inputField = {
			img: {
				placeholder: "Image URL",
				text: "IMG:",
			},
			webm: {
				placeholder: "Webm URL",
				text: "WEBM:",
			},
			mp4: {
				placeholder: "Mp4 URL",
				text: "MP4:",
			},
		};
		for (const key in inputField) {
			const div = document.createElement("div");
			div.setAttribute("style", "display: flex; justify-content: space-between; width: 100%");
			const label = document.createElement("label");
			label.textContent = inputField[key as keyof typeof inputField].text;
			const input = document.createElement("input");
			input.className = "w-2/4";
			input.type = "url";
			input.placeholder = inputField[key as keyof typeof inputField].placeholder;
			input.id = "betterfloat-customstall-" + key;
			div.appendChild(label);
			div.appendChild(input);
			popupBackground.appendChild(div);
		}
		const colorDiv = document.createElement("div");
		colorDiv.setAttribute("style", "display: flex; justify-content: space-between; width: 100%");
		const colorLabel = document.createElement("label");
		colorLabel.textContent = "Color:";
		const colorInput = document.createElement("input");
		colorInput.type = "color";
		colorInput.id = "betterfloat-customstall-color";
		colorDiv.appendChild(colorLabel);
		colorDiv.appendChild(colorInput);
		const transparentDiv = document.createElement("div");
		transparentDiv.setAttribute("style", "display: flex; justify-content: space-between; width: 100%");
		const transparentLabel = document.createElement("label");
		transparentLabel.textContent = "Transparent Elements:";
		const transparentInput = document.createElement("input");
		transparentInput.setAttribute("style", "height: 24px; width: 24px; accent-color: #ff5722;");
		transparentInput.type = "checkbox";
		transparentInput.id = "betterfloat-customstall-transparent";
		transparentDiv.appendChild(transparentLabel);
		transparentDiv.appendChild(transparentInput);

		const popupSaveButton = document.createElement("button");
		popupSaveButton.className = "mat-raised-button mat-warn betterfloat-customstall-buttondiv";
		popupSaveButton.style.marginTop = "15px";
		popupSaveButton.type = "button";
		const saveButtonTextNode = document.createElement("span");
		saveButtonTextNode.textContent = "Save";
		popupSaveButton.onclick = async () => {
			const stall_id = (<HTMLInputElement>document.getElementById("mat-input-1")).value.split("/").pop();
			if (isNaN(Number(stall_id)) || location.pathname !== "/stall/me") {
				console.debug("[BetterFloat] Invalid stall id");
				return;
			}
			// send get to /api/v1/me to get obfuscated user id
			const obfuscated_id: string = await fetch("https://csfloat.com/api/v1/me")
				.then((res) => res.json())
				.then((data) => data?.user?.obfuscated_id);
			if (!obfuscated_id) {
				console.debug("[BetterFloat] Could not get obfuscated user id");
				return;
			}
			const stallData = {
				stall_id: stall_id,
				options: {
					video: {
						poster: (<HTMLInputElement>document.getElementById("betterfloat-customstall-img")).value,
						webm: (<HTMLInputElement>document.getElementById("betterfloat-customstall-webm")).value,
						mp4: (<HTMLInputElement>document.getElementById("betterfloat-customstall-mp4")).value,
					},
					"background-color": (<HTMLInputElement>document.getElementById("betterfloat-customstall-color")).value,
					transparent_elements: (<HTMLInputElement>document.getElementById("betterfloat-customstall-transparent")).checked,
				},
			};
			console.debug("[BetterFloat] New stall settings: ", stallData);

			// send post to /api/v1/stall/{id} to update stall
			await fetch("https://api.rums.dev/v1/csfloatstalls/store", {
				method: "POST",
				headers: {
					Accept: "*/*",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					stall_id: stallData.stall_id,
					// token: obfuscated_id,
					token: "testtoken",
					data: stallData.options,
				}),
			})
				.then((res) => res.json())
				.then((data) => console.debug("[BetterFloat] Stall update - success response from api.rums.dev: ", data))
				.catch((err) => console.debug("[BetterFloat] Stall update - error: ", err));

			settingsPopup.style.display = "none";
		};
		popupSaveButton.appendChild(saveButtonTextNode);

		popupBackground.appendChild(colorDiv);
		popupBackground.appendChild(transparentDiv);
		settingsPopup.appendChild(popupBackground);
		settingsPopup.appendChild(popupSaveButton);

		const settingsButton = document.createElement("button");
		settingsButton.setAttribute("style", "background: none; border: none; margin-left: 60px");
		const settingsIcon = document.createElement("img");
		// settingsIcon.setAttribute('src', extensionSettings["runtimePublicURL"] + '/gear-solid.svg');
		settingsIcon.style.height = "64px";
		settingsIcon.style.filter = "brightness(0) saturate(100%) invert(59%) sepia(55%) saturate(3028%) hue-rotate(340deg) brightness(101%) contrast(101%)";
		settingsButton.onclick = () => {
			settingsPopup.style.display = "block";
		};
		settingsButton.appendChild(settingsIcon);
		popupOuter.appendChild(settingsPopup);
		popupOuter.appendChild(settingsButton);

		const container = document.querySelector(".settings")?.parentElement;
		if (container) {
			container.after(popupOuter);
			(<HTMLElement>container.parentElement).style.alignItems = "center";
		}

		// get stall id from input field to still load custom stall
		const newID = (<HTMLInputElement>document.getElementById("mat-input-1")).value.split("/").pop();
		if (newID) {
			stall_id = newID;
		} else {
			console.log("[BetterFloat] Could not load stall data");
			return;
		}
	}
	const stallData = await getStallData(stall_id);
	if (!stallData || !stall_id.includes(stallData.stall_id)) {
		console.log("[BetterFloat] Could not load stall data");
		return;
	}
	// user has not set a customer stall yet
	if (stallData.roles.length === 0) {
		console.debug(`[BetterFloat] User ${stall_id} has not set a custom stall yet`);
		return;
	}

	document.body.classList.add("betterfloat-custom-stall");

	const backgroundVideo = document.createElement("video");
	backgroundVideo.setAttribute("playsinline", "");
	backgroundVideo.setAttribute("autoplay", "");
	backgroundVideo.setAttribute("muted", "");
	backgroundVideo.setAttribute("loop", "");
	backgroundVideo.setAttribute("poster", stallData.options.video.poster);
	backgroundVideo.setAttribute(
		"style",
		`position: absolute; width: 100%; height: 100%; z-index: -100; background-size: cover; background-position: center center; object-fit: cover; background-color: ${stallData.options["background-color"]}`
	);
	const sourceWebm = document.createElement("source");
	sourceWebm.setAttribute("src", stallData.options.video.webm);
	sourceWebm.setAttribute("type", "video/webm");
	const sourceMp4 = document.createElement("source");
	sourceMp4.setAttribute("src", stallData.options.video.mp4);
	sourceMp4.setAttribute("type", "video/mp4");

	backgroundVideo.appendChild(sourceWebm);
	backgroundVideo.appendChild(sourceMp4);
	document.body.firstChild?.before(backgroundVideo);

	// start video after it is loaded
	backgroundVideo.addEventListener("canplay", async () => {
		backgroundVideo.muted = true;
		await backgroundVideo.play();
	});

	if (stallData.options.transparent_elements) {
		const stallHeader = document.querySelector(".betterfloat-custom-stall .mat-card.header");
		if (stallHeader) {
			(<HTMLElement>stallHeader).style.backgroundColor = "transparent";
		}
		const stallFooter = document.querySelector(".betterfloat-custom-stall > app-root > div > div.footer");
		if (stallFooter) {
			(<HTMLElement>stallFooter).style.backgroundColor = "transparent";
		}
	}

	const matChipWrapper = document.querySelector(".mat-chip-list-wrapper");
	if (matChipWrapper?.firstElementChild) {
		const bfChip = <HTMLElement>matChipWrapper.firstElementChild.cloneNode(true);
		bfChip.style.backgroundColor = "purple";
		bfChip.textContent = "BetterFloat " + stallData.roles[0];
		matChipWrapper.appendChild(bfChip);
	}

	const interval = setInterval(() => {
		if (!location.href.includes("/stall/") && !location.href.includes("/item/")) {
			document.querySelector(".betterfloat-custom-stall")?.classList.remove("betterfloat-custom-stall");
			document.querySelector("video")?.remove();

			clearInterval(interval);
		}
	}, 200);
}

function offerItemClickListener(listItem: Element) {
	listItem.addEventListener("click", async () => {
		await new Promise((r) => setTimeout(r, 100));
		const itemCard = document.querySelector("item-card");
		if (itemCard) {
			await adjustItem(itemCard);
		}
	});
}

function applyMutation() {
	const observer = new MutationObserver(async (mutations) => {
		if (await getSetting("csf-enable")) {
			for (let i = 0; i < unsupportedSubPages.length; i++) {
				if (location.href.includes(unsupportedSubPages[i])) {
					console.debug("[BetterFloat] Current page is currently NOT supported");
					return;
				}
			}
			for (const mutation of mutations) {
				for (let i = 0; i < mutation.addedNodes.length; i++) {
					const addedNode = mutation.addedNodes[i];
					// some nodes are not elements, so we need to check
					if (!(addedNode instanceof HTMLElement)) continue;
					// console.debug('[BetterFloat] Mutation detected:', addedNode);

					// item popout
					if (addedNode.tagName.toLowerCase() === "item-detail") {
						await adjustItem(addedNode, POPOUT_ITEM.PAGE);
						// item from listings
					} else if (addedNode.tagName.toLowerCase() === "app-stall-view") {
						// adjust stall
						// await customStall(location.pathname.split('/').pop() ?? '');
					} else if (addedNode.tagName === "ITEM-CARD") {
						await adjustItem(addedNode, addedNode.className.includes("flex-item") ? POPOUT_ITEM.NONE : POPOUT_ITEM.SIMILAR);
					} else if (addedNode.className.toString().includes("mat-mdc-row")) {
						// row of the latest sales table of an item popup
						await adjustSalesTableRow(addedNode);
					} else if (location.pathname === "/profile/offers" && addedNode.className.startsWith("container")) {
						// item in the offers page when switching from another page
						await adjustOfferContainer(addedNode);
					} else if (location.pathname === "/profile/offers" && addedNode.className.toString().includes("mat-list-item")) {
						// offer list in offers page
						offerItemClickListener(addedNode);
					} else if (addedNode.tagName.toLowerCase() === "app-markdown-dialog") {
						adjustCurrencyChangeNotice(addedNode);
					}
				}
			}
		}
	});
	observer.observe(document, { childList: true, subtree: true });
}

export async function adjustOfferContainer(container: Element) {
	const offers = Array.from(document.querySelectorAll(".offers .offer"));
	const offerIndex = offers.findIndex((el) => el.className.includes("is-selected"));
	const offer = getSpecificCSFOffer(offerIndex);

	const header = container.querySelector(".header");

	const itemName = offer.contract.item.market_hash_name;
	let itemStyle: ItemStyle = "";
	if (offer.contract.item.phase) {
		itemStyle = offer.contract.item.phase;
	} else if (offer.contract.item.paint_index === 0) {
		itemStyle = "Vanilla";
	}
	const buff_id = await getBuffMapping(itemName);
	const { priceListing, priceOrder } = await getBuffPrice(itemName, itemStyle);
	const priceFromReference = extensionSettings["csf-pricereference"] === 1 ? priceListing : priceOrder;

	const userCurrency = CSFloatHelpers.userCurrency();

	const buffContainer = generatePriceLine(
		extensionSettings["csf-pricingsource"] as MarketSource,
		buff_id,
		itemName,
		priceOrder,
		priceListing,
		priceFromReference,
		userCurrency,
		"" as DopplerPhase,
		Intl.NumberFormat("en-US", { style: "currency", currency: CSFloatHelpers.userCurrency() }),
		false,
		false
	);
	header?.insertAdjacentHTML("beforeend", buffContainer);

	const buffA = container.querySelector(".betterfloat-buff-a");
	buffA?.setAttribute("data-betterfloat", JSON.stringify({ priceOrder, priceListing, userCurrency, itemName, priceFromReference }));
}

async function adjustBargainPopup(itemContainer: Element, container: Element) {
	const itemCard = container.querySelector("item-card");
	if (!itemCard) return;
	await adjustItem(itemCard, POPOUT_ITEM.BARGAIN);

	// we have to wait for the sticker data to be loaded
	await new Promise((r) => setTimeout(r, 1100));

	const item = JSON.parse(itemContainer.getAttribute("data-betterfloat") ?? "{}") as CSFloat.ListingData;
	const buff_data = JSON.parse(itemContainer.querySelector(".betterfloat-buffprice")?.getAttribute("data-betterfloat") ?? "{}");
	const stickerData = JSON.parse(itemContainer.querySelector(".sticker-percentage")?.getAttribute("data-betterfloat") ?? "{}");

	// console.log('[BetterFloat] Bargain popup data:', itemContainer, item, buff_data, stickerData);
	if (buff_data.priceFromReference > 0 && item.min_offer_price) {
		const currency = getSymbolFromCurrency(buff_data.userCurrency);
		const minOffer = new Decimal(item.min_offer_price).div(100).minus(buff_data.priceFromReference);
		const minPercentage = minOffer.greaterThan(0) && stickerData.priceSum ? minOffer.div(stickerData.priceSum).mul(100).toDP(2).toNumber() : 0;
		const showSP = stickerData.priceSum > 0;

		const spStyle = "border-radius: 7px; padding: 2px 5px; white-space: nowrap; font-size: 14px;";
		const diffStyle = `font-size: 14px; padding: 2px 5px; border-radius: 7px; color: white; background-color: ${
			minOffer.isNegative() ? extensionSettings["csf-color-profit"] : extensionSettings["csf-color-loss"]
		}`;
		const bargainTags = `<div style="display: inline-flex; align-items: center; gap: 8px; font-size: 15px; margin-left: 10px;"><span style="${diffStyle}">${
			minOffer.isNegative() ? "-" : "+"
		}${currency}${minOffer.absoluteValue().toDP(2).toNumber()}</span><span style="border: 1px solid grey; ${spStyle} display: ${showSP ? "block" : "none"}">${minPercentage}% SP</span></div>`;

		const minContainer = container.querySelector(".minimum-offer");
		if (minContainer) {
			minContainer.insertAdjacentHTML("beforeend", bargainTags);
		}

		const inputField = container.querySelector<HTMLInputElement>("input");
		if (!inputField) return;
		inputField.parentElement?.setAttribute("style", "display: flex; align-items: center; justify-content: space-between;");
		inputField.insertAdjacentHTML(
			"afterend",
			html` <div style="position: relative; display: inline-flex; ${showSP ? "flex-direction: column; align-items: flex-end;" : "align-items: center;"} gap: 8px; font-size: 16px;">
				<span class="betterfloat-bargain-diff" style="${diffStyle} cursor: pointer;"></span>
				${showSP && `<span class="betterfloat-bargain-sp" style="${spStyle}"></span>`}
			</div>`
		);

		const diffElement = container.querySelector<HTMLElement>(".betterfloat-bargain-diff");
		const spElement = container.querySelector<HTMLElement>(".betterfloat-bargain-sp");
		let absolute = false;

		const calculateDiff = () => {
			const inputPrice = new Decimal(inputField.value ?? 0);
			if (absolute) {
				const diff = inputPrice.minus(buff_data.priceFromReference);
				if (diffElement) {
					diffElement.textContent = `${diff.isNegative() ? "-" : "+"}${currency}${diff.absoluteValue().toDP(2).toNumber()}`;
					diffElement.style.backgroundColor = `${diff.isNegative() ? extensionSettings["csf-color-profit"] : extensionSettings["csf-color-loss"]}`;
				}
			} else {
				const diff = inputPrice.div(buff_data.priceFromReference).mul(100);
				const percentage = stickerData.priceSum ? inputPrice.minus(buff_data.priceFromReference).div(stickerData.priceSum).mul(100).toDP(2) : null;
				if (diffElement) {
					diffElement.textContent = `${diff.absoluteValue().toDP(2).toNumber()}%`;
					diffElement.style.backgroundColor = `${diff.lessThan(100) ? extensionSettings["csf-color-profit"] : extensionSettings["csf-color-loss"]}`;
				}
				if (spElement && percentage) {
					spElement.textContent = `${percentage.lessThan(0) ? "0" : percentage.toNumber()}% SP`;
					spElement.style.border = "1px solid grey";
				}
			}
		};

		inputField.addEventListener("input", () => {
			calculateDiff();
		});

		diffElement?.addEventListener("click", () => {
			absolute = !absolute;
			calculateDiff();
		});
	}
}

function adjustCurrencyChangeNotice(container: Element) {
	if (!container.querySelector(".title")?.textContent?.includes("Currencies on CSFloat")) {
		return;
	}
	const warningDiv = html`
		<div style="display: flex; align-items: center; background-color: #7f101080; border-radius: 18px;">
			<img src="${ICON_EXCLAMATION}" style="height: 30px; margin: 0 10px; filter: brightness(0) saturate(100%) invert(19%) sepia(64%) saturate(3289%) hue-rotate(212deg) brightness(89%) contrast(98%);">
			<p>Please note that BetterFloat requires a page refresh after changing the currency.</p>
		</div>
		<div style="display: flex; align-items: center; justify-content: center; margin-top: 15px;">
			<button class="bf-reload mat-mdc-tooltip-trigger mdc-button mdc-button--raised mat-mdc-raised-button mat-primary mat-mdc-button-base" color="primary">
				<span class="mat-mdc-button-persistent-ripple mdc-button__ripple"></span>
				<span class="mdc-button__label"><span class="mdc-button__label"><span class="text">Refresh</span></span>
			</button>
		</div>
	`;
	container.children[0].insertAdjacentHTML("beforeend", warningDiv);
	container.children[0].querySelector("button.bf-reload")?.addEventListener("click", () => {
		location.reload();
	});
}

async function adjustSalesTableRow(container: Element) {
	const cachedSale = getFirstHistorySale();
	if (!cachedSale) {
		return;
	}

	const priceData = JSON.parse(document.querySelector(".betterfloat-big-price")?.getAttribute("data-betterfloat") ?? "{}");
	const priceDiff = new Decimal(cachedSale.price).div(100).minus(priceData.priceFromReference);
	// add Buff price difference
	const priceContainer = container.querySelector(".price-wrapper");
	if (priceContainer && priceData.priceFromReference) {
		priceContainer.querySelector("app-reference-widget")?.remove();
		const priceDiffElement = html`
			<div
				class="betterfloat-table-item-sp"
				style="font-size: 14px; padding: 2px 5px; border-radius: 7px; color: white; background-color: ${priceDiff.isNegative()
					? extensionSettings["csf-color-profit"]
					: extensionSettings["csf-color-loss"]}"
				data-betterfloat="${priceDiff.toDP(2).toNumber()}"
			>
				${priceDiff.isNegative() ? "-" : "+"}${getSymbolFromCurrency(priceData.userCurrency)}${priceDiff.absoluteValue().toDP(2).toNumber()}
			</div>
		`;
		priceContainer.insertAdjacentHTML("beforeend", priceDiffElement);
	}

	// add sticker percentage
	const appStickerView = container.querySelector<HTMLElement>("app-sticker-view");
	const stickerData = cachedSale.item.stickers;
	if (appStickerView && stickerData) {
		appStickerView.style.justifyContent = "center";
		if (stickerData.length > 0) {
			const stickerContainer = document.createElement("div");
			stickerContainer.className = "betterfloat-table-sp";
			(<HTMLElement>appStickerView).style.display = "flex";
			(<HTMLElement>appStickerView).style.alignItems = "center";

			const doChange = await changeSpContainer(stickerContainer, stickerData, priceDiff.toNumber());
			if (doChange) {
				appStickerView.appendChild(stickerContainer);
				// (<HTMLElement>appStickerView.parentElement).style.paddingRight = '0';
			}
		}
	}

	// add fade percentage
	const seedContainer = container.querySelector(".cdk-column-seed")?.firstElementChild;
	if (cachedSale.item.fade && seedContainer) {
		const fadeData = cachedSale.item.fade;
		const fadeSpan = document.createElement("span");
		fadeSpan.textContent += " (" + toTruncatedString(fadeData.percentage, 1) + "%" + (fadeData.rank < 10 ? ` - #${fadeData.rank}` : "") + ")";
		fadeSpan.setAttribute("style", "background: linear-gradient(to right,#d9bba5,#e5903b,#db5977,#6775e1); -webkit-background-clip: text; -webkit-text-fill-color: transparent;");
		seedContainer.appendChild(fadeSpan);
	}

	// add float coloring
	const itemSchema = getItemSchema(cachedSale.item);
	if (itemSchema && cachedSale.item.float_value) {
		const floatContainer = container.querySelector("td.mat-column-wear")?.firstElementChild;
		if (floatContainer) {
			floatContainer.setAttribute("style", "color: " + getFloatColoring(cachedSale.item.float_value, itemSchema.min, itemSchema.max, cachedSale.item.paint_index === 0));
		}
	}

	// add row coloring if same item
	const itemWear = document.querySelector("item-detail .wear")?.textContent;
	if (itemWear && cachedSale.item.float_value && new Decimal(itemWear).minus(cachedSale.item.float_value).absoluteValue().lt(0.0001)) {
		container.setAttribute("style", "background-color: #0b255d;");
	}
}

enum POPOUT_ITEM {
	NONE = 0,
	PAGE = 1,
	BARGAIN = 2,
	SIMILAR = 3,
}

function addScreenshotListener(container: Element, item: CSFloat.Item) {
	const screenshotButton = container.querySelector(".detail-buttons mat-icon");
	if (!screenshotButton?.textContent?.includes("photo_camera") || !item.cs2_screenshot_at) {
		return;
	}

	screenshotButton.parentElement?.addEventListener("click", async () => {
		waitForElement("app-screenshot-dialog").then((screenshotDialog) => {
			if (!screenshotDialog || !item.cs2_screenshot_at) return;
			const screenshotContainer = document.querySelector("app-screenshot-dialog");
			if (!screenshotContainer) return;

			const date = new Date(item.cs2_screenshot_at).toLocaleDateString("en-US");
			const inspectedAt = html`
				<div
					class="betterfloat-screenshot-date"
					style="position: absolute;left: 0;bottom: 25px;background-color: var(--dialog-background);-webkit-backdrop-filter: blur(var(--highlight-blur));backdrop-filter: blur(var(--highlight-blur));padding: 5px 10px;font-size: 14px;border-top-right-radius: 6px;color: var(--subtext-color);z-index: 2;"
				>
					<span>Inspected at ${date}</span>
				</div>
			`;

			screenshotContainer.querySelector(".mat-mdc-tab-body-wrapper")?.insertAdjacentHTML("beforeend", inspectedAt);
		});
	});
}

async function adjustItem(container: Element, popout = POPOUT_ITEM.NONE) {
	if (popout === POPOUT_ITEM.PAGE || popout === POPOUT_ITEM.BARGAIN) {
		await new Promise((r) => setTimeout(r, 500));
	}
	const item = getFloatItem(container);
	// console.log('[BetterFloat] Adjusting item:', item);
	if (Number.isNaN(item.price)) return;
	const priceResult = await addBuffPrice(item, container, popout);
	// Currency up until this moment is stricly the user's local currency, however the sticker %
	// is done stricly in USD, we have to make sure the price difference reflects that
	const cachedItem = getFirstCSFItem();
	// POPOUT_ITEM.NONE
	if (cachedItem) {
		if (item.name !== cachedItem.item.item_name) {
			console.log("[BetterFloat] Item name mismatch:", item.name, cachedItem.item.item_name);
			return;
		}
		if (extensionSettings["csf-stickerprices"] && item.price > 0) {
			await addStickerInfo(container, cachedItem, priceResult.price_difference);
		} else {
			adjustExistingSP(container);
		}
		if (extensionSettings["csf-listingage"]) {
			addListingAge(container, cachedItem, false);
		}
		CSFloatHelpers.storeApiItem(container, cachedItem);

		if (extensionSettings["csf-floatcoloring"]) {
			addFloatColoring(container, cachedItem);
		}
		if (extensionSettings["csf-removeclustering"]) {
			removeClustering(container);
		}

		addBargainListener(container);
		addScreenshotListener(container, cachedItem.item);
		if (extensionSettings["csf-showbargainprice"]) {
			await showBargainPrice(container, cachedItem, popout);
		}

		patternDetections(container, cachedItem, false);

		if (extensionSettings["csf-showingamess"]) {
			addItemScreenshot(container, cachedItem.item);
		}
	} else if (popout > 0) {
		// need timeout as request is only sent after popout has been loaded
		await new Promise((r) => setTimeout(r, 1000));
		const itemPreview = document.getElementsByClassName("item-" + location.pathname.split("/").pop())[0];

		let apiItem = CSFloatHelpers.getApiItem(itemPreview);
		// if this is the first launch, the item has to be newly retrieved by the api
		if (!apiItem) {
			apiItem = popout === POPOUT_ITEM.PAGE ? getCSFPopupItem() : JSON.parse(container.getAttribute("data-betterfloat") ?? "{}");
		}

		if (apiItem?.id) {
			console.log("[BetterFloat] Popout item data:", apiItem);
			await addStickerInfo(container, apiItem, priceResult.price_difference);
			addListingAge(container, apiItem, true);
			await patternDetections(container, apiItem, true);
			addFloatColoring(container, apiItem);
			if (popout === POPOUT_ITEM.PAGE) {
				addQuickLinks(container, apiItem);
				copyNameOnClick(container);
			}
			CSFloatHelpers.storeApiItem(container, apiItem);
			await showBargainPrice(container, apiItem, popout);
			if (extensionSettings["csf-showingamess"] || popout === POPOUT_ITEM.PAGE) {
				addItemScreenshot(container, apiItem.item);
			}
			addScreenshotListener(container, apiItem.item);
		}
		addBargainListener(container);
	}
}

function addItemScreenshot(container: Element, item: CSFloat.Item) {
	if (!item.cs2_screenshot_id) return;

	const imgContainer = container.querySelector<HTMLImageElement>("app-item-image-actions img.item-img");
	if (!imgContainer) return;

	imgContainer.src = `https://s.csfloat.com/m/${item.cs2_screenshot_id}/playside.png?v=2`;
	imgContainer.style.objectFit = "contain";
}

async function showBargainPrice(container: Element, listing: CSFloat.ListingData, popout: POPOUT_ITEM) {
	const buttonLabel = container.querySelector(".bargain-btn > button > span.mdc-button__label");
	if (listing.min_offer_price && buttonLabel && !buttonLabel.querySelector(".betterfloat-minbargain-label")) {
		const { userCurrency, currencyRate } = await getCurrencyRate();
		const minBargainLabel = html`
			<span class="betterfloat-minbargain-label" style="color: slategrey;">
				(${popout === POPOUT_ITEM.PAGE ? "min. " : ""}${Intl.NumberFormat("en-US", { style: "currency", currency: userCurrency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(
					new Decimal(listing.min_offer_price).mul(currencyRate).div(100).toDP(2).toNumber()
				)})
			</span>
		`;

		buttonLabel.insertAdjacentHTML("beforeend", minBargainLabel);
		if (popout === POPOUT_ITEM.PAGE) {
			buttonLabel.setAttribute("style", "display: flex; flex-direction: column;");
		}
	}
}

function addBargainListener(container: Element | null) {
	if (!container) return;
	const bargainBtn = container.querySelector(".bargain-btn > button");
	if (bargainBtn) {
		bargainBtn.addEventListener("click", () => {
			let tries = 10;
			const interval = setInterval(async () => {
				if (tries-- <= 0) {
					clearInterval(interval);
					return;
				}
				const bargainPopup = document.querySelector("app-make-offer-dialog");
				if (bargainPopup) {
					clearInterval(interval);
					await adjustBargainPopup(container, bargainPopup);
				}
			}, 500);
		});
	}
}

function copyNameOnClick(container: Element) {
	const itemName = container.querySelector("app-item-name");
	if (itemName) {
		itemName.setAttribute("style", "cursor: pointer;");
		itemName.setAttribute("title", "Click to copy item name");
		itemName.addEventListener("click", () => {
			const name = itemName.textContent;
			if (name) {
				navigator.clipboard.writeText(name);
				itemName.setAttribute("title", "Copied!");
				itemName.setAttribute("style", "cursor: default;");
				setTimeout(() => {
					itemName.setAttribute("title", "Click to copy item name");
					itemName.setAttribute("style", "cursor: pointer;");
				}, 2000);
			}
		});
	}
}

type QuickLink = {
	icon: string;
	tooltip: string;
	link: string;
};

function addQuickLinks(container: Element, listing: CSFloat.ListingData) {
	const actionsContainer = document.querySelector(".item-actions");
	if (!actionsContainer) return;

	actionsContainer.setAttribute("style", "flex-wrap: wrap;");
	const quickLinks: QuickLink[] = [
		{
			icon: ICON_CSGOSTASH,
			tooltip: "Show CSGOStash Page",
			link: "https://csgostash.com/markethash/" + listing.item.market_hash_name,
		},
		{
			icon: ICON_PRICEMPIRE,
			tooltip: "Show Pricempire Page",
			link: createPricempireURL(container, listing.item),
		},
	];
	// inventory link if seller stall is public
	if (listing.seller.stall_public) {
		quickLinks.push({
			icon: ICON_STEAM,
			tooltip: "Show in Seller's Inventory",
			link: "https://steamcommunity.com/profiles/" + listing.seller.steam_id + "/inventory/#730_2_" + listing.item.asset_id,
		});
	}

	const quickLinksContainer = html`
		<div class="betterfloat-quicklinks" style="flex-basis: 100%; display: flex; justify-content: space-evenly;">
			${quickLinks
				.map(
					(link) => html`
						<div class="bf-tooltip">
							<a class="mat-icon-button" href="${link.link}" target="_blank">
								<img src="${link.icon}" style="height: 24px; border-radius: 5px; vertical-align: middle;" />
							</a>
							<div class="bf-tooltip-inner" style="translate: -60px 10px; width: 140px;">
								<span>${link.tooltip}</span>
							</div>
						</div>
					`
				)
				.join("")}
		</div>
	`;

	if (!actionsContainer.querySelector(".betterfloat-quicklinks")) {
		actionsContainer.insertAdjacentHTML("beforeend", quickLinksContainer);
	}
}

function createPricempireURL(container: Element, item: CSFloat.Item) {
	const pricempireType = (item: CSFloat.Item) => {
		if (item.type === "container" && !item.item_name.includes("Case")) {
			return "sticker-capsule";
		}
		return item.type;
	};
	const sanitizeURL = (url: string) => {
		return url.replace(/\s\|/g, "").replace("(", "").replace(")", "").replace("™", "").replace("★ ", "").replace(/\s+/g, "-");
	};
	return `https://pricempire.com/item/cs2/${pricempireType(item)}/${sanitizeURL(createBuffName(getFloatItem(container)).toLowerCase())}${
		item.phase ? `-${sanitizeURL(item.phase.toLowerCase())}` : ""
	}`;
}

function removeClustering(container: Element) {
	const sellerDetails = container.querySelector("div.seller-details-wrapper");
	if (sellerDetails) {
		sellerDetails.setAttribute("style", "display: none;");
	}
}

function getItemSchema(item: CSFloat.Item): CSFloat.ItemSchema.SingleSchema | null {
	if (item.type !== "skin") {
		return null;
	}

	if (!ITEM_SCHEMA) {
		ITEM_SCHEMA = JSON.parse(window.sessionStorage.ITEM_SCHEMA || "{}");
	}

	if (Object.keys(ITEM_SCHEMA ?? {}).length === 0) {
		return null;
	}

	const names = item.item_name.split(" | ");
	if (names[0].includes("★")) {
		names[0] = names[0].replace("★ ", "");
	}
	if (item.paint_index === 0) {
		names[1] = "Vanilla";
	}
	if (item.phase) {
		names[1] += ` (${item.phase})`;
	}

	// @ts-ignore
	const schemaItem = Object.values(Object.values((<CSFloat.ItemSchema.TypeSchema>ITEM_SCHEMA).weapons).find((el) => el.name === names[0])["paints"]).find(
		(el) => el.name === names[1]
	) as CSFloat.ItemSchema.SingleSchema;

	return schemaItem;
}

function addFloatColoring(container: Element, listing: CSFloat.ListingData) {
	if (!listing.item.float_value) return;
	const itemSchema = getItemSchema(listing.item);

	const element = container.querySelector<HTMLElement>("div.wear");
	if (element) {
		element.style.color = getFloatColoring(listing.item.float_value, itemSchema?.min ?? 0, itemSchema?.max ?? 1);
	}
}

async function patternDetections(container: Element, listing: CSFloat.ListingData, isPopout: boolean) {
	const item = listing.item;
	if (item.item_name.includes("Case Hardened")) {
		if (extensionSettings["csf-csbluegem"] || isPopout) {
			await caseHardenedDetection(container, item, isPopout);
		}
	} else if (item.item_name.includes("Fade")) {
		await addFadePercentages(container, item);
	} else if ((item.item_name.includes("Crimson Web") || item.item_name.includes("Emerald Web")) && item.item_name.startsWith("★")) {
		await webDetection(container, item);
	} else if (item.item_name.includes("Specialist Gloves | Crimson Kimono")) {
		await badgeCKimono(container, item);
	} else if (item.item_name.includes("Phoenix Blacklight")) {
		await badgePhoenix(container, item);
	} else if (item.item_name.includes("Overprint")) {
		await badgeOverprint(container, item);
	}
	// else if (item.item_name.includes('Karambit | Gamma Doppler') && item.phase == 'Phase 3') {
	// 	await badgeCyanbit(container, item);
	// }
}

async function badgeOverprint(container: Element, item: CSFloat.Item) {
	const overprint_data = await OverprintMapping.getPattern(item.paint_seed!);
	if (!overprint_data) return;

	const getTooltipStyle = (type: typeof overprint_data.type) => {
		switch (type) {
			case "Flower":
				return "translate: -15px 15px; width: 55px;";
			case "Arrow":
				return "translate: -25px 15px; width: 100px;";
			case "Polygon":
				return "translate: -25px 15px; width: 100px;";
			case "Mixed":
				return "translate: -15px 15px; width: 55px;";
			default:
				return "";
		}
	};

	const badgeStyle = "color: lightgrey; font-size: 18px; font-weight: 500;" + (overprint_data.type === "Flower" ? " margin-left: 5px;" : "");

	const iconMapping = {
		Flower: ICON_OVERPRINT_FLOWER,
		Arrow: ICON_OVERPRINT_ARROW,
		Polygon: ICON_OVERPRINT_POLYGON,
		Mixed: ICON_OVERPRINT_MIXED,
	};
	CSFloatHelpers.addPatternBadge(
		container,
		iconMapping[overprint_data.type],
		"height: 30px; filter: brightness(0) saturate(100%) invert(79%) sepia(65%) saturate(2680%) hue-rotate(125deg) brightness(95%) contrast(95%);",
		[`"${overprint_data.type}" Pattern`].concat(overprint_data.tier === 0 ? [] : [`Tier ${overprint_data.tier}`]),
		getTooltipStyle(overprint_data.type),
		overprint_data.tier === 0 ? "" : "T" + overprint_data.tier,
		badgeStyle
	);
}

async function badgeCKimono(container: Element, item: CSFloat.Item) {
	const ck_data = await CrimsonKimonoMapping.getPattern(item.paint_seed!);
	if (!ck_data) return;

	const badgeStyle = "color: lightgrey; font-size: 18px; font-weight: 500; position: absolute; top: 6px;";
	if (ck_data.tier === -1) {
		CSFloatHelpers.addPatternBadge(container, ICON_CRIMSON, "height: 30px; filter: grayscale(100%);", ["T1 GRAY PATTERN"], "translate: -25px 15px; width: 80px;", "1", badgeStyle);
	} else {
		CSFloatHelpers.addPatternBadge(container, ICON_CRIMSON, "height: 30px;", [`Tier ${ck_data.tier}`], "translate: -18px 15px; width: 60px;", String(ck_data.tier), badgeStyle);
	}
}

async function badgeCyanbit(container: Element, item: CSFloat.Item) {
	const cyanbit_data = await CyanbitKarambitMapping.getPattern(item.paint_seed!);
	if (!cyanbit_data) return;

	CSFloatHelpers.addPatternBadge(
		container,
		ICON_GEM_CYAN,
		"height: 30px;",
		[`${cyanbit_data.type === "" ? "Unclassified" : cyanbit_data.type} Pattern`, cyanbit_data.tier === 0 ? "No Tier" : `Tier ${cyanbit_data.tier}`],
		"translate: -15px 15px; width: 90px;",
		"T" + cyanbit_data.tier,
		"color: #00ffff; font-size: 18px; font-weight: 600; margin-left: 2px;"
	);
}

async function badgePhoenix(container: Element, item: CSFloat.Item) {
	const phoenix_data = await PhoenixMapping.getPattern(item.paint_seed!);
	if (!phoenix_data) return;

	CSFloatHelpers.addPatternBadge(
		container,
		ICON_PHOENIX,
		"height: 30px;",
		[`Position: ${phoenix_data.type}`, `Tier ${phoenix_data.tier}`].concat(phoenix_data.rank ? [`Rank #${phoenix_data.rank}`] : []),
		"translate: -15px 15px; width: 90px;",
		"T" + phoenix_data.tier,
		"color: #d946ef; font-size: 18px; font-weight: 600;"
	);
}

async function webDetection(container: Element, item: CSFloat.Item) {
	let type = "";
	if (item.item_name.includes("Gloves")) {
		type = "gloves";
	} else {
		type = item.item_name.split("★ ")[1].split(" ")[0].toLowerCase();
	}
	const cw_data = await getCrimsonWebMapping(type as Extension.CWWeaponTypes, item.paint_seed!);
	if (!cw_data) return;
	const itemImg = container.querySelector(".item-img");
	if (!itemImg) return;

	const filter = item.item_name.includes("Crimson")
		? "brightness(0) saturate(100%) invert(13%) sepia(87%) saturate(576%) hue-rotate(317deg) brightness(93%) contrast(113%)"
		: "brightness(0) saturate(100%) invert(64%) sepia(64%) saturate(2232%) hue-rotate(43deg) brightness(84%) contrast(90%)";

	CSFloatHelpers.addPatternBadge(
		container,
		ICON_SPIDER_WEB,
		`height: 30px; filter: ${filter};`,
		[cw_data.type, `Tier ${cw_data.tier}`],
		"translate: -25px 15px; width: 80px;",
		cw_data.type === "Triple Web" ? "3" : cw_data.type === "Double Web" ? "2" : "1",
		`color: ${item.item_name.includes("Crimson") ? "lightgrey" : "white"}; font-size: 18px; font-weight: 500; position: absolute; top: 7px;`
	);
}

async function addFadePercentages(container: Element, item: CSFloat.Item) {
	const itemName = item.item_name;
	const paintSeed = item.paint_seed;
	if (!paintSeed) return;
	const weapon = itemName.split(" | ")[0];
	let fadePercentage: (FadePercentage & { background: string }) | null = null;
	if (itemName.includes("Amber Fade")) {
		fadePercentage = { ...AmberFadeCalculator.getFadePercentage(weapon, paintSeed), background: "linear-gradient(to right,#627d66,#896944,#3b2814)" };
	} else if (itemName.includes("Acid Fade")) {
		fadePercentage = { ...AcidFadeCalculator.getFadePercentage(weapon, paintSeed), background: "linear-gradient(to right,#6d5f55,#76c788, #574828)" };
	}
	if (fadePercentage) {
		const fadeContainer = html`
			<div class="bf-tooltip" style="display: flex; align-items: center; justify-content: center;">
				<div class="bf-badge-text" style="background-position-x: ${fadePercentage.percentage}%; background-image: ${fadePercentage.background};">
					<span style="color: #00000080;">${toTruncatedString(fadePercentage.percentage, 1)}</span>
				</div>
				<div class="bf-tooltip-inner" style="translate: 0 50px">
					<span>Fade: ${toTruncatedString(fadePercentage.percentage, 5)}%</span>
					<span>Rank #${fadePercentage.ranking}</span>
				</div>
			</div>
		`;
		let badgeContainer = container.querySelector(".badge-container");
		if (!badgeContainer) {
			badgeContainer = document.createElement("div");
			badgeContainer.setAttribute("style", "position: absolute; top: 5px; left: 5px;");
			container.querySelector(".item-img")?.after(badgeContainer);
		} else {
			badgeContainer = badgeContainer.querySelector(".container") ?? badgeContainer;
			badgeContainer.setAttribute("style", "gap: 5px;");
		}
		badgeContainer.insertAdjacentHTML("beforeend", fadeContainer);
	}
}

async function caseHardenedDetection(container: Element, item: CSFloat.Item, isPopout: boolean) {
	if (!item.item_name.includes("Case Hardened") || item.item_name.includes("Gloves") || !item.paint_seed || (!isPopout && item.rarity !== 6)) return;

	let patternElement: BlueGem.PatternData | null = null;
	const userCurrency = CSFloatHelpers.userCurrency();
	const currencySymbol = getSymbolFromCurrency(userCurrency) ?? "$";
	let type = "";
	if (item.item_name.startsWith("★")) {
		type = item.item_name.split(" | ")[0].split("★ ")[1];
	} else {
		type = item.item_name.split(" | ")[0];
	}

	// retrieve the stored data instead of fetching newly
	if (!isPopout) {
		patternElement = await fetchCSBlueGemPatternData(type, item.paint_seed);
		container.setAttribute("data-csbluegem", JSON.stringify(patternElement));
	} else {
		const itemPreview = document.getElementsByClassName("item-" + location.pathname.split("/").pop())[0];
		const csbluegem = itemPreview?.getAttribute("data-csbluegem");
		if (csbluegem && csbluegem.length > 0) {
			patternElement = JSON.parse(csbluegem);
		}
	}

	// add gem icon and blue gem percent if item is a knife
	if (item.rarity === 6) {
		let tierContainer = container.querySelector(".badge-container");
		if (!tierContainer) {
			tierContainer = document.createElement("div");
			tierContainer.setAttribute("style", "position: absolute; top: 5px; left: 5px;");
			container.querySelector(".item-img")?.after(tierContainer);
		} else {
			tierContainer = tierContainer.querySelector(".container") ?? tierContainer;
			tierContainer.setAttribute("style", "gap: 5px;");
		}
		const gemContainer = genGemContainer(patternElement);
		gemContainer.setAttribute("style", "display: flex; align-items: center; justify-content: flex-end;");
		tierContainer.appendChild(gemContainer);
	}

	if (!isPopout) {
		return;
	}

	// past sales table
	const pastSales = await fetchCSBlueGemPastSales({ type, paint_seed: item.paint_seed, currency: userCurrency });
	const gridHistory = document.querySelector(".grid-history");
	if (!gridHistory) return;
	const salesHeader = document.createElement("mat-button-toggle");
	salesHeader.setAttribute("role", "presentation");
	salesHeader.className = "mat-button-toggle mat-button-toggle-appearance-standard";
	salesHeader.innerHTML = `<button type="button" class="mat-button-toggle-button mat-focus-indicator" aria-pressed="false"><span class="mat-button-toggle-label-content" style="color: deepskyblue;">Buff Pattern Sales (${pastSales.length})</span></button>`;
	gridHistory.querySelector("mat-button-toggle-group.sort")?.appendChild(salesHeader);
	salesHeader.addEventListener("click", () => {
		Array.from(gridHistory.querySelectorAll("mat-button-toggle") ?? []).forEach((element) => {
			element.className = element.className.replace("mat-button-toggle-checked", "");
		});
		salesHeader.className += " mat-button-toggle-checked";

		const tableBody = document.createElement("tbody");
		pastSales.forEach((sale) => {
			const saleHtml = html`
				<tr role="row" class="mat-mdc-row mdc-data-table__row cdk-row">
					<td role="cell" class="mat-mdc-cell mdc-data-table__cell cdk-cell">
						<img src="${sale.sale_data.origin === "CSFloat" ? ICON_CSFLOAT : ICON_BUFF}" style="height: 28px; border: 1px solid dimgray; border-radius: 4px;" />
					</td>
					<td role="cell" class="mat-mdc-cell mdc-data-table__cell cdk-cell">${sale.sale_data.date}</td>
					<td role="cell" class="mat-mdc-cell mdc-data-table__cell cdk-cell">${currencySymbol}${sale.sale_data.price}</td>
					<td role="cell" class="mat-mdc-cell mdc-data-table__cell cdk-cell">
						${sale.isStattrak ? '<span style="color: rgb(255, 120, 44); margin-right: 5px;">StatTrak™</span>' : ""}
						<span>${sale.float}</span>
					</td>
					<td role="cell" class="mat-mdc-tooltip-trigger action">
						${sale.sale_data.inspect
							? html`
									<a href="${sale.sale_data.inspect}" target="_blank" title="Show Buff screenshot">
										<mat-icon role="img" class="mat-icon notranslate material-icons mat-ligature-font mat-icon-no-color">photo_camera</mat-icon>
									</a>
							  `
							: ""}
						${sale.sale_data.inspect_playside
							? html`
									<a href="${sale.sale_data.inspect_playside}" target="_blank" title="Show CSFloat font screenshot">
										<mat-icon role="img" class="mat-icon notranslate material-icons mat-ligature-font mat-icon-no-color">photo_camera</mat-icon>
									</a>
									<a href="${sale.sale_data.inspect_backside}" target="_blank" title="Show CSFloat back screenshot">
										<img
											src="${ICON_CAMERA_FLIPPED}"
											style="height: 24px; translate: 7px 0; filter: brightness(0) saturate(100%) invert(39%) sepia(52%) saturate(4169%) hue-rotate(201deg) brightness(113%) contrast(101%);"
										/>
									</a>
							  `
							: ""}
					</td>
				</tr>
			`;
			tableBody.insertAdjacentHTML("beforeend", saleHtml);
		});
		const outerContainer = document.createElement("div");
		outerContainer.setAttribute("style", "width: 100%; height: 100%; padding: 10px; background-color: rgba(193, 206, 255, .04);border-radius: 6px; box-sizing: border-box;");
		const innerContainer = document.createElement("div");
		innerContainer.className = "table-container slimmed-table";
		innerContainer.setAttribute("style", "height: 100%;overflow-y: auto;overflow-x: hidden;overscroll-behavior: none;");
		const table = document.createElement("table");
		table.className = "mat-mdc-table mdc-data-table__table cdk-table bf-table";
		table.setAttribute("role", "table");
		table.setAttribute("style", "width: 100%;");
		const header = document.createElement("thead");
		header.setAttribute("role", "rowgroup");
		const tableTr = document.createElement("tr");
		tableTr.setAttribute("role", "row");
		tableTr.className = "mat-mdc-header-row mdc-data-table__header-row cdk-header-row ng-star-inserted";
		const headerValues = ["Source", "Date", "Price", "Float Value"];
		for (let i = 0; i < headerValues.length; i++) {
			const headerCell = document.createElement("th");
			headerCell.setAttribute("role", "columnheader");
			const headerCellStyle = `text-align: center; color: #9EA7B1; letter-spacing: .03em; background: rgba(193, 206, 255, .04); ${
				i === 0 ? "border-top-left-radius: 10px; border-bottom-left-radius: 10px" : ""
			}`;
			headerCell.setAttribute("style", headerCellStyle);
			headerCell.className = "mat-mdc-header-cell mdc-data-table__header-cell ng-star-inserted";
			headerCell.textContent = headerValues[i];
			tableTr.appendChild(headerCell);
		}
		const linkHeaderCell = document.createElement("th");
		linkHeaderCell.setAttribute("role", "columnheader");
		linkHeaderCell.setAttribute(
			"style",
			"text-align: center; color: #9EA7B1; letter-spacing: .03em; background: rgba(193, 206, 255, .04); border-top-right-radius: 10px; border-bottom-right-radius: 10px"
		);
		linkHeaderCell.className = "mat-mdc-header-cell mdc-data-table__header-cell ng-star-inserted";
		const linkHeader = document.createElement("a");
		linkHeader.setAttribute("href", `https://csbluegem.com/search?skin=${type}&pattern=${item.paint_seed}&currency=USD&filter=date&sort=descending`);
		linkHeader.setAttribute("target", "_blank");
		linkHeader.innerHTML = ICON_ARROWUP_SMALL;
		linkHeaderCell.appendChild(linkHeader);
		tableTr.appendChild(linkHeaderCell);
		header.appendChild(tableTr);
		table.appendChild(header);
		table.appendChild(tableBody);
		innerContainer.appendChild(table);
		outerContainer.appendChild(innerContainer);

		const historyChild = gridHistory.querySelector(".history-component")?.firstElementChild;
		if (historyChild?.firstElementChild) {
			historyChild.removeChild(historyChild.firstElementChild);
			historyChild.appendChild(outerContainer);
		}
	});
}

function adjustExistingSP(container: Element) {
	const spContainer = container.querySelector(".sticker-percentage");
	let spValue = spContainer?.textContent!.trim().split("%")[0];
	if (!spValue || !spContainer) return;
	if (spValue.startsWith(">")) {
		spValue = spValue.substring(1);
	}
	const backgroundImageColor = getSPBackgroundColor(Number(spValue) / 100);
	(<HTMLElement>spContainer).style.backgroundColor = backgroundImageColor;
}

function addListingAge(container: Element, cachedItem: CSFloat.ListingData, isPopout: boolean) {
	if ((isPopout && container.querySelector(".item-card.large .betterfloat-listing-age")) || (!isPopout && container.querySelector(".betterfloat-listing-age"))) {
		return;
	}

	const listingAge = html`
		<div class="betterfloat-listing-age" style="display: flex; align-items: flex-end;">
			<p style="margin: 0 5px 0 0; font-size: 13px; color: #9EA7B1;">${calculateTime(cachedItem.created_at)}</p>
			<img src="${ICON_CLOCK}" style="height: 16px; filter: brightness(0) saturate(100%) invert(59%) sepia(55%) saturate(3028%) hue-rotate(340deg) brightness(101%) contrast(101%);" />
		</div>
	`;

	const parent = container.querySelector<HTMLElement>(".top-right-container");
	if (parent) {
		parent.style.flexDirection = "column";
		parent.style.alignItems = "flex-end";
		parent.insertAdjacentHTML("afterbegin", listingAge);
		const action = parent.querySelector(".action");
		if (action) {
			const newParent = document.createElement("div");
			newParent.style.display = "inline-flex";
			newParent.style.justifyContent = "flex-end";
			newParent.appendChild(action);
			parent.appendChild(newParent);
		}
	}
}

async function addStickerInfo(container: Element, cachedItem: CSFloat.ListingData, price_difference: number) {
	// quality 12 is souvenir
	if (!cachedItem.item?.stickers || cachedItem.item?.quality === 12) {
		return;
	}

	const csfSP = container.querySelector(".sticker-percentage");
	if (csfSP) {
		const didChange = await changeSpContainer(csfSP, cachedItem.item.stickers, price_difference);
		if (!didChange) {
			csfSP.remove();
		}
	}
}

// returns if the SP container was created, so priceSum > 1
async function changeSpContainer(csfSP: Element, stickers: CSFloat.StickerData[], price_difference: number) {
	const source = extensionSettings["csf-pricingsource"] as MarketSource;
	const { userCurrency, currencyRate } = await getCurrencyRate();
	const stickerPrices = await Promise.all(stickers.map(async (s) => await getItemPrice(s.name, source)));

	const priceSum = stickerPrices.reduce((a, b) => a + b.starting_at * currencyRate, 0);

	const spPercentage = price_difference / priceSum;
	// don't display SP if total price is below $1
	csfSP.setAttribute("data-betterfloat", JSON.stringify({ priceSum, spPercentage }));
	if (priceSum >= 2) {
		const backgroundImageColor = getSPBackgroundColor(spPercentage);
		if (spPercentage > 2 || spPercentage < 0.005) {
			const CurrencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: userCurrency, minimumFractionDigits: 0, maximumFractionDigits: 2 });
			csfSP.textContent = `${CurrencyFormatter.format(Number(priceSum.toFixed(0)))} SP`;
		} else {
			csfSP.textContent = (spPercentage > 0 ? spPercentage * 100 : 0).toFixed(1) + "% SP";
		}
		(<HTMLElement>csfSP).style.backgroundColor = backgroundImageColor;
		(<HTMLElement>csfSP).style.marginBottom = "5px";
		return true;
	} else {
		return false;
	}
}

const parsePrice = (textContent: string) => {
	const regex = /([A-Za-z]+)\s+(\d+)/;
	const priceText = textContent.trim().replace(regex, "$1$2").split(/\s/);
	let price: number;
	let currency = "$";
	if (priceText.includes("Bids")) {
		price = 0;
	} else {
		let pricingText: string;
		if (location.pathname === "/sell") {
			pricingText = priceText[1].split("Price")[1];
		} else {
			pricingText = priceText[0];
		}
		if (pricingText.split(/\s/).length > 1) {
			const parts = pricingText.replace(",", "").replace(".", "").split(/\s/);
			price = Number(parts.filter((x) => !isNaN(+x)).join("")) / 100;
			currency = parts.filter((x) => isNaN(+x))[0];
		} else {
			const firstDigit = Array.from(pricingText).findIndex((x) => !isNaN(Number(x)));
			currency = pricingText.substring(0, firstDigit);
			price = Number(pricingText.substring(firstDigit).replace(",", "").replace(".", "")) / 100;
		}
	}
	return { price, currency };
};

function getFloatItem(container: Element): CSFloat.FloatItem {
	const nameContainer = container.querySelector("app-item-name");
	const priceContainer = container.querySelector(".price");
	const header_details = <Element>nameContainer?.querySelector(".subtext");

	const name = nameContainer?.querySelector(".item-name")?.textContent?.replace("\n", "").trim();
	// replace potential spaces between currency characters and price
	const { price } = parsePrice(priceContainer?.textContent ?? "");
	let condition: ItemCondition = "";
	let quality = "";
	let style: ItemStyle = "";

	if (header_details) {
		header_details.childNodes.forEach((node) => {
			switch (node.nodeType) {
				case Node.ELEMENT_NODE: {
					const text = node.textContent?.trim();
					if (text && (text.includes("StatTrak") || text.includes("Souvenir") || text.includes("Container") || text.includes("Sticker") || text.includes("Agent"))) {
						// TODO: integrate the ItemQuality type
						// https://stackoverflow.com/questions/51528780/typescript-check-typeof-against-custom-type
						quality = text;
					} else {
						style = text?.substring(1, text.length - 1) as ItemStyle;
					}
					break;
				}
				case Node.TEXT_NODE:
					condition = (node.textContent?.trim() ?? "") as ItemCondition;
					break;
				default:
					break;
			}
		});
	}

	if (!name?.includes("|")) {
		style = "Vanilla";
	}
	return {
		name: name ?? "",
		quality: quality,
		style: style,
		condition: condition,
		price: price,
	};
}

async function getCurrencyRate() {
	const userCurrency = CSFloatHelpers.userCurrency();
	let currencyRate = await getCSFCurrencyRate(userCurrency);
	if (!currencyRate) {
		console.warn(`[BetterFloat] Could not get currency rate for ${userCurrency}`);
		currencyRate = 1;
	}
	return { userCurrency, currencyRate };
}

async function getBuffItem(item: CSFloat.FloatItem) {
	const source = extensionSettings["csf-pricingsource"] as MarketSource;
	const buff_name = handleSpecialStickerNames(createBuffName(item));
	let buff_id: number | undefined = source === MarketSource.Buff ? await getBuffMapping(buff_name) : undefined;

	const pricingData = await getBuffPrice(buff_name, item.style, source);

	if (source === MarketSource.Buff && isBuffBannedItem(buff_name)) {
		pricingData.priceListing = new Decimal(0);
		pricingData.priceOrder = new Decimal(0);
		buff_id = undefined;
	}

	const { currencyRate } = await getCurrencyRate();

	let priceFromReference = pricingData.priceOrder && extensionSettings["csf-pricereference"] === 0 ? pricingData.priceOrder : pricingData.priceListing;

	priceFromReference = priceFromReference?.mul(currencyRate);

	return {
		buff_name: buff_name,
		buff_id: buff_id,
		priceListing: pricingData.priceListing?.mul(currencyRate),
		priceOrder: pricingData.priceOrder?.mul(currencyRate),
		priceFromReference,
		difference: new Decimal(item.price).minus(priceFromReference ?? 0),
	};
}

async function addBuffPrice(
	item: CSFloat.FloatItem,
	container: Element,
	popout: POPOUT_ITEM
): Promise<{
	price_difference: number;
}> {
	const source = extensionSettings["csf-pricingsource"] as MarketSource;
	const isSellTab = location.pathname === "/sell";
	const isPopout = popout === POPOUT_ITEM.PAGE;

	const priceContainer = container.querySelector<HTMLElement>(isSellTab ? ".price" : ".price-row");
	const userCurrency = CSFloatHelpers.userCurrency();
	const CurrencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: userCurrency, minimumFractionDigits: 0, maximumFractionDigits: 2 });
	const isDoppler = item.name.includes("Doppler");

	const { buff_name, buff_id, priceListing, priceOrder, priceFromReference, difference } = await getBuffItem(item);
	const itemExists =
		(source === MarketSource.Buff && (buff_id! > 0 || priceOrder?.gt(0))) ||
		source === MarketSource.Steam ||
		(source === MarketSource.C5Game && priceListing) ||
		(source === MarketSource.YouPin && priceListing);

	if (priceContainer && !container.querySelector(".betterfloat-buffprice") && popout !== POPOUT_ITEM.SIMILAR && itemExists) {
		const buffContainer = generatePriceLine(
			source,
			buff_id,
			buff_name,
			priceOrder,
			priceListing,
			priceFromReference,
			userCurrency,
			item.style as DopplerPhase,
			CurrencyFormatter,
			isDoppler,
			isPopout
		);

		if (!container.querySelector(".betterfloat-buffprice")) {
			if (isSellTab) {
				priceContainer.outerHTML = buffContainer;
			} else {
				priceContainer.insertAdjacentHTML("afterend", buffContainer);
			}
		}
	}

	// add link to steam market
	if (extensionSettings["csf-steamlink"] && buff_name) {
		const flexGrow = container.querySelector("div.seller-details > div");
		if (flexGrow) {
			const steamImg = html`
				<a href="https://steamcommunity.com/market/listings/730/${encodeURIComponent(buff_name)}" target="_blank">
					<img src="${ICON_STEAM}" style="height: 18px; translate: 0px 2px;" />
				</a>
			`;
			flexGrow?.insertAdjacentHTML("afterend", steamImg);
		}
	}

	// edge case handling: reference price may be a valid 0 for some paper stickers etc.
	if (
		extensionSettings["csf-buffdifference"] &&
		!priceContainer?.querySelector(".betterfloat-sale-tag") &&
		item.price !== 0 &&
		(priceFromReference?.isPositive() || item.price < 0.06) &&
		location.pathname !== "/sell" &&
		itemExists
	) {
		const priceContainer = container.querySelector<HTMLElement>(".price-row");
		const priceIcon = priceContainer?.querySelector("app-price-icon");
		const floatAppraiser = priceContainer?.querySelector(".reference-widget-container");

		if (priceIcon) {
			priceContainer?.removeChild(priceIcon);
		}
		if (floatAppraiser && !isPopout) {
			priceContainer?.removeChild(floatAppraiser);
		}

		let backgroundColor: string;
		let differenceSymbol: string;
		if (difference.isNegative()) {
			backgroundColor = extensionSettings["csf-color-profit"];
			differenceSymbol = "-";
		} else if (difference.isPos()) {
			backgroundColor = extensionSettings["csf-color-loss"];
			differenceSymbol = "+";
		} else {
			backgroundColor = extensionSettings["csf-color-neutral"];
			differenceSymbol = "-";
		}

		const saleTag = document.createElement("span");
		saleTag.setAttribute("class", "betterfloat-sale-tag");
		saleTag.style.backgroundColor = backgroundColor;
		saleTag.setAttribute("data-betterfloat", String(difference));
		// tags may get too long, so we may need to break them into two lines
		const saleDiff = html` <span> ${differenceSymbol}${CurrencyFormatter.format(difference.abs().toNumber())} </span> `;
		let saleTagInner = saleDiff;
		if (extensionSettings["csf-buffdifferencepercent"] && priceFromReference) {
			const percentage = new Decimal(item.price).div(priceFromReference).times(100);
			if (percentage.isFinite()) {
				const decimalPlaces = percentage.greaterThan(200) ? 0 : percentage.greaterThan(150) ? 1 : 2;
				saleTagInner += html`<span class="betterfloat-sale-tag-percentage" style="margin-left: 5px;"> (${percentage.toDP(decimalPlaces).toNumber()}%) </span>`;
			}
		}
		saleTag.innerHTML = saleTagInner;

		if (isPopout && floatAppraiser) {
			priceContainer?.insertBefore(saleTag, floatAppraiser);
		} else {
			priceContainer?.appendChild(saleTag);
		}
		if ((item.price > 999 || (priceContainer?.textContent?.length ?? 0) > 24) && !isPopout) {
			saleTag.style.flexDirection = "column";
			saleTag.querySelector(".betterfloat-sale-tag-percentage")?.setAttribute("style", "margin-left: 0;");
		}
	}

	// add event listener to bargain button if it exists
	const bargainButton = container.querySelector<HTMLButtonElement>("button.mat-stroked-button");
	if (bargainButton && !bargainButton.disabled) {
		bargainButton.addEventListener("click", () => {
			setTimeout(() => {
				const listing = container.getAttribute("data-betterfloat");
				const bargainPopup = document.querySelector("app-make-offer-dialog");
				if (bargainPopup && listing) {
					bargainPopup.querySelector("item-card")?.setAttribute("data-betterfloat", listing);
				}
			}, 100);
		});
	}

	return {
		price_difference: difference.toNumber(),
	};
}

function generatePriceLine(
	source: MarketSource,
	buff_id: number | undefined,
	buff_name: string,
	priceOrder: Decimal | undefined,
	priceListing: Decimal | undefined,
	priceFromReference: Decimal | undefined,
	userCurrency: string,
	itemStyle: DopplerPhase,
	CurrencyFormatter: Intl.NumberFormat,
	isDoppler: boolean,
	isPopout: boolean
) {
	const href = getMarketURL({ source, buff_id, buff_name, phase: isDoppler ? itemStyle : undefined });
	let icon = "";
	let iconStyle = "height: 20px; margin-right: 5px;";
	switch (source) {
		case MarketSource.Buff:
			icon = ICON_BUFF;
			iconStyle += " border: 1px solid dimgray; border-radius: 4px;";
			break;
		case MarketSource.Steam:
			icon = ICON_STEAM;
			break;
		case MarketSource.C5Game:
			icon = ICON_C5GAME;
			iconStyle += " border: 1px solid black; border-radius: 4px;";
			break;
		case MarketSource.YouPin:
			icon = ICON_YOUPIN;
			iconStyle += " border: 1px solid black; border-radius: 4px;";
			break;
	}
	const isWarning = priceOrder?.gt(priceListing ?? 0);
	const extendedDisplay = priceOrder?.lt(100) && priceListing?.lt(100) && !isWarning;
	const buffContainer = html`
		<a class="betterfloat-buff-a" href="${href}" target="_blank" style="display: inline-flex; align-items: center; font-size: 15px;">
			<img src="${icon}" style="${iconStyle}" />
			<div class="betterfloat-buffprice ${isPopout ? "betterfloat-big-price" : ""}" data-betterfloat="${JSON.stringify({ buff_name, priceFromReference, userCurrency })}">
				${[MarketSource.Buff, MarketSource.Steam].includes(source)
					? html`
							<span class="betterfloat-buff-tooltip">
								Bid: Highest buy order price;
								<br />
								Ask: Lowest listing price
							</span>
							<span style="color: orange;"> ${extendedDisplay ? "Bid " : ""}${CurrencyFormatter.format(priceOrder?.toNumber() ?? 0)} </span>
							<span style="color: gray;margin: 0 3px 0 3px;">|</span>
							<span style="color: greenyellow;"> ${extendedDisplay ? "Ask " : ""}${CurrencyFormatter.format(priceListing?.toNumber() ?? 0)} </span>
					  `
					: html` <span style="color: white;"> ${CurrencyFormatter.format(priceListing?.toNumber() ?? 0)} </span> `}
			</div>
			${(source === MarketSource.Buff || source === MarketSource.Steam) && isWarning
				? html`
						<img
							src="${ICON_EXCLAMATION}"
							style="height: 20px; margin-left: 5px; filter: brightness(0) saturate(100%) invert(28%) sepia(95%) saturate(4997%) hue-rotate(3deg) brightness(103%) contrast(104%);"
						/>
				  `
				: ""}
		</a>
	`;
	return buffContainer;
}

function createBuffName(item: CSFloat.FloatItem): string {
	let full_name = `${item.name}`;
	if (item.quality.includes("Sticker")) {
		full_name = "Sticker | " + full_name;
	} else if (!item.quality.includes("Container") && !item.quality.includes("Agent")) {
		if (item.quality.includes("StatTrak") || item.quality.includes("Souvenir")) {
			full_name = full_name.includes("★") ? `★ StatTrak™ ${full_name.split("★ ")[1]}` : `${item.quality} ${full_name}`;
		}
		if (item.style !== "Vanilla") {
			full_name += ` (${item.condition})`;
		}
	}
	return full_name
		.replace(/ +(?= )/g, "")
		.replace(/\//g, "-")
		.trim();
}

const supportedSubPages = ["/item/", "/stall", "/profile/watchlist", "/search", "/profile/offers", "/sell", "/ref/", "/checkout"];
const unsupportedSubPages = ["blog.csfloat", "/db"];

let extensionSettings: IStorage;
let ITEM_SCHEMA: CSFloat.ItemSchema.TypeSchema | null = null;
// mutation observer active?
let isObserverActive = false;
