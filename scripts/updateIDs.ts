#!/usr/bin/env -S deno run --allow-read --allow-write --allow-net scripts/updateIDs.ts

/**
 * This script updates the marketids.json file with missing entries from cs2_marketplaceids.json
 * It fetches the latest IDs from GitHub, compares them with the local marketids.json,
 * and adds missing entries to marketids.json
 */

// Add Deno namespace reference
/// <reference lib="deno.ns" />

// Define the paths to the JSON files
const MARKET_IDS_PATH = './assets/marketids.json';
const CS2_MARKET_IDS_URL = 'https://github.com/ModestSerhat/cs2-marketplace-ids/raw/refs/heads/main/cs2_marketplaceids.json';
const OUTPUT_PATH = './assets/marketids.json';

type MarketIDMapping = {
	[item: string]: {
		buff: number;
		uu: number;
		buff_sticker?: number;
		c5: number;
	};
};

type DopplerPhase = 'Phase 1' | 'Phase 2' | 'Phase 3' | 'Phase 4' | 'Sapphire' | 'Ruby' | 'Black Pearl' | 'Emerald';
type CSMarketIDMapping = {
	items: {
		[item: string]: {
			buff163_goods_id: number;
			youpin_id: number;
			buff163_sticker_id?: number;
			buffmarket_goods_id?: number;
			buff163_phase_ids?: Record<DopplerPhase, number>;
		};
	};
};

// Define mappings from CS2 property names to marketids property names
const propertyMap: Record<string, string> = {
	buff163_goods_id: 'buff',
	youpin_id: 'uu',
	buff163_sticker_id: 'buff_sticker',
};

async function main() {
	console.log('Starting update process...');

	try {
		// Check if local marketids.json exists
		try {
			await Deno.stat(MARKET_IDS_PATH);
		} catch {
			throw new Error(`File not found: ${MARKET_IDS_PATH}`);
		}

		// Read local marketids.json file
		console.log(`Reading ${MARKET_IDS_PATH}...`);
		const marketIDsText = await Deno.readTextFile(MARKET_IDS_PATH);
		const marketIDs = JSON.parse(marketIDsText) as MarketIDMapping;

		// Fetch the latest CS2 marketplace IDs from GitHub
		console.log(`Fetching CS2 marketplace IDs from ${CS2_MARKET_IDS_URL}...`);
		const response = await fetch(CS2_MARKET_IDS_URL);
		if (!response.ok) {
			throw new Error(`Failed to fetch CS2 marketplace IDs: ${response.status} ${response.statusText}`);
		}
		const cs2MarketIDsText = await response.text();
		const cs2MarketIDs = JSON.parse(cs2MarketIDsText) as CSMarketIDMapping;

		// Track the number of items added and updated
		let addedCount = 0;
		let updatedCount = 0;

		console.log(`Found ${Object.keys(marketIDs).length} items in marketids.json`);
		console.log(`Found ${Object.keys(cs2MarketIDs.items).length} items in cs2_marketplaceids.json`);

		// Iterate through each item in cs2_marketplaceids.json
		for (const [itemName, cs2ItemData] of Object.entries(cs2MarketIDs.items)) {
			// Check if item exists in marketIDs
			if (marketIDs[itemName]) {
				// Item exists, check for missing properties and update
				let updated = false;

				for (const [cs2PropName, marketPropName] of Object.entries(propertyMap)) {
					const typedCs2PropName = cs2PropName as keyof typeof cs2ItemData;
					const typedMarketPropName = marketPropName as keyof (typeof marketIDs)[typeof itemName];

					if (cs2ItemData[typedCs2PropName] && !marketIDs[itemName][typedMarketPropName] && typeof cs2ItemData[typedCs2PropName] === 'number') {
						// Add missing property
						marketIDs[itemName][typedMarketPropName] = cs2ItemData[typedCs2PropName];
						updated = true;
					}
				}

				if (updated) {
					updatedCount++;
				}
			} else {
				// Item doesn't exist, create new entry
				const newEntry: Record<string, number> = {
					buff: 0,
					uu: 0,
					c5: 0, // Required field with default value
				};

				// Map properties from CS2 item to marketIDs format
				for (const [cs2PropName, marketPropName] of Object.entries(propertyMap)) {
					const typedCs2PropName = cs2PropName as keyof typeof cs2ItemData;
					const value = cs2ItemData[typedCs2PropName];
					if (value !== undefined) {
						newEntry[marketPropName] = value as number;
					}
				}

				// Add the new entry
				marketIDs[itemName] = newEntry as unknown as MarketIDMapping[typeof itemName];
				addedCount++;
			}
		}

		console.log(`Added ${addedCount} new entries`);
		console.log(`Updated ${updatedCount} existing entries`);

		// Write the updated data back to the file using Deno.writeTextFile
		console.log(`Writing updated data to ${OUTPUT_PATH}...`);
		await Deno.writeTextFile(OUTPUT_PATH, JSON.stringify(marketIDs, null, 2));

		console.log('Update completed successfully!');
	} catch (error) {
		console.error('Error:', (error as Error).message);
		// Exit with error code
		console.error('Exiting with error code 1');
	}
}

// Run the main function
main();
