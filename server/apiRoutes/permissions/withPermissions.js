export default (resolved) => (testPermissions) => (credentials) =>
	testPermissions(credentials).then(typeof resolved === 'function' ? resolved : () => resolved);
