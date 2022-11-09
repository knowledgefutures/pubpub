import React, { useEffect } from 'react';
import { Button, Card, Classes, Tooltip } from '@blueprintjs/core';
import stickybits from 'stickybits';

import { LayoutBlock, LayoutPubsByBlock } from 'utils/layout';
import { Pub, Community, Collection, DefinitelyHas } from 'types';

import { Popover } from 'components';
import { useLayout } from './useLayout';
import { useLayoutPubs } from './useLayoutPubs';
import LayoutEditorInsert from './LayoutEditorInsert';
import LayoutEditorPubs from './LayoutEditorPubs';
import LayoutEditorPagesCollections from './LayoutEditorPagesCollections';
import LayoutEditorText from './LayoutEditorText';
import LayoutEditorHtml from './LayoutEditorHtml';
import LayoutEditorBanner from './LayoutEditorBanner';
import LayoutEditorCollectionHeader from './LayoutEditorCollectionHeader';

require('./layoutEditor.scss');

type Props = {
	onChange: (layout: LayoutBlock[]) => unknown;
	initialLayout: LayoutBlock[];
	initialLayoutPubsByBlock: LayoutPubsByBlock<Pub>;
	collection?: Collection;
	communityData: DefinitelyHas<Community, 'pages' | 'collections'>;
};

const validBlockTypes = [
	'pubs',
	'text',
	'html',
	'banner',
	'collections-pages',
	'collection-header',
];

const getTitleKindForBlock = (blockType: string) => {
	if (blockType === 'collection-header') {
		return 'Collection Header';
	}
	if (blockType === 'collections-pages') {
		return 'Collections & Pages';
	}
	if (blockType === 'html') {
		return 'HTML';
	}
	return blockType;
};

const LayoutEditor = React.memo((props: Props) => {
	const { initialLayout, initialLayoutPubsByBlock, collection, communityData, onChange } = props;
	const {
		layout,
		changeLayout,
		changeLayoutPartial,
		insertBlock,
		removeBlock,
		moveBlockUp,
		moveBlockDown,
	} = useLayout(initialLayout, onChange);
	const { pubsByBlockId, loadingPubs } = useLayoutPubs(
		initialLayoutPubsByBlock,
		layout,
		collection && collection.id,
	);

	useEffect(() => {
		const stickyInstance = stickybits('.block-header', {
			// TODO(ian): this is a magic number to make this work "for now" --
			// it's the combined height of the global header and dashboard breadcrumbs
			stickyBitStickyOffset: 73 + 56,
		});
		return () => stickyInstance.cleanup();
	}, []);

	const cannotRemoveLonePubsBlock =
		!!collection && layout.filter((block) => block.type === 'pubs').length === 1;

	const renderLayoutBlockTitle = (block: LayoutBlock, index: number) => {
		const cannotRemove = cannotRemoveLonePubsBlock && block.type === 'pubs';

		return (
			<div className="block-title">
				<div className="text">{getTitleKindForBlock(block.type)} Block</div>
				<div className={`${Classes.BUTTON_GROUP} ${Classes.MINIMAL} ${Classes.SMALL}`}>
					<Button
						text="Move Up"
						icon="caret-up"
						disabled={index === 0}
						onClick={() => moveBlockUp(index)}
					/>
					<Button
						text="Move Down"
						icon="caret-down"
						disabled={index === layout.length - 1}
						onClick={() => moveBlockDown(index)}
					/>
					{!cannotRemove && (
						<Popover
							placement="bottom-end"
							aria-label="Remove this block"
							gutter={1}
							content={
								<Card>
									<p>Are you sure you want to remove this block?</p>
									<Button
										intent="danger"
										text="Remove"
										onClick={() => removeBlock(index)}
									/>
								</Card>
							}
						>
							<Button>Remove Block</Button>
						</Popover>
					)}
					{cannotRemove && (
						<Tooltip content="This layout requires at least one Pubs block.">
							<Button text="Remove" disabled />
						</Tooltip>
					)}
				</div>
			</div>
		);
	};

	const renderLayoutBlock = (block: LayoutBlock, index: number) => {
		const validType = validBlockTypes.indexOf(block.type) > -1;
		if (!validType) {
			return null;
		}
		return (
			<div key={block.id}>
				{renderLayoutBlockTitle(block, index)}
				<div key={`block-${block.id}`} className="component-wrapper">
					{block.type === 'pubs' && (
						<LayoutEditorPubs
							key={`item-${block.id}`}
							onChange={changeLayoutPartial}
							layoutIndex={index}
							block={block}
							pubsInBlock={pubsByBlockId[block.id] || []}
							communityData={communityData}
							loading={loadingPubs}
							scopedCollectionId={collection?.id}
						/>
					)}
					{block.type === 'text' && (
						<LayoutEditorText
							key={`item-${block.id}`}
							onChange={changeLayoutPartial}
							layoutIndex={index}
							content={block.content}
						/>
					)}
					{block.type === 'html' && (
						<LayoutEditorHtml
							key={`item-${block.id}`}
							onChange={changeLayout}
							layoutIndex={index}
							content={block.content}
						/>
					)}
					{block.type === 'banner' && (
						<LayoutEditorBanner
							key={`item-${block.id}`}
							onChange={changeLayout}
							layoutIndex={index}
							content={block.content}
							communityData={communityData}
						/>
					)}
					{block.type === 'collections-pages' && (
						<LayoutEditorPagesCollections
							key={`item-${block.id}`}
							onChange={changeLayout}
							layoutIndex={index}
							content={block.content}
							pages={communityData.pages}
							collections={communityData.collections}
						/>
					)}
					{!!collection && block.type === 'collection-header' && (
						<LayoutEditorCollectionHeader
							key={`item-${block.id}`}
							layoutIndex={index}
							onChange={changeLayoutPartial}
							collection={collection}
							block={block}
						/>
					)}
				</div>
				<LayoutEditorInsert
					key={`insert-${block.id}`}
					insertIndex={index + 1}
					onInsert={insertBlock}
					communityData={communityData}
					showCollectionHeaderBlock={!!collection}
					pubSort={collection ? 'collection-rank' : 'creation-date'}
				/>
			</div>
		);
	};

	return (
		<div className="layout-editor-component">
			<LayoutEditorInsert
				insertIndex={0}
				onInsert={insertBlock}
				communityData={communityData}
				showCollectionHeaderBlock={!!collection}
				pubSort={collection ? 'collection-rank' : 'creation-date'}
			/>
			{layout.map(renderLayoutBlock)}
		</div>
	);
});

export default LayoutEditor;
