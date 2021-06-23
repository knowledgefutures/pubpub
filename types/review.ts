import { Visibility } from './visibility';
import { Thread } from './thread';
import { Pub } from './pub';

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
	pub?: Pub;
};
