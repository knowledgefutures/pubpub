export type MemberPermission = 'view' | 'edit' | 'manage' | 'admin';

export type Member = {
	id?: string;
	permissions: MemberPermission;
	isOwner?: boolean;
	userId: string;
	pubId?: string;
	collectionId?: string;
	communityId?: string;
	organizationId?: string;
};
