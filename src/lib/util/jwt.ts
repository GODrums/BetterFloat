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

export async function synchronizePlanWithStorage(): Promise<IStorage['user']> {
	const secureStorage = await getSecureStorage();
	let decodedJwt = await secureStorage.getItem<CustomerClaims & JWTPayload>('decodedJwt');

	let newPlan: IStorage['user']['plan'] = { type: 'free' };

	const user = await getSetting<IStorage['user']>('user');

	if (decodedJwt && user.steam?.steamid) {
		// check if token is expired and refresh
		let hasRefreshed = false;
		if (decodedJwt.exp && decodedJwt.exp * 1000 < new Date().getTime()) {
			const newToken = await refreshToken(user!.steam!.steamid!);
			if (!newToken) {
				await ExtensionStorage.sync.setItem('user', { ...user, plan: { type: 'free' } });
				throw new Error('Failed to refresh token');
			}
			decodedJwt = decodeJWT(newToken);
			hasRefreshed = true;
		}
		// verify token contents
		let { plan, expired } = await verifyPlan(decodedJwt, user);
		// if plan is expired and we still got an old token, refresh again
		if (plan.type === 'free' && expired && !hasRefreshed) {
			const newToken = await refreshToken(user!.steam!.steamid!);
			if (!newToken) {
				await ExtensionStorage.sync.setItem('user', { ...user, plan: { type: 'free' } });
				throw new Error('Failed to refresh token');
			}
			decodedJwt = decodeJWT(newToken);
			const { plan: secondPlan } = await verifyPlan(decodedJwt, user);
			plan = secondPlan;
		}
		newPlan = plan;
	}

	const newUser = { ...user, plan: newPlan };

	await ExtensionStorage.sync.setItem('user', newUser);

	return newUser;
}

export function decodeJWT(jwt: string) {
	return decodeJwt<CustomerClaims>(jwt);
}

export async function verifyPlan(decodedJwt: CustomerClaims & JWTPayload, user: IStorage['user']): Promise<{ plan: IStorage['user']['plan']; expired?: boolean }> {
	const secureStorage = await getSecureStorage();
	try {
		checkJwtClaims(decodedJwt, user.steam.steamid);
	} catch (e) {
		console.error(e);
		return { plan: { type: 'free' } };
	}
	const endDate = new Date(decodedJwt.plan.currentPeriodEnd);
	if (endDate.getTime() < new Date().getTime()) {
		console.error('Subscription expired');
		return { plan: { type: 'free' }, expired: true };
	}

	secureStorage.setItem('decodedJwt', decodedJwt);

	return {
		plan: {
			type: 'pro',
			expiry: Math.min(decodedJwt.exp! * 1000, decodedJwt.plan.currentPeriodEnd),
			customerId: decodedJwt.customerId,
			provider: decodedJwt.customerId ? 'stripe' : 'crypto',
			endDate: decodedJwt.plan.currentPeriodEnd,
		},
	};
}

interface TokenResponse {
	token: string;
}

export async function refreshToken(steamid: string) {
	const response = await fetch(`${process.env.PLASMO_PUBLIC_BETTERFLOATAPI}/subscription/${steamid}`)
		.then((res) => res.json() as Promise<TokenResponse>)
		.catch((e) => {
			console.error('Failed to refresh token', e);
			return { token: null };
		});
	return response.token;
}
