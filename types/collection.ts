import type {
	Collection as CollectionModel,
	CollectionPub as CollectionPubModel,
} from 'server/models';

import type { SerializedModel } from './serializedModel';

export const collectionKinds = ['tag', 'issue', 'book', 'conference'] as const;
export type CollectionKind = (typeof collectionKinds)[number];
export const readNextPreviewSizes = ['none', 'minimal', 'medium', 'choose-best'] as const;
export type ReadNextPreviewSize = (typeof readNextPreviewSizes)[number];

export type Collection = SerializedModel<CollectionModel>;

export type CollectionPub = SerializedModel<CollectionPubModel>;
