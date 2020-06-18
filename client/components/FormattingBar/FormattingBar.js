import React, { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Toolbar, ToolbarItem, useToolbarState } from 'reakit';

import { usePageContext } from 'utils/hooks';
import { useRefMap } from 'client/utils/useRefMap';

import BlockTypeSelector from './BlockTypeSelector';
import FormattingBarButton from './FormattingBarButton';
import FormattingBarPopover from './FormattingBarPopover';
import { positionNearSelection } from './positioning';

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
	citationStyle: PropTypes.string,
};

const defaultProps = {
	showBlockTypes: true,
	isTranslucent: false,
	isSmall: false,
	isFullScreenWidth: false,
	citationStyle: 'apa',
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
	const firstRenderRef = useRef(true);
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
		setOpenedButton(openableIndicatedButton);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [controlsKey, indicatedButtonsString]);

	firstRenderRef.current = false;

	return {
		indicatedButtons: indicatedButtons,
		openedButton: openedButton,
		setOpenedButton: setOpenedButton,
		controlsPosition: controlsPosition,
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
		citationStyle,
	} = props;
	const { menuItems, insertFunctions, view } = editorChangeObject;
	const { communityData } = usePageContext();
	const buttonElementRefs = useRefMap();
	const toolbar = useToolbarState({ loop: true });
	const {
		indicatedButtons,
		openedButton,
		setOpenedButton,
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

	useEffect(() => {
		const options = { capture: true };
		const handler = (evt) => {
			if (evt.key === 'Enter') {
				if (indicatedButtons.length === 1 && !openedButton) {
					const [openableButton] = indicatedButtons;
					if (
						openableButton &&
						openableButton.controls &&
						openableButton.controls.enterKeyTriggers
					) {
						evt.stopImmediatePropagation();
						evt.preventDefault();
						setOpenedButton(openableButton);
					}
				}
			}
		};
		document.addEventListener('keydown', handler, options);
		return () => document.removeEventListener('keydown', handler, options);
	}, [indicatedButtons, openedButton, setOpenedButton]);

	useEffect(() => {
		if (openedButton) {
			const ref = buttonElementRefs.get(openedButton.key);
			if (ref && ref.current && typeof ref.current.scrollIntoView === 'function') {
				const buttonElement = ref.current;
				const paddingPx = 5;
				buttonElement.parentNode.scrollLeft = buttonElement.offsetLeft - paddingPx;
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [openedButton]);

	const handlePopoverClose = useCallback(() => {
		setOpenedButton(null);
	}, [setOpenedButton]);

	const renderButton = (button) => {
		const matchingMenuItem = menuItemByKey(button.key);
		const insertFunction = insertFunctions && insertFunctions[button.key];
		const noFunction = !insertFunction && matchingMenuItem && !matchingMenuItem.canRun;
		const isOpen = openedButton === button;
		const isIndicated = indicatedButtons.includes(button) && !isOpen;
		const isActive = !isOpen && !isIndicated && !!matchingMenuItem && matchingMenuItem.isActive;
		const isDisabled =
			noFunction || (openedButton && !isOpen && !isIndicated && !controlsPosition);
		const maybeEditorChangeObject =
			button.key === 'media' ? { editorChangeObject: editorChangeObject } : {};
		return (
			<ToolbarItem
				{...toolbar}
				outerRef={buttonElementRefs.get(button.key)}
				as={button.component || FormattingBarButton}
				key={button.key}
				formattingItem={button}
				disabled={isDisabled}
				isActive={isActive}
				isIndicated={isIndicated && !isOpen}
				isOpen={isOpen}
				isDetached={isOpen && !!controlsPosition}
				isSmall={isSmall}
				accentColor={communityData.accentColorDark}
				onClick={(evt) => handleButtonClick(button, evt)}
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
			<Toolbar aria-label="Formatting toolbar" className="toolbar" {...toolbar}>
				{showBlockTypes && (
					<React.Fragment>
						<ToolbarItem
							as={BlockTypeSelector}
							isSmall={isSmall}
							editorChangeObject={editorChangeObject}
							{...toolbar}
						/>
						<div className="separator" />
					</React.Fragment>
				)}
				{buttons.map(renderButton)}
			</Toolbar>
			{ControlsComponent && (
				<FormattingBarPopover
					editorChangeObject={editorChangeObject}
					accentColor={communityData.accentColorDark}
					button={openedButton}
					onClose={handlePopoverClose}
					isFullScreenWidth={isFullScreenWidth}
					containerRef={popoverContainerRef}
					floatingPosition={
						isFullScreenWidth
							? controlsPosition
							: controlsPosition || positionNearSelection
					}
					captureFocusOnMount={
						openedButton &&
						openedButton.controls &&
						openedButton.controls.captureFocusOnMount
					}
					showCloseButton={
						openedButton &&
						openedButton.controls &&
						openedButton.controls.showCloseButton
					}
					disableClickProxying={
						openedButton &&
						openedButton.controls &&
						openedButton.controls.disableClickProxying
					}
				>
					{({ pendingAttrs, onClose }) => (
						<ControlsComponent
							editorChangeObject={editorChangeObject}
							pendingAttrs={pendingAttrs}
							onClose={onClose}
							isSmall={isSmall}
							citationStyle={citationStyle}
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
