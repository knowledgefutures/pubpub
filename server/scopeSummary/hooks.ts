import { Discussion, ReviewNew, Pub, CollectionPub, Collection, Community } from 'server/models';
import { summarizeCollection, summarizeCommunity, summarizePub } from './queries';

[Discussion, ReviewNew].forEach((Model) => {
	Model.afterCreate(async ({ pubId }) => {
		await summarizePub(pubId);
	});
	Model.afterDestroy(async ({ pubId }) => {
		await summarizePub(pubId);
	});
});

Pub.afterCreate(async ({ id }) => {
	await summarizePub(id);
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
