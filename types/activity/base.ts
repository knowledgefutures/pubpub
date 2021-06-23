export type InsertableActivityItemBase = {
	kind: string;
	communityId: string;
	actorId: null | string;
	collectionId?: string;
	pubId?: string;
};
