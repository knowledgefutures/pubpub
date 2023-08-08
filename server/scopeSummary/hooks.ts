import {
	Discussion,
	ReviewNew,
	Pub,
	Submission,
	CollectionPub,
	Collection,
	Community,
} from 'server/models';
import { expect } from 'utils/assert';
import { summarizeCollection, summarizeCommunity, summarizePub } from './queries';

let summarizeParentScopesOnPubCreation = true;

export const setSummarizeParentScopesOnPubCreation = (value: boolean) => {
	summarizeParentScopesOnPubCreation = value;
};

Discussion.afterCreate(async ({ pubId }) => {
	await summarizePub(expect(pubId));
});
Discussion.afterDestroy(async ({ pubId }) => {
	await summarizePub(expect(pubId));
});
ReviewNew.afterCreate(async ({ pubId }) => {
	await summarizePub(expect(pubId));
});
ReviewNew.afterDestroy(async ({ pubId }) => {
	await summarizePub(expect(pubId));
});

Pub.afterCreate(async ({ id }) => {
	await summarizePub(id, summarizeParentScopesOnPubCreation);
});

Submission.afterUpdate(async ({ pubId }) => {
	await summarizePub(pubId, summarizeParentScopesOnPubCreation);
});

Collection.afterCreate(async ({ id }) => {
	await summarizeCollection(id);
});

Community.afterCreate(async ({ id }) => {
	await summarizeCommunity(id);
});

CollectionPub.afterCreate(async ({ collectionId }) => {
	await summarizeCollection(collectionId);
});

CollectionPub.afterDestroy(async ({ collectionId }) => {
	await summarizeCollection(collectionId);
});
