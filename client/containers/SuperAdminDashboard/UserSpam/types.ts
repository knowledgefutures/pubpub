import type { DefinitelyHas, UserWithPrivateFields } from 'types';

export type SpamUser = DefinitelyHas<UserWithPrivateFields, 'spamTag'>;
