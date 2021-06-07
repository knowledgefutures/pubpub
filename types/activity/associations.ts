import {
	IdIndex,
	CollectionPub,
	Collection,
	Community,
	Discussion,
	ExternalPublication,
	PubEdge,
	Pub,
	Release,
	Review,
	ThreadComment,
	Thread,
	User,
} from 'types';

import { ActivityItem } from '.';

export const activityAssociationTypes = [
	'collectionPub',
	'collection',
	'community',
	'discussion',
	'externalPublication',
	'pubEdge',
	'pub',
	'review',
	'release',
	'threadComment',
	'thread',
	'user',
] as const;

type AssociationRecord<T> = T extends Record<ActivityAssociationType, any> ? T : never;
type IdIndexes<T extends { [k: string]: any }> = { [k in keyof T]: IdIndex<T[k]> };

export type ActivityAssociationType = typeof activityAssociationTypes[number];
export type ActivityAssociationIds = Record<ActivityAssociationType, string[]>;

export type ActivityAssociations = AssociationRecord<
	IdIndexes<{
		collectionPub: CollectionPub;
		collection: Collection;
		community: Community;
		discussion: Discussion;
		externalPublication: ExternalPublication;
		pubEdge: PubEdge;
		pub: Pub;
		release: Release;
		review: Review;
		threadComment: ThreadComment;
		thread: Thread;
		user: User;
	}>
>;

export type ActivityItemsContext = {
	activityItems: ActivityItem[];
	associations: ActivityAssociations;
};
