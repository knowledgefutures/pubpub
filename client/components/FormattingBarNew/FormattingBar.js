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
	popoverContainerRef: PropTypes.object.isRequired,
	editorChangeObject: PropTypes.shape({
		latestDomEvent: PropTypes.object,
		insertFunctions: PropTypes.object,
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
	isSmall: PropTypes.bool,
	isTranslucent: PropTypes.bool,
	isFullScreenWidth: PropTypes.bool,
};

const defaultProps = {
	showBlockTypes: true,
	isTranslucent: false,
	isSmall: false,
	isFullScreenWidth: false,
};

const useControlsKey = (latestDomEvent) => {
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

const useControlsState = ({ buttons, editorChangeObject, popoverContainerRef }) => {
	const [openedButton, setOpenedButton] = useState(null);
	const controlsKey = useControlsKey(editorChangeObject.latestDomEvent);

	const indicatedButtons = buttons.filter(
		(button) => button.controls && button.controls.indicate(editorChangeObject),
	);

	const indicatedButtonsString = indicatedButtons.map((button) => button.key).join('-');

	const controlsComponent =
		openedButton &&
		openedButton.controls.show(editorChangeObject) &&
		openedButton.controls.component;

	const controlsPosition =
		controlsComponent &&
		openedButton.controls.position &&
		openedButton.controls.position(editorChangeObject, popoverContainerRef);

	useEffect(() => {
		const openableIndicatedButton = indicatedButtons.find(
			(button) => button.controls && button.controls.trigger(editorChangeObject),
		);
		if (openableIndicatedButton) {
			setOpenedButton(openableIndicatedButton);
		} else if (openedButton && !openableIndicatedButton) {
			setOpenedButton(null);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [controlsKey, indicatedButtonsString]);

	return {
		indicatedButtons: indicatedButtons,
		openedButton: openedButton,
		setOpenedButton: setOpenedButton,
		controlsPosition: controlsPosition,
		controlsKey: controlsKey,
		ControlsComponent: controlsComponent,
	};
};

const FormattingBar = (props) => {
	const {
		buttons,
		editorChangeObject,
		popoverContainerRef,
		showBlockTypes,
		isSmall,
		isTranslucent,
		isFullScreenWidth,
	} = props;
	const { menuItems, insertFunctions, view } = editorChangeObject;
	const { communityData } = usePageContext();
	const toolbar = useToolbarState({ loop: true });
	const {
		indicatedButtons,
		openedButton,
		setOpenedButton,
		controlsKey,
		controlsPosition,
		ControlsComponent,
	} = useControlsState(props);

	const menuItemByKey = (key) => {
		if (menuItems) {
			return menuItems.find((menuItem) => menuItem.title === key);
		}
		return null;
	};

	const handleButtonClick = (item) => {
		if (indicatedButtons.includes(item)) {
			setOpenedButton(openedButton === item ? null : item);
		} else {
			const insertFunction = insertFunctions[item.key];
			const menuItem = menuItemByKey(item.key);
			if (insertFunction) {
				insertFunction();
				view.focus();
			} else if (menuItem) {
				menuItem.run();
				view.focus();
			}
		}
	};

	const renderButton = (button) => {
		const matchingMenuItem = menuItemByKey(button.key);
		const insertFunction = insertFunctions && insertFunctions[button.key];
		const noFunction = !insertFunction && matchingMenuItem && !matchingMenuItem.canRun;
		const isOpen = openedButton === button;
		const isIndicated = indicatedButtons.includes(button) && !isOpen;
		const isActive = !isOpen && !isIndicated && !!matchingMenuItem && matchingMenuItem.isActive;
		const maybeEditorChangeObject =
			button.key === 'media' ? { editorChangeObject: editorChangeObject } : {};
		return (
			<ToolbarItem
				{...toolbar}
				as={button.component || FormattingBarButton}
				key={button.key}
				formattingItem={button}
				disabled={noFunction}
				isActive={isActive}
				isIndicated={isIndicated && !isOpen}
				isOpen={isOpen}
				isDetached={isOpen && !!controlsPosition}
				isSmall={isSmall}
				accentColor={communityData.accentColorDark}
				onClick={() => handleButtonClick(button)}
				{...maybeEditorChangeObject}
			/>
		);
	};

	return (
		<div
			className={classNames(
				'formatting-bar-component',
				isSmall && 'small',
				isTranslucent && 'translucent',
			)}
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
						<div className="separator" />
					</>
				)}
				{buttons.map(renderButton)}
			</Toolbar>
			{ControlsComponent && (
				<FormattingBarPopover
					key={controlsKey}
					accentColor={communityData.accentColorDark}
					button={openedButton}
					onClose={() => setOpenedButton(null)}
					isFullScreenWidth={isFullScreenWidth}
					containerRef={popoverContainerRef}
					floatingPosition={controlsPosition}
				>
					{({ onPendingChanges, onClose }) => (
						<ControlsComponent
							editorChangeObject={editorChangeObject}
							onPendingChanges={onPendingChanges}
							onClose={onClose}
							isSmall={isSmall}
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
