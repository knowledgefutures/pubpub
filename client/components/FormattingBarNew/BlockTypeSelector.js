import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';

import CommandMenu from './CommandMenu';

const propTypes = {
	isSmall: PropTypes.bool.isRequired,
	editorChangeObject: PropTypes.shape({
		menuItems: PropTypes.arrayOf(PropTypes.shape({})),
	}).isRequired,
};

const paragraphBlockType = {
	key: 'paragraph',
	title: 'Paragraph',
	shortTitle: 'Para',
	icon: 'git-merge',
};

const blockTypes = [
	paragraphBlockType,
	{ key: 'header1', title: 'Header 1', shortTitle: 'H1', icon: 'header-one' },
	{ key: 'header2', title: 'Header 2', shortTitle: 'H2', icon: 'header-two' },
	{ key: 'header3', title: 'Header 3', shortTitle: 'H3', icon: 'comparison' },
	{
		key: 'header4',
		title: 'Header 4',
		shortTitle: 'H4',
		icon: 'comparison',
		hideInMenu: true,
	},
	{
		key: 'header5',
		title: 'Header 5',
		shortTitle: 'H5',
		icon: 'comparison',
		hideInMenu: true,
	},
	{
		key: 'header6',
		title: 'Header 6',
		shortTitle: 'H6',
		icon: 'comparison',
		hideInMenu: true,
	},
	{ key: 'code_block', title: 'Code Block', shortTitle: 'Code', icon: 'code' },
];

const BlockTypeSelector = React.forwardRef((props, ref) => {
	const {
		editorChangeObject: { menuItems = [] },
		isSmall,
	} = props;
	// eslint-disable-next-line react/prop-types

	// eslint-disable-next-line react/prop-types
	const renderDisclosure = ({ ref: innerRef, ...disclosureProps }) => {
		const activeMenuItem = menuItems.find((item) => item.isActive);
		const activeBlockType =
			activeMenuItem &&
			blockTypes.find((blockType) => blockType.key === activeMenuItem.title);
		const effectiveBlockType = activeBlockType || paragraphBlockType;
		return (
			<Button
				minimal
				className="block-type-selector-component"
				rightIcon="caret-down"
				elementRef={innerRef}
				{...disclosureProps}
				disabled={!activeBlockType}
				small={isSmall}
			>
				<span>
					<span className="full-title">{effectiveBlockType.title}</span>
					<span className="short-title">{effectiveBlockType.shortTitle}</span>
				</span>
			</Button>
		);
	};

	return (
		<CommandMenu
			aria-label="Choose text formatting"
			ref={ref}
			commands={blockTypes.filter((type) => !type.hideInMenu)}
			disclosure={renderDisclosure}
			{...props}
		/>
	);
});

BlockTypeSelector.propTypes = propTypes;
export default BlockTypeSelector;
