import type { Member as MemberModel } from 'server/models';

import type { SerializedModel } from './serializedModel';

export const memberPermissions = ['view', 'edit', 'manage', 'admin'] as const;
export type MemberPermission = (typeof memberPermissions)[number];

export type Member = SerializedModel<MemberModel>;
