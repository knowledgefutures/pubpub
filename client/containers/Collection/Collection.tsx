import React from 'react';

import { Layout } from 'components';
import { Pub, Collection as CollectionType } from 'utils/types';

type Props = {
	pubs: Pub[];
	collection: CollectionType;
};

const Collection = (props: Props) => {
	const { pubs, collection } = props;
	if (collection.layout) {
		const { blocks, isNarrow } = collection.layout;
		return <Layout blocks={blocks} isNarrow={isNarrow} pubs={pubs} collection={collection} />;
	}
	return null;
};

export default Collection;
