/** Paths for which analytics should not be loaded */
export const ignoredPaths = [
	/^\/dash\/.*/,
	/^\/login/,
	/^\/signup/,
	/^\/password-reset/,
	/^\/superadmin/,
] as const;
