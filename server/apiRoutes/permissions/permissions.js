/**
 * A utility to handle checking permissions. It exposes two functions: any() and all(). Each one
 * takes an object that looks like:
 *
 *     {somePermissionToCheck: Promise, someOtherPermission: Promise, ...}
 *
 * And returns an object that looks like {somePermissionToCheck, someOtherPermission, ...} with an
 * entry representing the resolution for each promise in the input. The difference between any() and
 * all() is how they handle errors:
 *
 * - all() works like Promise.all() in the sense that it rejects if any constituent promise has
 *   rejected. You can use this when you want to make sure a user has _all_ of a set of permissions
 *   before letting them continue.
 * - any() waits for all promises to resolve or reject, and catches the ones that reject. It will
 *   resolve as long as _at least one_ of the constitutent promises resolved, and pass their results
 *   onwards -- the ones that failed will simply not pass along an object.
 *
 * Here's a simple example. If you want to test whether a user is either a community admin, or has
 * manage permissions for a specific pub, you can do something like this:
 *
 *     promise.any({
 *         pubManager: pubManagerFor({userId, pubId}),
 *         communityAdmin: communityAdminFor({userId, communityId})
 *    }).then(({pubManager, communityAdmin}) => { ... })
 */

class PermissionRejectedError extends Error {
	constructor(contents) {
		super();
		this.contents = contents;
	}
}

const keysAndPromises = (permsObject) => {
	// The keys and promises here are both guaranteed to appear in key-order
	const keys = Object.keys(permsObject);
	const promises = Object.values(permsObject);
	return { keys: keys, promises: promises };
};

const withPermissionRejectedError = (promise) => {
	if (promise.catch) {
		return promise.catch((err) => new PermissionRejectedError(err));
	}
	return promise;
};

export default {
	all: (permsObject) => {
		const { keys, promises } = keysAndPromises(permsObject);
		return Promise.all(promises).then((promiseResults) => {
			// Promise.all rejects if any promise rejects, so we know they all succeeded here.
			const resultObj = {};
			promiseResults.forEach((result, index) => {
				resultObj[keys[index]] = result;
			});
			return resultObj;
		});
	},
	any: (permsObject) => {
		const { keys, promises } = keysAndPromises(permsObject);
		return Promise.all(promises.map(withPermissionRejectedError)).then((promiseResults) => {
			if (promiseResults.every((res) => res instanceof PermissionRejectedError)) {
				throw new PermissionRejectedError(promiseResults);
			}
			const resultObj = {};
			promiseResults.forEach((result, index) => {
				if (!(result instanceof PermissionRejectedError)) {
					resultObj[keys[index]] = result;
				}
			});
			return resultObj;
		});
	},
};
