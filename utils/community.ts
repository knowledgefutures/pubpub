import { Community } from 'types';

export const getPublisherString = (community: Pick<Community, 'publishAs' | 'title'>): string =>
	community.publishAs || community.title;
