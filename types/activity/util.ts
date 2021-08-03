export type InsertableActivityItemBase = {
	kind: string;
	communityId: string;
	actorId: string;
	collectionId?: string;
	pubId?: string;
	payload: Record<string, any>;
};
