import { initServer } from '@ts-rest/express';
import { pubServer } from 'server/pub/api';
import { collectionPubServer } from 'server/collectionPub/api';
import { pubAttributionServer } from 'server/pubAttribution/api';
import { collectionAttributionServer } from 'server/collectionAttribution/api';
import { collectionServer } from 'server/collection/api';
import { facetsServer } from 'server/facets/api';
import { logoutRouteImplementation } from 'server/logout/api';
import { loginRouteImplementation } from 'server/login/api';
import { pageServer } from 'server/page/api';
import { memberServer } from 'server/member/api';
import { pubEdgeServer } from 'server/pubEdge/api';
import { workerTaskServer } from 'server/workerTask/api';
import { releaseServer } from 'server/release/api';
import { uploadPolicyRouteImplementation } from 'server/uploadPolicy/api';
import { communityServer } from 'server/community/api';
import { uploadRouteImplementation } from 'server/upload/api';
import { authTokenServer } from 'server/authToken/api';
import { analyticsServer } from 'server/analytics/api';
import { contract } from './contract';

const s = initServer();

// FIXME: Add these routes back in
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { customScript, ...contractWithScriptsAndCommunity } = contract;

export const server = s.router(contractWithScriptsAndCommunity, {
	analytics: analyticsServer,
	auth: {
		login: loginRouteImplementation,
		logout: logoutRouteImplementation,
	},
	authToken: authTokenServer,
	collection: collectionServer,
	collectionAttribution: collectionAttributionServer,
	collectionPub: collectionPubServer,
	community: communityServer,
	facets: facetsServer,
	member: memberServer,
	page: pageServer,
	pub: pubServer,
	pubAttribution: pubAttributionServer,
	pubEdge: pubEdgeServer,
	release: releaseServer,
	upload: {
		file: uploadRouteImplementation,
		policy: uploadPolicyRouteImplementation,
	},
	workerTask: workerTaskServer,
});
