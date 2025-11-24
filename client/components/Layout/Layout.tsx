import type { Collection, Pub } from 'types';

import React from 'react';

import classNames from 'classnames';

import { usePageContext } from 'utils/hooks';
import {
	type LayoutBlock,
	type LayoutOptions,
	type LayoutPubsByBlock,
	resolveLayoutPubsByBlock,
} from 'utils/layout';

import LayoutBanner from './LayoutBanner';
import LayoutCollectionHeader from './LayoutCollectionHeader';
import LayoutHtml from './LayoutHtml';
import LayoutPagesCollections from './LayoutPagesCollections';
import LayoutPubs from './LayoutPubs';
import LayoutSubmissionBanner from './LayoutSubmissionBanner';
import LayoutText from './LayoutText';

import './layout.scss';

type Props = LayoutOptions & {
	blocks: LayoutBlock[];
	id?: string;
	layoutPubsByBlock: LayoutPubsByBlock<Pub>;
	collection?: Collection;
};

const Layout = (props: Props) => {
	const { locationData, loginData, communityData } = usePageContext();
	const { blocks, isNarrow, layoutPubsByBlock, id = '', collection } = props;
	const pubsByBlockId = resolveLayoutPubsByBlock(layoutPubsByBlock, blocks);

	const renderBlock = (block: LayoutBlock, index: number) => {
		if (block.type === 'pubs') {
			return (
				<div className="layout-pubs-block" key={index}>
					<LayoutPubs
						content={block.content}
						pubs={pubsByBlockId[block.id]}
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
			return (
				<LayoutCollectionHeader
					key={index}
					content={block.content}
					collection={collection}
				/>
			);
		}
		if (block.type === 'submission-banner') {
			return <LayoutSubmissionBanner key={index} content={block.content} />;
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
