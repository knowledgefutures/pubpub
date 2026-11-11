/* global RequestInit */
type JSON = Record<string, any> | any[] | any;
type ApiFetchFn = (path: string, opts?: RequestInit) => Promise<JSON>;

type HttpMethodApiFetchWrapper = <T extends JSON = JSON>(
	path: string,
	body?: JSON | string,
	opts?: RequestInit,
) => Promise<T>;

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

type HttpMethod = (typeof httpMethods)[number];

type ApiFetch = ApiFetchFn & { [K in HttpMethod]: HttpMethodApiFetchWrapper };

// ── Core fetch wrapper ──

/**
 * Like fetch, but always sends credentials and JSON headers and returns the raw
 * Response. Use this for callers that need the Response object rather than the
 * parsed JSON — e.g. the Altcha widget's `customfetch`, which needs the
 * credentialed request but its own response handling.
 */
export function apiFetchRaw(path: string, opts?: RequestInit): Promise<Response> {
	return fetch(path, {
		...opts,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...opts?.headers,
		},
		credentials: 'include',
	});
}

export const apiFetch = ((path, opts) => {
	return apiFetchRaw(path, opts).then(async (response) => {
		if (!response.ok) {
			const err = await response.json();

			if (response.status === 423 && err?.error === 'readOnly') {
				window.dispatchEvent(new CustomEvent('pubpub:readOnly'));
			}
			throw err;
		}
		return response.json();
	});
}) as ApiFetch;

const createMethodWrapper = (method: HttpMethod): HttpMethodApiFetchWrapper => {
	return ((path, body, opts) =>
		apiFetch(path, {
			...opts,
			method: method.toUpperCase(),
			body: typeof body === 'string' ? body : JSON.stringify(body),
		})) as HttpMethodApiFetchWrapper;
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
