import { initServer } from '@ts-rest/express';
import { pubServer } from 'server/pub/api';
import { collectionPubServer } from 'server/collectionPub/api';
import { pubAttributionServer } from 'server/pubAttribution/api';
import { collectionAttributionServer } from 'server/collectionAttribution/api';
import { collectionServer } from 'server/collection/api';
import { facetsServer } from 'server/facets/api';
import { logoutRouteImplementation } from 'server/logout/api';
import { loginRouteImplementation } from 'server/login/api';
import { exportRouteImplementation } from 'server/export/api';
import { importRouteImplementation } from 'server/import/api';
import { pageServer } from 'server/page/api';
import { memberServer } from 'server/member/api';
import { pubEdgeServer } from 'server/pubEdge/api';
import { workerTaskServer } from 'server/workerTask/api';
import { releaseServer } from 'server/release/api';
import { uploadPolicyRouteImplementation } from 'server/uploadPolicy/api';
import { contract } from './contract';

const s = initServer();

// FIXME: Add these routes back in
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { customScript, community, ...contractWithScriptsAndCommunity } = contract;

export const server = s.router(contractWithScriptsAndCommunity, {
	collection: collectionServer,
	collectionAttribution: collectionAttributionServer,
	collectionPub: collectionPubServer,
	export: exportRouteImplementation,
	facets: facetsServer,
	import: importRouteImplementation,
	member: memberServer,
	page: pageServer,
	pub: pubServer,
	pubAttribution: pubAttributionServer,
	pubEdge: pubEdgeServer,
	release: releaseServer,
	uploadPolicy: uploadPolicyRouteImplementation,
	workerTask: workerTaskServer,
	logout: logoutRouteImplementation,
	login: loginRouteImplementation,
});
