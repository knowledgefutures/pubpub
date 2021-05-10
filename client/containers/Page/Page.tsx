import React from 'react';

import { Layout } from 'components';
import { Pub } from 'types';
import { LayoutBlock, LayoutPubsByBlock } from 'utils/layout';
import { getDefaultLayout } from 'utils/pages';

type Props = {
	pageData: {
		layoutPubsByBlock: LayoutPubsByBlock<Pub>;
		isNarrow: boolean;
		isNarrowWidth: boolean;
		layout: LayoutBlock[];
	};
};

const Page = (props: Props) => {
	const { pageData } = props;
	const blocks = pageData.layout || getDefaultLayout();
	return (
		<Layout
			blocks={blocks}
			isNarrow={pageData.isNarrow || pageData.isNarrowWidth}
			layoutPubsByBlock={pageData.layoutPubsByBlock}
		/>
	);
};

export default Page;
