import type { Community, DefinitelyHas } from 'types';

export type CommunityWithSpam = DefinitelyHas<Community, 'spamTag'>;
