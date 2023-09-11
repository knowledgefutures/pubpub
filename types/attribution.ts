import {
	PubAttribution as PubAttributionModel,
	CollectionAttribution as CollectionAttributionModel,
} from 'server/models';
import { SerializedModel } from './serializedModel';

import { DefinitelyHas } from './util';

export type PubAttribution = SerializedModel<PubAttributionModel>;

export type CollectionAttribution = SerializedModel<CollectionAttributionModel>;

export type Attribution = CollectionAttribution | PubAttribution;
export type AttributionWithUser = DefinitelyHas<Attribution, 'user'>;

export const isAttributionWithUser = (
	attribution: Attribution | PubAttributionModel | CollectionAttributionModel,
): attribution is AttributionWithUser => 'user' in attribution && !!attribution.user;

export const isCollectionAttribution = (
	attribution: Attribution,
): attribution is CollectionAttribution => 'collectionId' in attribution;

export const isPubAttribution = (attribution: Attribution): attribution is PubAttribution =>
	'pubId' in attribution;

export const DEFAULT_ROLES = [
	'Conceptualization',
	'Methodology',
	'Software',
	'Validation',
	'Formal Analysis',
	'Investigation',
	'Resources',
	'Data Curation',
	'Writing – Original Draft Preparation',
	'Writing – Review & Editing',
	'Visualization',
	'Supervision',
	'Project Administration',
	'Peer Review',
	'Funding Acquisition',
	'Illustrator',
	'Editor',
	'Series Editor',
	'Translator',
	'Chair',
] as const;

export type AttributionRole = (typeof DEFAULT_ROLES)[number];

export type PubAttributionCreationParams = {
	pubId: string;
	order: number;
	roles?: string[] | null;
	affiliation?: string | null;
	isAuthor?: boolean | null;
} & (
	| {
			userId: string;
			name?: undefined | null;
			orcid?: undefined | null;
	  }
	| {
			name: string;
			userId?: undefined | null;
			orcid?: string | null;
	  }
);

export type CollectionAttributionCreationParams = Omit<PubAttributionCreationParams, 'pubId'> & {
	collectionId: string;
};
