import {
	Discussion as DiscussionModel,
	DiscussionAnchor as DiscussionAnchorModel,
} from 'server/models';
import { SerializedModel } from './serializedModel';

export type DiscussionAnchor = SerializedModel<DiscussionAnchorModel>;
export type Discussion = SerializedModel<DiscussionModel>;
