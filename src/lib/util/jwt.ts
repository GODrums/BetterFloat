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
	if (!decodedJwt.customerId || !decodedJwt.exp || !decodedJwt.sub) {
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
	const decodedJwt = await secureStorage.getItem<CustomerClaims & JWTPayload>('decodedJwt');

	let newPlan: IStorage['user']['plan'] = { type: 'free' };

	const user = await getSetting<IStorage['user']>('user');
	if (!user.steam?.steamid) {
		newPlan = { type: 'free' };
	}

	if (!decodedJwt) {
		newPlan = { type: 'free' };
	} else {
		try {
			checkJwtClaims(decodedJwt, user.steam.steamid);
		} catch (e) {
			console.error(e);
			newPlan = { type: 'free' };
		}

		newPlan = await verifyPlan(decodedJwt, user);
	}

	const newUser = { ...user, plan: newPlan };

	ExtensionStorage.sync.setItem('user', newUser);

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
	const endDate = new Date(decodedJwt.plan.currentPeriodEnd * 1000);
	if (endDate.getTime() < new Date().getTime()) {
		console.error('Subscription expired');
		return { type: 'free' };
	}

	secureStorage.setItem('decodedJwt', decodedJwt);

	return { type: 'pro', expiry: Math.min(decodedJwt.exp!, decodedJwt.plan.currentPeriodEnd), customerId: decodedJwt.customerId };
}
