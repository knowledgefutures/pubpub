import { type AppRouter, initContract } from '@ts-rest/core';
import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { type PubRouter, pubRouter } from './contracts/pub';
import { type CollectionPubRouter, collectionPubRouter } from './contracts/collectionPub';
import { type CollectionRouter, collectionRouter } from './contracts/collection';
import {
	type CollectionAttributionRouter,
	collectionAttributionRouter,
} from './contracts/collectionAttribution';
import { type CommunityRouter, communityRouter } from './contracts/community';
import { type CustomScriptRouter, customScriptRouter } from './contracts/customScript';
import { type FacetsRouter, facetsRouter } from './contracts/facets';
import { type MemberRouter, memberRouter } from './contracts/member';
import { type PageRouter, pageRouter } from './contracts/page';
import { type PubAttributionRouter, pubAttributionRouter } from './contracts/pubAttribution';
import { type PubEdgeRouter, pubEdgeRouter } from './contracts/pubEdge';
import { type WorkerTaskRouter, workerTaskRouter } from './contracts/workerTask';
import { type ReleaseRouter, releaseRouter } from './contracts/release';
import { UploadRouter, uploadRouter } from './contracts/upload';
import { type AuthRouter, authRouter } from './contracts/auth';
import { type AnalyticsRouter, analyticsRouter } from './contracts/analytics';

extendZodWithOpenApi(z);

const c = initContract();

const router = {
	/** Methods for dealing with authentication */
	auth: authRouter as AuthRouter,
	/** @internal */
	analytics: analyticsRouter as AnalyticsRouter,
	collection: collectionRouter as CollectionRouter,
	collectionAttribution: collectionAttributionRouter as CollectionAttributionRouter,
	collectionPub: collectionPubRouter as CollectionPubRouter,
	community: communityRouter as CommunityRouter,
	customScript: customScriptRouter as CustomScriptRouter,
	facets: facetsRouter as FacetsRouter,
	member: memberRouter as MemberRouter,
	page: pageRouter as PageRouter,
	pub: pubRouter as PubRouter,
	pubAttribution: pubAttributionRouter as PubAttributionRouter,
	pubEdge: pubEdgeRouter as PubEdgeRouter,
	release: releaseRouter as ReleaseRouter,
	/** Methods for dealing with worker tasks, i.e. imports and exports */
	workerTask: workerTaskRouter as WorkerTaskRouter,
	upload: uploadRouter as UploadRouter,
} as const satisfies AppRouter;

export const contract = c.router<typeof router, '', { strictStatusCodes: true }>(router, {
	strictStatusCodes: true,
});

type ContractType = typeof contract;
export interface Contract extends ContractType {}
