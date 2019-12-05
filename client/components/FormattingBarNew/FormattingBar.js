import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Toolbar, ToolbarItem, useToolbarState } from 'reakit';

import { usePageContext } from 'containers/Pub/pubHooks';

import BlockTypeSelector from './BlockTypeSelector';
import FormattingBarButton from './FormattingBarButton';
import FormattingBarPopover from './FormattingBarPopover';

require('./formattingBar.scss');

const propTypes = {
	editorChangeObject: PropTypes.shape({
		menuItems: PropTypes.arrayOf(PropTypes.shape({})),
		view: PropTypes.shape({
			focus: PropTypes.func,
		}),
	}).isRequired,
	hideExtraFormatting: PropTypes.bool,
	isSmall: PropTypes.bool,
	threads: PropTypes.arrayOf(PropTypes.object),
};

const defaultProps = {
	hideExtraFormatting: false,
	isSmall: false,
	threads: [],
};

const formattingItems = [
	{ key: 'strong', title: 'Bold', icon: 'bold', priority: true, isToggle: true },
	{ key: 'em', title: 'Italic', icon: 'italic', priority: true, isToggle: true },
	{ key: 'link', title: 'Link', icon: 'link', priority: true, isToggle: true },
	{ key: 'bullet-list', title: 'Bullet List', icon: 'list-ul' },
	{ key: 'numbered-list', title: 'Numbered List', icon: 'list-ol' },
	{ key: 'blockquote', title: 'Blockquote', icon: 'citation' },
	{ key: 'code', title: 'Code', icon: 'code', isToggle: true },
	{ key: 'subscript', title: 'Subscript', icon: 'subscript', isToggle: true },
	{ key: 'superscript', title: 'Superscript', icon: 'superscript', isToggle: true },
	{
		key: 'strikethrough',
		title: 'Strikethrough',
		ariaTitle: 'strike through',
		icon: 'strikethrough',
		isToggle: true,
	},
];

const tableItem = { key: 'table', title: 'Table', icon: 'th' };

const insertItems = [
	{ key: 'citation', title: 'Citation', icon: 'bookmark' },
	{ key: 'discussion', title: 'Discussion Thread', icon: 'chat' },
	{
		key: 'equation',
		matchesNodes: ['equation', 'block_equation'],
		title: 'Equation',
		icon: 'function',
	},
	{ key: 'footnote', title: 'Footnote', icon: 'asterisk' },
	{ key: 'horizontal_rule', title: 'Horizontal Line', icon: 'minus' },
	tableItem,
];

const deriveIndicatedControlsItems = (editorChangeObject) => {
	const { selectedNode, selectionInTable } = editorChangeObject;
	return [
		selectedNode &&
			insertItems.find(
				(item) =>
					(item.matchesNodes &&
						item.matchesNodes.some(
							(nodeType) => nodeType === selectedNode.type.name,
						)) ||
					item.key === selectedNode.type.name,
			),
		selectionInTable && insertItems.find((i) => i.key === 'table'),
	].filter((x) => x);
};

const FormattingBar = (props) => {
	const { editorChangeObject, isSmall, hideExtraFormatting, threads } = props;
	const { menuItems = [], selectedNode, latestDomEvent } = editorChangeObject;
	const placementRef = useRef();
	const [openedItem, setOpenedItem] = useState(null);
	const {
		communityData: { accentColorDark },
	} = usePageContext();
	const toolbar = useToolbarState({ loop: true });
	const indicatedItems = deriveIndicatedControlsItems(editorChangeObject);
	const [firstIndicatedItem] = indicatedItems;

	useEffect(() => {
		const clickedOnNode = latestDomEvent && latestDomEvent.type === 'click';
		console.log(clickedOnNode, firstIndicatedItem, selectedNode);
		setOpenedItem(clickedOnNode ? firstIndicatedItem : null);
	}, [firstIndicatedItem, latestDomEvent, selectedNode]);

	const toolbarItems = [
		...formattingItems.filter((item) => !isSmall || item.priority),
		...insertItems.filter((item) => {
			if (indicatedItems.includes(item)) {
				return true;
			}
			if (!threads.length && item.key === 'discussion') {
				return false;
			}
			return !hideExtraFormatting;
		}),
	];

	const handleFormattingItemClick = (item) => {
		if (indicatedItems.includes(item)) {
			setOpenedItem(openedItem === item ? null : item);
		}
	};

	return (
		<div className="formatting-bar-component" ref={placementRef}>
			<Toolbar aria-label="Formatting toolbar" {...toolbar}>
				<ToolbarItem
					as={BlockTypeSelector}
					editorChangeObject={editorChangeObject}
					{...toolbar}
				/>
				<div className="separator" as="div" />
				{toolbarItems.map((formattingItem) => {
					const matchingMenuItem = menuItems.find(
						(menuItem) => menuItem.title === formattingItem.key,
					);
					const isActive = matchingMenuItem ? matchingMenuItem.isActive : false;
					const isIndicated = indicatedItems.includes(formattingItem) && !isActive;
					const isOpen = openedItem === formattingItem;
					return (
						<ToolbarItem
							{...toolbar}
							as={FormattingBarButton}
							key={formattingItem.key}
							formattingItem={formattingItem}
							disabled={indicatedItems.length > 0 && !isIndicated}
							isActive={isActive}
							isIndicated={isIndicated && !isActive}
							isOpen={isOpen}
							accentColor={accentColorDark}
							onClick={() => handleFormattingItemClick(formattingItem)}
						/>
					);
				})}
			</Toolbar>
			{openedItem && (
				<FormattingBarPopover accentColor={accentColorDark} formattingItem={openedItem} />
			)}
		</div>
	);
};

FormattingBar.propTypes = propTypes;
FormattingBar.defaultProps = defaultProps;
export default FormattingBar;
