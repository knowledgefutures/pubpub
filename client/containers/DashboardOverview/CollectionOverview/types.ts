import { Pub, CollectionPub, DefinitelyHas } from 'types';

export type PubWithCollections = Pub & {
	collectionPubs: DefinitelyHas<CollectionPub, 'collection'>;
};
