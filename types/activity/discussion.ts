import { ThreadActivityItemBase } from './thread';

export type DiscussionActivityItemBase = ThreadActivityItemBase & {
	payload: {
		discussionId: string;
	};
};
