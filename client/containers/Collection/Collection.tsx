import React from 'react';

import { Layout } from 'components';
import { LayoutPubsByBlock } from 'utils/layout';
import { Pub, Collection as CollectionType } from 'utils/types';

type Props = {
	layoutPubsByBlock: LayoutPubsByBlock<Pub>;
	collection: CollectionType;
};

const Collection = (props: Props) => {
	const { layoutPubsByBlock, collection } = props;
	if (collection.layout) {
		const { blocks, isNarrow } = collection.layout;
		return (
			<Layout
				blocks={blocks}
				isNarrow={isNarrow}
				layoutPubsByBlock={layoutPubsByBlock}
				collection={collection}
			/>
		);
	}
	return null;
};

export default Collection;
