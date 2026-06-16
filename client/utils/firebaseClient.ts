/**
 * @deprecated Firebase is no longer used for collaborative editing.
 * This module is kept as a stub during the migration period.
 * Remove after full migration is confirmed.
 */

export const initFirebase = async (_rootKey: string, _authToken: string) => {
	console.warn('initFirebase called but Firebase has been removed. This is a no-op.');
	return null;
};
