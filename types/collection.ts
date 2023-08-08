import { Collection as CollectionModel, CollectionPub as CollectionPubModel } from 'server/models';
import { SerializedModel } from './serializedModel';

export type CollectionKind = 'tag' | 'issue' | 'book' | 'conference';
export type ReadNextPreviewSize = 'none' | 'minimal' | 'medium' | 'choose-best';

export type Collection = SerializedModel<CollectionModel>;

export type CollectionPub = SerializedModel<CollectionPubModel>;
