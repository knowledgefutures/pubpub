import { DefinitelyHas, Community } from 'types';

export type CommunityWithSpam = DefinitelyHas<Community, 'spamTag'>;
