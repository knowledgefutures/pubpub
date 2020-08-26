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
};

const blockTypes = [
	paragraphBlockType,
	{ key: 'header1', title: 'Header 1' },
	{ key: 'header2', title: 'Header 2' },
	{ key: 'header3', title: 'Header 3' },
	{ key: 'header4', title: 'Header 4', hideInMenu: true },
	{ key: 'header5', title: 'Header 5', hideInMenu: true },
	{ key: 'header6', title: 'Header 6', hideInMenu: true },
	{ key: 'code_block', title: 'Code Block' },
];

const BlockTypeSelector = React.forwardRef((props, ref) => {
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'editorChangeObject' does not exist on ty... Remove this comment to see the full error message
	const { editorChangeObject, isSmall, ...restProps } = props;
	const { menuItems = [] } = editorChangeObject;

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
				{effectiveBlockType.title}
			</Button>
		);
	};

	return (
		<CommandMenu
			// @ts-expect-error ts-migrate(2322) FIXME: Property 'className' does not exist on type 'Intri... Remove this comment to see the full error message
			className="block-type-selector-menu"
			aria-label="Choose text formatting"
			ref={ref}
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'hideInMenu' does not exist on type '{ ke... Remove this comment to see the full error message
			commands={blockTypes.filter((type) => !type.hideInMenu)}
			disclosure={renderDisclosure}
			editorChangeObject={editorChangeObject}
			{...restProps}
		/>
	);
});

// @ts-expect-error ts-migrate(2559) FIXME: Type '{ isSmall: Validator<boolean>; editorChangeO... Remove this comment to see the full error message
BlockTypeSelector.propTypes = propTypes;
export default BlockTypeSelector;
