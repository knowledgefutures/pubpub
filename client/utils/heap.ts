/* eslint-disable */
import { isProd } from 'utils/environment';

import { getGdprConsentElection } from './legal/gdprConsent';

export const setupHeap = (initialData) => {
	const { communityData, collectionData, pubData, loginData } = initialData;
	const hasGdprConsent = getGdprConsentElection(loginData);
	const heapEnvironment = isProd() ? '422727431' : '3777990325';
	// eslint-disable-next-line
// @ts-expect-error ts-migrate(2339) FIXME: Property 'heap' does not exist on type 'Window & t... Remove this comment to see the full error message
	(window.heap = window.heap || []),
		// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'heap'.
		(heap.load = function(e, t) {
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'heap' does not exist on type 'Window & t... Remove this comment to see the full error message
			(window.heap.appid = e), (window.heap.config = t = t || {});
			const r = document.createElement('script');
			(r.type = 'text/javascript'),
				(r.async = !0),
				(r.src = 'https://cdn.heapanalytics.com/js/heap-' + e + '.js');
			const a = document.getElementsByTagName('script')[0];
			// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
			a.parentNode.insertBefore(r, a);
			for (
				let n = function(e) {
						return function() {
							// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'heap'.
							heap.push([e].concat(Array.prototype.slice.call(arguments, 0)));
						};
					},
					p = [
						'addEventProperties',
						'addUserProperties',
						'clearEventProperties',
						'identify',
						'resetIdentity',
						'removeEventProperty',
						'setEventProperties',
						'track',
						'unsetEventProperty',
					],
					o = 0;
				o < p.length;
				o++
			)
				// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'heap'.
				heap[p[o]] = n(p[o]);
		});
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'heap' does not exist on type 'Window & t... Remove this comment to see the full error message
	window.heap.load(heapEnvironment);
	const customEventData = {
		communityId: null,
		pageId: null,
		pubId: null,
	};
	if (communityData) {
		customEventData.communityId = communityData.id;
	}
	if (collectionData) {
		customEventData.pageId = collectionData.id;
	}
	if (pubData) {
		customEventData.pubId = pubData.id;
	}
	if (hasGdprConsent && loginData.id) {
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'loggedIn' does not exist on type '{ comm... Remove this comment to see the full error message
		customEventData.loggedIn = 'true';
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'heap' does not exist on type 'Window & t... Remove this comment to see the full error message
		window.heap.identify(loginData.id);
	}
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'heap' does not exist on type 'Window & t... Remove this comment to see the full error message
	window.heap.addEventProperties(customEventData);
};
