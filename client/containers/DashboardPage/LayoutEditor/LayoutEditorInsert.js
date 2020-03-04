import React from 'react';
import PropTypes from 'prop-types';
import { Popover, PopoverInteractionKind, Position, Menu, MenuItem } from '@blueprintjs/core';
import Icon from 'components/Icon/Icon';

require('./layoutEditorInsert.scss');

const propTypes = {
	insertIndex: PropTypes.number.isRequired,
	onInsert: PropTypes.func.isRequired,
	communityData: PropTypes.object.isRequired,
};

const LayoutEditorInsert = function(props) {
	const insertIndex = props.insertIndex;
	const onInsert = props.onInsert;
	const pubsBlocks = [
		{
			title: 'Default',
			type: 'pubs',
			content: {
				title: '',
				pubPreviewType: 'medium',
				limit: 0,
				pubIds: [],
				collectionIds: [],
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
	const pagesBlocks = [
		{
			title: 'Default',
			type: 'pages',
			content: {
				title: '',
				pageIds: props.communityData.pages.slice(0, 3).map((page) => {
					return page.id;
				}),
			},
		},
	];
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

	const generateMenuItem = (item) => {
		return (
			<MenuItem
				key={`insert-${item.type}-${item.title}`}
				onClick={() => {
					onInsert(insertIndex, item.type, item.content);
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
						<li className="bp3-menu-header">
							<h6>
								Pubs Block
								<Icon icon="widget-header" />
							</h6>
						</li>
						{pubsBlocks.map((item) => {
							return generateMenuItem(item);
						})}
						<li className="bp3-menu-header">
							<h6>
								Banner Block
								<Icon icon="vertical-distribution" />
							</h6>
						</li>
						{bannerBlocks.map((item) => {
							return generateMenuItem(item);
						})}
						<li className="bp3-menu-header">
							<h6>
								Text Block
								<Icon icon="new-text-box" />
							</h6>
						</li>
						{textBlocks.map((item) => {
							return generateMenuItem(item);
						})}
						<li className="bp3-menu-header">
							<h6>
								HTML Block
								<Icon icon="code" />
							</h6>
						</li>
						{htmlBlocks.map((item) => {
							return generateMenuItem(item);
						})}
						<li className="bp3-menu-header">
							<h6>
								Pages Block
								<Icon icon="application" />
							</h6>
						</li>
						{pagesBlocks.map((item) => {
							return generateMenuItem(item);
						})}
					</Menu>
				}
				interactionKind={PopoverInteractionKind.CLICK}
				position={Position.BOTTOM}
				popoverClassName="bp3-minimal"
				transitionDuration={-1}
				inheritDarkTheme={false}
				usePortal={false}
			>
				<button type="button" className="bp3-button bp3-icon-add">
					Add Block
				</button>
			</Popover>
			<div className="center-line" />
		</div>
	);
};

LayoutEditorInsert.propTypes = propTypes;
export default LayoutEditorInsert;
