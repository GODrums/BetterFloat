export interface MessagesMetadata {
	[name: string]: unknown;
}

export namespace PlasmoMessaging {
	export type Request<Name = string, Body = unknown> = { name: Name; body?: Body };
	export type Response<Value = unknown> = { send(value: Value): void };
	export type MessageHandler<Body = unknown, Value = unknown> = (request: Request<string, Body>, response: Response<Value>) => void | Promise<void>;
}

type Protocol = Record<string, (body: any) => any>;
const messenger = defineExtensionMessaging<Protocol>({ logger: console });

export async function sendToBackground<Body = unknown, Value = unknown>({ name, body }: { name: string; body?: Body }): Promise<Value> {
	return (await messenger.sendMessage(name, body)) as Value;
}

export const sendToBackgroundViaRelay = sendToBackground;

export function relayMessage(_request?: unknown): void {}

export function registerMessageHandlers(handlers: Record<string, PlasmoMessaging.MessageHandler<any, any>>): void {
	for (const [name, handler] of Object.entries(handlers)) {
		messenger.onMessage(
			name,
			({ data }) =>
				new Promise((resolve, reject) => {
					Promise.resolve(handler({ name, body: data }, { send: resolve })).catch(reject);
				})
		);
	}
}

import { defineExtensionMessaging } from '@webext-core/messaging';
