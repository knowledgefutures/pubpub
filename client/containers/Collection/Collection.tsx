import React from 'react';

import { Layout } from 'components';
import { LayoutPubsByBlock, CollectionLayout } from 'utils/layout';
import { Pub, Collection as CollectionType } from 'types';

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
