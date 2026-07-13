import type { GetDataType, GetReturnType, MaybePromise } from '@webext-core/messaging';
import { defineExtensionMessaging } from '@webext-core/messaging';

// biome-ignore lint/suspicious/noEmptyInterface: This interface is augmented by background message modules.
export interface BackgroundProtocol {}

export type BackgroundMessageName = keyof BackgroundProtocol;
export type BackgroundRequest<Name extends BackgroundMessageName> = GetDataType<BackgroundProtocol[Name]>;
export type BackgroundResponse<Name extends BackgroundMessageName> = GetReturnType<BackgroundProtocol[Name]>;
export type BackgroundHandler<Name extends BackgroundMessageName> = (data: BackgroundRequest<Name>) => MaybePromise<BackgroundResponse<Name>>;

export const backgroundMessaging = defineExtensionMessaging<BackgroundProtocol>({ logger: console });

export function defineBackgroundHandler<Name extends BackgroundMessageName>(name: Name, handler: BackgroundHandler<Name>): void {
	backgroundMessaging.onMessage(name, ({ data }) => handler(data));
}
