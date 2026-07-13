import { type BackgroundRequest, backgroundMessaging } from '~lib/messaging/background';

export async function createNotificationMessage(data: BackgroundRequest<'createNotification'>) {
	return backgroundMessaging.sendMessage('createNotification', data);
}

export async function fetchBlueGemPastSales(data: BackgroundRequest<'getBlueSales'>) {
	return backgroundMessaging.sendMessage('getBlueSales', data);
}

export async function fetchBlueGemPatternData(data: BackgroundRequest<'getBluePercent'>) {
	return backgroundMessaging.sendMessage('getBluePercent', data);
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
			backgroundMessaging.sendMessage('getMarketComparison', {
				buff_name,
				isVIP,
			}),
		{
			maxRetries: 3,
			baseDelay: 1000,
			timeout: 5000,
		}
	);
}
