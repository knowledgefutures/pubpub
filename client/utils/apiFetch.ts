type JSON = Record<string, any> | any[] | any;
type ApiFetchFn = (path: string, opts?: RequestInit) => Promise<JSON>;

type HttpMethodApiFetchWrapper = (
	path: string,
	body: JSON | string,
	opts?: RequestInit,
) => Promise<JSON>;

const httpMethods = [
	'get',
	'head',
	'post',
	'put',
	'delete',
	'connect',
	'options',
	'trace',
] as const;

type HttpMethod = typeof httpMethods[number];

type ApiFetch = ApiFetchFn & { [K in HttpMethod]: HttpMethodApiFetchWrapper };

export const apiFetch = ((path, opts) => {
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
}) as ApiFetch;

const createMethodWrapper = (method: HttpMethod): HttpMethodApiFetchWrapper => {
	return (path, body, opts) =>
		apiFetch(path, {
			...opts,
			method: method.toUpperCase(),
			body: typeof body === 'string' ? body : JSON.stringify(body),
		});
};

// Create apiFetch.get, apiFetch.post, etc.
httpMethods.forEach((method) =>
	Object.defineProperty(apiFetch, method, {
		writable: false,
		value: createMethodWrapper(method),
	}),
);

declare global {
	interface Window {
		apiFetch: ApiFetch;
	}
}

if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
	window.apiFetch = apiFetch;
}
