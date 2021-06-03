import { InsertableActivityItemBase } from './util';

export type ThreadActivityItemBase = InsertableActivityItemBase & {
	payload: {
		threadId: string;
		isReply: boolean;
		threadComment: {
			id: string;
			text: string;
			userId: string;
		};
	};
};
