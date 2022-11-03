type ExpiringPromiseOptions<ReturnType> = { timeout: number } & (
	| { fallback: ReturnType }
	| { throws: () => Error }
);

export const expiringPromise = <Arguments extends any[], ReturnType>(
	fn: (...args: Arguments) => Promise<ReturnType>,
	options: ExpiringPromiseOptions<ReturnType>,
) => {
	return (...args: Arguments): Promise<ReturnType> => {
		return new Promise((resolve, reject) => {
			fn(...args)
				.then(resolve)
				.catch(reject);
			setTimeout(() => {
				if ('fallback' in options) {
					resolve(options.fallback);
				} else if ('throws' in options) {
					reject(options.throws());
				}
			}, options.timeout);
		});
	};
};

export const sleep = (timeMs: number) => {
	return new Promise((resolve) => setTimeout(resolve, timeMs));
};
