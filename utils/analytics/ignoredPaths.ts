/** Paths for which analytics should not be loaded */
export const ingoredPaths = [
	/^\/dash\/.*/,
	/^\/login/,
	/^\/signup/,
	/^\/password-reset/,
	/^\/superadmin/,
] as const;
