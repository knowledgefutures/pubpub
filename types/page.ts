import { LayoutBlock } from 'utils/layout/types';

export type Page = {
	id: string;
	title: string;
	slug: string;
	communityId: string;
	description: null | string;
	avatar?: string;
	isPublic: boolean;
	isNarrowWidth?: boolean;
	viewHash?: string;
	layout: LayoutBlock[];
};
