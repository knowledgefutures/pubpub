import { MemberPermission } from 'types';

const orderedMemberPermissions = ['view', 'edit', 'manage', 'admin'];

export const checkMemberPermission = (held: MemberPermission, required: MemberPermission) => {
	return orderedMemberPermissions.indexOf(held) >= orderedMemberPermissions.indexOf(required);
};
