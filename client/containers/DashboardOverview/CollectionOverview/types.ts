import { Pub, CollectionPub, DefinitelyHas } from 'utils/types';

export type PubWithCollections = Pub & {
	collectionPubs: DefinitelyHas<CollectionPub, 'collection'>;
};
