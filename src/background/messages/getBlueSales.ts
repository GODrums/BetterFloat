import type { BlueGem } from '~lib/@typings/ExtensionTypes';
import { defineBackgroundHandler } from '~lib/messaging/background';

export type GetBlueSalesRequest = {
	weapon: string;
	type: 'ch' | 'ht';
	pattern: number;
};

export type GetBlueSalesResponse = BlueGem.PastSale[];

declare module '~lib/messaging/background' {
	interface BackgroundProtocol {
		getBlueSales: (data: GetBlueSalesRequest) => GetBlueSalesResponse;
	}
}

defineBackgroundHandler('getBlueSales', async (data) => {
	if (!data?.weapon || !['ch', 'ht'].includes(data.type) || typeof data.pattern !== 'number') {
		return [];
	}
	let { weapon } = data;
	const { type, pattern } = data;

	if (weapon === 'desert') {
		weapon = 'deagle';
	}

	const responseData = await fetch(`${process.env.PLASMO_PUBLIC_BETTERFLOATAPI}/v1/bluegem/sales?weapon=${weapon}&type=${type}&pattern=${pattern}`)
		.then((res) => res.json() as Promise<BlueGem.SearchResponse>)
		.catch(() => null);

	if (responseData) {
		return responseData;
	}

	// data unavailable
	return [];
});
