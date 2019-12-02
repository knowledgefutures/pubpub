import React from 'react';
import PropTypes from 'prop-types';
import { Toolbar, ToolbarItem, useToolbarState, Button } from 'reakit';
import { OverflowList } from '@blueprintjs/core';

import { Icon } from 'components';

import BlockTypeSelector from './BlockTypeSelector';

require('./formattingBar.scss');

const propTypes = {
	editorChangeObject: PropTypes.object.isRequired,
	isSmall: PropTypes.bool,
};

const defaultProps = {
	isSmall: false,
};

const formattingItems = [
	{ key: 'strong', title: 'Bold', icon: 'bold', priority: true },
	{ key: 'em', title: 'Italic', icon: 'italic', priority: true },
	{ key: 'link', title: 'Link', icon: 'link', priority: true },
	{ key: 'bullet-list', title: 'Bullet List', icon: 'list-ul' },
	{ key: 'numbered-list', title: 'Numbered List', icon: 'list-ol' },
	{ key: 'blockquote', title: 'Blockquote', icon: 'citation' },
	{ key: 'code', title: 'Code', icon: 'code' },
	{ key: 'subscript', title: 'Subscript', icon: 'subscript' },
	{ key: 'superscript', title: 'Superscript', icon: 'superscript' },
	{ key: 'strikethrough', title: 'Strikethrough', icon: 'strikethrough' },
];

const FormattingBar = (props) => {
	const { editorChangeObject, isSmall } = props;
	const toolbar = useToolbarState({});

	const showFormattingItem = (item) => !isSmall || item.priority;

	return (
		<Toolbar className="formatting-bar-component" aria-label="Formatting toolbar" {...toolbar}>
			<ToolbarItem
				as={BlockTypeSelector}
				editorChangeObject={editorChangeObject}
				{...toolbar}
			/>
			{formattingItems.filter(showFormattingItem).map((item) => (
				<ToolbarItem {...toolbar}>
					{(toolbarItemProps) => (
						<Button
							{...toolbarItemProps}
							key={item.key}
							as="a"
							className="bp3-button bp3-minimal"
						>
							<Icon icon={item.icon} />
						</Button>
					)}
				</ToolbarItem>
			))}
		</Toolbar>
	);
};

FormattingBar.propTypes = propTypes;
FormattingBar.defaultProps = defaultProps;
export default FormattingBar;
