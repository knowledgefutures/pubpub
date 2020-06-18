import KeenTracking from 'keen-tracking';

import { isProd } from 'utils/environment';

import { getClientInitialData } from './initialData';
import { getGdprConsentElection } from './legal/gdprConsent';

const keenEnvProd = {
	projectId: '5b57a01ac9e77c0001eef181',
	writeKey:
		'BA7C339A2A000ADC20572BBE37F49872DD8AB8EECBAF03E23AB8EDEF47E56FE9D1A54F63A7FC9548B06D7FF9AA057141E029369E637317B1E276CCE8206745A8D96CAFFFF2D6C4DB15E9E2D5C410426821E8379D0760A482ECF37C2F3868881C',
};

const keenEnvDev = {
	projectId: '5b5791b9c9e77c000175ca3b',
	writeKey:
		'44F36099BAA3DF17892D232C2D9A807E817FCA0D99461DBDCA05CB97E760D57409145F6E2045B616ED3BD16C3B4A75A467240F23CE78E09BB7515603C3DFD2061F430B27CDA4059F059EF58702514CDE5A09CD5134E6530CFAD8589D5341D185',
};

export const setupKeen = () => {
	const { communityData, collectionData, pubData, loginData } = getClientInitialData();
	const hasGdprConsent = getGdprConsentElection(loginData);

	const keenEnvironment = isProd() ? keenEnvProd : keenEnvDev;
	const client = new KeenTracking(keenEnvironment);
	const customEventData = {};
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
		customEventData.userId = loginData.id;
	}
	client.extendEvents({ pubpub: customEventData });
	client.initAutoTracking({
		recordPageViewsOnExit: true,
		recordClicks: false,
		collectIpAddress: hasGdprConsent,
		collectUuid: hasGdprConsent,
	});
};
