import { isProd } from 'utils/environment';

import { getGdprConsentElection } from './legal/gdprConsent';

export const setupHeap = (initialData) => {
	const { communityData, collectionData, pubData, loginData } = initialData;
	const hasGdprConsent = getGdprConsentElection(loginData);
	const heapEnvironment = isProd() ? '422727431' : '3777990325';
	// eslint-disable-next-line
	window.heap=window.heap||[],heap.load=function(e,t){window.heap.appid=e,window.heap.config=t=t||{};var r=document.createElement("script");r.type="text/javascript",r.async=!0,r.src="https://cdn.heapanalytics.com/js/heap-"+e+".js";var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(r,a);for(var n=function(e){return function(){heap.push([e].concat(Array.prototype.slice.call(arguments,0)))}},p=["addEventProperties","addUserProperties","clearEventProperties","identify","resetIdentity","removeEventProperty","setEventProperties","track","unsetEventProperty"],o=0;o<p.length;o++)heap[p[o]]=n(p[o])};
	window.heap.load(heapEnvironment);
	const customEventData = {
		communityId: null,
		pageId: null,
		pubId: null,
		branchId: null,
	};
	if (communityData) {
		customEventData.communityId = communityData.id;
	}
	if (collectionData) {
		customEventData.pageId = collectionData.id;
	}
	if (pubData) {
		customEventData.pubId = pubData.id;
		customEventData.branchId = pubData.activeBranch.id;
	}
	if (hasGdprConsent && loginData.id) {
		customEventData.loggedIn = 'true';
		window.heap.identify(loginData.id);
	}
	window.heap.addEventProperties(customEventData);
};
