import React from 'react';
import classNames from 'classnames';

import { Collection, Pub } from 'utils/types';
import { getPubsByBlockIndex } from 'utils/layout';
import { LayoutBlock, LayoutOptions } from 'utils/layout/types';
import { usePageContext } from 'utils/hooks';

import LayoutPubs from './LayoutPubs';
import LayoutHtml from './LayoutHtml';
import LayoutBanner from './LayoutBanner';
import LayoutText from './LayoutText';
import LayoutPagesCollections from './LayoutPagesCollections';
import LayoutCollectionHeader from './LayoutCollectionHeader';

require('./layout.scss');

type Props = LayoutOptions & {
	blocks: LayoutBlock[];
	id?: string;
	pubs: Pub[];
	collection?: Collection;
};

const Layout = (props: Props) => {
	const { locationData, loginData, communityData } = usePageContext();
	const { blocks, isNarrow, pubs, id = '', collection } = props;

	const pubBlocksLists = getPubsByBlockIndex(blocks, pubs, {
		collectionId: collection && collection.id,
	});

	const renderBlock = (block: LayoutBlock, index: number) => {
		if (block.type === 'pubs') {
			return (
				<div className="layout-pubs-block" key={index}>
					<LayoutPubs
						content={block.content}
						pubs={pubBlocksLists[index]}
						collectionId={collection && collection.id}
					/>
				</div>
			);
		}
		if (block.type === 'text') {
			return <LayoutText key={index} content={block.content} />;
		}
		if (block.type === 'html') {
			return <LayoutHtml key={index} content={block.content} />;
		}
		if (block.type === 'banner') {
			return (
				<LayoutBanner
					key={index}
					content={block.content}
					communityData={communityData}
					loginData={loginData}
					locationData={locationData}
				/>
			);
		}
		if (block.type === 'collections-pages') {
			return (
				<div className="layout-pages-block" key={index}>
					<LayoutPagesCollections
						content={block.content}
						pages={communityData.pages}
						collections={communityData.collections}
					/>
				</div>
			);
		}
		if (block.type === 'collection-header' && collection) {
			return <LayoutCollectionHeader content={block.content} collection={collection} />;
		}
		return null;
	};

	return (
		<div
			id={id}
			className={classNames(
				'layout-component',
				isNarrow && 'narrow',
				locationData.query.display === 'ultrawide' && 'ultrawide',
			)}
		>
			{blocks.map(renderBlock)}
		</div>
	);
};

export default Layout;
