import { PatchFnArg } from 'types';

export function patch<T extends Record<string, any>>(object: T, patchFnOrObject: PatchFnArg<T>) {
	if (typeof patchFnOrObject === 'function') {
		return patchFnOrObject(object);
	}
	return { ...object, ...patchFnOrObject };
}
