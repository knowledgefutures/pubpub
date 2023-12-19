import { purgeSurrogateTag } from './purgeSurrogateTag';

/**
 * Creates a cache purge debouncer function.
 *
 * @param errorHandler - The error handler function to handle any errors that occur during the purge process. Defaults to console.error.
 * @param debounceTime - The debounce time in milliseconds. Defaults to 1000ms.
 * @param throttleTime - The throttle time in milliseconds. Defaults to 250ms.
 * @returns A function that can be used to schedule cache purges.
 */
export const createCachePurgeDebouncer = (
	{
		errorHandler = (error) => console.error(error),
		debounceTime = 1000,
		throttleTime = 250,
	}: {
		errorHandler?: (error: any) => any;
		debounceTime?: number;
		throttleTime?: number;
	} = {
		errorHandler: (error) => console.error(error),
		debounceTime: 1000,
		throttleTime: 250,
	},
) => {
	// eslint-disable-next-line no-undef
	const purgeRequests = new Map<string, { timer: NodeJS.Timeout; resolver: () => void }>();
	let lastExecutionTime = 0;

	const resolvePromiseForKey = (key: string) => {
		const request = purgeRequests.get(key);
		if (request) {
			request.resolver();
			purgeRequests.delete(key);
		}
	};

	const executePurge = (key: string, soft = false) => {
		const now = Date.now();
		if (now - lastExecutionTime > throttleTime) {
			lastExecutionTime = now;

			// this is where the magic happens
			purgeSurrogateTag(key, soft)
				.then(() => resolvePromiseForKey(key))
				.catch(errorHandler);
		} else {
			setTimeout(() => executePurge(key), throttleTime - (now - lastExecutionTime));
		}
	};

	const schedulePurge = (key: string, soft = false): Promise<void> => {
		return new Promise((resolve) => {
			const existingRequest = purgeRequests.get(key);
			if (existingRequest) {
				clearTimeout(existingRequest.timer);
				resolvePromiseForKey(key);
			}
			purgeRequests.set(key, {
				timer: setTimeout(() => {
					executePurge(key, soft);
				}, debounceTime),
				resolver: resolve,
			});
		});
	};
	return {
		/**
		 * Schedule a purge for a surrogate tag from Fastly
		 *
		 * @param tag The tag to purge, e.g. the hostname
		 * @param soft Whether to do a soft purge. This marks the content as stale and will serve stale content while the new content is being fetched
		 *
		 */
		schedulePurge,
	};
};
