import { Member as MemberModel } from 'server/models';
import { SerializedModel } from './serializedModel';

export const memberPermissions = ['view', 'edit', 'manage', 'admin'] as const;
export type MemberPermission = (typeof memberPermissions)[number];

export type Member = SerializedModel<MemberModel>;
