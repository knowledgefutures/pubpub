/** Paths for which analytics should not be loaded */
export const ignoredPaths = [
	/^\/dash\/.*/,
	/^\/login/,
	/^\/signup/,
	/^\/password-reset/,
	/^\/superadmin/,
] as const;

export const shouldPathBeIgnored = (path?: string) => {
	if (!path) {
		return false;
	}

	return ignoredPaths.some((ignoredPath) => ignoredPath.test(path));
};
