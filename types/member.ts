import { User } from './user';

export type MemberPermission = 'view' | 'edit' | 'manage' | 'admin';

export type Member = {
	id: string;
	createdAt: string;
	updatedAt: string;
	permissions: MemberPermission;
	isOwner?: boolean;
	subscribedToActivityDigest: boolean;
	userId: string;
	pubId?: string;
	collectionId?: string;
	communityId?: string;
	organizationId?: string;
	user?: User;
};
