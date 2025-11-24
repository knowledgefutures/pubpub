import type { Collection as CollectionType, Pub } from 'types';
import type { CollectionLayout, LayoutPubsByBlock } from 'utils/layout';

import React from 'react';

import { Layout } from 'components';

type Props = {
	layoutPubsByBlock: LayoutPubsByBlock<Pub>;
	layout: CollectionLayout;
	collection: CollectionType;
};

const Collection = (props: Props) => {
	const { layoutPubsByBlock, layout, collection } = props;

	if (layout) {
		const { blocks, isNarrow } = layout;
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
