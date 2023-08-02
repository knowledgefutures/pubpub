import { ReviewNew as ReviewNewModel, Reviewer as ReviewerModel } from 'server/models';
import { SerializedModel } from './serializedModel';

export type Review = SerializedModel<ReviewNewModel>;

export type Reviewer = SerializedModel<ReviewerModel>;
