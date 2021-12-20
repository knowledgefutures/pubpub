import {
	IdIndex,
	CollectionPub,
	Collection,
	Community,
	Discussion,
	ExternalPublication,
	Page,
	PubEdge,
	Pub,
	Release,
	Review,
	Submission,
	ThreadComment,
	Thread,
	User,
} from 'types';

export const activityAssociationTypes = [
	'collectionPub',
	'collection',
	'community',
	'discussion',
	'externalPublication',
	'page',
	'pubEdge',
	'pub',
	'review',
	'submission',
	'release',
	'threadComment',
	'thread',
	'user',
] as const;

type AssociationRecord<T> = T extends Record<ActivityAssociationType, any> ? T : never;
type IdIndexes<T extends { [k: string]: any }> = { [k in keyof T]: IdIndex<T[k]> };

export type ActivityAssociationType = typeof activityAssociationTypes[number];
export type ActivityAssociationIds = Record<ActivityAssociationType, Set<string>>;

export type ActivityAssociationModels = {
	collectionPub: CollectionPub;
	collection: Collection;
	community: Community;
	discussion: Discussion;
	externalPublication: ExternalPublication;
	page: Page;
	pubEdge: PubEdge;
	pub: Pub;
	release: Release;
	review: Review;
	submission: Submission;
	threadComment: ThreadComment;
	thread: Thread;
	user: User;
};

export type ActivityAssociations = AssociationRecord<IdIndexes<ActivityAssociationModels>>;
