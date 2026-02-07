import { sendToBackground, sendToBackgroundViaRelay } from '@plasmohq/messaging';
import type { CreateNotificationBody, CreateNotificationResponse } from '~background/messages/createNotification';
import type { GetBlueBody } from '~background/messages/getBluePercent';
import type { GetBlueSalesBody } from '~background/messages/getBlueSales';
import type { GetMarketComparisonBody, GetMarketComparisonResponse } from '~background/messages/getMarketComparison';
import type { BlueGem } from '~lib/@typings/ExtensionTypes';

export async function createNotificationMessage(body: CreateNotificationBody) {
	const response = await sendToBackground<CreateNotificationBody, CreateNotificationResponse>({
		name: 'createNotification',
		body,
	});
	return response;
}

export async function fetchBlueGemPastSales(body: GetBlueSalesBody) {
	return await sendToBackground<GetBlueSalesBody, BlueGem.PastSale[]>({
		name: 'getBlueSales',
		body: body,
	});
}

export async function fetchBlueGemPatternData(body: GetBlueBody) {
	return await sendToBackground<GetBlueBody, Partial<BlueGem.PatternData>>({
		name: 'getBluePercent',
		body,
	});
}

type RetryOptions = {
	maxRetries?: number;
	baseDelay?: number;
	maxDelay?: number;
	timeout?: number;
};

/**
 * Retry function with exponential backoff and timeout
 */
async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
	const { maxRetries = 3, timeout = 2000 } = options;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			// Wrap the function call with a timeout
			const result = await Promise.race([fn(), new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Request timeout')), timeout))]);
			return result;
		} catch (error) {
			// If this is the last attempt, throw the error
			if (attempt === maxRetries) {
				console.error('[BetterFloat] Max retries reached:', error);
				throw error;
			}
		}
	}

	// This should never be reached, but TypeScript requires it
	throw new Error('Unexpected error in retry logic');
}

// to be used in page scripts
export async function fetchMarketComparisonData(buff_name: string, isVIP?: boolean) {
	return await withRetry(
		() =>
			sendToBackgroundViaRelay<GetMarketComparisonBody, GetMarketComparisonResponse>({
				name: 'getMarketComparison',
				body: {
					buff_name,
					isVIP,
				},
			}),
		{
			maxRetries: 3,
			baseDelay: 1000,
			timeout: 5000,
		}
	);
}
