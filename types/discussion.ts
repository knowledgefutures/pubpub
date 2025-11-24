import type {
	DiscussionAnchor as DiscussionAnchorModel,
	Discussion as DiscussionModel,
} from 'server/models';

import type { SerializedModel } from './serializedModel';

export type DiscussionAnchor = SerializedModel<DiscussionAnchorModel>;
export type Discussion = SerializedModel<DiscussionModel>;
