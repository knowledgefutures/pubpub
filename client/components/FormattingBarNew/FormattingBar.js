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
		selectedNode: PropTypes.shape({
			attrs: PropTypes.object,
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
	).isRequired,
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

const usePopoverKey = (latestDomEvent) => {
	const key = useRef(-1);
	const previousDomEvent = useRef(null);

	if (latestDomEvent) {
		const domEventsEqual =
			previousDomEvent.current &&
			previousDomEvent.current.type === latestDomEvent.type &&
			previousDomEvent.current.timeStamp === latestDomEvent.timeStamp;

		if (!domEventsEqual) {
			key.current += 1;
		}
		previousDomEvent.current = latestDomEvent;
	}

	return key.current;
};

const FormattingBar = (props) => {
	const {
		buttons,
		editorChangeObject,
		showBlockTypes,
		isSmall,
		isTranslucent,
		isFullScreenWidth,
	} = props;
	const {
		menuItems,
		selectedNode,
		latestDomEvent,
		insertFunctions,
		view,
		updateNode,
	} = editorChangeObject;
	const placementRef = useRef();
	const [openedButton, setOpenedButton] = useState(null);
	const {
		communityData: { accentColorDark },
	} = usePageContext();
	const toolbar = useToolbarState({ loop: true });
	const popoverKey = usePopoverKey(latestDomEvent);
	const indicatedItems = deriveIndicatedButton(buttons, editorChangeObject);
	const [firstIndicatedItem] = indicatedItems;

	useEffect(() => {
		const clickedOnNode = latestDomEvent && latestDomEvent.type === 'click';
		setOpenedButton(clickedOnNode ? firstIndicatedItem : null);
	}, [latestDomEvent, firstIndicatedItem, popoverKey]);

	const menuItemByKey = (key) => {
		if (menuItems) {
			return menuItems.find((menuItem) => menuItem.title === key);
		}
		return null;
	};

	const handleButtonClick = (item) => {
		if (indicatedItems.includes(item)) {
			setOpenedButton(openedButton === item ? null : item);
		} else {
			const insertFunction = insertFunctions[item.key];
			const menuItem = menuItemByKey(item.key);
			if (insertFunction) {
				insertFunction();
				view.focus();
			} else if (menuItem) {
				menuItem.run();
			}
		}
	};

	const handlePopoverClose = () => {
		setOpenedButton(null);
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
				{buttons.map((button) => {
					const matchingMenuItem = menuItemByKey(button.key);
					const insertFunction = insertFunctions && insertFunctions[button.key];
					if (!insertFunction && matchingMenuItem && !matchingMenuItem.canRun) {
						return null;
					}
					const isActive = matchingMenuItem ? matchingMenuItem.isActive : false;
					const isIndicated = indicatedItems.includes(button) && !isActive;
					const isOpen = openedButton === button;
					return (
						<ToolbarItem
							{...toolbar}
							as={FormattingBarButton}
							key={button.key}
							formattingItem={button}
							disabled={indicatedItems.length > 0 && !isIndicated}
							isActive={isActive}
							isIndicated={isIndicated && !isOpen}
							isOpen={isOpen}
							isSmall={isSmall}
							accentColor={accentColorDark}
							onClick={() => handleButtonClick(button)}
						/>
					);
				})}
			</Toolbar>
			{openedButton && selectedNode && (
				<FormattingBarPopover
					key={popoverKey}
					accentColor={accentColorDark}
					button={openedButton}
					onClose={handlePopoverClose}
					isFullScreenWidth={isFullScreenWidth}
				>
					{({ onPendingChanges, onClose }) => (
						<openedButton.controls
							updateNodeAttrs={updateNode}
							nodeAttrs={selectedNode.attrs}
							onPendingChanges={onPendingChanges}
							onClose={onClose}
						/>
					)}
				</FormattingBarPopover>
			)}
		</div>
	);
};

FormattingBar.propTypes = propTypes;
FormattingBar.defaultProps = defaultProps;
export default FormattingBar;
