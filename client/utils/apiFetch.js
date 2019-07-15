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
