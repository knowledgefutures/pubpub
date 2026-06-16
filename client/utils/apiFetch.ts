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

export const apiFetch = ((path, opts) => {
	return rawFetch(path, opts).then(async (response) => {
		if (!response.ok) {
			const err = await response.json();

			// Session expired but was previously logged in — try silent renewal
			if (response.status === 401 && err?.error === 'sessionExpired') {
				const renewed = await renewSession();
				if (renewed) {
					const retry = await rawFetch(path, opts);
					if (retry.ok) return retry.json();
					throw await retry.json();
				}
				// Renewal failed — full page reload so the page-level reauth kicks in
				window.location.reload();
				// Never resolves — the reload navigates away
				return new Promise(() => {});
			}

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
