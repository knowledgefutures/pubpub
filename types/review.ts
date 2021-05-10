import { Visibility } from './visibility';
import { Thread } from './thread';

export type Review = {
	id: string;
	createdAt: string;
	updatedAt: string;
	title: string;
	number: number;
	status: 'open' | 'closed' | 'completed';
	releaseRequested: boolean;
	threadId: string;
	thread?: Thread;
	visibilityId: string;
	visibility?: Visibility;
	userId: string;
	pubId: string;
};
