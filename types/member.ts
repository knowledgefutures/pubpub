import type { Member as MemberModel } from 'server/models';

import type { SerializedModel } from './serializedModel';

export const memberPermissions = ['view', 'edit', 'manage', 'admin'] as const;
export type MemberPermission = (typeof memberPermissions)[number];

export type Member = SerializedModel<MemberModel>;

/** A member as seen in scope data: either a Member row, or an org membership the user
 *  inherits in a community their org owns */
export type ScopeMember = Member & {
	inheritedFromOrg?: { id: string; slug: string; title: string };
};
