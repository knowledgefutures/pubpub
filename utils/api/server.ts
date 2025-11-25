import { initServer } from '@ts-rest/express';

import { analyticsServer } from 'server/analytics/api';
import { authTokenServer } from 'server/authToken/api';
import { collectionServer } from 'server/collection/api';
import { collectionAttributionServer } from 'server/collectionAttribution/api';
import { collectionPubServer } from 'server/collectionPub/api';
import { communityServer } from 'server/community/api';
import { facetsServer } from 'server/facets/api';
import { loginRouteImplementation } from 'server/login/api';
import { logoutRouteImplementation } from 'server/logout/api';
import { memberServer } from 'server/member/api';
import { pageServer } from 'server/page/api';
import { pubServer } from 'server/pub/api';
import { pubAttributionServer } from 'server/pubAttribution/api';
import { pubEdgeServer } from 'server/pubEdge/api';
import { releaseServer } from 'server/release/api';
import { uploadRouteImplementation } from 'server/upload/api';
import { uploadPolicyRouteImplementation } from 'server/uploadPolicy/api';
import { accountServer } from 'server/user/account';
import { workerTaskServer } from 'server/workerTask/api';

import { contract } from './contract';

const s = initServer();

// FIXME: Add these routes back in
const { customScript: _, ...contractWithScriptsAndCommunity } = contract;

export const server = s.router(contractWithScriptsAndCommunity, {
	account: accountServer,
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
