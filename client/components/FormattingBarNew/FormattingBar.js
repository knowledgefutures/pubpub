import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
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
	buttons: PropTypes.arrayOf(
		PropTypes.shape({
			key: PropTypes.string.isRequired,
			title: PropTypes.string.isRequired,
			ariaTitle: PropTypes.string,
			icon: PropTypes.string.isRequired,
			isToggle: PropTypes.bool,
		}),
	),
	showBlockTypes: PropTypes.bool,
	showMedia: PropTypes.bool,
	isSmall: PropTypes.bool,
	isTranslucent: PropTypes.bool,
};

const defaultProps = {
	showMedia: true,
	showBlockTypes: true,
	isTranslucent: false,
	isSmall: false,
};

const deriveIndicatedButton = (buttons, editorChangeObject) => {
	const { selectedNode, selectionInTable } = editorChangeObject;
	return [
		selectedNode &&
			buttons.find(
				(item) =>
					(item.matchesNodes &&
						item.matchesNodes.some(
							(nodeType) => nodeType === selectedNode.type.name,
						)) ||
					item.key === selectedNode.type.name,
			),
		selectionInTable && buttons.find((i) => i.key === 'table'),
	].filter((x) => x);
};

const FormattingBar = (props) => {
	const { buttons, editorChangeObject, showBlockTypes, isSmall, isTranslucent } = props;
	const { menuItems = [], selectedNode, latestDomEvent } = editorChangeObject;
	const placementRef = useRef();
	const [openedButton, setOpenedButton] = useState(null);
	const {
		communityData: { accentColorDark },
	} = usePageContext();
	const toolbar = useToolbarState({ loop: true });
	const indicatedItems = deriveIndicatedButton(buttons, editorChangeObject);
	const [firstIndicatedItem] = indicatedItems;

	useEffect(() => {
		const clickedOnNode = latestDomEvent && latestDomEvent.type === 'click';
		setOpenedButton(clickedOnNode ? firstIndicatedItem : null);
	}, [firstIndicatedItem, latestDomEvent, selectedNode]);

	const handleFormattingItemClick = (item) => {
		if (indicatedItems.includes(item)) {
			setOpenedButton(openedButton === item ? null : item);
		}
	};

	return (
		<div
			className={classNames(
				'formatting-bar-component',
				isSmall && 'small',
				isTranslucent && 'translucent',
			)}
			ref={placementRef}
		>
			<Toolbar aria-label="Formatting toolbar" {...toolbar}>
				{showBlockTypes && (
					<>
						<ToolbarItem
							as={BlockTypeSelector}
							isSmall={isSmall}
							editorChangeObject={editorChangeObject}
							{...toolbar}
						/>
						<div className="separator" as="div" />
					</>
				)}
				{buttons.map((formattingItem) => {
					const matchingMenuItem = menuItems.find(
						(menuItem) => menuItem.title === formattingItem.key,
					);
					const isActive = matchingMenuItem ? matchingMenuItem.isActive : false;
					const isIndicated = indicatedItems.includes(formattingItem) && !isActive;
					const isOpen = openedButton === formattingItem;
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
							isSmall={isSmall}
							accentColor={accentColorDark}
							onClick={() => handleFormattingItemClick(formattingItem)}
						/>
					);
				})}
			</Toolbar>
			{openedButton && (
				<FormattingBarPopover accentColor={accentColorDark} button={openedButton}>
					<openedButton.controls />
				</FormattingBarPopover>
			)}
		</div>
	);
};

FormattingBar.propTypes = propTypes;
FormattingBar.defaultProps = defaultProps;
export default FormattingBar;
