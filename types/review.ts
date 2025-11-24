import type { Reviewer as ReviewerModel, ReviewNew as ReviewNewModel } from 'server/models';

import type { SerializedModel } from './serializedModel';

export type Review = SerializedModel<ReviewNewModel>;

export type Reviewer = SerializedModel<ReviewerModel>;
