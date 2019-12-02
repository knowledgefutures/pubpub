import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Toolbar, ToolbarItem, useToolbarState, Button } from 'reakit';
import { OverflowList } from '@blueprintjs/core';

import { Icon } from 'components';

import BlockTypeSelector from './BlockTypeSelector';

require('./formattingBar.scss');

const propTypes = {
	editorChangeObject: PropTypes.shape({
		menuItems: PropTypes.arrayOf(PropTypes.shape({})),
		view: PropTypes.shape({
			focus: PropTypes.func,
		}),
	}).isRequired,
	isSmall: PropTypes.bool,
};

const defaultProps = {
	isSmall: false,
};

const formattingItems = [
	{ key: 'strong', title: 'Bold', icon: 'bold', priority: true, toggle: true },
	{ key: 'em', title: 'Italic', icon: 'italic', priority: true, toggle: true },
	{ key: 'link', title: 'Link', icon: 'link', priority: true, toggle: true },
	{ key: 'bullet-list', title: 'Bullet List', icon: 'list-ul' },
	{ key: 'numbered-list', title: 'Numbered List', icon: 'list-ol' },
	{ key: 'blockquote', title: 'Blockquote', icon: 'citation' },
	{ key: 'code', title: 'Code', icon: 'code', toggle: true },
	{ key: 'subscript', title: 'Subscript', icon: 'subscript', toggle: true },
	{ key: 'superscript', title: 'Superscript', icon: 'superscript', toggle: true },
	{
		key: 'strikethrough',
		title: 'Strikethrough',
		ariaTitle: 'strike through',
		icon: 'strikethrough',
		toggle: true,
	},
];

const FormattingBar = (props) => {
	const { editorChangeObject, isSmall } = props;
	const { menuItems } = editorChangeObject;
	const toolbar = useToolbarState({});

	const showFormattingItem = (item) => !isSmall || item.priority;

	return (
		<Toolbar className="formatting-bar-component" aria-label="Formatting toolbar" {...toolbar}>
			<ToolbarItem
				as={BlockTypeSelector}
				editorChangeObject={editorChangeObject}
				{...toolbar}
			/>
			{formattingItems.filter(showFormattingItem).map((formattingItem) => {
				const matchingMenuItem =
					menuItems.find((menuItem) => menuItem.title === formattingItem.key) || {};
				const { isActive } = matchingMenuItem;
				return (
					<ToolbarItem {...toolbar}>
						{(toolbarItemProps) => (
							<Button
								{...toolbarItemProps}
								role="button"
								key={formattingItem.key}
								as="a"
								aria-label={formattingItem.ariaTitle || formattingItem.title}
								aria-pressed={formattingItem.toggle ? isActive : undefined}
								className={classNames(
									'bp3-button',
									'bp3-minimal',
									isActive && 'bp3-active',
								)}
							>
								<Icon icon={formattingItem.icon} />
							</Button>
						)}
					</ToolbarItem>
				);
			})}
		</Toolbar>
	);
};

FormattingBar.propTypes = propTypes;
FormattingBar.defaultProps = defaultProps;
export default FormattingBar;
