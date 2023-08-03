import {
	Discussion,
	ReviewNew,
	Pub,
	Submission,
	CollectionPub,
	Collection,
	Community,
} from 'server/models';
import { summarizeCollection, summarizeCommunity, summarizePub } from './queries';

let summarizeParentScopesOnPubCreation = true;

export const setSummarizeParentScopesOnPubCreation = (value: boolean) => {
	summarizeParentScopesOnPubCreation = value;
};

[Discussion, ReviewNew].forEach((Model) => {
	Model.afterCreate(async ({ pubId }) => {
		await summarizePub(pubId);
	});
	Model.afterDestroy(async ({ pubId }) => {
		await summarizePub(pubId);
	});
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
