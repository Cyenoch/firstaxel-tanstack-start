/**
 * This interfaces provides the contract that an session management utility must
 * satisfiy in order to work with this SDK, please vist the example provided in the
 * README, to understand how this works.
 */
type Awaitable<T> = Promise<T>;

export interface SessionManager {
	getCookie: (itemKey: string) => Awaitable<string | undefined | null>;
	setCookie: (
		itemKey: string,
		itemValue: string,
		itemExpiry?: Date,
	) => Awaitable<void>;
	removeCookie: (itemKey: string) => Awaitable<void>;
	destroyCookie?: () => Awaitable<void>;
}
