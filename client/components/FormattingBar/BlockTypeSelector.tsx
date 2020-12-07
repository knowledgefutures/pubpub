import React from 'react';
import { Button } from '@blueprintjs/core';

import CommandMenu from './CommandMenu';

require('./blockTypeSelector.scss');

type Props = {
	isSmall: boolean;
	editorChangeObject: {
		menuItems?: {}[];
	};
};

const paragraphBlockType = {
	key: 'paragraph',
	title: <p>Paragraph</p>,
	label: 'Paragraph',
};

const blockTypes = [
	paragraphBlockType,
	{ key: 'header1', title: <h1 className="h1">Header 1</h1>, label: 'Header 1' },
	{ key: 'header2', title: <h2 className="h2">Header 2</h2>, label: 'Header 2' },
	{ key: 'header3', title: <h3 className="h3">Header 3</h3>, label: 'Header 3' },
	{ key: 'header4', title: <h4 className="h4">Header 4</h4>, label: 'Header 4' },
	{ key: 'header5', title: <h5 className="h5">Header 5</h5>, label: 'Header 5' },
	{ key: 'header6', title: <h6 className="h6">Header 6</h6>, label: 'Header 6' },
	{
		key: 'code_block',
		title: (
			<pre>
				<code>Code</code>
			</pre>
		),
		label: 'Code',
	},
];

const BlockTypeSelector = React.forwardRef<any, Props>((props, ref) => {
	const { editorChangeObject, isSmall, ...restProps } = props;
	const { menuItems = [] } = editorChangeObject;

	// eslint-disable-next-line react/prop-types
	const renderDisclosure = ({ ref: innerRef, ...disclosureProps }) => {
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'isActive' does not exist on type '{}'.
		const activeMenuItem = menuItems.find((item) => item.isActive);
		const activeBlockType =
			activeMenuItem &&
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'title' does not exist on type '{}'.
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
				{effectiveBlockType.label}
			</Button>
		);
	};

	return (
		<CommandMenu
			className="block-type-selector-menu pub-body-styles"
			aria-label="Choose text formatting"
			ref={ref}
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'hideInMenu' does not exist on type '{ ke... Remove this comment to see the full error message
			commands={blockTypes.filter((type) => !type.hideInMenu)}
			disclosure={renderDisclosure}
			// @ts-expect-error ts-migrate(2741) FIXME: Property 'view' is missing in type '{ menuItems?: ... Remove this comment to see the full error message
			editorChangeObject={editorChangeObject}
			{...restProps}
		/>
	);
});
export default BlockTypeSelector;
