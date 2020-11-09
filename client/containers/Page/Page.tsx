import React from 'react';

import { Layout } from 'components';
import { LayoutBlock } from 'utils/layout/types';
import { getDefaultLayout } from 'utils/pages';

type Props = {
	pageData: {
		pubs: any[];
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
			pubs={pageData.pubs}
		/>
	);
};

export default Page;
