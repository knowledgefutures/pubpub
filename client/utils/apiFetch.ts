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

// ── Silent session renewal via hidden iframe ──

let renewalInFlight: Promise<boolean> | null = null;

function renewSession(): Promise<boolean> {
	if (renewalInFlight) return renewalInFlight;

	renewalInFlight = new Promise<boolean>((resolve) => {
		const iframe = document.createElement('iframe');
		iframe.style.display = 'none';

		const cleanup = () => {
			window.removeEventListener('message', onMessage);
			clearTimeout(timeout);
			iframe.remove();
			renewalInFlight = null;
		};

		const onMessage = (event: MessageEvent) => {
			if (
				event.origin === window.location.origin &&
				event.data?.type === 'pubpub:session-renewed'
			) {
				cleanup();
				resolve(!!event.data.success);
			}
		};

		const timeout = setTimeout(() => {
			cleanup();
			resolve(false);
		}, 15_000);

		window.addEventListener('message', onMessage);
		iframe.src = '/auth/login?renew=true&return_to=/auth/renew-done';
		document.body.appendChild(iframe);
	});

	return renewalInFlight;
}

// ── Core fetch wrapper ──

function rawFetch(path: string, opts?: RequestInit): Promise<Response> {
	return fetch(path, {
		...opts,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
		credentials: 'include',
	});
}

/**
 * Like fetch, but transparently handles an expired-but-renewable session:
 * on a `401 {error: 'sessionExpired'}` it silently renews (hidden iframe →
 * OIDC prompt=none) and retries once, returning the resolved Response. Returns
 * credentials with every request. Use this for callers that need a raw
 * Response and the renewal behaviour — e.g. the Altcha widget's customfetch,
 * which otherwise issues a plain fetch that dies on the 401.
 */
export async function apiFetchRaw(path: string, opts?: RequestInit): Promise<Response> {
	const response = await rawFetch(path, opts);
	if (response.status === 401) {
		// Peek the body without consuming it for the caller.
		const err = await response
			.clone()
			.json()
			.catch(() => null);
		if (err?.error === 'sessionExpired') {
			const renewed = await renewSession();
			if (renewed) {
				return rawFetch(path, opts);
			}
			// Renewal failed — full page reload so the page-level reauth kicks in
			window.location.reload();
			// Never resolves — the reload navigates away
			return new Promise<Response>(() => {
				/* page is reloading */
			});
		}
	}
	return response;
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
