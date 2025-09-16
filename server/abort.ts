import { AsyncLocalStorage } from 'async_hooks';

/**
 * This stores an abort controller in the beginning of a request, to be listened for in a sequelize
 * hook later.
 *
 * See `server/sequelize.ts` for more details and `server/server.ts` for usage.
 */
export const abortStorage = new AsyncLocalStorage<{
	abortController: AbortController;
}>();

export const isRequestAborted = () => {
	return abortStorage.getStore()?.abortController.signal.aborted;
};
