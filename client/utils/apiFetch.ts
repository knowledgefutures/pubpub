export const apiFetch = function(path, opts) {
	return fetch(path, {
		...opts,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
		credentials: 'include',
	}).then((response) => {
		if (!response.ok) {
			return response.json().then((err) => {
				throw err;
			});
		}
		return response.json();
	});
};

// Create apiFetch.get, apiFetch.post, etc.
['get', 'head', 'post', 'put', 'delete', 'connect', 'options', 'trace'].forEach((method) =>
	Object.defineProperty(apiFetch, method, {
		writable: false,
		value: (path, body, opts) =>
			apiFetch(path, {
				...opts,
				method: method.toUpperCase(),
				body: typeof body === 'string' ? body : JSON.stringify(body),
			}),
	}),
);
