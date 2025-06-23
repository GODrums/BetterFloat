import { type JWTPayload, decodeJwt } from 'jose';
import { ExtensionStorage, type IStorage, getSecureStorage, getSetting } from './storage';

interface CustomerClaims extends JWTPayload {
	customerId: string;
	plan: {
		currentPeriodStart: number;
		currentPeriodEnd: number;
		cancelAtPeriodEnd: boolean;
	};
	status: string;
}

function checkJwtClaims(decodedJwt: CustomerClaims & JWTPayload, steamId: string | undefined) {
	if (!decodedJwt.exp || !decodedJwt.sub || decodedJwt.customerId === undefined) {
		throw new Error('Invalid JWT decodedJwt');
	}

	if (!decodedJwt.plan || decodedJwt.plan.currentPeriodStart === undefined || decodedJwt.plan.currentPeriodEnd === undefined || decodedJwt.plan.cancelAtPeriodEnd === undefined) {
		throw new Error('Invalid JWT plan decodedJwt');
	}

	if (decodedJwt.iss !== 'betterfloat') {
		throw new Error('Invalid JWT issuer');
	}

	if (!steamId || decodedJwt.sub !== steamId) {
		throw new Error('Invalid JWT subject');
	}

	if (new Date(decodedJwt.exp * 1000) < new Date()) {
		throw new Error('JWT expired');
	}
}

export async function synchronizePlanWithStorage(expired = false): Promise<IStorage['user']> {
	const secureStorage = await getSecureStorage();
	let decodedJwt = await secureStorage.getItem<CustomerClaims & JWTPayload>('decodedJwt');

	let newPlan: IStorage['user']['plan'] = { type: 'free' };

	const user = await getSetting<IStorage['user']>('user');

	if (decodedJwt && user.steam?.steamid) {
		// check if token or plan is expired and refresh
		if (expired || (decodedJwt.exp && decodedJwt.exp * 1000 < Date.now())) {
			const newToken = await refreshToken(user!.steam!.steamid!);
			if (!newToken) {
				await ExtensionStorage.sync.setItem('user', { ...user, plan: { type: 'free' } });
				throw new Error('Failed to refresh token');
			}
			decodedJwt = decodeJWT(newToken);
		}
		// verify token contents
		newPlan = await verifyPlan(decodedJwt, user);
	}

	const newUser = { ...user, plan: newPlan };

	await ExtensionStorage.sync.setItem('user', newUser);

	return newUser;
}

export function decodeJWT(jwt: string) {
	return decodeJwt<CustomerClaims>(jwt);
}

export async function verifyPlan(decodedJwt: CustomerClaims & JWTPayload, user: IStorage['user']): Promise<IStorage['user']['plan']> {
	const secureStorage = await getSecureStorage();
	try {
		checkJwtClaims(decodedJwt, user.steam.steamid);
	} catch (e) {
		console.error(e);
		return { type: 'free' };
	}
	const endDate = new Date(decodedJwt.plan.currentPeriodEnd);
	if (endDate.getTime() < Date.now()) {
		console.error('Subscription expired');
		return { type: 'free' };
	}

	secureStorage.setItem('decodedJwt', decodedJwt);

	return {
		type: 'pro',
		expiry: Math.min(decodedJwt.exp! * 1000, decodedJwt.plan.currentPeriodEnd),
		customerId: decodedJwt.customerId,
		provider: decodedJwt.customerId ? 'stripe' : 'crypto',
		endDate: decodedJwt.plan.currentPeriodEnd,
	};
}

interface TokenResponse {
	token: string;
}

export async function refreshToken(steamid: string, maxRetries = 3): Promise<string | null> {
	let lastError: Error | null = null;

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			const response = await fetch(`${process.env.PLASMO_PUBLIC_BETTERFLOATAPI}/subscription/${steamid}`);

			if (!response.ok) {
				const error = new Error(`HTTP ${response.status} ${response.statusText}`);
				console.error(`Failed to refresh token (attempt ${attempt + 1}/${maxRetries}):`, error.message);
				lastError = error;

				// Wait before retrying (exponential backoff)
				if (attempt < maxRetries - 1) {
					await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 1000));
				}
				continue;
			}

			const data = (await response.json()) as TokenResponse;
			return data.token;
		} catch (error) {
			console.error(`Failed to refresh token (attempt ${attempt + 1}/${maxRetries}):`, error);
			lastError = error as Error;

			// Wait before retrying (exponential backoff)
			if (attempt < maxRetries - 1) {
				await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 1000));
			}
		}
	}

	console.error(`Failed to refresh token after ${maxRetries} attempts. Last error:`, lastError);
	return null;
}
