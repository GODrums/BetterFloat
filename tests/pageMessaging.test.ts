import { describe, expect, test } from 'bun:test';
import { createPerKeySerializer } from '../src/lib/messaging/page';

describe('page request serialization', () => {
	test('serializes requests with the same key', async () => {
		const serialize = createPerKeySerializer<string>();
		const order: string[] = [];
		let releaseFirst: () => void = () => {};
		const firstGate = new Promise<void>((resolve) => {
			releaseFirst = resolve;
		});

		const first = serialize('comparison', async () => {
			order.push('first:start');
			await firstGate;
			order.push('first:end');
			return 1;
		});
		const second = serialize('comparison', async () => {
			order.push('second');
			return 2;
		});

		await Promise.resolve();
		expect(order).toEqual(['first:start']);
		releaseFirst();
		expect(await Promise.all([first, second])).toEqual([1, 2]);
		expect(order).toEqual(['first:start', 'first:end', 'second']);
	});

	test('allows different message types to run concurrently', async () => {
		const serialize = createPerKeySerializer<string>();
		const started: string[] = [];
		let release: () => void = () => {};
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});

		const comparison = serialize('comparison', async () => {
			started.push('comparison');
			await gate;
		});
		const notification = serialize('notification', async () => {
			started.push('notification');
		});

		await Promise.resolve();
		expect(started).toEqual(['comparison', 'notification']);
		release();
		await Promise.all([comparison, notification]);
	});
});
