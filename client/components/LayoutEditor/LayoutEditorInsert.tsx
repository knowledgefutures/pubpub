import React from 'react';
import {
	Button,
	Classes,
	Menu,
	MenuItem,
	Popover,
	PopoverInteractionKind,
	Position,
} from '@blueprintjs/core';

import { Page } from 'types';
import { LayoutBlock, PubSortOrder } from 'utils/layout/types';
import { Icon } from 'components';

require('./layoutEditorInsert.scss');

type Props = {
	communityData: {
		pages: Page[];
	};
	insertIndex: number;
	onInsert: (
		index: number,
		type: LayoutBlock['type'],
		content: LayoutBlock['content'],
	) => unknown;
	pubSort: PubSortOrder;
	showCollectionHeaderBlock: boolean;
};

const collectionHeaderBlock = {
	type: 'collection-header',
	title: 'Default',
	content: {},
};

const htmlBlocks = [
	{
		title: 'Default',
		type: 'html',
		content: {
			html: '',
		},
	},
];

const textBlocks = [
	{
		title: 'Default',
		type: 'text',
		content: {
			text: undefined,
			align: 'left',
		},
	},
];

const getPubsBlocks = (pubSort: PubSortOrder) => [
	{
		title: 'Default',
		type: 'pubs',
		content: {
			title: '',
			pubPreviewType: 'medium',
			limit: 0,
			pubIds: [],
			collectionIds: [],
			sort: pubSort,
		},
	},
	{
		title: 'Table of Contents',
		type: 'pubs',
		content: {
			title: '',
			pubPreviewType: 'small',
			limit: 0,
			pubIds: [],
			collectionIds: [],
			hideByline: true,
			hideDates: true,
			hideContributors: true,
		},
	},
];

const bannerBlocks = [
	{
		title: 'Default',
		type: 'banner',
		content: {
			text: 'Hello',
			align: 'center',
			backgroundColor: '#3275d8',
			backgroundImage: '',
			backgroundSize: 'full',
			showButton: false,
			buttonText: '',
			defaultCollectionIds: [],
			buttonUrl: '',
			buttonType: 'none',
		},
	},
	{
		title: 'Submission Button Banner',
		type: 'banner',
		content: {
			text: 'Create a pub to begin your submission.',
			align: 'center',
			backgroundColor: '#3275d8',
			backgroundImage: '',
			backgroundSize: 'full',
			showButton: true,
			buttonText: '',
			defaultCollectionIds: [],
			buttonUrl: '',
			buttonType: 'create-pub',
		},
	},
];

const newCollectionsPagesBlock = (communityData) => {
	const pagesToShow = communityData.pages.slice(0, 3);
	return {
		type: 'collections-pages',
		title: 'Default',
		content: {
			title: '',
			items: pagesToShow,
		},
	};
};

const LayoutEditorInsert = (props: Props) => {
	const { insertIndex, onInsert, pubSort, showCollectionHeaderBlock } = props;
	const pagesCollectionsBlocks = [newCollectionsPagesBlock(props.communityData)];

	const generateMenuItem = (item) => {
		return (
			<MenuItem
				key={`insert-${item.type}-${item.title}`}
				onClick={() => {
					onInsert(insertIndex, item.type, { ...item.content });
				}}
				text={item.title}
				shouldDismissPopover={true}
			/>
		);
	};

	return (
		<div className="layout-editor-insert-component">
			<Popover
				content={
					<Menu>
						{showCollectionHeaderBlock && (
							<>
								<li className={Classes.MENU_HEADER}>
									<h6>Collection Header Block</h6>
								</li>
								{generateMenuItem(collectionHeaderBlock)}
							</>
						)}
						<li className={Classes.MENU_HEADER}>
							<h6>
								Pubs Block
								<Icon icon="widget-header" />
							</h6>
						</li>
						{getPubsBlocks(pubSort).map((item) => generateMenuItem(item))}
						<li className={Classes.MENU_HEADER}>
							<h6>
								Banner Block
								<Icon icon="vertical-distribution" />
							</h6>
						</li>
						{bannerBlocks.map((item) => generateMenuItem(item))}
						<li className={Classes.MENU_HEADER}>
							<h6>
								Text Block
								<Icon icon="new-text-box" />
							</h6>
						</li>
						{textBlocks.map((item) => generateMenuItem(item))}
						<li className={Classes.MENU_HEADER}>
							<h6>
								HTML Block
								<Icon icon="code" />
							</h6>
						</li>
						{htmlBlocks.map((item) => generateMenuItem(item))}
						<li className={Classes.MENU_HEADER}>
							<h6>
								Collections & Pages Block
								<Icon icon="application" />
							</h6>
						</li>
						{pagesCollectionsBlocks.map((item) => generateMenuItem(item))}
					</Menu>
				}
				interactionKind={PopoverInteractionKind.CLICK}
				position={Position.BOTTOM}
				popoverClassName={Classes.MINIMAL}
				transitionDuration={-1}
				inheritDarkTheme={false}
				usePortal={false}
			>
				<Button icon="add">Add Block</Button>
			</Popover>
			<div className="center-line" />
		</div>
	);
};

export default LayoutEditorInsert;
